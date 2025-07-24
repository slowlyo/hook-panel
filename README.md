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
```bash
go run main.go
```

服务将在 `http://localhost:8080` 启动

## 📡 API 接口

### 健康检查（无需认证）
```bash
curl http://localhost:8080/health
```

### 受保护的接口（需要认证）
```bash
# 使用默认密钥
curl -H "Authorization: Bearer your-secret-key" \
     http://localhost:8080/api/protected

# 使用自定义密钥（需要设置环境变量 SECRET_KEY）
curl -H "Authorization: Bearer your-custom-secret" \
     http://localhost:8080/api/protected
```

## 🏗️ 项目结构

```
hook-panel/
├── main.go                    # 主入口文件
├── go.mod                     # Go 模块文件
├── .env.example              # 环境变量示例
├── README.md                 # 项目说明
└── internal/
    ├── middleware/
    │   └── auth.go           # 认证中间件
    └── handlers/
        ├── health.go         # 健康检查处理器
        └── protected.go      # 受保护接口处理器
```

## 🔐 认证说明

- 使用 Bearer Token 认证
- 默认密钥：`your-secret-key`
- 可通过环境变量 `SECRET_KEY` 自定义密钥
- Header 格式：`Authorization: Bearer <your-token>`

## 🛠️ 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| PORT | 8080 | 服务端口 |
| SECRET_KEY | your-secret-key | 认证密钥 |
