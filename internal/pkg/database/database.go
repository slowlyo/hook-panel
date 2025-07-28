package database

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"hook-panel/internal/models"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDatabase 初始化数据库
func InitDatabase(port string) error {
	// 确保 data 目录存在
	dataDir := "./data"
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return fmt.Errorf("failed to create data directory: %v", err)
	}

	// 确保 scripts 目录存在
	scriptsDir := filepath.Join(dataDir, "scripts")
	if err := os.MkdirAll(scriptsDir, 0755); err != nil {
		return fmt.Errorf("failed to create scripts directory: %v", err)
	}

	// 确保 logs 目录存在
	logsDir := filepath.Join(dataDir, "logs")
	if err := os.MkdirAll(logsDir, 0755); err != nil {
		return fmt.Errorf("failed to create logs directory: %v", err)
	}

	// 确保 temp 目录存在
	tempDir := filepath.Join(dataDir, "temp")
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return fmt.Errorf("failed to create temp directory: %v", err)
	}

	// 数据库文件路径
	dbPath := filepath.Join(dataDir, "hook-panel.db")

	// 连接数据库
	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent), // 生产环境静默日志
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %v", err)
	}

	// 自动迁移
	if err := DB.AutoMigrate(&models.Script{}, &models.WebhookLog{}, &models.SystemConfig{}); err != nil {
		return fmt.Errorf("failed to migrate database: %v", err)
	}

	// 初始化默认系统配置
	if err := initDefaultConfigs(port); err != nil {
		return fmt.Errorf("failed to initialize default configs: %v", err)
	}

	log.Println("📦 Database initialized successfully")
	return nil
}

// GetDB 获取数据库实例
func GetDB() *gorm.DB {
	return DB
}

// CloseDatabase 关闭数据库连接
func CloseDatabase() error {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}

// initDefaultConfigs 初始化默认系统配置
func initDefaultConfigs(port string) error {
	for _, config := range models.DefaultSystemConfigs {
		// 检查配置是否已存在
		var existingConfig models.SystemConfig
		if err := DB.Where("key = ?", config.Key).First(&existingConfig).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// 配置不存在，创建新配置
				newConfig := config

				// 如果是域名配置且使用自定义端口，设置默认域名
				if config.Key == "system.domain" && port != "" && port != "8080" {
					newConfig.Value = fmt.Sprintf("http://localhost:%s", port)
				}

				if err := DB.Create(&newConfig).Error; err != nil {
					return fmt.Errorf("failed to create default config %s: %v", config.Key, err)
				}
			} else {
				return fmt.Errorf("failed to query config %s: %v", config.Key, err)
			}
		}
		// 配置已存在，跳过
	}
	return nil
}
