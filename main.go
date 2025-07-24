package main

import (
	"log"
	"os"

	"hook-panel/internal/handlers"
	"hook-panel/internal/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	// 设置 Gin 模式
	gin.SetMode(gin.ReleaseMode)

	// 创建路由器
	r := gin.New()

	// 添加基础中间件
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// 健康检查接口（无需认证）
	r.GET("/health", handlers.HealthCheck)

	// 需要认证的路由组
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/protected", handlers.ProtectedEndpoint)
	}

	// 获取端口，默认 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 服务启动在端口 %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("启动服务失败:", err)
	}
}
