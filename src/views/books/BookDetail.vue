<template>
  <div class="book-detail">
    <header class="header">
      <router-link to="/" class="back-btn">← 返回</router-link>
      <h1>{{ book?.title }}</h1>
    </header>
    
    <div class="book-info">
      <span class="book-icon">{{ book?.icon }}</span>
      <span class="chapter-count">{{ book?.chapters?.length || 0 }} 章</span>
    </div>
    
    <div class="chapters-list">
      <router-link
        v-for="(chapter, index) in book?.chapters"
        :key="index"
        :to="`/read/${book.id}/${index}`"
        class="chapter-item"
      >
        <span class="chapter-num">{{ String(index + 1).padStart(2, '0') }}</span>
        <span class="chapter-title">{{ chapter.title }}</span>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import novelsData from '../../../public/novels.json'

const props = defineProps<{
  id: string
}>()

const book = computed(() => {
  return novelsData.novels.find(n => n.id === props.id)
})
</script>

<style scoped>
.book-detail {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.back-btn {
  color: var(--miku-primary);
  text-decoration: none;
}

.book-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 30px;
  padding: 15px;
  background: var(--miku-bg-secondary);
  border-radius: 10px;
}

.book-icon {
  font-size: 24px;
}

.chapters-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--miku-bg);
  border: 1px solid var(--miku-border);
  border-radius: 8px;
  text-decoration: none;
  color: var(--miku-text);
}

.chapter-item:hover {
  border-color: var(--miku-primary);
}

.chapter-num {
  color: var(--miku-text-muted);
  font-size: 14px;
}
</style>
