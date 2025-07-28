package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SystemConfig 系统配置模型
type SystemConfig struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Key         string    `json:"key" gorm:"uniqueIndex;not null;size:100" binding:"required"`
	Value       string    `json:"value" gorm:"type:text"`
	Type        string    `json:"type" gorm:"not null;size:20;default:string" binding:"required"`
	Category    string    `json:"category" gorm:"not null;size:50;default:general" binding:"required"`
	Label       string    `json:"label" gorm:"not null;size:200" binding:"required"`
	Description string    `json:"description" gorm:"size:500"`
	Options     string    `json:"options" gorm:"type:text"` // JSON格式的选项数据，用于select类型
	Required    bool      `json:"required" gorm:"default:false"`
	Encrypted   bool      `json:"encrypted" gorm:"default:false"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// BeforeCreate GORM 钩子，在创建前生成 UUID
func (sc *SystemConfig) BeforeCreate(tx *gorm.DB) error {
	if sc.ID == "" {
		sc.ID = uuid.New().String()
	}
	return nil
}

// TableName 指定表名
func (SystemConfig) TableName() string {
	return "system_configs"
}

// ConfigUpdateRequest 配置更新请求
type ConfigUpdateRequest struct {
	Configs []ConfigItem `json:"configs" binding:"required"`
}

// ConfigItem 配置项
type ConfigItem struct {
	Key   string `json:"key" binding:"required"`
	Value string `json:"value"`
}

// ConfigResponse 配置响应
type ConfigResponse struct {
	Key         string `json:"key"`
	Value       string `json:"value"`
	Type        string `json:"type"`
	Category    string `json:"category"`
	Label       string `json:"label"`
	Description string `json:"description"`
	Options     string `json:"options,omitempty"` // JSON格式的选项数据
	Required    bool   `json:"required"`
}

// ConfigCategory 配置分类
type ConfigCategory struct {
	Category string           `json:"category"`
	Label    string           `json:"label"`
	Configs  []ConfigResponse `json:"configs"`
}

// 预定义的系统配置项
var DefaultSystemConfigs = []SystemConfig{
	{
		Key:         "system.domain",
		Value:       "",
		Type:        "url",
		Category:    "system",
		Label:       "config.system_domain.label", // 使用翻译key
		Description: "config.system_domain.description",
		Required:    true,
		Encrypted:   false,
	},
	{
		Key:         "webhook.timeout",
		Value:       "60",
		Type:        "number",
		Category:    "system",
		Label:       "config.webhook_timeout.label",
		Description: "config.webhook_timeout.description",
		Required:    false,
		Encrypted:   false,
	},
	{
		Key:         "system.language",
		Value:       "zh-CN",
		Type:        "select",
		Category:    "system",
		Label:       "config.system_language.label",
		Description: "config.system_language.description",
		Options:     `[{"label":"中文","value":"zh-CN"},{"label":"English","value":"en-US"}]`,
		Required:    false,
		Encrypted:   false,
	},
}
