package middleware

import (
	"hook-panel/internal/pkg/auth"
	"hook-panel/internal/pkg/i18n"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware 密钥认证中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取密钥
		secretKey := auth.GetSecretKey()

		// 从 Header 中获取 Authorization
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": i18n.T(c, "error.auth.missing_header"),
			})
			c.Abort()
			return
		}

		// 检查是否以 "Bearer " 开头
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": i18n.T(c, "error.auth.invalid_header_format"),
			})
			c.Abort()
			return
		}

		// 提取 token
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": i18n.T(c, "error.auth.empty_token"),
			})
			c.Abort()
			return
		}

		// 验证 token
		if token != secretKey {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": i18n.T(c, "error.auth.invalid_token"),
			})
			c.Abort()
			return
		}

		// 认证通过，继续处理请求
		c.Next()
	}
}
