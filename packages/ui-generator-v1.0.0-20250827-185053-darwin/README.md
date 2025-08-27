# UI素材生成器服务器

一个简单高效的UI素材创作工具的静态文件服务器。

## 🚀 快速开始

### Windows
双击 `start.bat` 或在命令行运行：
```cmd
ui-generator-windows-amd64.exe
```

### Mac/Linux
运行启动脚本：
```bash
./start.sh
```

或直接运行对应的可执行文件：
```bash
# Mac
./ui-generator-darwin-amd64
# 或 M1/M2 Mac
./ui-generator-darwin-arm64

# Linux
./ui-generator-linux-amd64
# 或 ARM Linux
./ui-generator-linux-arm64
```

## 📋 命令行参数

- `-port` : 服务端口（默认: 3000）
- `-host` : 服务地址（默认: 0.0.0.0）
- `-dev`  : 开发模式，使用本地dist目录
- `-help` : 显示帮助信息

## 🌐 访问地址

服务启动后，在浏览器中访问：
- 本地访问: http://localhost:3000
- 网络访问: http://你的IP:3000

## 💡 使用示例

```bash
# 默认启动
./start.sh

# 指定端口
./start.sh -port 8080

# 开发模式（需要本地dist目录）
./start.sh -dev

# 指定主机和端口
./start.sh -host 127.0.0.1 -port 5000
```

## 🏥 健康检查

访问 `/health` 端点查看服务状态：
```bash
curl http://localhost:3000/health
```

## 📦 构建信息

- 版本: 1.0.0
- 构建时间: 2025-08-27 18:50:48
- Go版本: go1.23.4

## 🆘 常见问题

### 端口被占用
如果3000端口被占用，可以使用 `-port` 参数指定其他端口。

### 权限问题（Mac/Linux）
如果遇到权限错误，请给可执行文件添加执行权限：
```bash
chmod +x ui-generator-*
```

### 防火墙问题
确保指定的端口没有被防火墙阻挡。

---

🎨 **享受UI创作的乐趣！**
