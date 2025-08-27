package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"

	"strconv"
	"strings"
)

//go:embed dist
var embeddedFiles embed.FS

var (
	port     = flag.Int("port", 3000, "服务端口")
	host     = flag.String("host", "0.0.0.0", "服务地址")
	dev      = flag.Bool("dev", false, "开发模式，使用本地dist目录")
	help     = flag.Bool("help", false, "显示帮助信息")
	version  = "1.0.0"
	buildTime = "unknown"
)

func main() {
	flag.Parse()

	if *help {
		printHelp()
		return
	}

	// 检查端口环境变量
	if envPort := os.Getenv("PORT"); envPort != "" {
		if p, err := strconv.Atoi(envPort); err == nil {
			*port = p
		}
	}

	// 启动服务器
	addr := fmt.Sprintf("%s:%d", *host, *port)
	
	var fileSystem http.FileSystem
	if *dev {
		// 开发模式：使用本地dist目录
		if _, err := os.Stat("dist"); os.IsNotExist(err) {
			log.Fatal("❌ dist目录不存在，请先运行 'npm run build' 构建项目")
		}
		fileSystem = http.Dir("dist")
		log.Printf("🔧 开发模式：使用本地 dist 目录")
	} else {
		// 生产模式：使用嵌入的文件
		distFS, err := fs.Sub(embeddedFiles, "dist")
		if err != nil {
			log.Fatal("❌ 无法访问嵌入的文件系统:", err)
		}
		fileSystem = http.FS(distFS)
		log.Printf("📦 生产模式：使用嵌入的静态文件")
	}

	// 创建文件服务器
	fileServer := http.FileServer(fileSystem)
	
	// 处理根路径和SPA路由
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// 设置安全头
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		
		// 处理静态文件
		path := r.URL.Path
		
		// 如果是根路径或者不包含文件扩展名，返回index.html（SPA支持）
		if path == "/" || (!strings.Contains(path, ".") && !strings.HasPrefix(path, "/api")) {
			if *dev {
				http.ServeFile(w, r, "dist/index.html")
			} else {
				indexContent, err := embeddedFiles.ReadFile("dist/index.html")
				if err != nil {
					http.Error(w, "页面未找到", http.StatusNotFound)
					return
				}
				w.Header().Set("Content-Type", "text/html; charset=utf-8")
				w.Write(indexContent)
			}
			return
		}
		
		// 处理静态资源
		fileServer.ServeHTTP(w, r)
	})

	// 健康检查端点
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"ok","version":"%s","build":"%s"}`, version, buildTime)
	})

	// 打印启动信息
	printStartupInfo(addr)
	
	// 启动服务器
	log.Printf("🚀 服务器启动成功！")
	log.Printf("📱 本地访问: http://localhost:%d", *port)
	log.Printf("🌐 网络访问: http://%s:%d", getLocalIP(), *port)
	log.Printf("💡 按 Ctrl+C 停止服务")
	
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatal("❌ 服务器启动失败:", err)
	}
}

func printHelp() {
	fmt.Printf(`
🎨 UI素材生成器服务器 v%s

用法:
  ./ui-generator [选项]

选项:
  -port int     服务端口 (默认: 3000)
  -host string  服务地址 (默认: 0.0.0.0)  
  -dev         开发模式，使用本地dist目录
  -help        显示此帮助信息

环境变量:
  PORT         服务端口（覆盖-port参数）

示例:
  ./ui-generator                    # 使用默认设置启动
  ./ui-generator -port 8080         # 在8080端口启动
  ./ui-generator -dev               # 开发模式启动
  PORT=5000 ./ui-generator          # 使用环境变量设置端口

健康检查:
  GET /health                       # 服务状态检查

构建时间: %s
`, version, buildTime)
}

func printStartupInfo(addr string) {
	banner := `
╔══════════════════════════════════════════════════╗
║            🎨 UI素材生成器服务器                    ║
║                                                  ║
║  一个简单高效的UI素材创作工具                      ║
║  支持按钮、文本、面板等UI元素设计                   ║
║  可导出高质量PNG图片，适合游戏开发                  ║
╚══════════════════════════════════════════════════╝`

	fmt.Println(banner)
	fmt.Printf("\n📊 服务信息:\n")
	fmt.Printf("   版本: %s\n", version)
	fmt.Printf("   构建: %s\n", buildTime) 
	fmt.Printf("   监听: %s\n", addr)
	fmt.Printf("   模式: %s\n", getMode())
	fmt.Println()
}

func getMode() string {
	if *dev {
		return "🔧 开发模式"
	}
	return "📦 生产模式"
}

func getLocalIP() string {
	// 简单获取本机IP，用于显示网络访问地址
	if *host == "0.0.0.0" || *host == "" {
		return "127.0.0.1"
	}
	return *host
}
