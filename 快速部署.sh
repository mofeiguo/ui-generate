#!/bin/bash

echo "🚀 UI素材生成器 - 快速部署脚本"
echo "=================================="

# 检查dist目录
if [ ! -d "dist" ]; then
    echo "❌ dist目录不存在，正在构建..."
    npm run build
else
    echo "✅ dist目录已存在"
fi

echo ""
echo "📋 部署选项："
echo "1) Vercel部署（推荐）"
echo "2) Netlify CLI部署"
echo "3) 只显示部署提示"
echo ""
read -p "请选择部署方式 (1-3): " choice

case $choice in
    1)
        echo "🌟 正在使用Vercel部署..."
        if ! command -v vercel &> /dev/null; then
            echo "📥 安装Vercel CLI..."
            npm i -g vercel
        fi
        vercel --prod
        ;;
    2)
        echo "🌐 正在使用Netlify部署..."
        if ! command -v netlify &> /dev/null; then
            echo "📥 安装Netlify CLI..."
            npm i -g netlify-cli
        fi
        netlify deploy --prod --dir=dist
        ;;
    3)
        echo ""
        echo "💡 手动部署提示："
        echo "=================================="
        echo "1. 最简单：访问 netlify.com，拖拽 dist 文件夹"
        echo "2. Vercel：访问 vercel.com，导入GitHub仓库"
        echo "3. GitHub Pages：推送到GitHub，启用Pages功能"
        echo "4. 自己服务器：上传 dist 内容到网站目录"
        echo ""
        echo "📁 当前dist文件："
        ls -la dist/
        echo ""
        echo "📊 文件大小："
        du -h dist/*
        ;;
    *)
        echo "❌ 无效选择"
        ;;
esac

echo ""
echo "✅ 部署完成！查看详细指南：cat 部署指南.md"
