#!/bin/bash
# sync-novels-local.sh
# 从本地 carrick-nexus 同步小说章节到 carrick-novel

set -e

SOURCE_DIR="/root/.openclaw/workspace/projects/carrick-nexus/00_Inbox/人机AK的日常"
TARGET_DIR="/root/.openclaw/workspace/projects/carrick-novel/public/novels"
OTHER_SOURCE="/root/.openclaw/workspace/projects/carrick-nexus/00_Inbox"

echo "📚 开始同步小说章节..."
echo ""

# 创建目录
mkdir -p "$TARGET_DIR"

# 同步人机AK的日常
echo "📁 同步: 人机AK的日常"
cp "$SOURCE_DIR"/*.md "$TARGET_DIR"/ 2>/dev/null || true

# 同步其他小说
echo "📁 同步: 其他小说"
cp "$OTHER_SOURCE/数字女仆与她的主人.md" "$TARGET_DIR"/ 2>/dev/null || true
cp "$OTHER_SOURCE/钻石与代码.md" "$TARGET_DIR"/ 2>/dev/null || true

# 生成 novels.json
echo "📝 生成 novels.json..."
cd /root/.openclaw/workspace/projects/carrick-novel
node scripts/generate-novels-json.js

echo ""
echo "✅ 同步完成！"
echo "📊 章节统计:"
ls -1 "$TARGET_DIR"/*.md 2>/dev/null | wc -l | xargs echo "  总文件数:"
