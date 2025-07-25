# Hook Panel 🎯

一个简洁的 Golang Web 项目，包含密钥认证中间件和健康检查接口。

## 🚀 快速开始

### 1. 安装依赖
```bash
go mod tidy
```

### 2. 配置环境变量（可选）
```bash
cp .env.example .env
# 编辑 .env 文件，修改 SECRET_KEY
```

### 3. 启动服务

#### 默认启动（端口 8080）
```bash
go run main.go
```

#### 自定义端口启动
```bash
# 使用完整参数名
go run main.go --port 3000

# 使用简写参数
go run main.go -p 3000

# 查看帮助信息
go run main.go --help
```

**注意**：当使用自定义端口启动时，系统会自动将域名配置设置为 `http://localhost:端口号`，方便生成正确的 Webhook URL。

服务将在指定端口启动，默认为 `http://localhost:8080`

## 📡 API 接口

### 健康检查（无需认证）
```bash
curl http://localhost:8080/health
```

### 仪表板统计（需要认证）
```bash
# 获取仪表板统计数据
curl -H "Authorization: Bearer your-secret-key" \
     http://localhost:8080/api/dashboard/stats
```

## 🏗️ 项目结构

```
hook-panel/
├── main.go                    # 主入口文件
├── go.mod                     # Go 模块文件
├── .env.example              # 环境变量示例
├── README.md                 # 项目说明
├── data/                     # 数据目录
│   └── hook-panel.db         # SQLite 数据库
├── web/                      # 前端项目
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   ├── components/      # 通用组件
│   │   ├── services/        # API 服务
│   │   └── utils/           # 工具函数
│   └── package.json
└── internal/
    ├── middleware/
    │   └── auth.go           # 认证中间件
    ├── models/              # 数据模型
    │   ├── script.go        # 脚本模型
    │   ├── webhook_log.go   # Webhook 日志模型
    │   └── config.go        # 系统配置模型
    ├── handlers/            # 请求处理器
    │   ├── health.go        # 健康检查
    │   ├── dashboard.go     # 仪表板统计
    │   ├── scripts.go       # 脚本管理
    │   ├── webhook.go       # Webhook 处理
    │   ├── webhook_log.go   # Webhook 日志
    │   └── config.go        # 系统配置
    └── pkg/                 # 内部包
        ├── auth/            # 认证相关
        ├── database/        # 数据库连接
        ├── executor/        # 脚本执行器
        └── file/            # 文件操作
```

## 🔐 认证说明

- 使用 Bearer Token 认证
- 默认密钥：`your-secret-key`
- 可通过环境变量 `SECRET_KEY` 自定义密钥
- Header 格式：`Authorization: Bearer <your-token>`

## 🛠️ 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| PORT | 8080 | 服务端口（也可通过命令行参数 --port 指定） |
| SECRET_KEY | your-secret-key | 认证密钥 |

## 🚀 命令行参数

| 参数 | 简写 | 说明 | 示例 |
|------|------|------|------|
| --port | -p | 指定服务端口 | `--port 3000` 或 `-p 3000` |
| --help | -h | 显示帮助信息 | `--help` |

**优先级**：命令行参数 > 环境变量 > 默认值
