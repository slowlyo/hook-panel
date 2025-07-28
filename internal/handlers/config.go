package handlers

import (
	"net/http"
	"strings"

	"hook-panel/internal/models"
	"hook-panel/internal/pkg/database"
	"hook-panel/internal/pkg/i18n"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// isTranslationKey 检查是否为翻译key
func isTranslationKey(text string) bool {
	return strings.Contains(text, ".")
}

// GetSystemConfigs 获取系统配置
func GetSystemConfigs(c *gin.Context) {
	db := database.GetDB()

	var configs []models.SystemConfig
	if err := db.Order("category, key").Find(&configs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": i18n.T(c, "error.config.get_failed"),
		})
		return
	}

	// 按分类组织配置
	categoryMap := make(map[string][]models.ConfigResponse)
	for _, config := range configs {
		// 翻译标签和描述
		label := config.Label
		description := config.Description

		// 如果是翻译key，则进行翻译
		if isTranslationKey(config.Label) {
			label = i18n.T(c, config.Label)
		}
		if isTranslationKey(config.Description) {
			description = i18n.T(c, config.Description)
		}

		response := models.ConfigResponse{
			Key:         config.Key,
			Value:       config.Value,
			Type:        config.Type,
			Category:    config.Category,
			Label:       label,
			Description: description,
			Options:     config.Options,
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

	for category, configList := range categoryMap {
		// 使用多语言翻译分类标签
		label := i18n.T(c, "category."+category)
		if label == "category."+category {
			// 如果翻译不存在，使用原始值
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
			"error": i18n.T(c, "error.request.invalid_params", err.Error()),
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
					"error": i18n.T(c, "error.config.not_found", configItem.Key),
				})
				return
			}
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": i18n.T(c, "error.config.query_failed"),
			})
			return
		}

		// 验证必填项
		if config.Required && configItem.Value == "" {
			tx.Rollback()
			// 获取配置项的显示标签
			label := config.Label
			if isTranslationKey(config.Label) {
				label = i18n.T(c, config.Label)
			}
			c.JSON(http.StatusBadRequest, gin.H{
				"error": i18n.T(c, "error.config.required", label),
			})
			return
		}

		// 更新配置值
		if err := tx.Model(&config).Update("value", configItem.Value).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": i18n.T(c, "error.config.update_failed"),
			})
			return
		}
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": i18n.T(c, "error.config.save_failed"),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": i18n.T(c, "success.config.saved"),
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
