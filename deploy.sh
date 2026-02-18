#!/bin/bash
# 部署 carrick-novel 到 novel.carrick7.com

set -e

echo "=== 开始部署 carrick-novel ==="

# 1. 进入项目目录
cd /root/.openclaw/workspace/projects/carrick-novel

# 2. 构建项目
echo "构建项目..."
npm run build

# 3. 复制小说数据
echo "复制小说数据..."
cp -r public/novels dist/ 2>/dev/null || true
cp public/novels.json dist/ 2>/dev/null || true

# 4. 部署到服务器目录
echo "部署到 /var/www/carrick-novel..."
sudo mkdir -p /var/www/carrick-novel
sudo cp -r dist/* /var/www/carrick-novel/

# 5. 设置权限
sudo chown -R caddy:caddy /var/www/carrick-novel

echo "=== 部署完成 ==="
echo "请确保 DNS 已配置: novel.carrick7.com"
echo "请确保 Caddy 配置已添加"
