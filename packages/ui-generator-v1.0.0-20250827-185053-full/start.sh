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
