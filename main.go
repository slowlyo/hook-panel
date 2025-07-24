package main

import (
	"log"
	"os"

	"hook-panel/internal/handlers"
	"hook-panel/internal/middleware"
	"hook-panel/internal/pkg/auth"
	"hook-panel/internal/pkg/database"

	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化密钥
	if err := auth.InitSecretKey(); err != nil {
		log.Fatal("密钥初始化失败:", err)
	}

	// 初始化数据库
	if err := database.InitDatabase(); err != nil {
		log.Fatal("数据库初始化失败:", err)
	}

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

		// 脚本管理路由
		scripts := api.Group("/scripts")
		{
			scripts.GET("", handlers.GetScripts)                   // 获取脚本列表
			scripts.POST("", handlers.CreateScript)                // 创建脚本
			scripts.GET("/:id", handlers.GetScript)                // 获取单个脚本
			scripts.PUT("/:id", handlers.UpdateScript)             // 更新脚本
			scripts.DELETE("/:id", handlers.DeleteScript)          // 删除脚本
			scripts.POST("/:id/toggle", handlers.ToggleScript)     // 切换脚本状态
			scripts.POST("/:id/call", handlers.IncrementCallCount) // 增加调用次数
			scripts.POST("/:id/execute", handlers.ExecuteScript)   // 执行脚本
			scripts.GET("/:id/logs", handlers.GetScriptLogs)       // 获取脚本日志
		}
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
