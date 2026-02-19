<template>
  <div class="min-h-screen flex flex-col relative" :class="{ 'immersive-mode': isImmersiveMode }">
    <!-- 顶部导航栏 -->
    <header 
      class="fixed top-0 left-0 right-0 flex items-center gap-3 px-4 py-3 bg-miku border-b border-miku z-[100] transition-transform duration-300"
      :class="isImmersiveMode ? '-translate-y-full' : 'translate-y-0'"
    >
      <router-link to="/" class="text-miku-primary no-underline flex-shrink-0 text-lg" title="返回书架">←</router-link>
      <div class="flex-1 min-w-0 flex items-center gap-2 text-sm">
        <span class="truncate text-miku-primary" :title="book?.title">{{ book?.title }}</span>
        <span class="text-miku-muted flex-shrink-0">-</span>
        <span class="truncate font-semibold" :title="currentChapter?.title">{{ currentChapter?.title }}</span>
      </div>
    </header>
    
    <!-- 阅读区域 -->
    <div 
      class="flex-1 px-5 max-w-3xl mx-auto w-full transition-all duration-300"
      :class="isImmersiveMode ? 'py-6 pb-6' : 'py-20 pb-24'"
    >
      <div v-if="content" class="markdown-body leading-relaxed text-base cursor-pointer" v-html="renderedContent" @click="handleContentClick" />
      <div v-else class="text-center py-12 text-miku-muted">加载中...</div>
    </div>
    
    <!-- 底部图标导航栏 -->
    <div 
      class="fixed bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-miku border-t border-miku transition-transform duration-300 z-[100]"
      :class="isImmersiveMode ? 'translate-y-full' : 'translate-y-0'"
    >
      <!-- 左侧：上一章 -->
      <button 
        :disabled="chapterIndex <= 0" 
        @click="prevChapter"
        class="nav-btn nav-btn-left"
        :class="{ 'nav-btn-disabled': chapterIndex <= 0 }"
        title="上一章"
        aria-label="上一章"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        <span class="nav-tooltip">上一章</span>
      </button>

      <!-- 中间：目录 + 书架 -->
      <div class="flex items-center gap-4 sm:gap-6">
        <router-link :to="`/book/${id}`" class="nav-btn" title="目录" aria-label="目录">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span class="nav-tooltip">目录</span>
        </router-link>
        
        <router-link to="/" class="nav-btn" title="书架" aria-label="书架">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            <line x1="9" y1="10" x2="15" y2="10"/>
          </svg>
          <span class="nav-tooltip">书架</span>
        </router-link>
      </div>

      <!-- 右侧：下一章 -->
      <button 
        :disabled="chapterIndex >= (book?.chapters?.length || 0) - 1" 
        @click="nextChapter"
        class="nav-btn nav-btn-right"
        :class="{ 'nav-btn-disabled': chapterIndex >= (book?.chapters?.length || 0) - 1 }"
        title="下一章"
        aria-label="下一章"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
        <span class="nav-tooltip">下一章</span>
      </button>
    </div>

    <!-- 沉浸模式退出提示条（屏幕顶部边缘） -->
    <div 
      v-if="isImmersiveMode"
      class="fixed top-0 left-0 right-0 h-2 z-[101] cursor-pointer group"
      @click="toggleImmersiveMode"
      title="点击退出沉浸模式"
    >
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-miku-muted/50 rounded-b-lg group-hover:bg-miku-primary/50 transition-colors"></div>
    </div>

    <!-- 沉浸模式悬浮退出按钮 -->
    <button
      v-if="isImmersiveMode"
      @click="toggleImmersiveMode"
      class="fixed bottom-4 right-4 z-[101] w-10 h-10 bg-miku-secondary/90 border border-miku rounded-full flex items-center justify-center text-miku-primary hover:bg-miku-primary hover:text-white transition-all duration-300 shadow-lg opacity-0 hover:opacity-100 focus:opacity-100"
      title="退出沉浸模式"
    >
      <span class="text-sm">⛶</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import novelsData from '../../../public/novels.json'

const props = defineProps<{
  id: string
  chapter: string
}>()

const router = useRouter()
const content = ref('')
const isImmersiveMode = ref(false)
const chapterIndex = computed(() => parseInt(props.chapter) || 0)

const book = computed(() => {
  return novelsData.novels.find(n => n.id === props.id)
})

const currentChapter = computed(() => {
  return book.value?.chapters?.[chapterIndex.value]
})

// 简单的 markdown 渲染
const renderedContent = computed(() => {
  if (!content.value) return ''
  return content.value
    .replace(/# (.*)/, '<h1>$1</h1>')
    .replace(/## (.*)/, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
})

const loadContent = async () => {
  if (!currentChapter.value) return
  try {
    const response = await fetch(`/novels/${currentChapter.value.file}`)
    content.value = await response.text()
  } catch (e) {
    content.value = '加载失败'
  }
}

const prevChapter = () => {
  if (chapterIndex.value > 0) {
    router.push(`/read/${props.id}/${chapterIndex.value - 1}`)
  }
}

const nextChapter = () => {
  if (chapterIndex.value < (book.value?.chapters?.length || 0) - 1) {
    router.push(`/read/${props.id}/${chapterIndex.value + 1}`)
  }
}

// 切换沉浸模式
const toggleImmersiveMode = () => {
  isImmersiveMode.value = !isImmersiveMode.value
  // 保存用户偏好到 localStorage
  localStorage.setItem('immersiveMode', JSON.stringify(isImmersiveMode.value))
}

// 处理内容区域点击 - 点击切换沉浸模式
const handleContentClick = (event: MouseEvent) => {
  // 点击内容区域切换沉浸模式
  toggleImmersiveMode()
}

// 键盘快捷键支持
const handleKeyDown = (event: KeyboardEvent) => {
  // ESC 键退出沉浸模式
  if (event.key === 'Escape' && isImmersiveMode.value) {
    toggleImmersiveMode()
  }
  // F11 键切换沉浸模式
  if (event.key === 'F11') {
    event.preventDefault()
    toggleImmersiveMode()
  }
}

onMounted(() => {
  // 恢复用户偏好
  const savedMode = localStorage.getItem('immersiveMode')
  if (savedMode !== null) {
    isImmersiveMode.value = JSON.parse(savedMode)
  }
  
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

watch(currentChapter, loadContent, { immediate: true })
</script>

<style scoped>
/* 沉浸模式样式 */
.immersive-mode .markdown-body {
  font-size: 1.1rem;
  line-height: 1.8;
}

/* 确保过渡动画流畅 */
header, .fixed.bottom-0 {
  will-change: transform;
}

/* 沉浸模式下内容区域优化 */
.immersive-mode :deep(.markdown-body) {
  h1 {
    margin-top: 0;
  }
}

/* ========================================
   底部图标导航栏样式
   ======================================== */

/* 图标按钮基础样式 */
.nav-btn {
  @apply relative flex items-center justify-center w-11 h-11 rounded-xl cursor-pointer transition-all duration-200;
  @apply bg-miku-secondary border border-miku;
  @apply text-miku;
  @apply active:scale-95;
  @apply touch-manipulation;
  -webkit-tap-highlight-color: transparent;
}

.nav-btn:hover {
  border-color: var(--miku-primary);
  color: var(--miku-primary);
  background-color: rgba(57, 197, 187, 0.1);
}

/* 上一章/下一章特殊间距 */
.nav-btn-left {
  @apply -ml-1;
}

.nav-btn-right {
  @apply -mr-1;
}

/* 禁用状态 */
.nav-btn-disabled {
  @apply opacity-30 cursor-not-allowed pointer-events-none;
}

/* 图标尺寸 */
.nav-icon {
  @apply w-5 h-5;
  stroke-width: 1.8;
}

@media (min-width: 640px) {
  .nav-icon {
    @apply w-[1.35rem] h-[1.35rem];
  }
}

/* 工具提示 */
.nav-tooltip {
  @apply absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap;
  background-color: var(--miku-primary);
  color: white;
  @apply opacity-0 invisible;
  @apply transition-all duration-200;
  pointer-events: none;
  z-index: 200;
}

/* 工具提示箭头 */
.nav-tooltip::after {
  content: '';
  @apply absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45;
  background-color: var(--miku-primary);
}

/* 显示工具提示 */
.nav-btn:hover .nav-tooltip,
.nav-btn:focus-visible .nav-tooltip {
  @apply opacity-100 visible -top-10;
}

/* 移动端触摸优化 */
@media (hover: none) {
  .nav-btn:hover {
    border-color: var(--miku-border);
    color: var(--miku-text);
    background-color: var(--miku-bg-secondary);
  }
  
  .nav-btn:active {
    border-color: var(--miku-primary);
    color: var(--miku-primary);
    background-color: rgba(57, 197, 187, 0.2);
  }
  
  /* 移动端隐藏工具提示（触摸设备不需要hover提示） */
  .nav-tooltip {
    display: none;
  }
}

/* 小屏手机适配 */
@media (max-width: 360px) {
  .nav-btn {
    @apply w-10 h-10;
  }
  
  .nav-icon {
    width: 1.125rem;
    height: 1.125rem;
  }
}

/* 大屏幕增强 */
@media (min-width: 768px) {
  .nav-btn {
    @apply w-12 h-12;
  }
  
  .nav-icon {
    @apply w-6 h-6;
  }
}

/* 聚焦样式（无障碍支持） */
.nav-btn:focus-visible {
  @apply outline-none ring-2 ring-offset-2;
  --tw-ring-color: var(--miku-primary);
  --tw-ring-offset-color: var(--miku-bg);
}

/* 底部导航栏安全区域适配（iPhone底部横条） */
@supports (padding: max(0px)) {
  .fixed.bottom-0 {
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  }
}
</style>

<style>
@reference "tailwindcss";

.markdown-body :deep(h1) {
  @apply text-2xl mb-5;
}

.markdown-body :deep(h2) {
  @apply text-xl my-5;
}
</style>
