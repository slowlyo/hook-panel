package database

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"hook-panel/internal/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDatabase 初始化数据库
func InitDatabase() error {
	// 确保 data 目录存在
	dataDir := "./data"
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return fmt.Errorf("创建 data 目录失败: %v", err)
	}

	// 确保 scripts 目录存在
	scriptsDir := filepath.Join(dataDir, "scripts")
	if err := os.MkdirAll(scriptsDir, 0755); err != nil {
		return fmt.Errorf("创建 scripts 目录失败: %v", err)
	}

	// 确保 logs 目录存在
	logsDir := filepath.Join(dataDir, "logs")
	if err := os.MkdirAll(logsDir, 0755); err != nil {
		return fmt.Errorf("创建 logs 目录失败: %v", err)
	}

	// 确保 temp 目录存在
	tempDir := filepath.Join(dataDir, "temp")
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return fmt.Errorf("创建 temp 目录失败: %v", err)
	}

	// 数据库文件路径
	dbPath := filepath.Join(dataDir, "hook-panel.db")

	// 连接数据库
	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent), // 生产环境静默日志
	})
	if err != nil {
		return fmt.Errorf("连接数据库失败: %v", err)
	}

	// 自动迁移
	if err := DB.AutoMigrate(&models.Script{}); err != nil {
		return fmt.Errorf("数据库迁移失败: %v", err)
	}

	log.Println("📦 数据库初始化成功")
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
