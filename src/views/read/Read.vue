<template>
  <div class="min-h-screen flex flex-col">
    <header class="fixed top-0 left-0 right-0 flex justify-between items-center px-5 py-4 bg-miku border-b border-miku z-[100]">
      <div class="flex items-center gap-4">
        <router-link to="/" class="text-miku-primary no-underline">📚 书架</router-link>
        <span class="text-miku-muted">/</span>
        <router-link :to="`/book/${id}`" class="text-miku-primary no-underline">{{ book?.title }}</router-link>
      </div>
      <span class="font-semibold">{{ currentChapter?.title }}</span>
    </header>
    
    <div class="flex-1 py-20 px-5 pb-24 max-w-3xl mx-auto w-full">
      <div v-if="content" class="markdown-body leading-relaxed text-base" v-html="renderedContent" />
      <div v-else class="text-center py-12 text-miku-muted">加载中...</div>
    </div>
    
    <div class="fixed bottom-0 left-0 right-0 flex justify-between px-5 py-4 bg-miku border-t border-miku">
      <router-link :to="`/book/${id}`" class="px-5 py-2.5 bg-miku-secondary border border-miku rounded-lg text-miku no-underline transition-colors hover:border-miku-primary">← 目录</router-link>
      
      <router-link to="/" class="px-5 py-2.5 bg-miku-secondary border border-miku rounded-lg text-miku no-underline transition-colors hover:border-miku-primary">📚 书架</router-link>
      
      <div class="flex gap-2.5">
        <button 
          :disabled="chapterIndex <= 0" 
          @click="prevChapter"
          class="px-5 py-2.5 bg-miku-secondary border border-miku rounded-lg text-miku cursor-pointer transition-colors hover:border-miku-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← 上一章
        </button>
        
        <button 
          :disabled="chapterIndex >= (book?.chapters?.length || 0) - 1" 
          @click="nextChapter"
          class="px-5 py-2.5 bg-miku-secondary border border-miku rounded-lg text-miku cursor-pointer transition-colors hover:border-miku-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下一章 →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import novelsData from '../../../public/novels.json'

const props = defineProps<{
  id: string
  chapter: string
}>()

const router = useRouter()
const content = ref('')
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

watch(currentChapter, loadContent, { immediate: true })
</script>

<style>
@reference "tailwindcss";

.markdown-body :deep(h1) {
  @apply text-2xl mb-5;
}

.markdown-body :deep(h2) {
  @apply text-xl my-5;
}
</style>
