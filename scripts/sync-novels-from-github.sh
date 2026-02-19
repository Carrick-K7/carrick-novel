#!/bin/bash
# sync-novels-from-github.sh
# 从GitHub自动拉取最新小说章节

set -e

NOVELS_DIR="/root/.openclaw/workspace/projects/carrick-novel/public/novels"
GITHUB_API="https://api.github.com/repos/Carrick-K7/carrick-nexus/contents"
# 使用环境变量，不要硬编码 Token
TOKEN="${GITHUB_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "❌ 错误: GITHUB_TOKEN 环境变量未设置"
  exit 1
fi

echo "📚 开始同步小说章节..."
echo ""

# 创建目录
mkdir -p "$NOVELS_DIR"
cd "$NOVELS_DIR"

# 获取GitHub上的文件列表
echo "🔍 获取GitHub文件列表..."
NOVEL_URL="$GITHUB_API/00_Inbox/%E4%BA%BA%E6%9C%BAAK%E7%9A%84%E6%97%A5%E5%B8%B8"

curl -s -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "$NOVEL_URL" | python3 -c "
import json
import sys
data = json.load(sys.stdin)
for item in data:
    if item['name'].endswith('.md'):
        print(f\"{item['name']}|{item['download_url']}\")
" | while IFS='|' read -r name url; do
  echo "📥 下载: $name"
  curl -s -L -H "Authorization: token $TOKEN" -o "$name" "$url"
done

echo ""
echo "✅ 同步完成！"
