@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: UI素材生成器 - Windows编译脚本
:: 支持 Mac、Linux、Windows 三个平台

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║            🚀 UI素材生成器 编译脚本                ║
echo ║                                                  ║
echo ║     支持 Mac、Linux、Windows 跨平台编译           ║
echo ╚══════════════════════════════════════════════════╝
echo.

:: 项目信息
set APP_NAME=ui-generator
set VERSION=1.0.0
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do if not "%%I"=="" set datetime=%%I
set BUILD_TIME=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2% %datetime:~8,2%:%datetime:~10,2%:%datetime:~12,2%

:: 输出目录
set BUILD_DIR=build
set RELEASE_DIR=releases

echo 🔍 检查编译环境...

:: 检查Go
where go >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Go未安装，请先安装Go语言环境
    pause
    exit /b 1
)
echo ✅ Go版本:
go version

:: 检查npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm未安装，请先安装Node.js环境
    pause
    exit /b 1
)
echo ✅ npm版本:
npm --version

:: 检查dist目录
if not exist "dist" (
    echo ⚠️  dist目录不存在，正在构建前端...
    call npm run build
) else (
    echo ✅ dist目录已存在
)

echo.
echo 📁 准备构建目录...
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
mkdir "%BUILD_DIR%"
if not exist "%RELEASE_DIR%" mkdir "%RELEASE_DIR%"

echo.
echo 🔨 开始编译...

:: 设置LDFLAGS
set LDFLAGS=-X main.version=%VERSION% -X "main.buildTime=%BUILD_TIME%" -w -s

:: 编译Mac Intel
echo 🔨 编译 darwin/amd64...
set GOOS=darwin
set GOARCH=amd64
set CGO_ENABLED=0
go build -ldflags "%LDFLAGS%" -o "%BUILD_DIR%/%APP_NAME%-darwin-amd64" server.go
if %errorlevel% equ 0 (
    echo ✅ %APP_NAME%-darwin-amd64
) else (
    echo ❌ darwin/amd64 编译失败
)

:: 编译Mac M1/M2
echo 🔨 编译 darwin/arm64...
set GOOS=darwin
set GOARCH=arm64
go build -ldflags "%LDFLAGS%" -o "%BUILD_DIR%/%APP_NAME%-darwin-arm64" server.go
if %errorlevel% equ 0 (
    echo ✅ %APP_NAME%-darwin-arm64
) else (
    echo ❌ darwin/arm64 编译失败
)

:: 编译Linux x64
echo 🔨 编译 linux/amd64...
set GOOS=linux
set GOARCH=amd64
go build -ldflags "%LDFLAGS%" -o "%BUILD_DIR%/%APP_NAME%-linux-amd64" server.go
if %errorlevel% equ 0 (
    echo ✅ %APP_NAME%-linux-amd64
) else (
    echo ❌ linux/amd64 编译失败
)

:: 编译Linux ARM
echo 🔨 编译 linux/arm64...
set GOOS=linux
set GOARCH=arm64
go build -ldflags "%LDFLAGS%" -o "%BUILD_DIR%/%APP_NAME%-linux-arm64" server.go
if %errorlevel% equ 0 (
    echo ✅ %APP_NAME%-linux-arm64
) else (
    echo ❌ linux/arm64 编译失败
)

:: 编译Windows x64
echo 🔨 编译 windows/amd64...
set GOOS=windows
set GOARCH=amd64
go build -ldflags "%LDFLAGS%" -o "%BUILD_DIR%/%APP_NAME%-windows-amd64.exe" server.go
if %errorlevel% equ 0 (
    echo ✅ %APP_NAME%-windows-amd64.exe
) else (
    echo ❌ windows/amd64 编译失败
)

echo.
echo 📝 创建启动脚本...

:: 创建Windows启动脚本
echo @echo off > "%BUILD_DIR%/start.bat"
echo chcp 65001 ^>nul 2^>^&1 >> "%BUILD_DIR%/start.bat"
echo echo. >> "%BUILD_DIR%/start.bat"
echo echo 🎨 UI素材生成器服务器启动中... >> "%BUILD_DIR%/start.bat"
echo echo. >> "%BUILD_DIR%/start.bat"
echo ui-generator-windows-amd64.exe %%* >> "%BUILD_DIR%/start.bat"
echo pause >> "%BUILD_DIR%/start.bat"

:: 创建Unix启动脚本
echo #!/bin/bash > "%BUILD_DIR%/start.sh"
echo. >> "%BUILD_DIR%/start.sh"
echo # UI素材生成器启动脚本 >> "%BUILD_DIR%/start.sh"
echo. >> "%BUILD_DIR%/start.sh"
echo echo "🎨 UI素材生成器服务器" >> "%BUILD_DIR%/start.sh"
echo echo "======================" >> "%BUILD_DIR%/start.sh"
echo echo "" >> "%BUILD_DIR%/start.sh"
echo. >> "%BUILD_DIR%/start.sh"
echo # 检测操作系统 >> "%BUILD_DIR%/start.sh"
echo OS="" >> "%BUILD_DIR%/start.sh"
echo case "$(uname -s)" in >> "%BUILD_DIR%/start.sh"
echo     Darwin*^)    OS="darwin" ;; >> "%BUILD_DIR%/start.sh"
echo     Linux*^)     OS="linux" ;; >> "%BUILD_DIR%/start.sh"
echo     *^)          echo "❌ 不支持的操作系统"; exit 1 ;; >> "%BUILD_DIR%/start.sh"
echo esac >> "%BUILD_DIR%/start.sh"
echo. >> "%BUILD_DIR%/start.sh"
echo # 检测架构 >> "%BUILD_DIR%/start.sh"
echo ARCH="" >> "%BUILD_DIR%/start.sh"
echo case "$(uname -m)" in >> "%BUILD_DIR%/start.sh"
echo     x86_64*^)    ARCH="amd64" ;; >> "%BUILD_DIR%/start.sh"
echo     arm64*^)     ARCH="arm64" ;; >> "%BUILD_DIR%/start.sh"
echo     aarch64*^)   ARCH="arm64" ;; >> "%BUILD_DIR%/start.sh"
echo     *^)          echo "❌ 不支持的架构"; exit 1 ;; >> "%BUILD_DIR%/start.sh"
echo esac >> "%BUILD_DIR%/start.sh"
echo. >> "%BUILD_DIR%/start.sh"
echo # 构建可执行文件名 >> "%BUILD_DIR%/start.sh"
echo BINARY="ui-generator-${OS}-${ARCH}" >> "%BUILD_DIR%/start.sh"
echo. >> "%BUILD_DIR%/start.sh"
echo if [ ! -f "$BINARY" ]; then >> "%BUILD_DIR%/start.sh"
echo     echo "❌ 未找到可执行文件: $BINARY" >> "%BUILD_DIR%/start.sh"
echo     echo "请确保下载了正确的版本" >> "%BUILD_DIR%/start.sh"
echo     exit 1 >> "%BUILD_DIR%/start.sh"
echo fi >> "%BUILD_DIR%/start.sh"
echo. >> "%BUILD_DIR%/start.sh"
echo # 添加执行权限 >> "%BUILD_DIR%/start.sh"
echo chmod +x "$BINARY" >> "%BUILD_DIR%/start.sh"
echo. >> "%BUILD_DIR%/start.sh"
echo # 启动服务器 >> "%BUILD_DIR%/start.sh"
echo echo "🚀 启动服务器..." >> "%BUILD_DIR%/start.sh"
echo ./"$BINARY" "$@" >> "%BUILD_DIR%/start.sh"

:: 创建说明文件
echo # UI素材生成器服务器 > "%BUILD_DIR%/README.md"
echo. >> "%BUILD_DIR%/README.md"
echo 一个简单高效的UI素材创作工具的静态文件服务器。 >> "%BUILD_DIR%/README.md"
echo. >> "%BUILD_DIR%/README.md"
echo ## 🚀 快速开始 >> "%BUILD_DIR%/README.md"
echo. >> "%BUILD_DIR%/README.md"
echo ### Windows >> "%BUILD_DIR%/README.md"
echo 双击 `start.bat` 或在命令行运行： >> "%BUILD_DIR%/README.md"
echo ```cmd >> "%BUILD_DIR%/README.md"
echo ui-generator-windows-amd64.exe >> "%BUILD_DIR%/README.md"
echo ``` >> "%BUILD_DIR%/README.md"
echo. >> "%BUILD_DIR%/README.md"
echo ### Mac/Linux >> "%BUILD_DIR%/README.md"
echo 运行启动脚本： >> "%BUILD_DIR%/README.md"
echo ```bash >> "%BUILD_DIR%/README.md"
echo ./start.sh >> "%BUILD_DIR%/README.md"
echo ``` >> "%BUILD_DIR%/README.md"
echo. >> "%BUILD_DIR%/README.md"
echo ## 🌐 访问地址 >> "%BUILD_DIR%/README.md"
echo. >> "%BUILD_DIR%/README.md"
echo 服务启动后，在浏览器中访问： >> "%BUILD_DIR%/README.md"
echo - 本地访问: http://localhost:3000 >> "%BUILD_DIR%/README.md"
echo - 网络访问: http://你的IP:3000 >> "%BUILD_DIR%/README.md"
echo. >> "%BUILD_DIR%/README.md"
echo ## 📦 构建信息 >> "%BUILD_DIR%/README.md"
echo. >> "%BUILD_DIR%/README.md"
echo - 版本: %VERSION% >> "%BUILD_DIR%/README.md"
echo - 构建时间: %BUILD_TIME% >> "%BUILD_DIR%/README.md"

echo.
echo 🎉 编译完成！
echo 📁 构建文件位于: %BUILD_DIR%\
echo 📋 包含文件:
dir /b "%BUILD_DIR%"

echo.
echo 💡 快速启动:
echo    cd %BUILD_DIR% ^&^& start.bat
echo.
pause
