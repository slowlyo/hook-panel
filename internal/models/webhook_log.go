package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WebhookLog webhook 调用记录模型
type WebhookLog struct {
	ID           string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	ScriptID     string    `json:"script_id" gorm:"not null;type:varchar(36);index"`
	Method       string    `json:"method" gorm:"not null;size:10"`
	Headers      string    `json:"headers" gorm:"type:text"`
	Body         string    `json:"body" gorm:"type:text"`
	SourceIP     string    `json:"source_ip" gorm:"size:45"`
	UserAgent    string    `json:"user_agent" gorm:"size:500"`
	Status       int       `json:"status" gorm:"not null"`
	ResponseTime int64     `json:"response_time" gorm:"comment:响应时间(毫秒)"`
	ErrorMsg     string    `json:"error_msg" gorm:"size:1000"`
	CreatedAt    time.Time `json:"created_at"`

	// 关联脚本
	Script Script `json:"script,omitempty" gorm:"foreignKey:ScriptID;references:ID"`
}

// BeforeCreate GORM 钩子，在创建前生成 UUID
func (w *WebhookLog) BeforeCreate(tx *gorm.DB) error {
	if w.ID == "" {
		w.ID = uuid.New().String()
	}
	return nil
}

// TableName 指定表名
func (WebhookLog) TableName() string {
	return "webhook_logs"
}

// WebhookLogListRequest 查询请求
type WebhookLogListRequest struct {
	ScriptID  string `form:"script_id"`
	Status    *int   `form:"status"`
	StartTime string `form:"start_time"`
	EndTime   string `form:"end_time"`
	Page      int    `form:"page,default=1"`
	PageSize  int    `form:"page_size,default=20"`
	SortField string `form:"sort_field"`
	SortOrder string `form:"sort_order"`
}

// WebhookLogListResponse 查询响应
type WebhookLogListResponse struct {
	Data     []WebhookLog `json:"data"`
	Total    int64        `json:"total"`
	Page     int          `json:"page"`
	PageSize int          `json:"page_size"`
}

// WebhookLogStats webhook 调用统计
type WebhookLogStats struct {
	TotalCalls   int64      `json:"total_calls"`
	SuccessCalls int64      `json:"success_calls"`
	FailedCalls  int64      `json:"failed_calls"`
	SuccessRate  float64    `json:"success_rate"`
	AvgResponse  float64    `json:"avg_response_time"`
	LastCallTime *time.Time `json:"last_call_time"`
}

// DashboardStats 仪表板统计
type DashboardStats struct {
	TotalScripts    int64      `json:"total_scripts"`
	EnabledScripts  int64      `json:"enabled_scripts"`
	DisabledScripts int64      `json:"disabled_scripts"`
	TotalCalls      int64      `json:"total_calls"`
	SuccessCalls    int64      `json:"success_calls"`
	FailedCalls     int64      `json:"failed_calls"`
	SuccessRate     float64    `json:"success_rate"`
	AvgResponseTime float64    `json:"avg_response_time"`
	LastCallTime    *time.Time `json:"last_call_time"`
	TodayCalls      int64      `json:"today_calls"`
}
