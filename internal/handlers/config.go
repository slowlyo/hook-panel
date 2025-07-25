package handlers

import (
	"net/http"

	"hook-panel/internal/models"
	"hook-panel/internal/pkg/database"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetSystemConfigs 获取系统配置
func GetSystemConfigs(c *gin.Context) {
	db := database.GetDB()
	
	var configs []models.SystemConfig
	if err := db.Order("category, key").Find(&configs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "获取系统配置失败",
		})
		return
	}

	// 按分类组织配置
	categoryMap := make(map[string][]models.ConfigResponse)
	for _, config := range configs {
		response := models.ConfigResponse{
			Key:         config.Key,
			Value:       config.Value,
			Type:        config.Type,
			Category:    config.Category,
			Label:       config.Label,
			Description: config.Description,
			Required:    config.Required,
		}
		
		// 如果是加密字段，不返回实际值
		if config.Encrypted && config.Value != "" {
			response.Value = "******"
		}
		
		categoryMap[config.Category] = append(categoryMap[config.Category], response)
	}

	// 转换为分类结构
	var categories []models.ConfigCategory
	categoryLabels := map[string]string{
		"system":  "系统配置",
		"webhook": "Webhook 配置",
	}
	
	for category, configList := range categoryMap {
		label := categoryLabels[category]
		if label == "" {
			label = category
		}
		
		categories = append(categories, models.ConfigCategory{
			Category: category,
			Label:    label,
			Configs:  configList,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data": categories,
	})
}

// UpdateSystemConfigs 更新系统配置
func UpdateSystemConfigs(c *gin.Context) {
	var req models.ConfigUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "请求参数错误: " + err.Error(),
		})
		return
	}

	db := database.GetDB()
	
	// 开始事务
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 更新每个配置项
	for _, configItem := range req.Configs {
		var config models.SystemConfig
		if err := tx.Where("key = ?", configItem.Key).First(&config).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				tx.Rollback()
				c.JSON(http.StatusNotFound, gin.H{
					"error": "配置项不存在: " + configItem.Key,
				})
				return
			}
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "查询配置失败",
			})
			return
		}

		// 验证必填项
		if config.Required && configItem.Value == "" {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{
				"error": config.Label + " 是必填项",
			})
			return
		}

		// 更新配置值
		if err := tx.Model(&config).Update("value", configItem.Value).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "更新配置失败",
			})
			return
		}
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "保存配置失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "配置保存成功 ✅",
	})
}

// GetConfigValue 获取单个配置值（内部使用）
func GetConfigValue(key string) (string, error) {
	db := database.GetDB()
	
	var config models.SystemConfig
	if err := db.Where("key = ?", key).First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", nil // 配置不存在返回空字符串
		}
		return "", err
	}
	
	return config.Value, nil
}

// SetConfigValue 设置单个配置值（内部使用）
func SetConfigValue(key, value string) error {
	db := database.GetDB()
	
	var config models.SystemConfig
	if err := db.Where("key = ?", key).First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return gorm.ErrRecordNotFound
		}
		return err
	}
	
	return db.Model(&config).Update("value", value).Error
}
