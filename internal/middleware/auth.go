package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware 密钥认证中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从环境变量获取密钥，默认值为 "your-secret-key"
		secretKey := os.Getenv("SECRET_KEY")
		if secretKey == "" {
			secretKey = "your-secret-key"
		}

		// 从 Header 中获取 Authorization
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "缺少 Authorization header",
			})
			c.Abort()
			return
		}

		// 检查是否以 "Bearer " 开头
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header 格式错误，应为 'Bearer <token>'",
			})
			c.Abort()
			return
		}

		// 提取 token
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Token 不能为空",
			})
			c.Abort()
			return
		}

		// 验证 token
		if token != secretKey {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "无效的 token",
			})
			c.Abort()
			return
		}

		// 认证通过，继续处理请求
		c.Next()
	}
}
