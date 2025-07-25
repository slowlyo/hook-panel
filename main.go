package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"hook-panel/internal/handlers"
	"hook-panel/internal/middleware"
	"hook-panel/internal/pkg/auth"
	"hook-panel/internal/pkg/database"

	"github.com/gin-gonic/gin"
)

func main() {
	// 解析命令行参数
	var port string
	flag.StringVar(&port, "port", "", "服务端口 (默认: 8080)")
	flag.StringVar(&port, "p", "", "服务端口 (简写)")
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "Hook Panel - 轻量级 Webhook 脚本管理平台\n\n")
		fmt.Fprintf(os.Stderr, "使用方法:\n")
		fmt.Fprintf(os.Stderr, "  %s [选项]\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "选项:\n")
		flag.PrintDefaults()
		fmt.Fprintf(os.Stderr, "\n示例:\n")
		fmt.Fprintf(os.Stderr, "  %s --port 3000    # 在端口 3000 启动服务\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  %s -p 8888        # 在端口 8888 启动服务\n", os.Args[0])
	}
	flag.Parse()

	log.Println("🚀 启动 Hook Panel...")

	// 初始化密钥
	log.Println("🔑 初始化密钥...")
	if err := auth.InitSecretKey(); err != nil {
		log.Fatal("密钥初始化失败:", err)
	}

	// 初始化数据库
	log.Println("📦 初始化数据库...")
	if err := database.InitDatabase(port); err != nil {
		log.Fatal("数据库初始化失败:", err)
	}

	// 设置 Gin 模式
	log.Println("🌐 设置 Web 服务...")
	gin.SetMode(gin.ReleaseMode)

	// 创建路由器
	r := gin.New()

	// 添加基础中间件
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// 健康检查接口（无需认证）
	r.GET("/health", handlers.HealthCheck)

	// Webhook 路由（无需认证，使用签名验证）
	r.POST("/h/:id", handlers.WebhookHandler)

	// 需要认证的路由组
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		// 仪表板统计
		api.GET("/dashboard/stats", handlers.GetDashboardStats)

		// 脚本管理路由
		scripts := api.Group("/scripts")
		{
			scripts.GET("", handlers.GetScripts)                           // 获取脚本列表
			scripts.POST("", handlers.CreateScript)                        // 创建脚本
			scripts.GET("/:id", handlers.GetScript)                        // 获取单个脚本
			scripts.PUT("/:id", handlers.UpdateScript)                     // 更新脚本
			scripts.DELETE("/:id", handlers.DeleteScript)                  // 删除脚本
			scripts.POST("/:id/toggle", handlers.ToggleScript)             // 切换脚本状态
			scripts.POST("/:id/execute", handlers.ExecuteScript)           // 执行脚本
			scripts.GET("/:id/logs", handlers.GetScriptLogs)               // 获取脚本日志
			scripts.DELETE("/:id/logs", handlers.ClearScriptLogs)          // 清空脚本日志
			scripts.GET("/:id/webhook", handlers.GetWebhookURL)            // 获取 webhook URL
			scripts.GET("/:id/webhook-logs", handlers.GetWebhookLogs)      // 获取 webhook 调用记录
			scripts.GET("/:id/webhook-stats", handlers.GetWebhookLogStats) // 获取 webhook 调用统计
			scripts.DELETE("/:id/webhook-logs", handlers.ClearWebhookLogs) // 清空 webhook 调用记录
		}

		// 全局 webhook 日志路由
		webhookLogs := api.Group("/webhook-logs")
		{
			webhookLogs.GET("", handlers.GetWebhookLogs) // 获取所有 webhook 调用记录
		}

		// 系统配置路由
		config := api.Group("/config")
		{
			config.GET("", handlers.GetSystemConfigs)    // 获取系统配置
			config.PUT("", handlers.UpdateSystemConfigs) // 更新系统配置
		}
	}

	// 确定最终端口
	if port == "" {
		port = os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}
	}

	log.Printf("🚀 服务启动在端口 %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("启动服务失败:", err)
	}
}
