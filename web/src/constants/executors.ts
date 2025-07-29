// Executor configuration constants
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

// Executor configuration list
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

# Webhook Script Example - Bash
echo "Webhook request received"

# Get current time
current_time=$(date '+%Y-%m-%d %H:%M:%S')
echo "Execution time: $current_time"

# Write your script logic here
echo "Script execution completed"`,
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

# Webhook Script Example - Shell
echo "Webhook request received"

# Get current time
current_time=$(date '+%Y-%m-%d %H:%M:%S')
echo "Execution time: $current_time"

# Write your script logic here
echo "Script execution completed"`,
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
Webhook Script Example - Python
"""

import sys
import json
from datetime import datetime

def main():
    print("Webhook request received")

    # Get current time
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"Execution time: {current_time}")

    # Get Python version
    print(f"Python version: {sys.version}")

    # Write your script logic here
    print("Script execution completed")

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
Webhook Script Example - Python3
"""

import sys
import json
from datetime import datetime

def main():
    print("Webhook request received")

    # Get current time
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"Execution time: {current_time}")

    # Get Python version
    print(f"Python version: {sys.version}")

    # Write your script logic here
    print("Script execution completed")

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
 * Webhook Script Example - Node.js
 */

console.log("Webhook request received");

// Get current time
const currentTime = new Date().toLocaleString('en-US');
console.log(\`Execution time: \${currentTime}\`);

// Get Node.js version
console.log(\`Node.js version: \${process.version}\`);

// Write your script logic here
console.log("Script execution completed");`,
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
 * Webhook Script Example - PHP
 */

echo "Webhook request received\\n";

// Get current time
$currentTime = date('Y-m-d H:i:s');
echo "Execution time: {$currentTime}\\n";

// Get PHP version
echo "PHP version: " . phpversion() . "\\n";

// Write your script logic here
echo "Script execution completed\\n";
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

# Webhook Script Example - Ruby

puts "Webhook request received"

# Get current time
current_time = Time.now.strftime('%Y-%m-%d %H:%M:%S')
puts "Execution time: #{current_time}"

# Get Ruby version
puts "Ruby version: #{RUBY_VERSION}"

# Write your script logic here
puts "Script execution completed"`,
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

# Webhook Script Example - Perl

print "Webhook request received\\n";

# Get current time
my $current_time = strftime('%Y-%m-%d %H:%M:%S', localtime);
print "Execution time: $current_time\\n";

# Get Perl version
print "Perl version: $]\\n";

# Write your script logic here
print "Script execution completed\\n";`,
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

// Webhook Script Example - Go
func main() {
	fmt.Println("Webhook request received")

	// Get current time
	currentTime := time.Now().Format("2006-01-02 15:04:05")
	fmt.Printf("Execution time: %s\\n", currentTime)

	// Get Go version
	fmt.Printf("Go version: %s\\n", runtime.Version())

	// Write your script logic here
	fmt.Println("Script execution completed")
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
 * Webhook Script Example - Java
 */
public class WebhookScript {
    public static void main(String[] args) {
        System.out.println("Webhook request received");

        // Get current time
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        String currentTime = now.format(formatter);
        System.out.println("Execution time: " + currentTime);

        // Get Java version
        System.out.println("Java version: " + System.getProperty("java.version"));

        // Write your script logic here
        System.out.println("Script execution completed");
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
    defaultTemplate: `# Webhook Script Example - PowerShell

Write-Host "Webhook request received"

# Get current time
$currentTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "Execution time: $currentTime"

# Get PowerShell version
Write-Host "PowerShell version: $($PSVersionTable.PSVersion)"

# Write your script logic here
Write-Host "Script execution completed"`,
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
REM Webhook Script Example - CMD

echo Webhook request received

REM Get current time
echo Execution time: %date% %time%

REM Write your script logic here
echo Script execution completed

pause`,
  },
];

// Get executor configuration by value
export const getExecutorConfig = (value: string): ExecutorConfig | undefined => {
  return EXECUTOR_CONFIGS.find(config => config.value === value);
};

// Get executor options (for forms)
export const getExecutorOptions = () => {
  return EXECUTOR_CONFIGS.map(config => ({
    label: config.label,
    value: config.value,
  }));
};

// Get executor value enum (for table filtering)
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

// Get executor render configuration (for table display)
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
