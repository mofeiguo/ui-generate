# UI素材生成器 Makefile

.PHONY: help build package clean dev test docker

# 默认目标
help:
	@echo "🎨 UI素材生成器构建工具"
	@echo "========================"
	@echo ""
	@echo "可用命令:"
	@echo "  make build     - 编译所有平台的二进制文件"
	@echo "  make package   - 完整打包发布（包括前端构建）"
	@echo "  make dev       - 开发模式运行"
	@echo "  make test      - 运行测试"
	@echo "  make clean     - 清理构建文件"
	@echo "  make docker    - 构建Docker镜像"
	@echo "  make serve     - 快速启动服务器"
	@echo "  make frontend  - 仅构建前端"
	@echo ""

# 编译Go服务器
build:
	@echo "🔨 编译Go服务器..."
	./build.sh

# 完整打包
package:
	@echo "📦 完整打包发布..."
	./package.sh

# 仅构建前端
frontend:
	@echo "🎨 构建前端..."
	npm run build

# 开发模式
dev:
	@echo "🔧 启动开发模式..."
	@if [ -f "build/ui-generator-darwin-amd64" ]; then \
		./build/ui-generator-darwin-amd64 -dev; \
	elif [ -f "build/ui-generator-linux-amd64" ]; then \
		./build/ui-generator-linux-amd64 -dev; \
	else \
		echo "❌ 未找到可执行文件，请先运行 make build"; \
	fi

# 快速启动（生产模式）
serve:
	@echo "🚀 启动服务器..."
	@if [ -f "build/ui-generator-darwin-amd64" ]; then \
		./build/ui-generator-darwin-amd64; \
	elif [ -f "build/ui-generator-linux-amd64" ]; then \
		./build/ui-generator-linux-amd64; \
	else \
		echo "❌ 未找到可执行文件，请先运行 make build"; \
	fi

# 运行测试
test:
	@echo "🧪 运行测试..."
	@if [ -f "go.mod" ]; then \
		go test -v ./...; \
	fi
	@if [ -f "package.json" ]; then \
		npm test; \
	fi

# 清理构建文件
clean:
	@echo "🧹 清理构建文件..."
	rm -rf build/
	rm -rf releases/
	rm -rf packages/
	rm -rf dist/

# Docker构建
docker:
	@echo "🐳 构建Docker镜像..."
	docker build -t ui-generator:latest .

# 安装依赖
install:
	@echo "📦 安装依赖..."
	npm install
	go mod tidy

# 格式化代码
fmt:
	@echo "🎨 格式化代码..."
	@if command -v gofmt >/dev/null 2>&1; then \
		gofmt -w server.go; \
	fi
	@if command -v prettier >/dev/null 2>&1; then \
		npx prettier --write src/; \
	fi

# 检查代码质量
lint:
	@echo "🔍 检查代码质量..."
	@if command -v golint >/dev/null 2>&1; then \
		golint server.go; \
	fi
	@if [ -f "package.json" ]; then \
		npm run lint; \
	fi

# 快速构建和运行
quick: build serve

# 开发环境一键设置
setup: install frontend build
	@echo "✅ 开发环境设置完成！"
	@echo "💡 现在可以运行 'make dev' 启动开发服务器"

# 发布流程
release: clean package
	@echo "🎉 发布包已创建完成！"
	@echo "📁 查看 packages/ 目录获取发布文件"

# 显示版本信息
version:
	@echo "📊 版本信息:"
	@if [ -f "package.json" ]; then \
		echo "   前端版本: $$(jq -r '.version' package.json)"; \
	fi
	@if command -v go >/dev/null 2>&1; then \
		echo "   Go版本: $$(go version)"; \
	fi
	@if command -v node >/dev/null 2>&1; then \
		echo "   Node.js版本: $$(node --version)"; \
	fi
