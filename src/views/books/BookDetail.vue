<template>
  <div class="p-5 max-w-3xl mx-auto">
    <header class="flex items-center gap-4 mb-5">
      <router-link to="/" class="text-miku-primary no-underline flex items-center gap-1 hover:opacity-80">
        <Library class="w-4 h-4" />
        <span>书架</span>
      </router-link>
      <ChevronRight class="w-4 h-4 text-miku-muted" />
      <h1 class="text-2xl font-bold">{{ book?.title }}</h1>
    </header>

    <!-- 当前正在阅读 -->
    <div v-if="currentChapterIndex !== null" class="mb-6">
      <!-- 进度提示 -->
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-miku-muted flex items-center gap-1">
          <BookOpen class="w-3 h-3" />
          当前阅读进度
        </span>
        <span class="text-xs text-miku-primary">已读 {{ readCount }}/{{ book?.chapters?.length || 0 }} 章</span>
      </div>
      <!-- 当前章节行 -->
      <router-link
        :to="book ? `/read/${book.id}/${currentChapterIndex + 1}` : '/'"
        class="flex items-center gap-3 py-3 px-1 border-b border-miku no-underline group"
      >
        <span class="text-sm font-medium text-miku-primary tabular-nums">
          第{{ String(currentChapterIndex + 1).padStart(2, '0') }}章
        </span>
        <span class="flex-1 text-sm text-miku truncate">{{ book?.chapters?.[currentChapterIndex]?.title }}</span>
        <span class="text-xs text-miku-primary group-hover:underline shrink-0 flex items-center gap-1">
          <span>继续阅读</span>
          <ArrowRight class="w-3 h-3" />
        </span>
      </router-link>
    </div>

    <!-- 章节列表 -->
    <div class="flex flex-col gap-2.5">
      <template v-for="(chapter, index) in book?.chapters" :key="index">
        <router-link
          :to="book ? `/read/${book.id}/${index + 1}` : '/'"
          :class="getChapterClass(index)"
        >
          <span class="text-sm w-8 text-center" :class="getChapterNumberClass(index)">
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <span :class="getChapterTitleClass(index)">{{ chapter.title }}</span>
          <!-- 最近阅读章节显示"阅读中" -->
          <span v-if="isCurrentChapter(index)" class="ml-auto text-xs bg-miku-primary text-white px-2 py-0.5 rounded font-medium flex items-center gap-1">
            <Play class="w-2.5 h-2.5" />
            阅读中
          </span>
          <!-- 其他已读章节显示"已读" -->
          <span v-else-if="isChapterRead(index)" class="ml-auto text-xs bg-miku-primary/20 text-miku-primary px-2 py-0.5 rounded flex items-center gap-1">
            <Check class="w-2.5 h-2.5" />
            已读
          </span>
        </router-link>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Library, ChevronRight, BookOpen, ArrowRight, Play, Check } from 'lucide-vue-next'
import novelsData from '../../../public/novels.json'

const props = defineProps<{ id: string }>()
const route = useRoute()

const book = computed(() => novelsData.novels.find(n => n.id === props.id))
const currentChapterIndex = ref<number | null>(null)
const readingHistory = ref<number[]>([])
const readCount = computed(() => readingHistory.value.length)

const isChapterRead = (index: number): boolean => {
  return readingHistory.value.includes(index) && index !== currentChapterIndex.value
}

const isCurrentChapter = (index: number): boolean => {
  return index === currentChapterIndex.value
}

const getChapterClass = (index: number): string => {
  const baseClass = 'flex items-center gap-2.5 p-3 border rounded-lg no-underline transition-all'
  if (isChapterRead(index)) {
    return `${baseClass} bg-miku-secondary/50 border-miku text-miku-muted hover:border-miku-primary`
  }
  return `${baseClass} bg-miku border-miku text-miku hover:border-miku-primary`
}

const getChapterNumberClass = (_index: number): string => 'text-miku-muted'
const getChapterTitleClass = (_index: number): string => ''

const loadReadingHistory = () => {
  const historyKey = `reading_history_${props.id}`
  const history = JSON.parse(localStorage.getItem(historyKey) || '[]')
  readingHistory.value = history
}

onMounted(() => {
  loadReadingHistory()
  const chapterParam = route.query.chapter
  if (chapterParam !== undefined) {
    currentChapterIndex.value = parseInt(chapterParam as string, 10) - 1
  } else if (readingHistory.value.length > 0) {
    currentChapterIndex.value = readingHistory.value[readingHistory.value.length - 1]
  }
})
</script>
