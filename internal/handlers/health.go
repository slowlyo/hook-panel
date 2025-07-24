package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// HealthCheck 健康检查接口
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "ok",
		"message":   "服务运行正常 ✅",
		"timestamp": time.Now().Format("2006-01-02 15:04:05"),
		"service":   "hook-panel",
	})
}
