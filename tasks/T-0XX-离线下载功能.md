# T-0XX: Novel 离线下载功能

## 目标
为 Novel 项目添加章节离线下载功能

## 功能需求

### 方案A: 打包下载（推荐）
**支持格式**:
- [ ] .txt - 纯文本格式，最通用
- [ ] .epub - 电子书格式，支持目录
- [ ] .pdf - PDF格式，适合打印

**实现方式**:
- 前端 JS 打包生成文件
- 或使用后端 API 生成（如需服务器支持）

**交互**:
- 单章下载：每章标题旁添加下载按钮
- 批量下载：支持选择章节范围下载
- 全书下载：一键下载所有已读/所有章节

### 方案B: PWA 离线支持
- [ ] Service Worker 缓存章节内容
- [ ] IndexedDB 存储章节数据
- [ ] 离线时显示已缓存章节
- [ ] 在线时自动同步更新

### 方案C: 简单导出
- [ ] Markdown 格式导出
- [ ] JSON 格式导出（包含元数据）

## 技术方案

### 前端实现（纯前端方案）
```typescript
// 单章下载为 txt
function downloadChapter(chapter: Chapter, format: 'txt' | 'epub' | 'pdf') {
  const content = generateContent(chapter, format)
  const blob = new Blob([content], { type: getMimeType(format) })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${chapter.title}.${format}`
  a.click()
  URL.revokeObjectURL(url)
}
```

### 需要的库
- JSZip: 批量打包多个章节
- FileSaver.js: 文件保存
- epub.js: 生成 EPUB 格式
- pdf-lib: 生成 PDF 格式

## UI 设计

### 下载按钮
- 位置：章节标题右侧 / 底部工具栏
- 图标：⬇️ 下载

### 下载弹窗
```
下载章节
━━━━━━━━━━━━━
格式: [TXT ▼]
范围: [当前章节 ▼]
      ○ 仅本章
      ○ 从本章到最新
      ○ 选择范围...
      ○ 全部章节

[取消] [下载]
```

## 验收标准
- [ ] 支持单章下载为 TXT 格式
- [ ] 支持批量选择章节下载
- [ ] 下载文件名包含章节信息
- [ ] 进度提示（批量下载时）
- [ ] 移动端适配
- [ ] Git提交推送
- [ ] 部署验证

## 进度
| 时间 | 事件 | 状态 |
|:---:|:---|:---:|
| 2026-02-22 | Task 创建 | ✅ |

## 提交记录
- 待添加
