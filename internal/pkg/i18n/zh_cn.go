package i18n

// getChineseMessages 获取中文语言包
func getChineseMessages() map[string]interface{} {
	return map[string]interface{}{
		"error": map[string]interface{}{
			"config": map[string]interface{}{
				"get_failed":    "获取系统配置失败",
				"not_found":     "配置项不存在: {{0}}",
				"query_failed":  "查询配置失败",
				"update_failed": "更新配置失败",
				"save_failed":   "保存配置失败",
				"required":      "{{0}} 是必填项",
			},
			"request": map[string]interface{}{
				"invalid_params": "请求参数错误: {{0}}",
				"bind_failed":    "参数绑定失败",
			},
			"script": map[string]interface{}{
				"not_found":           "脚本不存在",
				"create_failed":       "创建脚本失败",
				"update_failed":       "更新脚本失败",
				"delete_failed":       "删除脚本失败",
				"get_failed":          "获取脚本失败",
				"save_content_failed": "保存脚本内容失败",
				"load_content_failed": "加载脚本内容失败",
				"execute_failed":      "脚本执行失败",
			},
			"webhook": map[string]interface{}{
				"invalid_signature":   "签名验证失败",
				"script_not_found":    "脚本不存在或已禁用",
				"execution_timeout":   "脚本执行超时",
				"get_logs_failed":     "获取调用记录失败",
				"script_id_required":  "脚本 ID 不能为空",
				"script_disabled":     "脚本已禁用",
				"read_content_failed": "读取脚本内容失败",
				"get_domain_failed":   "获取系统域名配置失败",
			},
			"auth": map[string]interface{}{
				"invalid_token":         "访问令牌无效",
				"missing_token":         "缺少访问令牌",
				"unauthorized":          "未授权访问",
				"missing_header":        "缺少 Authorization header",
				"invalid_header_format": "Authorization header 格式错误，应为 'Bearer <token>'",
				"empty_token":           "Token 不能为空",
			},
			"database": map[string]interface{}{
				"connection_failed":  "数据库连接失败",
				"query_failed":       "数据库查询失败",
				"transaction_failed": "事务执行失败",
			},
		},
		"success": map[string]interface{}{
			"config": map[string]interface{}{
				"saved": "配置保存成功 ✅",
			},
			"script": map[string]interface{}{
				"created": "脚本创建成功 🎉",
				"updated": "脚本更新成功 ✅",
				"deleted": "脚本删除成功 🗑️",
			},
			"webhook": map[string]interface{}{
				"executed": "脚本执行成功",
			},
			"system": map[string]interface{}{
				"running": "服务运行正常 ✅",
			},
		},
		"category": map[string]interface{}{
			"system":  "系统配置",
			"webhook": "Webhook 配置",
		},
		"config": map[string]interface{}{
			"system_domain": map[string]interface{}{
				"label":       "系统域名",
				"description": "系统访问域名，用于生成 Webhook URL",
			},
			"webhook_timeout": map[string]interface{}{
				"label":       "执行超时时间",
				"description": "脚本执行超时时间（秒）",
			},
			"system_language": map[string]interface{}{
				"label":       "界面语言",
				"description": "系统界面显示语言",
			},
		},
		"validation": map[string]interface{}{
			"required":       "请输入{{0}}",
			"invalid_url":    "请输入有效的域名格式",
			"invalid_number": "请输入有效的数字",
			"max_length":     "{{0}}不能超过{{1}}个字符",
		},
		"status": map[string]interface{}{
			"enabled":  "启用",
			"disabled": "禁用",
			"running":  "运行中",
			"stopped":  "已停止",
			"success":  "成功",
			"failed":   "失败",
		},
		"action": map[string]interface{}{
			"create":  "创建",
			"update":  "更新",
			"delete":  "删除",
			"save":    "保存",
			"cancel":  "取消",
			"edit":    "编辑",
			"view":    "查看",
			"enable":  "启用",
			"disable": "禁用",
		},
		"field": map[string]interface{}{
			"name":        "名称",
			"description": "描述",
			"content":     "内容",
			"executor":    "执行器",
			"status":      "状态",
			"created_at":  "创建时间",
			"updated_at":  "更新时间",
			"call_count":  "调用次数",
			"last_call":   "最近调用",
		},
	}
}
