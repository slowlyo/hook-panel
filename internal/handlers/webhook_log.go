package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"hook-panel/internal/models"
	"hook-panel/internal/pkg/database"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetWebhookLogs 获取 webhook 调用记录
func GetWebhookLogs(c *gin.Context) {
	var req models.WebhookLogListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "请求参数错误: " + err.Error(),
		})
		return
	}

	// 设置默认值
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 20
	}
	if req.PageSize > 100 {
		req.PageSize = 100 // 限制最大页面大小
	}

	db := database.GetDB()
	query := db.Model(&models.WebhookLog{})

	// 筛选条件
	if req.ScriptID != "" {
		query = query.Where("script_id = ?", req.ScriptID)
	}
	if req.Status != nil {
		// 支持状态范围查询
		if *req.Status == 200 {
			query = query.Where("status >= 200 AND status < 300")
		} else if *req.Status == 400 {
			query = query.Where("status >= 400 AND status < 500")
		} else if *req.Status == 500 {
			query = query.Where("status >= 500")
		} else {
			query = query.Where("status = ?", *req.Status)
		}
	}
	if req.StartTime != "" {
		if startTime, err := time.Parse("2006-01-02 15:04:05", req.StartTime); err == nil {
			query = query.Where("created_at >= ?", startTime)
		}
	}
	if req.EndTime != "" {
		if endTime, err := time.Parse("2006-01-02 15:04:05", req.EndTime); err == nil {
			query = query.Where("created_at <= ?", endTime)
		}
	}

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "查询总数失败",
		})
		return
	}

	// 处理排序
	orderBy := "created_at DESC" // 默认排序
	if req.SortField != "" && req.SortOrder != "" {
		// 验证排序字段
		validSortFields := map[string]bool{
			"created_at":    true,
			"response_time": true,
			"status":        true,
		}
		if validSortFields[req.SortField] {
			// 验证排序方向
			if req.SortOrder == "asc" || req.SortOrder == "desc" {
				orderBy = req.SortField + " " + strings.ToUpper(req.SortOrder)
			}
		}
	}

	// 分页查询
	var logs []models.WebhookLog
	offset := (req.Page - 1) * req.PageSize
	if err := query.Preload("Script").
		Order(orderBy).
		Limit(req.PageSize).
		Offset(offset).
		Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "查询记录失败",
		})
		return
	}

	c.JSON(http.StatusOK, models.WebhookLogListResponse{
		Data:     logs,
		Total:    total,
		Page:     req.Page,
		PageSize: req.PageSize,
	})
}

// GetWebhookLogStats 获取 webhook 调用统计
func GetWebhookLogStats(c *gin.Context) {
	scriptID := c.Param("id")
	if scriptID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "脚本 ID 不能为空",
		})
		return
	}

	db := database.GetDB()
	var stats models.WebhookLogStats

	// 总调用次数
	if err := db.Model(&models.WebhookLog{}).
		Where("script_id = ?", scriptID).
		Count(&stats.TotalCalls).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "查询统计失败",
		})
		return
	}

	// 成功调用次数 (2xx 状态码)
	if err := db.Model(&models.WebhookLog{}).
		Where("script_id = ? AND status >= 200 AND status < 300", scriptID).
		Count(&stats.SuccessCalls).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "查询成功统计失败",
		})
		return
	}

	// 失败调用次数
	stats.FailedCalls = stats.TotalCalls - stats.SuccessCalls

	// 成功率
	if stats.TotalCalls > 0 {
		stats.SuccessRate = float64(stats.SuccessCalls) / float64(stats.TotalCalls) * 100
	}

	// 平均响应时间
	var avgResponse *float64
	if err := db.Model(&models.WebhookLog{}).
		Where("script_id = ?", scriptID).
		Select("AVG(response_time)").
		Scan(&avgResponse).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "查询平均响应时间失败",
		})
		return
	}
	if avgResponse != nil {
		stats.AvgResponse = *avgResponse
	} else {
		stats.AvgResponse = 0
	}

	// 最近调用时间
	var lastLog models.WebhookLog
	if err := db.Where("script_id = ?", scriptID).
		Order("created_at DESC").
		First(&lastLog).Error; err != nil {
		if err != gorm.ErrRecordNotFound {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "查询最近调用时间失败",
			})
			return
		}
	} else {
		stats.LastCallTime = &lastLog.CreatedAt
	}

	c.JSON(http.StatusOK, stats)
}

// ClearWebhookLogs 清空 webhook 调用记录
func ClearWebhookLogs(c *gin.Context) {
	scriptID := c.Param("id")
	if scriptID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "脚本 ID 不能为空",
		})
		return
	}

	db := database.GetDB()

	// 删除指定脚本的所有 webhook 日志
	result := db.Where("script_id = ?", scriptID).Delete(&models.WebhookLog{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "清空记录失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "调用记录已清空 🗑️",
		"deleted": result.RowsAffected,
	})
}

// LogWebhookCall 记录 webhook 调用（内部函数）
func LogWebhookCall(c *gin.Context, scriptID string, status int, responseTime int64, errorMsg string) {
	// 获取请求头
	headers, _ := json.Marshal(c.Request.Header)

	// 获取请求体
	body := ""
	if c.Request.ContentLength > 0 && c.Request.ContentLength < 10240 { // 限制10KB
		// 尝试读取请求体
		if bodyBytes, err := c.GetRawData(); err == nil {
			body = string(bodyBytes)
			// 重新设置请求体，以便后续处理可以继续使用
			c.Request.Body = io.NopCloser(strings.NewReader(body))
		}
	}

	// 获取客户端IP
	clientIP := c.ClientIP()

	// 获取User-Agent
	userAgent := c.GetHeader("User-Agent")

	// 创建日志记录
	log := models.WebhookLog{
		ScriptID:     scriptID,
		Method:       c.Request.Method,
		Headers:      string(headers),
		Body:         body,
		SourceIP:     clientIP,
		UserAgent:    userAgent,
		Status:       status,
		ResponseTime: responseTime,
		ErrorMsg:     errorMsg,
	}

	// 异步保存日志，不影响主流程
	go func() {
		db := database.GetDB()
		if err := db.Create(&log).Error; err != nil {
			// 记录错误但不影响主流程
			println("保存 webhook 日志失败:", err.Error())
		}
	}()
}
