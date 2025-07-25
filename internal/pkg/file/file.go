package file

import (
	"fmt"
	"os"
	"path/filepath"
)

const (
	ScriptsDir = "./data/scripts"
	LogsDir    = "./data/logs"
)

// SaveScriptContent 保存脚本内容到文件
func SaveScriptContent(scriptID, content string) error {
	// 确保目录存在
	if err := os.MkdirAll(ScriptsDir, 0755); err != nil {
		return fmt.Errorf("创建脚本目录失败: %v", err)
	}

	// 脚本文件路径
	filePath := filepath.Join(ScriptsDir, scriptID+".txt")

	// 写入文件
	if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
		return fmt.Errorf("保存脚本内容失败: %v", err)
	}

	return nil
}

// ReadScriptContent 读取脚本内容
func ReadScriptContent(scriptID string) (string, error) {
	filePath := filepath.Join(ScriptsDir, scriptID+".txt")

	// 检查文件是否存在
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return "", nil // 文件不存在返回空字符串
	}

	// 读取文件内容
	content, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("读取脚本内容失败: %v", err)
	}

	return string(content), nil
}

// DeleteScriptContent 删除脚本内容文件
func DeleteScriptContent(scriptID string) error {
	filePath := filepath.Join(ScriptsDir, scriptID+".txt")

	// 检查文件是否存在
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil // 文件不存在，无需删除
	}

	// 删除文件
	if err := os.Remove(filePath); err != nil {
		return fmt.Errorf("删除脚本内容失败: %v", err)
	}

	return nil
}

// SaveScriptLog 保存脚本执行日志
func SaveScriptLog(scriptID, logContent string) error {
	// 确保日志目录存在
	if err := os.MkdirAll(LogsDir, 0755); err != nil {
		return fmt.Errorf("创建日志目录失败: %v", err)
	}

	// 日志文件路径
	logPath := filepath.Join(LogsDir, scriptID+".log")

	// 追加写入日志文件
	file, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return fmt.Errorf("打开日志文件失败: %v", err)
	}
	defer file.Close()

	// 写入日志内容
	if _, err := file.WriteString(logContent); err != nil {
		return fmt.Errorf("写入日志失败: %v", err)
	}

	return nil
}

// ReadScriptLog 读取脚本执行日志
func ReadScriptLog(scriptID string) (string, error) {
	logPath := filepath.Join(LogsDir, scriptID+".log")

	// 检查文件是否存在
	if _, err := os.Stat(logPath); os.IsNotExist(err) {
		return "", nil // 文件不存在返回空字符串
	}

	// 读取日志内容
	content, err := os.ReadFile(logPath)
	if err != nil {
		return "", fmt.Errorf("读取日志文件失败: %v", err)
	}

	return string(content), nil
}

// DeleteScriptLog 删除脚本日志文件
func DeleteScriptLog(scriptID string) error {
	logPath := filepath.Join(LogsDir, scriptID+".log")

	// 检查文件是否存在
	if _, err := os.Stat(logPath); os.IsNotExist(err) {
		return nil // 文件不存在，无需删除
	}

	// 删除文件
	if err := os.Remove(logPath); err != nil {
		return fmt.Errorf("删除日志文件失败: %v", err)
	}

	return nil
}

// ClearScriptLog 清空脚本日志文件
func ClearScriptLog(scriptID string) error {
	logPath := filepath.Join(LogsDir, scriptID+".log")

	// 检查文件是否存在
	if _, err := os.Stat(logPath); os.IsNotExist(err) {
		return nil // 文件不存在，无需清空
	}

	// 清空文件内容
	if err := os.WriteFile(logPath, []byte(""), 0644); err != nil {
		return fmt.Errorf("清空日志文件失败: %v", err)
	}

	return nil
}
