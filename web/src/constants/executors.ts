// 执行器配置常量
export interface ExecutorConfig {
  value: string;
  label: string;
  icon: string;
  color: string;
  text: string;
  status: 'Default' | 'Processing' | 'Success' | 'Warning' | 'Error';
  fileExtension: string;
  defaultTemplate: string;
}

// 执行器配置列表
export const EXECUTOR_CONFIGS: ExecutorConfig[] = [
  {
    value: 'bash',
    label: '🐚 Bash',
    icon: '🐚',
    color: '#52c41a',
    text: 'Bash',
    status: 'Default',
    fileExtension: '.sh',
    defaultTemplate: `#!/bin/bash

# Webhook脚本示例 - Bash
echo "收到webhook请求"

# 获取当前时间
current_time=$(date '+%Y-%m-%d %H:%M:%S')
echo "执行时间: $current_time"

# 在这里编写你的脚本逻辑
echo "脚本执行完成"`,
  },
  {
    value: 'sh',
    label: '📜 Shell',
    icon: '📜',
    color: '#1890ff',
    text: 'Shell',
    status: 'Default',
    fileExtension: '.sh',
    defaultTemplate: `#!/bin/sh

# Webhook脚本示例 - Shell
echo "收到webhook请求"

# 获取当前时间
current_time=$(date '+%Y-%m-%d %H:%M:%S')
echo "执行时间: $current_time"

# 在这里编写你的脚本逻辑
echo "脚本执行完成"`,
  },
  {
    value: 'python',
    label: '🐍 Python',
    icon: '🐍',
    color: '#faad14',
    text: 'Python',
    status: 'Processing',
    fileExtension: '.py',
    defaultTemplate: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Webhook脚本示例 - Python
"""

import sys
import json
from datetime import datetime

def main():
    print("收到webhook请求")
    
    # 获取当前时间
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"执行时间: {current_time}")
    
    # 获取Python版本
    print(f"Python版本: {sys.version}")
    
    # 在这里编写你的脚本逻辑
    print("脚本执行完成")

if __name__ == "__main__":
    main()`,
  },
  {
    value: 'python3',
    label: '🐍 Python3',
    icon: '🐍',
    color: '#faad14',
    text: 'Python3',
    status: 'Processing',
    fileExtension: '.py',
    defaultTemplate: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Webhook脚本示例 - Python3
"""

import sys
import json
from datetime import datetime

def main():
    print("收到webhook请求")
    
    # 获取当前时间
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"执行时间: {current_time}")
    
    # 获取Python版本
    print(f"Python版本: {sys.version}")
    
    # 在这里编写你的脚本逻辑
    print("脚本执行完成")

if __name__ == "__main__":
    main()`,
  },
  {
    value: 'node',
    label: '🟢 Node.js',
    icon: '🟢',
    color: '#13c2c2',
    text: 'Node.js',
    status: 'Success',
    fileExtension: '.js',
    defaultTemplate: `#!/usr/bin/env node

/**
 * Webhook脚本示例 - Node.js
 */

console.log("收到webhook请求");

// 获取当前时间
const currentTime = new Date().toLocaleString('zh-CN');
console.log(\`执行时间: \${currentTime}\`);

// 获取Node.js版本
console.log(\`Node.js版本: \${process.version}\`);

// 在这里编写你的脚本逻辑
console.log("脚本执行完成");`,
  },
  {
    value: 'php',
    label: '🐘 PHP',
    icon: '🐘',
    color: '#722ed1',
    text: 'PHP',
    status: 'Warning',
    fileExtension: '.php',
    defaultTemplate: `<?php
/**
 * Webhook脚本示例 - PHP
 */

echo "收到webhook请求\\n";

// 获取当前时间
$currentTime = date('Y-m-d H:i:s');
echo "执行时间: {$currentTime}\\n";

// 获取PHP版本
echo "PHP版本: " . phpversion() . "\\n";

// 在这里编写你的脚本逻辑
echo "脚本执行完成\\n";
?>`,
  },
  {
    value: 'ruby',
    label: '💎 Ruby',
    icon: '💎',
    color: '#eb2f96',
    text: 'Ruby',
    status: 'Error',
    fileExtension: '.rb',
    defaultTemplate: `#!/usr/bin/env ruby
# -*- coding: utf-8 -*-

# Webhook脚本示例 - Ruby

puts "收到webhook请求"

# 获取当前时间
current_time = Time.now.strftime('%Y-%m-%d %H:%M:%S')
puts "执行时间: #{current_time}"

# 获取Ruby版本
puts "Ruby版本: #{RUBY_VERSION}"

# 在这里编写你的脚本逻辑
puts "脚本执行完成"`,
  },
  {
    value: 'perl',
    label: '🐪 Perl',
    icon: '🐪',
    color: '#fa8c16',
    text: 'Perl',
    status: 'Default',
    fileExtension: '.pl',
    defaultTemplate: `#!/usr/bin/perl
use strict;
use warnings;
use POSIX qw(strftime);

# Webhook脚本示例 - Perl

print "收到webhook请求\\n";

# 获取当前时间
my $current_time = strftime('%Y-%m-%d %H:%M:%S', localtime);
print "执行时间: $current_time\\n";

# 获取Perl版本
print "Perl版本: $]\\n";

# 在这里编写你的脚本逻辑
print "脚本执行完成\\n";`,
  },
  {
    value: 'go',
    label: '🐹 Go',
    icon: '🐹',
    color: '#1890ff',
    text: 'Go',
    status: 'Success',
    fileExtension: '.go',
    defaultTemplate: `package main

import (
	"fmt"
	"runtime"
	"time"
)

// Webhook脚本示例 - Go
func main() {
	fmt.Println("收到webhook请求")

	// 获取当前时间
	currentTime := time.Now().Format("2006-01-02 15:04:05")
	fmt.Printf("执行时间: %s\\n", currentTime)

	// 获取Go版本
	fmt.Printf("Go版本: %s\\n", runtime.Version())

	// 在这里编写你的脚本逻辑
	fmt.Println("脚本执行完成")
}`,
  },
  {
    value: 'java',
    label: '☕ Java',
    icon: '☕',
    color: '#fa541c',
    text: 'Java',
    status: 'Warning',
    fileExtension: '.java',
    defaultTemplate: `import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Webhook脚本示例 - Java
 */
public class WebhookScript {
    public static void main(String[] args) {
        System.out.println("收到webhook请求");
        
        // 获取当前时间
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        String currentTime = now.format(formatter);
        System.out.println("执行时间: " + currentTime);
        
        // 获取Java版本
        System.out.println("Java版本: " + System.getProperty("java.version"));
        
        // 在这里编写你的脚本逻辑
        System.out.println("脚本执行完成");
    }
}`,
  },
  {
    value: 'powershell',
    label: '💙 PowerShell',
    icon: '💙',
    color: '#2f54eb',
    text: 'PowerShell',
    status: 'Processing',
    fileExtension: '.ps1',
    defaultTemplate: `# Webhook脚本示例 - PowerShell

Write-Host "收到webhook请求"

# 获取当前时间
$currentTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "执行时间: $currentTime"

# 获取PowerShell版本
Write-Host "PowerShell版本: $($PSVersionTable.PSVersion)"

# 在这里编写你的脚本逻辑
Write-Host "脚本执行完成"`,
  },
  {
    value: 'cmd',
    label: '⚫ CMD',
    icon: '⚫',
    color: '#595959',
    text: 'CMD',
    status: 'Default',
    fileExtension: '.bat',
    defaultTemplate: `@echo off
REM Webhook脚本示例 - CMD

echo 收到webhook请求

REM 获取当前时间
echo 执行时间: %date% %time%

REM 在这里编写你的脚本逻辑
echo 脚本执行完成

pause`,
  },
];

// 根据值获取执行器配置
export const getExecutorConfig = (value: string): ExecutorConfig | undefined => {
  return EXECUTOR_CONFIGS.find(config => config.value === value);
};

// 获取执行器选项（用于表单）
export const getExecutorOptions = () => {
  return EXECUTOR_CONFIGS.map(config => ({
    label: config.label,
    value: config.value,
  }));
};

// 获取执行器枚举（用于表格筛选）
export const getExecutorValueEnum = () => {
  const valueEnum: Record<string, { text: string; status: string }> = {};
  EXECUTOR_CONFIGS.forEach(config => {
    valueEnum[config.value] = {
      text: config.text,
      status: config.status,
    };
  });
  return valueEnum;
};

// 获取执行器渲染配置（用于表格显示）
export const getExecutorRenderConfig = () => {
  const renderConfig: Record<string, { icon: string; color: string; text: string }> = {};
  EXECUTOR_CONFIGS.forEach(config => {
    renderConfig[config.value] = {
      icon: config.icon,
      color: config.color,
      text: config.text,
    };
  });
  return renderConfig;
};
