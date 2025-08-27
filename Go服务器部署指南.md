# UI素材生成器 - Go服务器部署指南

## 🚀 项目概述

这是一个完整的UI素材生成器解决方案，包含：
- **前端**: React + TypeScript + Vite构建的现代化Web应用
- **后端**: Go语言编写的高性能静态文件服务器
- **跨平台**: 支持Mac、Linux、Windows三大平台
- **一键部署**: 提供完整的构建、编译、打包脚本

---

## 📋 快速开始

### 🎯 最简单的方式 - 一键打包

```bash
# 1. 完整的自动化打包
./package.sh

# 2. 启动对应平台的服务器
cd packages/ui-generator-v1.0.0-*-full/
./deploy.sh

# 3. 浏览器访问
# http://localhost:3000
```

### 🔧 分步骤构建

```bash
# 1. 仅编译Go服务器
./build.sh

# 2. 或使用Makefile
make build        # 编译服务器
make serve        # 启动服务器
make dev          # 开发模式启动
```

---

## 🛠 构建环境要求

### 必需软件
- **Node.js** (v16+) 和 **npm** - 用于构建前端
- **Go** (v1.19+) - 用于编译服务器
- **Git** - 版本控制

### 可选软件
- **Docker** - 容器化部署
- **Make** - 使用Makefile命令
- **zip** - 创建Windows兼容的压缩包

### 环境检查
```bash
# 检查所有必需软件
go version
node --version
npm --version

# 运行自动检查（在构建脚本中）
./build.sh  # 会自动检查环境
```

---

## 📦 构建脚本详解

### 1. `build.sh` - Go服务器编译脚本

**支持平台**:
- `darwin/amd64` - Mac Intel
- `darwin/arm64` - Mac M1/M2
- `linux/amd64` - Linux x64
- `linux/arm64` - Linux ARM
- `windows/amd64` - Windows x64

**功能特性**:
- ✅ 自动环境检查
- ✅ 跨平台编译
- ✅ 自动创建启动脚本
- ✅ 嵌入静态文件
- ✅ 优化二进制大小

```bash
# 基本编译
./build.sh

# 创建发布包
./build.sh --release
```

### 2. `package.sh` - 一键打包脚本

**完整流程**:
1. 环境检查
2. 清理旧构建
3. 前端构建 (`npm run build`)
4. Go服务器编译
5. 创建部署包
6. 生成压缩包
7. 发布报告

```bash
# 完整打包
./package.sh

# 跳过某些步骤
./package.sh --skip-frontend  # 跳过前端构建
./package.sh --skip-clean     # 跳过清理

# 指定版本
./package.sh --version 2.0.0
```

### 3. `build.bat` - Windows编译脚本

为Windows用户提供的批处理脚本，功能与`build.sh`相同。

```cmd
:: Windows下编译
build.bat
```

---

## 🖥 服务器特性

### Go HTTP服务器功能
- **静态文件服务**: 内嵌dist目录，单文件部署
- **SPA支持**: 自动处理前端路由
- **健康检查**: `/health`端点
- **跨域支持**: 配置CORS头
- **安全头**: 自动设置安全HTTP头
- **优雅启动**: 美观的启动界面

### 命令行参数
```bash
# 基本用法
./ui-generator-darwin-amd64 [选项]

# 可用选项
-port 8080          # 指定端口 (默认: 3000)
-host 0.0.0.0       # 指定地址 (默认: 0.0.0.0)
-dev                # 开发模式，使用本地dist目录
-help               # 显示帮助
```

### 环境变量
```bash
# 使用环境变量设置端口
PORT=5000 ./ui-generator-darwin-amd64

# Docker中常用
export PORT=8080
```

---

## 🚀 部署方式

### 1. 直接运行 (推荐)

```bash
# 下载对应平台的二进制文件
# 直接运行
./ui-generator-linux-amd64

# 或使用启动脚本
./start.sh
```

**优势**:
- ✅ 单文件部署
- ✅ 无依赖
- ✅ 启动快速
- ✅ 内存占用小

### 2. Docker部署

```bash
# 使用提供的Dockerfile
docker build -t ui-generator .
docker run -p 3000:3000 ui-generator

# 或使用docker-compose
docker-compose up -d
```

### 3. 传统Web服务器

如果需要使用Nginx或Apache，可以只部署dist目录：

```bash
# 将dist内容复制到web根目录
cp -r dist/* /var/www/html/ui-generator/
```

### 4. 云平台部署

**Heroku**:
```bash
# 推送到Heroku
git push heroku main
```

**Railway/Render等**:
- 支持Go应用的自动检测和部署
- 自动读取PORT环境变量

---

## 📁 目录结构

```
ui-generator/
├── src/                    # 前端源码
├── dist/                   # 前端构建输出
├── server.go               # Go服务器源码
├── go.mod                  # Go模块文件
├── build.sh               # Unix编译脚本
├── build.bat              # Windows编译脚本
├── package.sh             # 一键打包脚本
├── Makefile               # Make构建文件
├── build/                 # 编译输出目录
│   ├── ui-generator-*     # 各平台可执行文件
│   ├── start.sh           # Unix启动脚本
│   ├── start.bat          # Windows启动脚本
│   └── README.md          # 部署说明
├── packages/              # 发布包目录
│   ├── *-full.tar.gz      # 完整版
│   ├── *-linux.tar.gz     # Linux版
│   ├── *-darwin.tar.gz    # Mac版
│   └── *-windows.zip      # Windows版
└── releases/              # 旧版本发布目录
```

---

## 🔧 Makefile用法

```bash
# 查看所有可用命令
make help

# 常用命令
make build        # 编译服务器
make package      # 完整打包
make serve        # 启动服务器
make dev          # 开发模式
make clean        # 清理文件
make setup        # 一键环境设置
make release      # 发布流程
```

---

## 🌐 生产环境部署

### 1. Linux服务器部署

```bash
# 1. 上传二进制文件
scp ui-generator-linux-amd64 user@server:/opt/ui-generator/

# 2. 创建systemd服务
sudo tee /etc/systemd/system/ui-generator.service > /dev/null <<EOF
[Unit]
Description=UI Generator Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ui-generator
ExecStart=/opt/ui-generator/ui-generator-linux-amd64 -port 3000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 3. 启动服务
sudo systemctl enable ui-generator
sudo systemctl start ui-generator
```

### 2. 反向代理配置

**Nginx**:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Docker生产部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  ui-generator:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - PORT=3000
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - ui-generator
    restart: unless-stopped
```

---

## 📊 性能特性

### 服务器性能
- **内存占用**: ~15MB
- **启动时间**: <1秒
- **并发连接**: 支持1000+并发
- **文件大小**: ~10-20MB (包含前端)

### 优化特性
- **静态文件嵌入**: 无需额外文件
- **Gzip压缩**: 自动压缩响应
- **缓存头**: 合理的缓存策略
- **健康检查**: 监控服务状态

---

## 🔍 故障排除

### 常见问题

**Q: 编译失败？**
A: 检查Go版本和网络连接，确保能访问Go模块代理

**Q: 端口被占用？**
A: 使用`-port`参数指定其他端口，或设置PORT环境变量

**Q: 页面显示404？**
A: 确保dist目录已构建，或使用`-dev`参数使用本地dist目录

**Q: 跨域问题？**
A: 服务器已配置CORS头，检查浏览器控制台错误

### 调试命令

```bash
# 检查服务状态
curl http://localhost:3000/health

# 查看日志
./ui-generator-linux-amd64 -port 3000

# 开发模式调试
./ui-generator-linux-amd64 -dev -port 3000
```

---

## 📋 部署检查清单

- [ ] Go环境已安装 (go version)
- [ ] Node.js环境已安装 (node --version)
- [ ] 前端已构建 (npm run build)
- [ ] 服务器已编译 (./build.sh)
- [ ] 端口未被占用 (netstat -tulpn | grep :3000)
- [ ] 防火墙已配置
- [ ] SSL证书已配置 (生产环境)
- [ ] 监控和日志已配置
- [ ] 备份策略已制定

---

## 🎉 完成！

现在你已经有了一个完整的、可生产部署的UI素材生成器！

### 🌟 主要优势

1. **单文件部署** - 无需复杂配置
2. **跨平台支持** - Mac/Linux/Windows
3. **高性能** - Go语言高并发
4. **易于维护** - 简单的架构
5. **完整工具链** - 从开发到部署

### 🚀 立即开始

```bash
# 一键完成所有步骤
./package.sh

# 选择对应平台包启动
cd packages/ui-generator-v1.0.0-*-full/
./deploy.sh
```

**享受UI创作的乐趣！** 🎨✨
