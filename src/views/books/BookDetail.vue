<template>
  <div class="p-5 max-w-3xl mx-auto">
    <header class="flex items-center gap-4 mb-5">
      <router-link to="/" class="text-miku-primary no-underline">📚 书架</router-link>
      <h1 class="text-2xl font-bold">{{ book?.title }}</h1>
    </header>
    
    <div class="flex items-center gap-2.5 mb-8 p-4 bg-miku-secondary rounded-xl">
      <span class="text-2xl">{{ book?.icon }}</span>
      <span class="text-miku-muted">{{ book?.chapters?.length || 0 }} 章</span>
      <span v-if="readCount > 0" class="text-sm text-miku-primary">· 已读 {{ readCount }} 章</span>
    </div>
    
    <!-- 当前正在阅读 -->
    <div v-if="currentChapterIndex !== null" class="mb-6">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-sm font-medium text-miku-primary">📖 当前正在阅读</span>
        <span class="text-xs text-miku-muted">({{ readProgress }}%)</span>
      </div>
      <router-link
        :to="`/read/${book.id}/${currentChapterIndex}`"
        class="flex items-center gap-2.5 p-4 bg-miku-primary/10 border-2 border-miku-primary rounded-xl no-underline transition-all hover:bg-miku-primary/20"
      >
        <span class="w-8 h-8 flex items-center justify-center bg-miku-primary text-white rounded-lg text-sm font-medium">
          {{ String(currentChapterIndex + 1).padStart(2, '0') }}
        </span>
        <span class="font-medium text-miku-primary">{{ book?.chapters?.[currentChapterIndex]?.title }}</span>
        <span class="ml-auto text-sm text-miku-primary">继续阅读 →</span>
      </router-link>
    </div>
    
    <!-- 章节列表 -->
    <div class="flex flex-col gap-2.5">
      <template v-for="(chapter, index) in book?.chapters" :key="index">
        <!-- 跳过分隔线如果当前章节在顶部显示 -->
        <div v-if="index === currentChapterIndex && shouldShowCurrentChapterInList" 
             class="border-t border-miku my-4"></div>
        
        <router-link
          v-if="shouldShowChapter(index)"
          :to="`/read/${book.id}/${index}`"
          :class="getChapterClass(index)"
        >
          <span class="text-sm w-8 text-center" :class="getChapterNumberClass(index)">
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <span :class="getChapterTitleClass(index)">{{ chapter.title }}</span>
          <!-- 已读标记 -->
          <span v-if="isChapterRead(index)" class="ml-auto text-xs text-miku-muted">✓</span>
          <!-- 当前章节标记 -->
          <span v-else-if="index === currentChapterIndex" class="ml-auto text-xs text-miku-primary font-medium">阅读中</span>
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

// 判断章节是否已读
const isChapterRead = (index: number): boolean => {
  return readingHistory.value.includes(index)
}

// 判断当前章节是否在列表中显示（如果已经在顶部显示则不重复显示）
const shouldShowCurrentChapterInList = computed(() => {
  // 当前章节总是在顶部显示，不在列表中重复显示
  return false
})

// 判断是否应该显示章节
const shouldShowChapter = (index: number): boolean => {
  // 如果当前章节已置顶，不在列表中重复显示
  if (index === currentChapterIndex.value) {
    return false
  }
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
  if (isChapterRead(index)) {
    return 'line-through opacity-60'
  }
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
  
  // 从 query 参数获取当前章节
  const chapterParam = route.query.chapter
  if (chapterParam !== undefined) {
    currentChapterIndex.value = parseInt(chapterParam as string, 10)
  } else if (readingHistory.value.length > 0) {
    // 如果没有 query 参数，使用最近阅读的章节（最后一条）
    currentChapterIndex.value = readingHistory.value[readingHistory.value.length - 1]
  }
})
</script>
