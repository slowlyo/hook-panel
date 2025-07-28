package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"

	"hook-panel/internal/handlers"
	"hook-panel/internal/middleware"
	"hook-panel/internal/pkg/auth"
	"hook-panel/internal/pkg/database"
	"hook-panel/internal/pkg/i18n"

	"github.com/gin-gonic/gin"
)

//go:embed web/dist/*
var staticFiles embed.FS

// setupStaticFiles 设置静态文件服务
func setupStaticFiles(r *gin.Engine) {
	// 获取嵌入的文件系统
	distFS, err := fs.Sub(staticFiles, "web/dist")
	if err != nil {
		log.Fatal("Failed to get static file system:", err)
	}

	// 处理前端路由，所有非API请求都返回index.html或静态文件
	r.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path

		// If it's an API request, return 404
		if len(path) >= 4 && path[:4] == "/api" {
			c.JSON(http.StatusNotFound, gin.H{"error": "API not found"})
			return
		}

		// If it's a webhook request, return 404
		if len(path) >= 2 && path[:2] == "/h" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Webhook not found"})
			return
		}

		// 去掉开头的斜杠
		filePath := path
		if filePath == "/" {
			filePath = "/index.html"
		}
		filePath = filePath[1:] // 去掉开头的 /

		// 尝试打开静态文件
		file, err := distFS.Open(filePath)
		if err == nil {
			defer file.Close()

			// 设置正确的Content-Type
			contentType := getContentType(filePath)
			c.Header("Content-Type", contentType)

			if stat, err := file.Stat(); err == nil {
				c.DataFromReader(http.StatusOK, stat.Size(), contentType, file, nil)
				return
			}
		}

		// 如果文件不存在，返回index.html（SPA路由）
		indexFile, err := distFS.Open("index.html")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load page"})
			return
		}
		defer indexFile.Close()

		c.Header("Content-Type", "text/html; charset=utf-8")
		if stat, err := indexFile.Stat(); err == nil {
			c.DataFromReader(http.StatusOK, stat.Size(), "text/html; charset=utf-8", indexFile, nil)
		}
	})
}

// getContentType 根据文件扩展名返回Content-Type
func getContentType(filePath string) string {
	if len(filePath) == 0 {
		return "text/html; charset=utf-8"
	}

	// 获取文件扩展名
	ext := ""
	for i := len(filePath) - 1; i >= 0; i-- {
		if filePath[i] == '.' {
			ext = filePath[i:]
			break
		}
		if filePath[i] == '/' {
			break
		}
	}

	switch ext {
	case ".html":
		return "text/html; charset=utf-8"
	case ".css":
		return "text/css; charset=utf-8"
	case ".js":
		return "application/javascript; charset=utf-8"
	case ".json":
		return "application/json; charset=utf-8"
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".gif":
		return "image/gif"
	case ".svg":
		return "image/svg+xml"
	case ".ico":
		return "image/x-icon"
	default:
		return "application/octet-stream"
	}
}

func main() {
	// 解析命令行参数
	var port string
	flag.StringVar(&port, "port", "", "Server port (default: 8080)")
	flag.StringVar(&port, "p", "", "Server port (short)")
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "Hook Panel - Lightweight Webhook Script Management Platform\n\n")
		fmt.Fprintf(os.Stderr, "Usage:\n")
		fmt.Fprintf(os.Stderr, "  %s [options]\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "Options:\n")
		flag.PrintDefaults()
		fmt.Fprintf(os.Stderr, "\nExamples:\n")
		fmt.Fprintf(os.Stderr, "  %s --port 3000    # Start service on port 3000\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  %s -p 8888        # Start service on port 8888\n", os.Args[0])
	}
	flag.Parse()

	log.Println("🚀 Starting Hook Panel...")

	// Initialize secret key
	log.Println("🔑 Initializing secret key...")
	if err := auth.InitSecretKey(); err != nil {
		log.Fatal("Failed to initialize secret key:", err)
	}

	// Initialize database
	log.Println("📦 Initializing database...")
	if err := database.InitDatabase(port); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// Initialize i18n system
	log.Println("🌐 Initializing i18n system...")
	i18n.Init()

	// Set Gin mode
	log.Println("🌐 Setting up web service...")
	gin.SetMode(gin.ReleaseMode)

	// 创建路由器
	r := gin.New()

	// 添加基础中间件
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// 设置静态文件服务
	setupStaticFiles(r)

	// 健康检查接口（无需认证）
	r.GET("/health", handlers.HealthCheck)

	// Webhook 路由（无需认证，使用签名验证，但需要i18n支持）
	webhook := r.Group("/h")
	webhook.Use(middleware.I18nMiddleware())
	{
		webhook.POST("/:id", handlers.WebhookHandler)
	}

	// 需要认证的路由组
	api := r.Group("/api")
	api.Use(middleware.I18nMiddleware())
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

	log.Printf("🚀 Service started on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start service:", err)
	}
}
