package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"hook-panel/internal/models"
	"hook-panel/internal/pkg/database"
	"hook-panel/internal/pkg/executor"
	"hook-panel/internal/pkg/file"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetScripts 获取脚本列表
func GetScripts(c *gin.Context) {
	db := database.GetDB()

	// 分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	// 搜索参数
	search := c.Query("search")

	// 状态筛选参数
	enabledParam := c.Query("enabled")

	// 执行器筛选参数
	executorParam := c.Query("executor")

	// 排序参数
	sortField := c.DefaultQuery("sort_field", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "desc")

	// 构建查询
	query := db.Model(&models.Script{})
	if search != "" {
		query = query.Where("name LIKE ? OR description LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// 添加状态筛选
	if enabledParam != "" {
		if enabledParam == "true" {
			query = query.Where("enabled = ?", true)
		} else if enabledParam == "false" {
			query = query.Where("enabled = ?", false)
		}
	}

	// 添加执行器筛选
	if executorParam != "" {
		query = query.Where("executor = ?", executorParam)
	}

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "获取脚本总数失败",
		})
		return
	}

	// 获取数据
	var scripts []models.Script
	offset := (page - 1) * pageSize

	// 构建排序字符串
	orderBy := buildOrderBy(sortField, sortOrder)
	if err := query.Order(orderBy).Offset(offset).Limit(pageSize).Find(&scripts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "获取脚本列表失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":     scripts,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

// GetScript 获取单个脚本（包含内容）
func GetScript(c *gin.Context) {
	scriptID := c.Param("id")
	if scriptID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "脚本 ID 不能为空",
		})
		return
	}

	db := database.GetDB()
	var script models.Script
	if err := db.First(&script, "id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "脚本不存在",
		})
		return
	}

	// 读取脚本内容
	content, err := file.ReadScriptContent(scriptID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "读取脚本内容失败",
		})
		return
	}

	response := models.ScriptResponse{
		Script:  script,
		Content: content,
	}

	c.JSON(http.StatusOK, response)
}

// CreateScript 创建脚本
func CreateScript(c *gin.Context) {
	var req models.ScriptCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "请求参数错误: " + err.Error(),
		})
		return
	}

	// 创建脚本记录
	script := models.Script{
		Name:        req.Name,
		Description: req.Description,
		Executor:    req.Executor,
		Enabled:     req.Enabled,
	}

	db := database.GetDB()
	if err := db.Create(&script).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "创建脚本失败",
		})
		return
	}

	// 保存脚本内容
	if req.Content != "" {
		if err := file.SaveScriptContent(script.ID, req.Content); err != nil {
			// 如果保存内容失败，删除已创建的记录
			db.Delete(&script)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "保存脚本内容失败",
			})
			return
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "脚本创建成功 ✅",
		"data":    script,
	})
}

// UpdateScript 更新脚本
func UpdateScript(c *gin.Context) {
	scriptID := c.Param("id")
	if scriptID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "脚本 ID 不能为空",
		})
		return
	}

	var req models.ScriptUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "请求参数错误: " + err.Error(),
		})
		return
	}

	db := database.GetDB()
	var script models.Script
	if err := db.First(&script, "id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "脚本不存在",
		})
		return
	}

	// 更新字段
	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Executor != "" {
		updates["executor"] = req.Executor
	}
	if req.Enabled != nil {
		updates["enabled"] = *req.Enabled
	}

	if len(updates) > 0 {
		if err := db.Model(&script).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "更新脚本失败",
			})
			return
		}
	}

	// 更新脚本内容
	if req.Content != "" {
		if err := file.SaveScriptContent(scriptID, req.Content); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "更新脚本内容失败",
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "脚本更新成功 ✅",
	})
}

// DeleteScript 删除脚本
func DeleteScript(c *gin.Context) {
	scriptID := c.Param("id")
	if scriptID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "脚本 ID 不能为空",
		})
		return
	}

	db := database.GetDB()
	var script models.Script
	if err := db.First(&script, "id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "脚本不存在",
		})
		return
	}

	// 删除数据库记录
	if err := db.Delete(&script).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "删除脚本失败",
		})
		return
	}

	// 删除脚本内容文件
	if err := file.DeleteScriptContent(scriptID); err != nil {
		// 记录错误但不影响响应
		// 可以考虑添加日志记录
	}

	// 删除脚本日志文件
	if err := file.DeleteScriptLog(scriptID); err != nil {
		// 记录错误但不影响响应
		// 可以考虑添加日志记录
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "脚本删除成功 ✅",
	})
}

// ToggleScript 切换脚本启用状态
func ToggleScript(c *gin.Context) {
	scriptID := c.Param("id")
	if scriptID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "脚本 ID 不能为空",
		})
		return
	}

	db := database.GetDB()
	var script models.Script
	if err := db.First(&script, "id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "脚本不存在",
		})
		return
	}

	// 切换状态
	newStatus := !script.Enabled
	if err := db.Model(&script).Update("enabled", newStatus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "切换脚本状态失败",
		})
		return
	}

	statusText := "启用"
	if !newStatus {
		statusText = "禁用"
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "脚本已" + statusText + " ✅",
		"enabled": newStatus,
	})
}

// IncrementCallCount 增加调用次数
func IncrementCallCount(c *gin.Context) {
	scriptID := c.Param("id")
	if scriptID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "脚本 ID 不能为空",
		})
		return
	}

	db := database.GetDB()
	now := time.Now()

	// 更新调用次数和最近调用时间
	result := db.Model(&models.Script{}).
		Where("id = ?", scriptID).
		Updates(map[string]interface{}{
			"call_count":   gorm.Expr("call_count + 1"),
			"last_call_at": now,
		})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "更新调用统计失败",
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "脚本不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "调用统计已更新 ✅",
	})
}

// ExecuteScript 执行脚本
func ExecuteScript(c *gin.Context) {
	scriptID := c.Param("id")
	if scriptID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "脚本 ID 不能为空",
		})
		return
	}

	db := database.GetDB()
	var script models.Script
	if err := db.First(&script, "id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "脚本不存在",
		})
		return
	}

	// 检查脚本是否启用
	if !script.Enabled {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "脚本已禁用，无法执行",
		})
		return
	}

	// 读取脚本内容
	content, err := file.ReadScriptContent(scriptID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "读取脚本内容失败",
		})
		return
	}

	if strings.TrimSpace(content) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "脚本内容为空",
		})
		return
	}

	// 创建执行器并执行脚本
	scriptExecutor := executor.NewScriptExecutor(60 * time.Second) // 60秒超时
	result, err := scriptExecutor.ExecuteScript(scriptID, content, script.Executor)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "脚本执行失败: " + err.Error(),
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

	// 返回执行结果
	c.JSON(http.StatusOK, gin.H{
		"message": "脚本执行完成 🎯",
		"result":  result,
	})
}

// GetScriptLogs 获取脚本执行日志
func GetScriptLogs(c *gin.Context) {
	scriptID := c.Param("id")
	if scriptID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "脚本 ID 不能为空",
		})
		return
	}

	// 检查脚本是否存在
	db := database.GetDB()
	var script models.Script
	if err := db.First(&script, "id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "脚本不存在",
		})
		return
	}

	// 读取日志内容
	logs, err := file.ReadScriptLog(scriptID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "读取日志失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"logs": logs,
	})
}

// ClearScriptLogs 清空脚本执行日志
func ClearScriptLogs(c *gin.Context) {
	scriptID := c.Param("id")
	if scriptID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "脚本 ID 不能为空",
		})
		return
	}

	// 检查脚本是否存在
	db := database.GetDB()
	var script models.Script
	if err := db.First(&script, "id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "脚本不存在",
		})
		return
	}

	// 清空日志文件
	if err := file.ClearScriptLog(scriptID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "清空日志失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "日志清空成功 🧹",
	})
}

// buildOrderBy 构建排序字符串
func buildOrderBy(field, order string) string {
	// 允许的排序字段映射（前端字段名 -> 数据库字段名）
	allowedFields := map[string]string{
		"callCount":    "call_count",
		"lastCallTime": "last_call_at",
		"createdAt":    "created_at",
		"updatedAt":    "updated_at",
		"name":         "name",
	}

	// 检查字段是否允许
	dbField, exists := allowedFields[field]
	if !exists {
		dbField = "created_at" // 默认按创建时间排序
	}

	// 检查排序方向
	if order != "asc" && order != "desc" {
		order = "desc" // 默认降序
	}

	return dbField + " " + strings.ToUpper(order)
}
