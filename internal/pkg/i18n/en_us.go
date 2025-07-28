package i18n

// getEnglishMessages 获取英文语言包
func getEnglishMessages() map[string]interface{} {
	return map[string]interface{}{
		"error": map[string]interface{}{
			"config": map[string]interface{}{
				"get_failed":    "Failed to get system configuration",
				"not_found":     "Configuration item not found: {{0}}",
				"query_failed":  "Failed to query configuration",
				"update_failed": "Failed to update configuration",
				"save_failed":   "Failed to save configuration",
				"required":      "{{0}} is required",
			},
			"request": map[string]interface{}{
				"invalid_params": "Invalid request parameters: {{0}}",
				"bind_failed":    "Failed to bind parameters",
			},
			"script": map[string]interface{}{
				"not_found":           "Script not found",
				"create_failed":       "Failed to create script",
				"update_failed":       "Failed to update script",
				"delete_failed":       "Failed to delete script",
				"get_failed":          "Failed to get script",
				"save_content_failed": "Failed to save script content",
				"load_content_failed": "Failed to load script content",
				"execute_failed":      "Script execution failed",
			},
			"webhook": map[string]interface{}{
				"invalid_signature":   "Signature verification failed",
				"script_not_found":    "Script not found or disabled",
				"execution_timeout":   "Script execution timeout",
				"get_logs_failed":     "Failed to get webhook logs",
				"script_id_required":  "Script ID is required",
				"script_disabled":     "Script is disabled",
				"read_content_failed": "Failed to read script content",
				"get_domain_failed":   "Failed to get system domain configuration",
			},
			"auth": map[string]interface{}{
				"invalid_token":         "Invalid access token",
				"missing_token":         "Missing access token",
				"unauthorized":          "Unauthorized access",
				"missing_header":        "Missing Authorization header",
				"invalid_header_format": "Invalid Authorization header format, should be 'Bearer <token>'",
				"empty_token":           "Token cannot be empty",
			},
			"database": map[string]interface{}{
				"connection_failed":  "Database connection failed",
				"query_failed":       "Database query failed",
				"transaction_failed": "Transaction execution failed",
			},
		},
		"success": map[string]interface{}{
			"config": map[string]interface{}{
				"saved": "Configuration saved successfully ✅",
			},
			"script": map[string]interface{}{
				"created": "Script created successfully 🎉",
				"updated": "Script updated successfully ✅",
				"deleted": "Script deleted successfully 🗑️",
			},
			"webhook": map[string]interface{}{
				"executed": "Script executed successfully",
			},
			"system": map[string]interface{}{
				"running": "Service is running normally ✅",
			},
		},
		"category": map[string]interface{}{
			"system":  "System Configuration",
			"webhook": "Webhook Configuration",
		},
		"config": map[string]interface{}{
			"system_domain": map[string]interface{}{
				"label":       "System Domain",
				"description": "System access domain for generating Webhook URLs",
			},
			"webhook_timeout": map[string]interface{}{
				"label":       "Execution Timeout",
				"description": "Script execution timeout (seconds)",
			},
			"system_language": map[string]interface{}{
				"label":       "Interface Language",
				"description": "System interface display language",
			},
		},
		"validation": map[string]interface{}{
			"required":       "Please enter {{0}}",
			"invalid_url":    "Please enter a valid domain format",
			"invalid_number": "Please enter a valid number",
			"max_length":     "{{0}} cannot exceed {{1}} characters",
		},
		"status": map[string]interface{}{
			"enabled":  "Enabled",
			"disabled": "Disabled",
			"running":  "Running",
			"stopped":  "Stopped",
			"success":  "Success",
			"failed":   "Failed",
		},
		"action": map[string]interface{}{
			"create":  "Create",
			"update":  "Update",
			"delete":  "Delete",
			"save":    "Save",
			"cancel":  "Cancel",
			"edit":    "Edit",
			"view":    "View",
			"enable":  "Enable",
			"disable": "Disable",
		},
		"field": map[string]interface{}{
			"name":        "Name",
			"description": "Description",
			"content":     "Content",
			"executor":    "Executor",
			"status":      "Status",
			"created_at":  "Created At",
			"updated_at":  "Updated At",
			"call_count":  "Call Count",
			"last_call":   "Last Call",
		},
	}
}
