package handlers

import (
	"net/http"
	"time"

	"hook-panel/internal/models"
	"hook-panel/internal/pkg/database"
	"hook-panel/internal/pkg/i18n"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetDashboardStats 获取仪表板统计数据
func GetDashboardStats(c *gin.Context) {
	db := database.GetDB()
	var stats models.DashboardStats

	// 统计脚本数量
	if err := db.Model(&models.Script{}).Count(&stats.TotalScripts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": i18n.T(c, "error.script.get_failed"),
		})
		return
	}

	// 统计启用的脚本数量
	if err := db.Model(&models.Script{}).Where("enabled = ?", true).Count(&stats.EnabledScripts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": i18n.T(c, "error.script.get_failed"),
		})
		return
	}

	// 计算禁用脚本数量
	stats.DisabledScripts = stats.TotalScripts - stats.EnabledScripts

	// 统计总调用次数
	if err := db.Model(&models.WebhookLog{}).Count(&stats.TotalCalls).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": i18n.T(c, "error.webhook.get_logs_failed"),
		})
		return
	}

	// 统计成功调用次数 (2xx 状态码)
	if err := db.Model(&models.WebhookLog{}).
		Where("status >= 200 AND status < 300").
		Count(&stats.SuccessCalls).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": i18n.T(c, "error.webhook.get_logs_failed"),
		})
		return
	}

	// 计算失败调用次数
	stats.FailedCalls = stats.TotalCalls - stats.SuccessCalls

	// 计算成功率
	if stats.TotalCalls > 0 {
		stats.SuccessRate = float64(stats.SuccessCalls) / float64(stats.TotalCalls) * 100
	}

	// 计算平均响应时间
	var avgResponse *float64
	if err := db.Model(&models.WebhookLog{}).
		Select("AVG(response_time)").
		Scan(&avgResponse).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": i18n.T(c, "error.webhook.get_logs_failed"),
		})
		return
	}
	if avgResponse != nil {
		stats.AvgResponseTime = *avgResponse
	} else {
		stats.AvgResponseTime = 0
	}

	// 获取最近调用时间
	var lastLog models.WebhookLog
	if err := db.Order("created_at DESC").First(&lastLog).Error; err != nil {
		if err != gorm.ErrRecordNotFound {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": i18n.T(c, "error.webhook.get_logs_failed"),
			})
			return
		}
	} else {
		stats.LastCallTime = &lastLog.CreatedAt
	}

	// 统计今日调用次数
	today := time.Now().Format("2006-01-02")
	if err := db.Model(&models.WebhookLog{}).
		Where("DATE(created_at) = ?", today).
		Count(&stats.TodayCalls).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": i18n.T(c, "error.webhook.get_logs_failed"),
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}
