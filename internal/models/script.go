package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Script 脚本模型
type Script struct {
	ID          string     `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Name        string     `json:"name" gorm:"not null;size:255" binding:"required"`
	Description string     `json:"description" gorm:"size:1000"`
	Executor    string     `json:"executor" gorm:"not null;size:20;default:bash" binding:"required"`
	Enabled     bool       `json:"enabled" gorm:"default:true"`
	CallCount   int64      `json:"call_count" gorm:"default:0"`
	LastCallAt  *time.Time `json:"last_call_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// BeforeCreate GORM 钩子，在创建前生成 UUID
func (s *Script) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	return nil
}

// TableName 指定表名
func (Script) TableName() string {
	return "scripts"
}

// ScriptCreateRequest 创建脚本请求
type ScriptCreateRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Content     string `json:"content"`
	Executor    string `json:"executor" binding:"required,oneof=bash sh python python3 node php ruby perl go java powershell cmd"`
	Enabled     bool   `json:"enabled"`
}

// ScriptUpdateRequest 更新脚本请求
type ScriptUpdateRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Content     string `json:"content"`
	Executor    string `json:"executor" binding:"omitempty,oneof=bash sh python python3 node php ruby perl go java powershell cmd"`
	Enabled     *bool  `json:"enabled"`
}

// ScriptResponse 脚本响应（包含内容）
type ScriptResponse struct {
	Script
	Content string `json:"content"`
}

// ScriptListResponse 脚本列表响应
type ScriptListResponse struct {
	Data  []Script `json:"data"`
	Total int64    `json:"total"`
}
