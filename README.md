# Hook Panel 🎯

一个轻量级的 Webhook 管理面板，支持脚本执行、日志记录和系统配置。

## 🚀 快速开始

### 1. 下载最新版本

#### 快速下载（推荐）

```bash
# Linux x64
curl -L -o hook-panel https://github.com/slowlyo/hook-panel/releases/latest/download/hook-panel-linux-amd64

# Linux ARM64
curl -L -o hook-panel https://github.com/slowlyo/hook-panel/releases/latest/download/hook-panel-linux-arm64

# macOS Intel
curl -L -o hook-panel https://github.com/slowlyo/hook-panel/releases/latest/download/hook-panel-darwin-amd64

# macOS Apple Silicon
curl -L -o hook-panel https://github.com/slowlyo/hook-panel/releases/latest/download/hook-panel-darwin-arm64
```

#### 手动下载

也可以前往 [GitHub Releases](https://github.com/slowlyo/hook-panel/releases/latest) 页面手动下载：

- **Linux (x64)**: `hook-panel-linux-amd64`
- **Linux (ARM64)**: `hook-panel-linux-arm64`
- **macOS (Intel)**: `hook-panel-darwin-amd64`
- **macOS (Apple Silicon)**: `hook-panel-darwin-arm64`
- **Windows (x64)**: `hook-panel-windows-amd64.exe`

### 2. 运行程序

#### Linux/macOS
```bash
# 添加执行权限
chmod +x hook-panel

# 默认启动（端口 8080）
./hook-panel

# 自定义端口启动
./hook-panel --port 3000
# 或使用简写
./hook-panel -p 3000
```

#### Windows
下载 `hook-panel-windows-amd64.exe` 后：
```cmd
# 默认启动（端口 8080）
hook-panel-windows-amd64.exe

# 自定义端口启动
hook-panel-windows-amd64.exe --port 3000
```

### 3. 访问面板

程序启动后，在浏览器中访问：`http://localhost:8080`

**注意**：当使用自定义端口启动时，系统会自动将域名配置设置为 `http://localhost:端口号`，方便生成正确的 Webhook URL。

## ✨ 主要功能

- 🎯 **Webhook 管理**: 创建和管理 Webhook 端点，支持脚本执行
- 📝 **脚本编辑**: 内置代码编辑器，支持 Shell、Python、Node.js 等脚本
- 📊 **实时日志**: 查看 Webhook 执行日志和结果
- ⚙️ **系统配置**: 自定义域名和超时时间设置
- 🔐 **安全认证**: Bearer Token 认证保护管理接口
- 🌙 **主题切换**: 支持明暗主题切换

## 🔧 配置说明

### 命令行参数

| 参数 | 简写 | 说明 | 示例 |
|------|------|------|------|
| --port | -p | 指定服务端口 | `--port 3000` |
| --help | -h | 显示帮助信息 | `--help` |

### 系统配置

程序启动后，可以通过 Web 界面的"系统配置"页面进行配置：

- **域名设置**: 用于生成 Webhook URL
- **超时时间**: 脚本执行超时时间
- **认证密钥**: 程序首次启动时自动生成，保存在 `data/secret.key` 文件中

## � 使用指南

### 1. 首次访问

- 打开浏览器访问 `http://localhost:8080`
- 使用默认密钥 `your-secret-key` 登录（建议修改）

### 2. 创建 Webhook

1. 在脚本管理页面创建新脚本
2. 编写你的脚本代码（支持 Shell、Python、Node.js 等）
3. 保存后获得 Webhook URL：`http://your-domain/h/{script-id}`

### 3. 调用 Webhook

```bash
# GET 请求（签名通过查询参数）
curl "http://localhost:8080/h/your-script-id?signature=your-signature"

# POST 请求（签名通过 Header）
curl -X POST \
     -H "X-Signature: your-signature" \
     -H "Content-Type: application/json" \
     -d '{"key": "value"}' \
     http://localhost:8080/h/your-script-id
```

### 4. 查看日志

在 Webhook 日志页面可以查看：
- 执行时间和状态
- 请求参数和响应结果
- 脚本输出和错误信息

## 🔐 安全说明

- **认证密钥**: 程序首次启动时自动生成随机密钥，保存在 `data/secret.key` 文件中
- **密钥管理**: 可通过删除 `data/secret.key` 文件重新生成新密钥
- **Webhook 签名**: 支持签名验证，确保请求来源可信
- **访问控制**: 管理接口需要 Bearer Token 认证

## � 故障排除

### 常见问题

1. **端口被占用**：使用 `-p` 参数指定其他端口
2. **权限不足**：Linux/macOS 下确保文件有执行权限
3. **脚本执行失败**：检查脚本语法和系统环境依赖

### 健康检查

```bash
# 检查服务状态（无需认证）
curl http://localhost:8080/health
```

## 📄 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。
