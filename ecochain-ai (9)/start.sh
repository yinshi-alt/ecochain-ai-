#!/bin/bash

# 启动脚本：同时启动前端和后端服务器

echo "=== EcoChain AI 启动脚本 ==="
echo "正在安装依赖..."

# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..

echo "依赖安装完成，正在启动服务..."

# 使用pm2启动多个进程
if ! command -v pm2 &> /dev/null
then
    echo "pm2 未安装，正在全局安装..."
    npm install -g pm2
fi

# 启动前端开发服务器
pm2 start npm --name "ecochain-frontend" -- run dev

# 启动后端服务器
pm2 start npm --name "ecochain-backend" -- run server

echo "服务启动完成！"
echo "前端: http://localhost:3000"
echo "后端: http://localhost:5000"
echo ""
echo "使用 'pm2 logs' 查看日志"
echo "使用 'pm2 stop all' 停止所有服务"

# 显示状态
pm2 status
