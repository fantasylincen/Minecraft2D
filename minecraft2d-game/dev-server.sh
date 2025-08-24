#!/bin/bash

# MCv2开发服务器管理脚本
# 用于正确管理开发服务器的启动、停止和状态检查

PROJECT_DIR="/Users/lincen/Desktop/codes/MCv2/mcv2-game"
SERVER_URL="http://localhost:5173"
PID_FILE="$PROJECT_DIR/.dev-server.pid"

case "$1" in
    start)
        echo "🚀 启动MCv2开发服务器..."
        cd "$PROJECT_DIR"
        
        # 检查是否已经在运行
        if curl -s "$SERVER_URL" >/dev/null 2>&1; then
            echo "✅ 开发服务器已经在运行中"
            echo "📍 访问地址: $SERVER_URL"
            exit 0
        fi
        
        # 启动服务器并记录PID
        npm run dev &
        echo $! > "$PID_FILE"
        
        # 等待服务器启动
        echo "⏳ 等待服务器启动..."
        for i in {1..30}; do
            if curl -s "$SERVER_URL" >/dev/null 2>&1; then
                echo "✅ 开发服务器启动成功"
                echo "📍 访问地址: $SERVER_URL"
                exit 0
            fi
            sleep 1
        done
        
        echo "❌ 服务器启动超时"
        exit 1
        ;;
        
    stop)
        echo "🛑 停止MCv2开发服务器..."
        
        # 尝试通过PID文件停止
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if kill -0 "$PID" 2>/dev/null; then
                kill "$PID"
                rm -f "$PID_FILE"
                echo "✅ 服务器已停止"
            else
                echo "⚠️ PID文件存在但进程未运行，清理PID文件"
                rm -f "$PID_FILE"
            fi
        fi
        
        # 尝试通过端口停止
        if pgrep -f "vite" >/dev/null; then
            pkill -f "vite"
            echo "✅ 通过进程名停止了服务器"
        fi
        
        # 验证是否已停止
        if curl -s "$SERVER_URL" >/dev/null 2>&1; then
            echo "⚠️ 服务器可能仍在运行，请手动检查"
        else
            echo "✅ 服务器已完全停止"
        fi
        ;;
        
    status)
        echo "📊 检查MCv2开发服务器状态..."
        
        if curl -s "$SERVER_URL" >/dev/null 2>&1; then
            echo "✅ 开发服务器正在运行"
            echo "📍 访问地址: $SERVER_URL"
            
            # 显示PID信息
            if [ -f "$PID_FILE" ]; then
                PID=$(cat "$PID_FILE")
                if kill -0 "$PID" 2>/dev/null; then
                    echo "🔍 进程ID: $PID"
                else
                    echo "⚠️ PID文件存在但进程未运行"
                fi
            fi
        else
            echo "❌ 开发服务器未运行"
        fi
        ;;
        
    restart)
        echo "🔄 重启MCv2开发服务器..."
        $0 stop
        sleep 2
        $0 start
        ;;
        
    logs)
        echo "📋 显示开发服务器日志..."
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if kill -0 "$PID" 2>/dev/null; then
                echo "🔍 服务器正在运行，PID: $PID"
                echo "📋 要查看实时日志，请使用: tail -f ~/.npm/_logs/*debug*.log"
            else
                echo "⚠️ 服务器未运行"
            fi
        else
            echo "⚠️ 未找到PID文件，服务器可能未通过此脚本启动"
        fi
        ;;
        
    *)
        echo "MCv2开发服务器管理脚本"
        echo ""
        echo "用法: $0 {start|stop|status|restart|logs}"
        echo ""
        echo "命令说明:"
        echo "  start   - 启动开发服务器"
        echo "  stop    - 停止开发服务器"
        echo "  status  - 检查服务器状态"
        echo "  restart - 重启开发服务器"
        echo "  logs    - 查看服务器日志"
        echo ""
        echo "示例:"
        echo "  $0 start    # 启动服务器"
        echo "  $0 status   # 检查状态"
        echo "  $0 stop     # 停止服务器"
        exit 1
        ;;
esac