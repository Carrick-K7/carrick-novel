<template>
  <div class="novel-view">
    <!-- 顶部：书籍切换标签 -->
    <header class="novel-header">
      <h1 class="page-title">📚 轻小说</h1>
      <div class="book-tabs">
        <button
          v-for="novel in novels"
          :key="novel.id"
          class="book-tab"
          :class="{ active: currentNovel?.id === novel.id }"
          @click="selectNovel(novel)"
        >
          <span class="book-icon">{{ novel.icon }}</span>
          <span class="book-name">{{ novel.title }}</span>
        </button>
      </div>
    </header>

    <div class="novel-container">
      <!-- 章节列表面板 -->
      <aside class="chapter-panel" :class="{ 'panel-open': showChapterPanel }">
        <div class="panel-header">
          <h3 class="panel-title">📖 章节列表</h3>
          <span class="chapter-count">{{ currentNovel?.chapters.length || 0 }} 章</span>
          <button class="close-panel" @click="showChapterPanel = false">✕</button>
        </div>

        <div class="chapters-scroll">
          <button
            v-for="(chapter, index) in currentNovel?.chapters"
            :key="index"
            class="chapter-item"
            :class="{ active: currentChapterIndex === index }"
            @click="selectChapter(index)"
          >
            <span class="chapter-num">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="chapter-name">{{ chapter.title }}</span>
          </button>
        </div>
      </aside>

      <!-- 遮罩层 -->
      <div
        v-if="showChapterPanel"
        class="panel-overlay"
        @click="showChapterPanel = false"
      ></div>

      <!-- 主阅读区 -->
      <main class="reader-main" ref="readerMain"
            @touchstart="handleTouchStart"
            @touchend="handleTouchEnd">
        <!-- 面包屑导航 -->
        <div class="reader-header">
          <button class="menu-btn" @click="showChapterPanel = true">
            ☰ 章节
          </button>
          <div class="breadcrumb">
            <span class="book">{{ currentNovel?.title }}</span>
            <span class="sep">/</span>
            <span class="chapter">{{ currentChapter?.title || '请选择章节' }}</span>
          </div>
        </div>

        <!-- 阅读内容 -->
        <div class="reader-content" ref="readerContent">
          <article v-if="currentChapter" class="markdown-body" v-html="renderedContent"></article>
          <div v-else class="empty-state">
            <div class="empty-icon">📖</div>
            <p>请选择章节开始阅读</p>
          </div>
        </div>

        <!-- 底部翻页栏 -->
        <div class="reader-footer">
          <button
            class="nav-btn prev"
            :disabled="currentChapterIndex === 0"
            @click="prevChapter"
          >
            <span class="nav-arrow">←</span>
            <span class="nav-text">上一章</span>
          </button>

          <span class="progress">
            {{ currentChapterIndex + 1 }} / {{ currentNovel?.chapters?.length || 1 }}
          </span>

          <button
            class="nav-btn next"
            :disabled="currentChapterIndex >= (currentNovel?.chapters?.length || 1) - 1"
            @click="nextChapter"
          >
            <span class="nav-text">下一章</span>
            <span class="nav-arrow">→</span>
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// localStorage 键名
const STORAGE_KEY = 'novel-reading-position'

// 小说数据 - 动态加载
const novels = ref([])
const currentNovel = ref(null)
const currentChapterIndex = ref(0)
const chapterContent = ref('')
const showChapterPanel = ref(false)
const readerContent = ref(null)
const isLoading = ref(true)
const loadError = ref('')

// 触摸滑动相关
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchEndX = ref(0)

// 监听章节变化，自动保存
watch(currentChapterIndex, () => {
  saveReadingPosition()
})

// 监听书籍变化，自动保存
watch(() => currentNovel.value?.id, () => {
  saveReadingPosition()
})

// 动态加载小说数据
async function loadNovelsData() {
  try {
    isLoading.value = true
    loadError.value = ''
    const response = await fetch('/novels.json')
    if (!response.ok) {
      throw new Error('加载失败')
    }
    const data = await response.json()
    if (data.novels && data.novels.length > 0) {
      novels.value = data.novels
      
      // 尝试恢复上次阅读位置
      const savedPosition = restoreReadingPosition()
      if (savedPosition) {
        const novel = novels.value.find(n => n.id === savedPosition.novelId)
        if (novel) {
          currentNovel.value = novel
          // 确保章节索引有效
          const maxIndex = novel.chapters.length - 1
          currentChapterIndex.value = Math.min(savedPosition.chapterIndex, maxIndex)
          console.log('📚 恢复阅读位置:', novel.title, '第', currentChapterIndex.value + 1, '章')
        } else {
          currentNovel.value = novels.value[0]
          currentChapterIndex.value = 0
        }
      } else {
        currentNovel.value = novels.value[0]
        currentChapterIndex.value = 0
      }
      loadChapter()
    }
  } catch (error) {
    console.error('加载小说数据失败:', error)
    loadError.value = '加载小说数据失败，请刷新重试'
    // 使用默认数据作为fallback
    novels.value = [
      {
        id: 'ak-daily',
        title: '人机AK的日常',
        icon: '🤖',
        chapters: [{ title: '数据加载中...', file: '' }]
      }
    ]
    currentNovel.value = novels.value[0]
  } finally {
    isLoading.value = false
  }
}

const currentChapter = computed(() => {
  if (!currentNovel.value) return null
  return currentNovel.value.chapters[currentChapterIndex.value]
})

// Markdown渲染
const renderedContent = computed(() => {
  if (!chapterContent.value) return ''

  return chapterContent.value
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^---$/gim, '<hr>')
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gim, '<p>$1</p>')
    .replace(/<(p)><(h[123]|blockquote|hr)>/g, '<$2>')
    .replace(/<\/(h[123]|blockquote|hr)><\/p>/g, '</$1>')
    .replace(/<p><\/p>/g, '')
})

// 保存阅读位置到 localStorage
function saveReadingPosition() {
  if (!currentNovel.value) return
  const position = {
    novelId: currentNovel.value.id,
    chapterIndex: currentChapterIndex.value,
    timestamp: Date.now()
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(position))
}

// 从 localStorage 恢复阅读位置
function restoreReadingPosition() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    return JSON.parse(saved)
  } catch {
    return null
  }
}

// 选择书籍
function selectNovel(novel) {
  // 保存之前的位置
  saveReadingPosition()
  currentNovel.value = novel
  currentChapterIndex.value = 0
  loadChapter()
  showChapterPanel.value = false
  // 保存新位置
  saveReadingPosition()
}

// 选择章节
function selectChapter(index) {
  currentChapterIndex.value = index
  loadChapter()
  showChapterPanel.value = false
  scrollToTop()
  // 保存位置
  saveReadingPosition()
}

// 加载章节
async function loadChapter() {
  if (!currentChapter.value) return

  chapterContent.value = ''
  try {
    const response = await fetch(`/novels/${currentChapter.value.file}`)
    if (response.ok) {
      chapterContent.value = await response.text()
    } else {
      chapterContent.value = '# 加载失败\n\n无法读取章节内容。'
    }
  } catch (error) {
    chapterContent.value = '# 加载失败\n\n网络错误。'
  }
}

// 上一章
function prevChapter() {
  if (currentChapterIndex.value > 0) {
    currentChapterIndex.value--
    loadChapter()
    scrollToTop()
    saveReadingPosition() // 保存位置
  }
}

// 下一章
function nextChapter() {
  if (currentNovel.value && currentChapterIndex.value < currentNovel.value.chapters.length - 1) {
    currentChapterIndex.value++
    loadChapter()
    scrollToTop()
    saveReadingPosition() // 保存位置
  }
}

// 滚动到顶部
function scrollToTop() {
  if (readerContent.value) {
    readerContent.value.scrollTop = 0
  }
}

// 触摸处理
function handleTouchStart(e) {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
}

function handleTouchEnd(e) {
  touchEndX.value = e.changedTouches[0].clientX
  const touchEndY = e.changedTouches[0].clientY

  const deltaX = touchStartX.value - touchEndX.value
  const deltaY = touchStartY.value - touchEndY

  // 水平滑动且垂直滑动较小（避免与滚动冲突）
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
    if (deltaX > 0) {
      // 左滑 - 下一章
      nextChapter()
    } else {
      // 右滑 - 上一章
      prevChapter()
    }
  }
}

// 键盘导航
function handleKeydown(e) {
  if (e.key === 'ArrowLeft') {
    prevChapter()
  } else if (e.key === 'ArrowRight') {
    nextChapter()
  }
}

onMounted(() => {
  loadNovelsData()
  window.addEventListener('keydown', handleKeydown)
  // 页面刷新/关闭前保存
  window.addEventListener('beforeunload', saveReadingPosition)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('beforeunload', saveReadingPosition)
  // 页面关闭前保存阅读位置
  saveReadingPosition()
})
</script>

<style scoped>
/* ========== 基础布局 ========== */
.novel-view {
  /* iOS Safari 100vh 修复 */
  height: 100vh;
  height: 100dvh;
  height: -webkit-fill-available;
  display: flex;
  flex-direction: column;
  background: var(--miku-bg);
  overflow: hidden;
}

/* ========== 顶部导航 ========== */
.novel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--miku-bg-secondary);
  border-bottom: 1px solid var(--miku-border);
  flex-shrink: 0;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--miku-text);
  margin: 0;
  flex-shrink: 0;
}

.book-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.book-tabs::-webkit-scrollbar {
  display: none;
}

.book-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--miku-bg);
  border: 1px solid var(--miku-border);
  border-radius: 8px;
  color: var(--miku-text);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.book-tab:hover {
  border-color: var(--miku-primary);
}

.book-tab.active {
  background: var(--miku-primary);
  color: white;
  border-color: var(--miku-primary);
}

.book-icon {
  font-size: 16px;
}

/* ========== 主体容器 ========== */
.novel-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* ========== 章节面板（桌面端） ========== */
.chapter-panel {
  width: 280px;
  flex-shrink: 0;
  background: var(--miku-bg-secondary);
  border-right: 1px solid var(--miku-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--miku-border);
  flex-shrink: 0;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--miku-text);
  margin: 0;
}

.chapter-count {
  font-size: 12px;
  color: var(--miku-text-muted);
  background: var(--miku-bg);
  padding: 2px 8px;
  border-radius: 10px;
}

.close-panel {
  display: none;
  background: none;
  border: none;
  color: var(--miku-text);
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}

/* 章节列表 */
.chapters-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  -webkit-overflow-scrolling: touch;
}

.chapters-scroll::-webkit-scrollbar {
  width: 6px;
}

.chapters-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.chapters-scroll::-webkit-scrollbar-thumb {
  background: var(--miku-border);
  border-radius: 3px;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--miku-text);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-bottom: 4px;
}

.chapter-item:hover {
  background: rgba(57, 197, 187, 0.1);
}

.chapter-item.active {
  background: rgba(57, 197, 187, 0.15);
  border-color: var(--miku-primary);
}

.chapter-num {
  width: 24px;
  height: 24px;
  background: var(--miku-bg);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--miku-text-muted);
  flex-shrink: 0;
}

.chapter-item.active .chapter-num {
  background: var(--miku-primary);
  color: white;
}

.chapter-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== 主阅读区 ========== */
.reader-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--miku-bg);
  overflow: hidden;
  position: relative;
}

/* 阅读区头部 */
.reader-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: var(--miku-bg-secondary);
  border-bottom: 1px solid var(--miku-border);
  flex-shrink: 0;
}

.menu-btn {
  display: none;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: var(--miku-bg);
  border: 1px solid var(--miku-border);
  border-radius: 6px;
  color: var(--miku-text);
  font-size: 13px;
  cursor: pointer;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--miku-text-secondary);
  overflow: hidden;
}

.breadcrumb .book {
  color: var(--miku-primary);
  font-weight: 500;
  flex-shrink: 0;
}

.breadcrumb .sep {
  color: var(--miku-text-muted);
  flex-shrink: 0;
}

.breadcrumb .chapter {
  color: var(--miku-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 阅读内容 */
.reader-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 32px 48px;
  -webkit-overflow-scrolling: touch;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--miku-text-muted);
  padding: 48px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

/* ========== 底部翻页栏 ========== */
.reader-footer {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--miku-bg-secondary);
  border-top: 1px solid var(--miku-border);
  flex-shrink: 0;
  gap: 16px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: var(--miku-bg);
  border: 1px solid var(--miku-border);
  border-radius: 8px;
  color: var(--miku-text);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
}

.nav-btn:hover:not(:disabled) {
  background: var(--miku-primary);
  color: white;
  border-color: var(--miku-primary);
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-arrow {
  font-size: 16px;
}

.progress {
  font-size: 13px;
  color: var(--miku-text-muted);
  white-space: nowrap;
}

/* ========== Markdown 样式 ========== */
:deep(.markdown-body) {
  max-width: 800px;
  margin: 0 auto;
  font-size: 17px;
  line-height: 1.9;
  color: var(--miku-text);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

:deep(.markdown-body h1) {
  font-size: 28px;
  font-weight: 700;
  color: var(--miku-text);
  margin: 32px 0 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--miku-border);
}

:deep(.markdown-body h2) {
  font-size: 22px;
  font-weight: 600;
  color: var(--miku-text);
  margin: 28px 0 16px;
}

:deep(.markdown-body h3) {
  font-size: 18px;
  font-weight: 600;
  color: var(--miku-primary);
  margin: 24px 0 12px;
}

:deep(.markdown-body p) {
  margin: 0 0 18px;
  text-align: justify;
}

:deep(.markdown-body blockquote) {
  margin: 24px 0;
  padding: 16px 20px;
  background: rgba(57, 197, 187, 0.1);
  border-left: 4px solid var(--miku-primary);
  border-radius: 0 8px 8px 0;
  font-style: italic;
}

:deep(.markdown-body hr) {
  border: none;
  height: 1px;
  background: var(--miku-border);
  margin: 32px 0;
}

:deep(.markdown-body strong) {
  color: var(--miku-primary);
  font-weight: 600;
}

/* ========== 遮罩层 ========== */
.panel-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

/* ========== 响应式：平板 ========== */
@media (max-width: 1024px) {
  .reader-content {
    padding: 24px 32px;
  }
}

/* ========== 响应式：移动端 ========== */
@media (max-width: 768px) {
  /* 整体布局 */
  .novel-view {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    height: 100%;
    width: 100%;
  }

  /* 顶部导航 */
  .novel-header {
    padding: 10px 12px;
    gap: 10px;
  }

  .page-title {
    font-size: 16px;
    display: none;
  }

  .book-tabs {
    width: 100%;
    gap: 6px;
  }

  .book-tab {
    padding: 8px 12px;
    font-size: 13px;
    flex: 1;
    justify-content: center;
  }

  /* 主体容器 */
  .novel-container {
    flex-direction: column;
  }

  /* 章节面板 - 移动端抽屉式 */
  .chapter-panel {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    max-width: 80vw;
    z-index: 200;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    border-right: none;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }

  .chapter-panel.panel-open {
    transform: translateX(0);
  }

  .close-panel {
    display: block;
  }

  .chapters-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .chapter-item {
    padding: 12px;
    margin-bottom: 6px;
    min-height: 44px;
  }

  /* 遮罩层 */
  .panel-overlay {
    display: block;
  }

  /* 阅读区头部 */
  .reader-header {
    padding: 10px 12px;
    gap: 10px;
  }

  .menu-btn {
    display: flex;
    flex-shrink: 0;
  }

  .breadcrumb {
    font-size: 12px;
    min-width: 0;
  }

  /* 阅读内容 */
  .reader-content {
    padding: 16px;
    padding-bottom: 80px; /* 为底部导航留空间 */
  }

  :deep(.markdown-body) {
    font-size: 16px;
    line-height: 1.8;
  }

  :deep(.markdown-body h1) {
    font-size: 22px;
    margin: 24px 0 16px;
  }

  :deep(.markdown-body h2) {
    font-size: 18px;
    margin: 20px 0 12px;
  }

  :deep(.markdown-body h3) {
    font-size: 16px;
    margin: 16px 0 10px;
  }

  :deep(.markdown-body p) {
    margin: 0 0 14px;
  }

  :deep(.markdown-body blockquote) {
    margin: 16px 0;
    padding: 12px 16px;
  }

  /* 底部翻页栏 */
  .reader-footer {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 10px 12px;
    padding-bottom: max(10px, env(safe-area-inset-bottom));
  }

  .nav-btn {
    padding: 10px 14px;
    font-size: 13px;
    min-height: 44px;
    min-width: 80px;
    justify-content: center;
  }

  .progress {
    font-size: 12px;
  }
}

/* 小屏幕手机 */
@media (max-width: 375px) {
  .book-tab {
    padding: 6px 8px;
    font-size: 12px;
  }

  .reader-content {
    padding: 12px;
    padding-bottom: 76px;
  }

  :deep(.markdown-body) {
    font-size: 15px;
  }

  .nav-btn {
    padding: 8px 12px;
    font-size: 12px;
    min-width: 70px;
  }
}

/* iPhone 安全区域适配 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  @media (max-width: 768px) {
    .reader-footer {
      padding-bottom: max(10px, env(safe-area-inset-bottom));
    }
  }
}
</style>
