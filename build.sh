#!/bin/bash

# UI素材生成器 - 跨平台编译脚本
# 支持 Mac、Linux、Windows 三个平台

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

# 输出目录
BUILD_DIR="build"
RELEASE_DIR="releases"

echo -e "${CYAN}
╔══════════════════════════════════════════════════╗
║            🚀 UI素材生成器 编译脚本                ║
║                                                  ║
║     支持 Mac、Linux、Windows 跨平台编译           ║
╚══════════════════════════════════════════════════╝
${NC}"

# 检查依赖
check_dependencies() {
    echo -e "${YELLOW}🔍 检查编译环境...${NC}"
    
    # 检查Go
    if ! command -v go &> /dev/null; then
        echo -e "${RED}❌ Go未安装，请先安装Go语言环境${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Go版本: $(go version)${NC}"
    
    # 检查Node.js和npm（用于构建前端）
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm未安装，请先安装Node.js环境${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ npm版本: $(npm --version)${NC}"
    
    # 检查dist目录
    if [ ! -d "dist" ]; then
        echo -e "${YELLOW}⚠️  dist目录不存在，正在构建前端...${NC}"
        npm run build
    else
        echo -e "${GREEN}✅ dist目录已存在${NC}"
    fi
}

# 创建构建目录
prepare_build_dir() {
    echo -e "${YELLOW}📁 准备构建目录...${NC}"
    rm -rf ${BUILD_DIR}
    mkdir -p ${BUILD_DIR}
    mkdir -p ${RELEASE_DIR}
}

# 编译函数
build_for_platform() {
    local os=$1
    local arch=$2
    local ext=$3
    local output_name="${APP_NAME}-${os}-${arch}${ext}"
    
    echo -e "${BLUE}🔨 编译 ${os}/${arch}...${NC}"
    
    # 设置构建参数
    local ldflags="-X main.version=${VERSION} -X 'main.buildTime=${BUILD_TIME}' -w -s"
    
    # 编译
    CGO_ENABLED=0 GOOS=${os} GOARCH=${arch} go build \
        -ldflags "${ldflags}" \
        -o ${BUILD_DIR}/${output_name} \
        server.go
    
    if [ $? -eq 0 ]; then
        local size=$(ls -lh ${BUILD_DIR}/${output_name} | awk '{print $5}')
        echo -e "${GREEN}✅ ${output_name} (${size})${NC}"
    else
        echo -e "${RED}❌ ${os}/${arch} 编译失败${NC}"
        return 1
    fi
}

# 创建启动脚本
create_startup_scripts() {
    echo -e "${YELLOW}📝 创建启动脚本...${NC}"
    
    # Windows启动脚本
    cat > ${BUILD_DIR}/start.bat << 'EOF'
@echo off
chcp 65001 >nul 2>&1
echo.
echo 🎨 UI素材生成器服务器启动中...
echo.
ui-generator-windows-amd64.exe
pause
EOF

    # Unix启动脚本（Mac/Linux通用）
    cat > ${BUILD_DIR}/start.sh << 'EOF'
#!/bin/bash

# UI素材生成器启动脚本

echo "🎨 UI素材生成器服务器"
echo "======================"
echo ""

# 检测操作系统
OS=""
case "$(uname -s)" in
    Darwin*)    OS="darwin" ;;
    Linux*)     OS="linux" ;;
    *)          echo "❌ 不支持的操作系统"; exit 1 ;;
esac

# 检测架构
ARCH=""
case "$(uname -m)" in
    x86_64*)    ARCH="amd64" ;;
    arm64*)     ARCH="arm64" ;;
    aarch64*)   ARCH="arm64" ;;
    *)          echo "❌ 不支持的架构"; exit 1 ;;
esac

# 构建可执行文件名
BINARY="ui-generator-${OS}-${ARCH}"

if [ ! -f "$BINARY" ]; then
    echo "❌ 未找到可执行文件: $BINARY"
    echo "请确保下载了正确的版本"
    exit 1
fi

# 添加执行权限
chmod +x "$BINARY"

# 启动服务器
echo "🚀 启动服务器..."
./"$BINARY" "$@"
EOF

    chmod +x ${BUILD_DIR}/start.sh
    
    # 开发模式启动脚本
    cat > ${BUILD_DIR}/start-dev.sh << 'EOF'
#!/bin/bash
echo "🔧 开发模式启动 (使用本地dist目录)"
echo "================================"
./start.sh -dev
EOF

    chmod +x ${BUILD_DIR}/start-dev.sh
}

# 创建说明文件
create_readme() {
    cat > ${BUILD_DIR}/README.md << EOF
# UI素材生成器服务器

一个简单高效的UI素材创作工具的静态文件服务器。

## 🚀 快速开始

### Windows
双击 \`start.bat\` 或在命令行运行：
\`\`\`cmd
ui-generator-windows-amd64.exe
\`\`\`

### Mac/Linux
运行启动脚本：
\`\`\`bash
./start.sh
\`\`\`

或直接运行对应的可执行文件：
\`\`\`bash
# Mac
./ui-generator-darwin-amd64
# 或 M1/M2 Mac
./ui-generator-darwin-arm64

# Linux
./ui-generator-linux-amd64
# 或 ARM Linux
./ui-generator-linux-arm64
\`\`\`

## 📋 命令行参数

- \`-port\` : 服务端口（默认: 3000）
- \`-host\` : 服务地址（默认: 0.0.0.0）
- \`-dev\`  : 开发模式，使用本地dist目录
- \`-help\` : 显示帮助信息

## 🌐 访问地址

服务启动后，在浏览器中访问：
- 本地访问: http://localhost:3000
- 网络访问: http://你的IP:3000

## 💡 使用示例

\`\`\`bash
# 默认启动
./start.sh

# 指定端口
./start.sh -port 8080

# 开发模式（需要本地dist目录）
./start.sh -dev

# 指定主机和端口
./start.sh -host 127.0.0.1 -port 5000
\`\`\`

## 🏥 健康检查

访问 \`/health\` 端点查看服务状态：
\`\`\`bash
curl http://localhost:3000/health
\`\`\`

## 📦 构建信息

- 版本: ${VERSION}
- 构建时间: ${BUILD_TIME}
- Go版本: $(go version | cut -d' ' -f3)

## 🆘 常见问题

### 端口被占用
如果3000端口被占用，可以使用 \`-port\` 参数指定其他端口。

### 权限问题（Mac/Linux）
如果遇到权限错误，请给可执行文件添加执行权限：
\`\`\`bash
chmod +x ui-generator-*
\`\`\`

### 防火墙问题
确保指定的端口没有被防火墙阻挡。

---

🎨 **享受UI创作的乐趣！**
EOF
}

# 创建发布包
create_release_package() {
    echo -e "${YELLOW}📦 创建发布包...${NC}"
    
    local release_name="${APP_NAME}-v${VERSION}-$(date +%Y%m%d)"
    local release_dir="${RELEASE_DIR}/${release_name}"
    
    # 创建发布目录
    mkdir -p "${release_dir}"
    
    # 复制所有构建文件
    cp -r ${BUILD_DIR}/* "${release_dir}/"
    
    # 创建压缩包
    cd ${RELEASE_DIR}
    tar -czf "${release_name}.tar.gz" "${release_name}"
    zip -r "${release_name}.zip" "${release_name}" > /dev/null 2>&1
    
    cd ..
    
    echo -e "${GREEN}✅ 发布包已创建:${NC}"
    echo -e "   📁 ${RELEASE_DIR}/${release_name}/"
    echo -e "   📦 ${RELEASE_DIR}/${release_name}.tar.gz"
    echo -e "   📦 ${RELEASE_DIR}/${release_name}.zip"
}

# 主函数
main() {
    check_dependencies
    prepare_build_dir
    
    echo -e "${YELLOW}🔨 开始编译...${NC}"
    
    # 编译各平台版本
    build_for_platform "darwin" "amd64" ""      # Mac Intel
    build_for_platform "darwin" "arm64" ""      # Mac M1/M2
    build_for_platform "linux" "amd64" ""       # Linux x64
    build_for_platform "linux" "arm64" ""       # Linux ARM
    build_for_platform "windows" "amd64" ".exe" # Windows x64
    
    create_startup_scripts
    create_readme
    
    echo -e "${GREEN}
🎉 编译完成！
📁 构建文件位于: ${BUILD_DIR}/
📋 包含以下文件:$(ls -1 ${BUILD_DIR} | sed 's/^/   - /')
${NC}"

    # 创建发布包
    if [ "$1" == "--release" ]; then
        create_release_package
    fi
    
    echo -e "${CYAN}
💡 快速启动:
   Windows: cd ${BUILD_DIR} && start.bat
   Mac/Linux: cd ${BUILD_DIR} && ./start.sh
${NC}"
}

# 执行主函数
main "$@"
