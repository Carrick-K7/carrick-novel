<template>
  <div class="read-page">
    <header class="header">
      <div class="header-left">
        <router-link :to="`/book/${id}`" class="back-btn">← 返回目录</router-link>
        <span class="book-title">{{ book?.title }}</span>
      </div>
      <span class="chapter-title">{{ currentChapter?.title }}</span>
    </header>
    
    <div class="content">
      <div v-if="content" class="markdown-body" v-html="renderedContent"></div>
      <div v-else class="loading">加载中...</div>
    </div>
    
    <div class="nav-footer">
      <button 
        :disabled="chapterIndex <= 0" 
        @click="prevChapter"
        class="nav-btn"
      >
        ← 上一章
      </button>
      
      <router-link :to="`/book/${id}`" class="nav-btn">目录</router-link>
      
      <button 
        :disabled="chapterIndex >= (book?.chapters?.length || 0) - 1" 
        @click="nextChapter"
        class="nav-btn"
      >
        下一章 →
      </button>
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

<style scoped>
.read-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: var(--miku-bg);
  border-bottom: 1px solid var(--miku-border);
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.back-btn {
  color: var(--miku-primary);
  text-decoration: none;
}

.book-title {
  color: var(--miku-text-muted);
  font-size: 14px;
}

.chapter-title {
  font-weight: 600;
}

.content {
  flex: 1;
  padding: 80px 20px 100px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.markdown-body {
  line-height: 1.8;
  font-size: 16px;
}

.markdown-body :deep(h1) {
  font-size: 24px;
  margin-bottom: 20px;
}

.markdown-body :deep(h2) {
  font-size: 20px;
  margin: 20px 0 15px;
}

.loading {
  text-align: center;
  padding: 50px;
  color: var(--miku-text-muted);
}

.nav-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 15px 20px;
  background: var(--miku-bg);
  border-top: 1px solid var(--miku-border);
}

.nav-btn {
  padding: 10px 20px;
  background: var(--miku-bg-secondary);
  border: 1px solid var(--miku-border);
  border-radius: 8px;
  color: var(--miku-text);
  text-decoration: none;
  cursor: pointer;
}

.nav-btn:hover:not(:disabled) {
  border-color: var(--miku-primary);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
