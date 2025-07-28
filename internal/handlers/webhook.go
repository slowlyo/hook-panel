package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"

	"hook-panel/internal/models"
	"hook-panel/internal/pkg/auth"
	"hook-panel/internal/pkg/database"
	"hook-panel/internal/pkg/executor"
	"hook-panel/internal/pkg/file"
	"hook-panel/internal/pkg/i18n"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// WebhookHandler 处理 webhook 请求
func WebhookHandler(c *gin.Context) {
	startTime := time.Now()
	scriptID := c.Param("id")

	if scriptID == "" {
		errorMsg := i18n.T(c, "error.request.invalid_params", "Script ID")
		LogWebhookCall(c, scriptID, http.StatusBadRequest, time.Since(startTime).Milliseconds(), errorMsg)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": errorMsg,
		})
		return
	}

	// 验证签名
	if !validateWebhookSignature(c, scriptID) {
		errorMsg := i18n.T(c, "error.webhook.invalid_signature")
		LogWebhookCall(c, scriptID, http.StatusUnauthorized, time.Since(startTime).Milliseconds(), errorMsg)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": errorMsg,
		})
		return
	}

	// 查找脚本
	db := database.GetDB()
	var script models.Script
	if err := db.First(&script, "id = ?", scriptID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			errorMsg := i18n.T(c, "error.webhook.script_not_found")
			LogWebhookCall(c, scriptID, http.StatusNotFound, time.Since(startTime).Milliseconds(), errorMsg)
			c.JSON(http.StatusNotFound, gin.H{
				"error": errorMsg,
			})
			return
		}
		errorMsg := i18n.T(c, "error.database.query_failed")
		LogWebhookCall(c, scriptID, http.StatusInternalServerError, time.Since(startTime).Milliseconds(), "Database error: "+err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": errorMsg,
		})
		return
	}

	// 检查脚本是否启用
	if !script.Enabled {
		errorMsg := i18n.T(c, "error.webhook.script_not_found")
		LogWebhookCall(c, scriptID, http.StatusBadRequest, time.Since(startTime).Milliseconds(), errorMsg)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": errorMsg,
		})
		return
	}

	// 读取脚本内容
	content, err := file.ReadScriptContent(scriptID)
	if err != nil {
		errorMsg := i18n.T(c, "error.script.load_content_failed")
		LogWebhookCall(c, scriptID, http.StatusInternalServerError, time.Since(startTime).Milliseconds(), "Failed to read script content: "+err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": errorMsg,
		})
		return
	}

	if strings.TrimSpace(content) == "" {
		errorMsg := i18n.T(c, "error.script.load_content_failed")
		LogWebhookCall(c, scriptID, http.StatusBadRequest, time.Since(startTime).Milliseconds(), errorMsg)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": errorMsg,
		})
		return
	}

	// 更新调用统计
	now := time.Now()
	db.Model(&models.Script{}).
		Where("id = ?", scriptID).
		Updates(map[string]interface{}{
			"call_count":   gorm.Expr("call_count + 1"),
			"last_call_at": now,
		})

	// 执行脚本（异步执行，不等待结果）
	go func() {
		scriptExecutor := executor.NewScriptExecutor(60 * time.Second)
		_, err := scriptExecutor.ExecuteScript(scriptID, content, script.Executor)
		if err != nil {
			// Record error log, but don't affect webhook response
			fmt.Printf("Script execution error for %s: %v\n", scriptID, err)
		}
	}()

	// 记录成功调用
	LogWebhookCall(c, scriptID, http.StatusOK, time.Since(startTime).Milliseconds(), "")

	// 返回符合 webhook 规范的响应
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": i18n.T(c, "success.webhook.executed"),
		"data": gin.H{
			"script_id":   scriptID,
			"script_name": script.Name,
			"timestamp":   now.Unix(),
		},
	})
}

// validateWebhookSignature 验证 webhook 签名
func validateWebhookSignature(c *gin.Context, scriptID string) bool {
	// 从查询参数或 Header 中获取签名
	signature := c.Query("signature")
	if signature == "" {
		signature = c.GetHeader("X-Hook-Signature")
	}

	if signature == "" {
		return false
	}

	// 计算期望的签名
	expectedSignature := generateWebhookSignature(scriptID)

	// 使用恒定时间比较防止时序攻击
	return hmac.Equal([]byte(signature), []byte(expectedSignature))
}

// generateWebhookSignature 生成 webhook 签名
func generateWebhookSignature(scriptID string) string {
	secretKey := auth.GetSecretKey()

	// 使用 HMAC-SHA256 计算签名
	h := hmac.New(sha256.New, []byte(secretKey))
	h.Write([]byte(scriptID))

	return hex.EncodeToString(h.Sum(nil))
}

// GetWebhookURL 获取脚本的 webhook URL
func GetWebhookURL(c *gin.Context) {
	scriptID := c.Param("id")
	if scriptID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": i18n.T(c, "error.request.invalid_params", "Script ID"),
		})
		return
	}

	// 验证脚本是否存在
	db := database.GetDB()
	var script models.Script
	if err := db.First(&script, "id = ?", scriptID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": i18n.T(c, "error.script.not_found"),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": i18n.T(c, "error.database.query_failed"),
		})
		return
	}

	// 生成签名
	signature := generateWebhookSignature(scriptID)

	// 获取系统配置的域名
	domain, err := GetConfigValue("system.domain")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": i18n.T(c, "error.config.get_failed"),
		})
		return
	}

	// 如果没有配置域名，使用请求头中的域名作为后备
	if domain == "" {
		scheme := "http"
		if c.Request.TLS != nil {
			scheme = "https"
		}
		domain = fmt.Sprintf("%s://%s", scheme, c.Request.Host)
	}

	// 确保域名不以斜杠结尾
	domain = strings.TrimSuffix(domain, "/")

	// 构建 webhook URL
	webhookURL := fmt.Sprintf("%s/h/%s?signature=%s", domain, scriptID, signature)

	c.JSON(http.StatusOK, gin.H{
		"webhook_url": webhookURL,
		"signature":   signature,
		"script_id":   scriptID,
		"script_name": script.Name,
	})
}
