package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ProtectedEndpoint 受保护的示例接口
func ProtectedEndpoint(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "恭喜！你已通过认证 🎉",
		"data":    "这是受保护的数据",
		"user":    "authenticated_user",
	})
}
