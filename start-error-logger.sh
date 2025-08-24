#!/bin/bash

# 错误日志服务器启动脚本

# 检查是否已经安装了依赖
if [ ! -d "node_modules" ]; then
  echo "📦 安装依赖..."
  npm install express cors
fi

# 启动错误日志服务器
echo "🚀 启动错误日志服务器..."
node error-logger-server.js