#!/bin/bash

# 停止脚本：停止所有EcoChain AI相关服务

echo "=== EcoChain AI 停止脚本 ==="

# 检查pm2是否安装
if ! command -v pm2 &> /dev/null
then
    echo "pm2 未安装，正在全局安装..."
    npm install -g pm2
fi

# 停止所有EcoChain AI服务
echo "正在停止所有服务..."
pm2 stop ecochain-frontend
pm2 stop ecochain-backend

# 删除服务
pm2 delete ecochain-frontend
pm2 delete ecochain-backend

echo "所有服务已停止！"

# 显示状态
pm2 status
