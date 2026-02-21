# Novel 章节索引修复报告

## 问题描述
URL `/15` 对应 `chapters[15]`（第16章），用户期望 `/15` 看到"第15章"。

## 修复方案
将 URL 从 0-based 改为 1-based：
- URL `/15` → chapters[14]（第15章）
- URL `/1` → chapters[0]（第01章）
- URL `/0` → chapters[0]（第01章，边界处理）

## 修改文件

### 1. src/views/read/Read.vue
```typescript
// chapterIndex 计算属性 - 将 URL 参数转换为 0-based 索引
const chapterIndex = computed(() => {
  const index = parseInt(props.chapter) || 0
  return Math.max(0, index - 1)
})

// prevChapter - 上一章导航
router.push(`/read/${props.id}/${chapterIndex.value}`)
// 说明: chapterIndex 已经是 0-based，直接作为 URL 参数即表示 chapterIndex+1

// nextChapter - 下一章导航  
router.push(`/read/${props.id}/${chapterIndex.value + 2}`)
// 说明: 下一章的 URL 参数 = 当前 chapterIndex + 2

// 目录链接
:to="`/book/${id}?chapter=${chapterIndex + 1}`"
```

### 2. src/views/books/BookDetail.vue
```typescript
// 当前阅读章节链接（1-based URL）
:to="`/read/${book.id}/${currentChapterIndex + 1}`"

// 章节列表链接（1-based URL）
:to="`/read/${book.id}/${index + 1}`"

// query 参数解析（转换为 0-based）
currentChapterIndex.value = parseInt(chapterParam as string, 10) - 1
```

### 3. src/views/Home.vue
```typescript
// 继续阅读链接（1-based URL）
router.push(`/read/${bookId}/${lastChapter + 1}`)
```

## 测试用例

| URL | 预期章节 | 实际章节 | 状态 |
|-----|---------|---------|------|
| /0  | 第01章  | 第01章  | ✅   |
| /1  | 第01章  | 第01章  | ✅   |
| /15 | 第15章  | 第15章  | ✅   |
| /131| 第131章 | 第131章 | ✅   |

## 导航测试

| 操作 | 当前 URL | 预期结果 | 状态 |
|------|---------|---------|------|
| 上一章 | /15 | URL 变为 /14 | ✅ |
| 下一章 | /15 | URL 变为 /16 | ✅ |
| 目录点击 | /15 | 返回目录并高亮第15章 | ✅ |
| 首页继续阅读 | - | 正确跳转到最近章节 | ✅ |

## 部署状态
- 构建成功 ✅
- 部署到 /var/www/carrick-novel ✅
- 网站访问正常 ✅

## 修复时间
2026-02-20 23:53 UTC

## 部署时间
2026-02-20 23:55 UTC
