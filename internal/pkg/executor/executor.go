package executor

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"hook-panel/internal/pkg/file"
)

// ExecutionResult 执行结果
type ExecutionResult struct {
	Success   bool   `json:"success"`
	Output    string `json:"output"`
	Error     string `json:"error"`
	ExitCode  int    `json:"exit_code"`
	Duration  string `json:"duration"`
	Timestamp string `json:"timestamp"`
}

// ScriptExecutor 脚本执行器
type ScriptExecutor struct {
	timeout time.Duration
}

// NewScriptExecutor 创建新的脚本执行器
func NewScriptExecutor(timeout time.Duration) *ScriptExecutor {
	if timeout <= 0 {
		timeout = 30 * time.Second // 默认30秒超时
	}
	return &ScriptExecutor{
		timeout: timeout,
	}
}

// ExecuteScript 执行脚本
func (e *ScriptExecutor) ExecuteScript(scriptID, content string) (*ExecutionResult, error) {
	startTime := time.Now()
	timestamp := startTime.Format("2006-01-02 15:04:05")

	// 记录开始执行日志
	logHeader := fmt.Sprintf("\n=== 脚本执行开始 [%s] ===\n", timestamp)
	if err := file.SaveScriptLog(scriptID, logHeader); err != nil {
		return nil, fmt.Errorf("记录执行日志失败: %v", err)
	}

	// 检测脚本类型并执行
	result, err := e.executeByType(scriptID, content)
	if err != nil {
		// 记录错误日志
		errorLog := fmt.Sprintf("执行失败: %v\n", err)
		file.SaveScriptLog(scriptID, errorLog)
		return nil, err
	}

	// 计算执行时间
	duration := time.Since(startTime)
	result.Duration = duration.String()
	result.Timestamp = timestamp

	// 记录执行结果日志
	resultLog := fmt.Sprintf("执行结果: %s\n", formatExecutionResult(result))
	resultLog += fmt.Sprintf("=== 脚本执行结束 [%s] ===\n\n", time.Now().Format("2006-01-02 15:04:05"))
	file.SaveScriptLog(scriptID, resultLog)

	return result, nil
}

// executeByType 根据脚本类型执行
func (e *ScriptExecutor) executeByType(scriptID, content string) (*ExecutionResult, error) {
	// 检测脚本类型
	scriptType := detectScriptType(content)
	
	// 创建临时脚本文件
	tempFile, err := e.createTempScript(scriptID, content, scriptType)
	if err != nil {
		return nil, fmt.Errorf("创建临时脚本文件失败: %v", err)
	}
	defer os.Remove(tempFile) // 清理临时文件

	// 根据类型选择执行器
	var cmd *exec.Cmd
	switch scriptType {
	case "bash", "sh":
		cmd = exec.Command("bash", tempFile)
	case "python":
		cmd = exec.Command("python3", tempFile)
	case "node":
		cmd = exec.Command("node", tempFile)
	default:
		// 默认使用bash执行
		cmd = exec.Command("bash", tempFile)
	}

	// 执行脚本
	return e.runCommand(cmd, scriptID)
}

// detectScriptType 检测脚本类型
func detectScriptType(content string) string {
	lines := strings.Split(content, "\n")
	if len(lines) == 0 {
		return "bash"
	}

	firstLine := strings.TrimSpace(lines[0])
	
	// 检查shebang
	if strings.HasPrefix(firstLine, "#!") {
		if strings.Contains(firstLine, "python") {
			return "python"
		}
		if strings.Contains(firstLine, "node") {
			return "node"
		}
		if strings.Contains(firstLine, "bash") {
			return "bash"
		}
		if strings.Contains(firstLine, "sh") {
			return "sh"
		}
	}

	// 根据内容特征判断
	contentLower := strings.ToLower(content)
	if strings.Contains(contentLower, "import ") || strings.Contains(contentLower, "def ") || strings.Contains(contentLower, "print(") {
		return "python"
	}
	if strings.Contains(contentLower, "require(") || strings.Contains(contentLower, "console.log") || strings.Contains(contentLower, "const ") {
		return "node"
	}

	// 默认返回bash
	return "bash"
}

// createTempScript 创建临时脚本文件
func (e *ScriptExecutor) createTempScript(scriptID, content, scriptType string) (string, error) {
	// 确保临时目录存在
	tempDir := filepath.Join("./data", "temp")
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return "", fmt.Errorf("创建临时目录失败: %v", err)
	}

	// 根据类型确定文件扩展名
	var ext string
	switch scriptType {
	case "python":
		ext = ".py"
	case "node":
		ext = ".js"
	default:
		ext = ".sh"
	}

	// 创建临时文件
	tempFile := filepath.Join(tempDir, fmt.Sprintf("%s_%d%s", scriptID, time.Now().Unix(), ext))
	
	// 写入脚本内容
	if err := os.WriteFile(tempFile, []byte(content), 0755); err != nil {
		return "", fmt.Errorf("写入临时脚本失败: %v", err)
	}

	return tempFile, nil
}

// runCommand 运行命令并捕获输出
func (e *ScriptExecutor) runCommand(cmd *exec.Cmd, scriptID string) (*ExecutionResult, error) {
	// 创建上下文用于超时控制
	ctx, cancel := context.WithTimeout(context.Background(), e.timeout)
	defer cancel()
	cmd = exec.CommandContext(ctx, cmd.Path, cmd.Args[1:]...)

	// 创建管道捕获输出
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("创建stdout管道失败: %v", err)
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, fmt.Errorf("创建stderr管道失败: %v", err)
	}

	// 启动命令
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("启动命令失败: %v", err)
	}

	// 实时读取输出并记录日志
	var outputBuilder, errorBuilder strings.Builder
	
	// 启动goroutine读取stdout
	go e.readAndLog(stdout, &outputBuilder, scriptID, "STDOUT")
	
	// 启动goroutine读取stderr  
	go e.readAndLog(stderr, &errorBuilder, scriptID, "STDERR")

	// 等待命令完成
	err = cmd.Wait()
	
	// 构建结果
	result := &ExecutionResult{
		Success:  err == nil,
		Output:   outputBuilder.String(),
		Error:    errorBuilder.String(),
		ExitCode: 0,
	}

	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			result.ExitCode = exitError.ExitCode()
		} else {
			result.ExitCode = -1
		}
	}

	return result, nil
}

// readAndLog 读取输出流并记录日志
func (e *ScriptExecutor) readAndLog(reader io.Reader, builder *strings.Builder, scriptID, prefix string) {
	scanner := bufio.NewScanner(reader)
	for scanner.Scan() {
		line := scanner.Text()
		builder.WriteString(line + "\n")
		
		// 记录到日志文件
		logLine := fmt.Sprintf("[%s] %s\n", prefix, line)
		file.SaveScriptLog(scriptID, logLine)
	}
}

// formatExecutionResult 格式化执行结果用于日志
func formatExecutionResult(result *ExecutionResult) string {
	status := "成功"
	if !result.Success {
		status = "失败"
	}
	
	return fmt.Sprintf("%s (退出码: %d, 耗时: %s)", status, result.ExitCode, result.Duration)
}
