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
    
    <!-- 底部按钮栏 -->
    <div 
      class="fixed bottom-0 left-0 right-0 flex justify-between items-center px-3 py-3 bg-miku border-t border-miku gap-2 transition-transform duration-300"
      :class="isImmersiveMode ? 'translate-y-full' : 'translate-y-0'"
    >
      <router-link :to="`/book/${id}`" class="px-3 py-2 bg-miku-secondary border border-miku rounded-lg text-miku no-underline transition-colors hover:border-miku-primary text-sm whitespace-nowrap">目录</router-link>
      
      <router-link to="/" class="px-3 py-2 bg-miku-secondary border border-miku rounded-lg text-miku no-underline transition-colors hover:border-miku-primary text-sm whitespace-nowrap">书架</router-link>
      
      <div class="flex gap-2">
        <button 
          :disabled="chapterIndex <= 0" 
          @click="prevChapter"
          class="px-3 py-2 bg-miku-secondary border border-miku rounded-lg text-miku cursor-pointer transition-colors hover:border-miku-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
        >
          上章
        </button>
        
        <button 
          :disabled="chapterIndex >= (book?.chapters?.length || 0) - 1" 
          @click="nextChapter"
          class="px-3 py-2 bg-miku-secondary border border-miku rounded-lg text-miku cursor-pointer transition-colors hover:border-miku-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
        >
          下章
        </button>
      </div>
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
