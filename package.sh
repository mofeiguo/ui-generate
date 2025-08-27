#!/bin/bash

# UI素材生成器 - 一键打包发布脚本
# 自动完成前端构建、Go编译、打包发布的完整流程

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目信息
APP_NAME="ui-generator"
VERSION="1.0.0"
BUILD_TIME=$(date "+%Y-%m-%d %H:%M:%S")
RELEASE_DIR="releases"
PACKAGE_DIR="packages"

# 从package.json获取版本（如果存在）
if [ -f "package.json" ] && command -v jq &> /dev/null; then
    VERSION=$(jq -r '.version' package.json 2>/dev/null || echo "1.0.0")
fi

echo -e "${CYAN}
╔══════════════════════════════════════════════════╗
║          📦 UI素材生成器 一键打包脚本              ║
║                                                  ║
║   完整的构建、编译、打包、发布流程自动化           ║
╚══════════════════════════════════════════════════╝
${NC}"

echo -e "${BLUE}📊 项目信息:${NC}"
echo -e "   名称: ${APP_NAME}"
echo -e "   版本: ${VERSION}"
echo -e "   构建时间: ${BUILD_TIME}"
echo ""

# 检查依赖
check_dependencies() {
    echo -e "${YELLOW}🔍 检查依赖环境...${NC}"
    
    local missing_deps=()
    
    # 检查Node.js和npm
    if ! command -v node &> /dev/null; then
        missing_deps+=("Node.js")
    else
        echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    else
        echo -e "${GREEN}✅ npm: $(npm --version)${NC}"
    fi
    
    # 检查Go
    if ! command -v go &> /dev/null; then
        missing_deps+=("Go")
    else
        echo -e "${GREEN}✅ Go: $(go version | cut -d' ' -f3)${NC}"
    fi
    
    # 检查可选依赖
    if command -v zip &> /dev/null; then
        echo -e "${GREEN}✅ zip: 可用${NC}"
    else
        echo -e "${YELLOW}⚠️  zip: 不可用 (将跳过ZIP打包)${NC}"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${RED}❌ 缺少必要依赖: ${missing_deps[*]}${NC}"
        echo -e "${YELLOW}请安装缺少的依赖后重新运行${NC}"
        exit 1
    fi
    
    echo ""
}

# 清理旧的构建文件
clean_old_builds() {
    echo -e "${YELLOW}🧹 清理旧的构建文件...${NC}"
    rm -rf build/
    rm -rf dist/
    echo -e "${GREEN}✅ 清理完成${NC}"
    echo ""
}

# 构建前端
build_frontend() {
    echo -e "${YELLOW}🎨 构建前端项目...${NC}"
    
    # 安装依赖（如果需要）
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}📥 安装npm依赖...${NC}"
        npm install
    fi
    
    # 构建前端
    echo -e "${BLUE}🔨 构建前端代码...${NC}"
    npm run build
    
    if [ -d "dist" ]; then
        local dist_size=$(du -sh dist/ | cut -f1)
        echo -e "${GREEN}✅ 前端构建完成 (${dist_size})${NC}"
    else
        echo -e "${RED}❌ 前端构建失败${NC}"
        exit 1
    fi
    echo ""
}

# 编译Go服务器
build_go_server() {
    echo -e "${YELLOW}⚙️  编译Go服务器...${NC}"
    
    # 初始化Go模块（如果需要）
    if [ ! -f "go.mod" ]; then
        echo -e "${BLUE}📝 初始化Go模块...${NC}"
        go mod init ${APP_NAME}
    fi
    
    # 清理Go模块
    go mod tidy
    
    # 运行构建脚本
    if [ -f "build.sh" ]; then
        chmod +x build.sh
        ./build.sh
        echo -e "${GREEN}✅ Go服务器编译完成${NC}"
    else
        echo -e "${RED}❌ 未找到build.sh脚本${NC}"
        exit 1
    fi
    echo ""
}

# 创建部署包
create_deployment_packages() {
    echo -e "${YELLOW}📦 创建部署包...${NC}"
    
    # 创建打包目录
    rm -rf ${PACKAGE_DIR}
    mkdir -p ${PACKAGE_DIR}
    
    local package_name="${APP_NAME}-v${VERSION}-$(date +%Y%m%d-%H%M%S)"
    
    # 完整包（包含所有平台）
    echo -e "${BLUE}📦 创建完整部署包...${NC}"
    local full_package="${PACKAGE_DIR}/${package_name}-full"
    mkdir -p "${full_package}"
    cp -r build/* "${full_package}/"
    
    # 添加额外的部署文件
    cat > "${full_package}/docker-compose.yml" << 'EOF'
version: '3.8'

services:
  ui-generator:
    image: nginx:alpine
    ports:
      - "3000:80"
    volumes:
      - ./dist:/usr/share/nginx/html:ro
    restart: unless-stopped
    
  # 或者使用Go服务器
  # ui-generator-go:
  #   build: .
  #   ports:
  #     - "3000:3000"
  #   restart: unless-stopped
EOF

    cat > "${full_package}/Dockerfile" << 'EOF'
# 多阶段构建 - 构建阶段
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# 生产阶段 - 使用Go服务器
FROM golang:1.21-alpine as go-builder
WORKDIR /app
COPY go.mod go.sum server.go ./
COPY --from=builder /app/dist ./dist
RUN go mod tidy && \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server server.go

# 最终镜像
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=go-builder /app/server .
EXPOSE 3000
CMD ["./server"]
EOF

    cat > "${full_package}/deploy.sh" << 'EOF'
#!/bin/bash

# 一键部署脚本

set -e

echo "🚀 UI素材生成器 - 自动部署"
echo "=========================="
echo ""

# 检测操作系统和架构
OS=""
ARCH=""

case "$(uname -s)" in
    Darwin*)    OS="darwin" ;;
    Linux*)     OS="linux" ;;
    *)          echo "❌ 不支持的操作系统"; exit 1 ;;
esac

case "$(uname -m)" in
    x86_64*)    ARCH="amd64" ;;
    arm64*|aarch64*) ARCH="arm64" ;;
    *)          echo "❌ 不支持的架构"; exit 1 ;;
esac

BINARY="ui-generator-${OS}-${ARCH}"

if [ ! -f "$BINARY" ]; then
    echo "❌ 未找到可执行文件: $BINARY"
    exit 1
fi

chmod +x "$BINARY"

echo "✅ 找到可执行文件: $BINARY"
echo "🚀 启动服务器..."
echo ""

./"$BINARY" "$@"
EOF

    chmod +x "${full_package}/deploy.sh"
    
    # 创建平台特定包
    for os in "darwin" "linux" "windows"; do
        echo -e "${BLUE}📦 创建${os}平台包...${NC}"
        local platform_package="${PACKAGE_DIR}/${package_name}-${os}"
        mkdir -p "${platform_package}"
        
        # 复制通用文件
        cp "${full_package}/README.md" "${platform_package}/"
        cp "${full_package}/docker-compose.yml" "${platform_package}/"
        cp "${full_package}/Dockerfile" "${platform_package}/"
        
        # 复制平台特定的可执行文件
        if [ "${os}" = "windows" ]; then
            cp "${full_package}/ui-generator-windows-amd64.exe" "${platform_package}/" 2>/dev/null || true
            cp "${full_package}/start.bat" "${platform_package}/" 2>/dev/null || true
        else
            cp "${full_package}/ui-generator-${os}-"* "${platform_package}/" 2>/dev/null || true
            cp "${full_package}/start.sh" "${platform_package}/" 2>/dev/null || true
            cp "${full_package}/deploy.sh" "${platform_package}/" 2>/dev/null || true
            chmod +x "${platform_package}/"*.sh 2>/dev/null || true
        fi
    done
    
    echo -e "${GREEN}✅ 部署包创建完成${NC}"
    echo ""
}

# 创建压缩包
create_archives() {
    echo -e "${YELLOW}🗜️  创建压缩包...${NC}"
    
    cd ${PACKAGE_DIR}
    
    for package_dir in */; do
        local package_name="${package_dir%/}"
        
        # 创建tar.gz压缩包
        echo -e "${BLUE}📦 创建 ${package_name}.tar.gz...${NC}"
        tar -czf "${package_name}.tar.gz" "${package_name}"
        
        # 创建ZIP压缩包（如果zip命令可用）
        if command -v zip &> /dev/null; then
            echo -e "${BLUE}📦 创建 ${package_name}.zip...${NC}"
            zip -r "${package_name}.zip" "${package_name}" > /dev/null
        fi
    done
    
    cd ..
    echo -e "${GREEN}✅ 压缩包创建完成${NC}"
    echo ""
}

# 生成发布报告
generate_release_report() {
    echo -e "${YELLOW}📋 生成发布报告...${NC}"
    
    local report_file="${PACKAGE_DIR}/RELEASE-NOTES.md"
    
    cat > "${report_file}" << EOF
# UI素材生成器 发布报告

**版本**: ${VERSION}  
**构建时间**: ${BUILD_TIME}  
**构建机器**: $(hostname)  

## 📦 包含内容

### 可执行文件
- \`ui-generator-darwin-amd64\` - Mac Intel版本
- \`ui-generator-darwin-arm64\` - Mac M1/M2版本  
- \`ui-generator-linux-amd64\` - Linux x64版本
- \`ui-generator-linux-arm64\` - Linux ARM版本
- \`ui-generator-windows-amd64.exe\` - Windows x64版本

### 启动脚本
- \`start.sh\` - Unix通用启动脚本
- \`start.bat\` - Windows启动脚本
- \`deploy.sh\` - 自动部署脚本

### 部署配置
- \`docker-compose.yml\` - Docker Compose配置
- \`Dockerfile\` - Docker镜像构建文件
- \`README.md\` - 使用说明

## 🚀 快速开始

### 1. 下载对应平台的包
\`\`\`bash
# 完整版（包含所有平台）
wget ${APP_NAME}-v${VERSION}-*-full.tar.gz

# 或下载平台特定版本
wget ${APP_NAME}-v${VERSION}-*-linux.tar.gz   # Linux
wget ${APP_NAME}-v${VERSION}-*-darwin.tar.gz  # Mac
wget ${APP_NAME}-v${VERSION}-*-windows.zip    # Windows
\`\`\`

### 2. 解压并启动
\`\`\`bash
tar -xzf ${APP_NAME}-v${VERSION}-*-full.tar.gz
cd ${APP_NAME}-v${VERSION}-*-full
./deploy.sh
\`\`\`

### 3. 访问应用
打开浏览器访问: http://localhost:3000

## 📊 构建信息

- **前端框架**: React 18 + TypeScript + Vite
- **后端语言**: Go $(go version | cut -d' ' -f3 2>/dev/null || echo "unknown")
- **Node.js版本**: $(node --version 2>/dev/null || echo "unknown")
- **构建平台**: $(uname -s) $(uname -m)

## 🔧 技术特性

- ✅ 跨平台支持 (Mac/Linux/Windows)
- ✅ 静态文件嵌入，单文件部署
- ✅ 自动SPA路由支持
- ✅ 健康检查端点
- ✅ 优雅的启动界面
- ✅ Docker化部署支持

---

🎨 **开始创作精美的UI素材吧！**
EOF

    echo -e "${GREEN}✅ 发布报告已生成: ${report_file}${NC}"
    echo ""
}

# 显示总结信息
show_summary() {
    echo -e "${GREEN}
🎉 打包完成！

📁 输出目录: ${PACKAGE_DIR}/
📦 生成的包:${NC}"
    
    ls -la ${PACKAGE_DIR}/ | grep -E "\.(tar\.gz|zip)$" | while read line; do
        echo -e "${CYAN}   $(echo $line | awk '{print $9}') ($(echo $line | awk '{print $5}') bytes)${NC}"
    done
    
    echo -e "${GREEN}
📋 快速启动指令:
   1. 解压任意平台包
   2. 运行对应的启动脚本
   3. 访问 http://localhost:3000

💡 完整说明请查看: ${PACKAGE_DIR}/RELEASE-NOTES.md
${NC}"
}

# 主函数
main() {
    local start_time=$(date +%s)
    
    check_dependencies
    
    # 解析命令行参数
    local skip_clean=false
    local skip_frontend=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-clean)
                skip_clean=true
                shift
                ;;
            --skip-frontend)
                skip_frontend=true
                shift
                ;;
            --version)
                VERSION="$2"
                shift 2
                ;;
            *)
                echo -e "${YELLOW}未知参数: $1${NC}"
                shift
                ;;
        esac
    done
    
    if [ "$skip_clean" = false ]; then
        clean_old_builds
    fi
    
    if [ "$skip_frontend" = false ]; then
        build_frontend
    fi
    
    build_go_server
    create_deployment_packages
    create_archives
    generate_release_report
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo -e "${PURPLE}⏱️  总耗时: ${duration}秒${NC}"
    show_summary
}

# 显示帮助信息
show_help() {
    echo -e "${CYAN}UI素材生成器 - 一键打包脚本

用法: $0 [选项]

选项:
  --skip-clean      跳过清理步骤
  --skip-frontend   跳过前端构建
  --version VERSION 指定版本号
  --help           显示此帮助信息

示例:
  $0                                # 完整打包流程
  $0 --version 2.0.0                # 指定版本号
  $0 --skip-frontend                # 跳过前端构建
${NC}"
}

# 解析帮助参数
if [[ $1 == "--help" || $1 == "-h" ]]; then
    show_help
    exit 0
fi

# 执行主函数
main "$@"
