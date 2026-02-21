<template>
  <div class="p-5 max-w-3xl mx-auto">
    <header class="flex items-center gap-4 mb-5">
      <router-link to="/" class="text-miku-primary no-underline">📚 书架</router-link>
      <h1 class="text-2xl font-bold">{{ book?.title }}</h1>
    </header>
    
    <!-- 当前正在阅读 -->
    <div v-if="currentChapterIndex !== null" class="mb-6">
      <!-- 进度提示 -->
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-miku-muted">📖 当前阅读进度</span>
        <span class="text-xs text-miku-primary">已读 {{ readCount }}/{{ book?.chapters?.length || 0 }} 章</span>
      </div>
      <!-- 当前章节行 -->
      <router-link
        :to="`/read/${book.id}/${currentChapterIndex + 1}`"
        class="flex items-center gap-3 py-3 px-1 border-b border-miku no-underline group"
      >
        <span class="text-sm font-medium text-miku-primary tabular-nums">
          第{{ String(currentChapterIndex + 1).padStart(2, '0') }}章
        </span>
        <span class="flex-1 text-sm text-miku truncate">{{ book?.chapters?.[currentChapterIndex]?.title }}</span>
        <span class="text-xs text-miku-primary group-hover:underline shrink-0">继续阅读</span>
      </router-link>
    </div>
    
    <!-- 章节列表 -->
    <div class="flex flex-col gap-2.5">
      <template v-for="(chapter, index) in book?.chapters" :key="index">
          <router-link
          :to="`/read/${book.id}/${index + 1}`"
          :class="getChapterClass(index)"
        >
          <span class="text-sm w-8 text-center" :class="getChapterNumberClass(index)">
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <span :class="getChapterTitleClass(index)">{{ chapter.title }}</span>
          <!-- 最近阅读章节显示"阅读中" -->
          <span v-if="isCurrentChapter(index)" class="ml-auto text-xs bg-miku-primary text-white px-2 py-0.5 rounded font-medium">阅读中</span>
          <!-- 其他已读章节显示"已读" -->
          <span v-else-if="isChapterRead(index)" class="ml-auto text-xs bg-miku-primary/20 text-miku-primary px-2 py-0.5 rounded">已读</span>
        </router-link>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import novelsData from '../../../public/novels.json'

const props = defineProps<{
  id: string
}>()

const route = useRoute()

const book = computed(() => {
  return novelsData.novels.find(n => n.id === props.id)
})

// 当前章节索引（从 query 参数或 localStorage 获取）
const currentChapterIndex = ref<number | null>(null)

// 阅读历史
const readingHistory = ref<number[]>([])

// 计算阅读进度
const readProgress = computed(() => {
  if (!book.value?.chapters?.length) return 0
  return Math.round((readingHistory.value.length / book.value.chapters.length) * 100)
})

// 已读章节数
const readCount = computed(() => readingHistory.value.length)

// 判断章节是否已读（排除当前阅读中的章节）
const isChapterRead = (index: number): boolean => {
  return readingHistory.value.includes(index) && index !== currentChapterIndex.value
}

// 判断是否为当前正在阅读的章节
const isCurrentChapter = (index: number): boolean => {
  return index === currentChapterIndex.value
}

// 判断是否应该显示章节
const shouldShowChapter = (index: number): boolean => {
  return true
}

// 获取章节样式
const getChapterClass = (index: number): string => {
  const baseClass = 'flex items-center gap-2.5 p-3 border rounded-lg no-underline transition-all'
  
  if (isChapterRead(index)) {
    // 已读章节：淡色背景
    return `${baseClass} bg-miku-secondary/50 border-miku text-miku-muted hover:border-miku-primary`
  }
  
  // 未读章节：默认样式
  return `${baseClass} bg-miku border-miku text-miku hover:border-miku-primary`
}

// 获取章节编号样式
const getChapterNumberClass = (index: number): string => {
  if (isChapterRead(index)) {
    return 'text-miku-muted'
  }
  return 'text-miku-muted'
}

// 获取章节标题样式
const getChapterTitleClass = (index: number): string => {
  // 已移除删除线样式，统一使用正常文字样式
  // 已读状态通过背景色和"已读"标签区分
  return ''
}

// 加载阅读历史
const loadReadingHistory = () => {
  const historyKey = `reading_history_${props.id}`
  const history = JSON.parse(localStorage.getItem(historyKey) || '[]')
  readingHistory.value = history
}

// 初始化
onMounted(() => {
  loadReadingHistory()
  
  // 从 query 参数获取当前章节（URL使用1-based索引，内部使用0-based）
  const chapterParam = route.query.chapter
  if (chapterParam !== undefined) {
    currentChapterIndex.value = parseInt(chapterParam as string, 10) - 1
  } else if (readingHistory.value.length > 0) {
    // 如果没有 query 参数，使用最近阅读的章节（最后一条）
    currentChapterIndex.value = readingHistory.value[readingHistory.value.length - 1]
  }
})
</script>
