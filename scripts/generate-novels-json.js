/**
 * 动态生成小说章节列表
 * 扫描 public/novels/ 目录生成 novels.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NOVELS_DIR = path.join(__dirname, '../public/novels');
const OUTPUT_FILE = path.join(__dirname, '../public/novels.json');

function extractChapterNumber(filename) {
  const match = filename.match(/第(\d+)章/);
  return match ? parseInt(match[1]) : 999;
}

function generateNovelsData() {
  const files = fs.readdirSync(NOVELS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort((a, b) => {
      const numA = extractChapterNumber(a);
      const numB = extractChapterNumber(b);
      return numA - numB;
    });

  // 分类文件
  const akDailyChapters = [];
  const otherFiles = [];

  for (const file of files) {
    // 过滤简化版：排除 "第1章.md" 这种格式（无下划线、无前导零）
    // 只保留完整版："第01章_标题.md" 或 "第10章_标题.md"
    const isSimplifiedVersion = /^第\d+章\.md$/.test(file);
    if (file.startsWith('第') && file.includes('章') && !isSimplifiedVersion) {
      // 提取章节标题
      const title = file.replace('.md', '').replace(/_/g, ' ');
      akDailyChapters.push({
        title: title,
        file: file
      });
    } else if (file === '数字女仆与她的主人.md') {
      otherFiles.push({
        id: 'maid-and-master',
        title: '数字女仆与她的主人',
        icon: '💎',
        chapters: [{ title: '全本', file: file }]
      });
    } else if (file === '钻石与代码.md') {
      otherFiles.push({
        id: 'diamond-and-code',
        title: '钻石与代码',
        icon: '💍',
        chapters: [{ title: '全本', file: file }]
      });
    }
  }

  const novels = [
    {
      id: 'ak-daily',
      title: '人机AK的日常',
      icon: '🤖',
      chapters: akDailyChapters
    },
    ...otherFiles
  ];

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ novels }, null, 2));
  console.log(`✅ 生成 novels.json，共 ${akDailyChapters.length} 章`);
  return novels;
}

generateNovelsData();
