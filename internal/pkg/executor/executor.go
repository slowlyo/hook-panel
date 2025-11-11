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
func (e *ScriptExecutor) ExecuteScript(scriptID, content, executor string) (*ExecutionResult, error) {
	startTime := time.Now()
	timestamp := startTime.Format("2006-01-02 15:04:05")

	// Record execution start log
	logHeader := fmt.Sprintf("\n=== Script execution started [%s] ===\n", timestamp)
	if err := file.SaveScriptLog(scriptID, logHeader); err != nil {
		return nil, fmt.Errorf("failed to record execution log: %v", err)
	}

	// 使用指定的执行器类型执行脚本
	result, err := e.executeByType(scriptID, content, executor)
	if err != nil {
		// Record error log
		errorLog := fmt.Sprintf("Execution failed: %v\n", err)
		file.SaveScriptLog(scriptID, errorLog)
		return nil, err
	}

	// 计算执行时间
	duration := time.Since(startTime)
	result.Duration = duration.String()
	result.Timestamp = timestamp

	// Record execution result log
	resultLog := fmt.Sprintf("Execution result: %s\n", formatExecutionResult(result))
	resultLog += fmt.Sprintf("=== Script execution ended [%s] ===\n\n", time.Now().Format("2006-01-02 15:04:05"))
	file.SaveScriptLog(scriptID, resultLog)

	return result, nil
}

// executeByType 根据脚本类型执行
func (e *ScriptExecutor) executeByType(scriptID, content, executor string) (*ExecutionResult, error) {
	// 创建临时脚本文件
	tempFile, err := e.createTempScript(scriptID, content, executor)
	if err != nil {
		return nil, fmt.Errorf("failed to create temporary script file: %v", err)
	}
	defer os.Remove(tempFile) // 清理临时文件

	// 根据执行器类型选择命令
	var cmd *exec.Cmd
	switch executor {
	case "bash":
		cmd = exec.Command("bash", tempFile)
	case "sh":
		cmd = exec.Command("sh", tempFile)
	case "python", "python3":
		cmd = exec.Command("python3", tempFile)
	case "node":
		cmd = exec.Command("node", tempFile)
	case "php":
		cmd = exec.Command("php", tempFile)
	case "ruby":
		cmd = exec.Command("ruby", tempFile)
	case "perl":
		cmd = exec.Command("perl", tempFile)
	case "go":
		cmd = exec.Command("go", "run", tempFile)
	case "java":
		// Java需要先编译再运行，这里简化处理
		cmd = exec.Command("java", tempFile)
	case "powershell":
		cmd = exec.Command("powershell", "-File", tempFile)
	case "cmd":
		cmd = exec.Command("cmd", "/C", tempFile)
	default:
		// 默认使用bash执行
		cmd = exec.Command("bash", tempFile)
	}

	// 执行脚本
	return e.runCommand(cmd, scriptID)
}

// createTempScript 创建临时脚本文件
func (e *ScriptExecutor) createTempScript(scriptID, content, executor string) (string, error) {
	// 确保临时目录存在
	tempDir := filepath.Join("./data", "temp")
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create temp directory: %v", err)
	}

	// 根据执行器类型确定文件扩展名
	var ext string
	switch executor {
	case "python", "python3":
		ext = ".py"
	case "node":
		ext = ".js"
	case "php":
		ext = ".php"
	case "ruby":
		ext = ".rb"
	case "perl":
		ext = ".pl"
	case "go":
		ext = ".go"
	case "java":
		ext = ".java"
	case "powershell":
		ext = ".ps1"
	case "cmd":
		ext = ".bat"
	default:
		ext = ".sh"
	}

	// 创建临时文件
	tempFile := filepath.Join(tempDir, fmt.Sprintf("%s_%d%s", scriptID, time.Now().Unix(), ext))

	// 写入脚本内容
	if err := os.WriteFile(tempFile, []byte(content), 0755); err != nil {
		return "", fmt.Errorf("failed to write temp script: %v", err)
	}

	return tempFile, nil
}

// runCommand 运行命令并捕获输出
func (e *ScriptExecutor) runCommand(cmd *exec.Cmd, scriptID string) (*ExecutionResult, error) {
	// 创建上下文用于超时控制
	ctx, cancel := context.WithTimeout(context.Background(), e.timeout)
	defer cancel()
	cmd = exec.CommandContext(ctx, cmd.Path, cmd.Args[1:]...)

	// 继承当前进程的环境变量
	cmd.Env = os.Environ()

	// 确保HOME环境变量被设置
	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = os.Getenv("HOME")
		if homeDir == "" {
			homeDir = "/root" // 默认fallback
		}
	}

	// 添加必要的环境变量
	cmd.Env = append(cmd.Env,
		"HOME="+homeDir,         // 确保HOME变量存在
		"GIT_TERMINAL_PROMPT=0", // 禁止Git提示输入凭据
		"GIT_ASKPASS=true",      // 设置空的askpass程序
	)

	// 创建管道捕获输出
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to create stdout pipe: %v", err)
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to create stderr pipe: %v", err)
	}

	// 启动命令
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("failed to start command: %v", err)
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

// formatExecutionResult formats execution result for logging
func formatExecutionResult(result *ExecutionResult) string {
	status := "Success"
	if !result.Success {
		status = "Failed"
	}

	return fmt.Sprintf("%s (exit code: %d, duration: %s)", status, result.ExitCode, result.Duration)
}
