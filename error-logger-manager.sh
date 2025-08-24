#!/bin/bash

# 错误日志服务器管理脚本

PID_FILE=".error-logger.pid"
LOG_FILE="logs/client-error.log"

case "$1" in
  start)
    if [ -f "$PID_FILE" ]; then
      echo "❌ 错误日志服务器已在运行 (PID: $(cat $PID_FILE))"
      exit 1
    fi
    
    echo "🚀 启动错误日志服务器..."
    node error-logger-server.js > error-logger.log 2>&1 &
    echo $! > "$PID_FILE"
    echo "✅ 错误日志服务器已启动 (PID: $(cat $PID_FILE))"
    ;;
    
  stop)
    if [ ! -f "$PID_FILE" ]; then
      echo "❌ 错误日志服务器未运行"
      exit 1
    fi
    
    PID=$(cat "$PID_FILE")
    echo "🛑 停止错误日志服务器 (PID: $PID)..."
    kill $PID
    rm -f "$PID_FILE"
    echo "✅ 错误日志服务器已停止"
    ;;
    
  status)
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      if ps -p $PID > /dev/null; then
        echo "✅ 错误日志服务器正在运行 (PID: $PID)"
      else
        echo "❌ 错误日志服务器进程文件存在但进程未运行"
        rm -f "$PID_FILE"
      fi
    else
      echo "❌ 错误日志服务器未运行"
    fi
    ;;
    
  restart)
    $0 stop
    sleep 2
    $0 start
    ;;
    
  logs)
    if [ -f "$LOG_FILE" ]; then
      echo "📝 错误日志内容:"
      cat "$LOG_FILE"
    else
      echo "📝 错误日志文件不存在"
    fi
    ;;
    
  clear-logs)
    if [ -f "$LOG_FILE" ]; then
      echo "🗑️ 清空错误日志..."
      > "$LOG_FILE"
      echo "✅ 错误日志已清空"
    else
      echo "📝 错误日志文件不存在"
    fi
    ;;
    
  *)
    echo "用法: $0 {start|stop|status|restart|logs|clear-logs}"
    exit 1
    ;;
esac