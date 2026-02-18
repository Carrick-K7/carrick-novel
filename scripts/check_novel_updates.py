#!/usr/bin/env python3
"""
检查人机AK的日常小说更新并推送到 Discord
运行方式: python3 check_novel_updates.py
"""

import os
import glob
from datetime import datetime, timedelta
from pathlib import Path

def check_novel_updates():
    """检查近3小时内更新的小说章节"""
    novel_dir = Path("/root/.openclaw/workspace/projects/carrick-nexus/00_Inbox/人机AK的日常")
    
    if not novel_dir.exists():
        print(f"[ERROR] 目录不存在: {novel_dir}")
        return None
    
    # 获取3小时前的时间
    three_hours_ago = datetime.now() - timedelta(hours=3)
    
    # 查找所有 markdown 文件
    updated_chapters = []
    for md_file in novel_dir.glob("*.md"):
        # 获取文件修改时间
        mtime = datetime.fromtimestamp(md_file.stat().st_mtime)
        if mtime > three_hours_ago:
            # 解析文件名
            filename = md_file.stem  # 去掉 .md
            # 提取章节信息
            if "_" in filename:
                chapter = filename.split("_")[0]  # 第XX章
                title = "_".join(filename.split("_")[1:])  # 标题
                updated_chapters.append({
                    "chapter": chapter,
                    "title": title,
                    "file": filename
                })
    
    return updated_chapters

def format_message(chapters):
    """格式化 Discord 消息"""
    if not chapters:
        return None
    
    # 按章节排序
    chapters.sort(key=lambda x: int(x["chapter"].replace("第", "").replace("章", "")))
    
    message = "📚 **人机AK的日常 - 新章节更新**\n\n"
    message += f"🕒 检查时间: {datetime.now().strftime('%Y-%m-%d %H:%M')} (东八区)\n"
    message += f"📖 近3小时更新 **{len(chapters)}** 章:\n\n"
    
    for ch in chapters:
        message += f"• **{ch['chapter']}**: {ch['title']}\n"
    
    message += "\n👉 [点击阅读](https://dashboard.carrick7.com/novel)"
    
    return message

def main():
    """主函数"""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 开始检查小说更新...")
    
    # 检查更新
    chapters = check_novel_updates()
    
    if not chapters:
        print("[INFO] 近3小时内无新章节更新")
        return
    
    # 格式化消息
    message = format_message(chapters)
    
    if message:
        print(f"[INFO] 发现 {len(chapters)} 章新内容")
        print(message)
        
        # 输出到 stdout，由调用者处理发送
        # 实际发送需要使用 message 工具
        print("\n[DISCORD_MESSAGE]")
        print(message)
    
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 检查完成")

if __name__ == "__main__":
    main()
