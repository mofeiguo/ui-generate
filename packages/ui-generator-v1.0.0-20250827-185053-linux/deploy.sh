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
