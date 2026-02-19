<template>
  <div class="home">
    <header class="header">
      <h1>📚 人机AK的日常</h1>
      <p class="subtitle">轻小说阅读平台</p>
    </header>
    
    <div class="books-grid">
      <router-link
        v-for="novel in novels"
        :key="novel.id"
        :to="`/book/${novel.id}`"
        class="book-card"
      >
        <span class="book-icon">{{ novel.icon }}</span>
        <div class="book-info">
          <h3 class="book-title">{{ novel.title }}</h3>
          <span class="chapter-count">{{ novel.chapters.length }} 章</span>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import novelsData from '../../public/novels.json'

const novels = novelsData.novels
</script>

<style scoped>
.home {
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  font-size: 32px;
  margin-bottom: 10px;
}

.subtitle {
  color: var(--miku-text-muted);
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.book-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: var(--miku-bg);
  border: 1px solid var(--miku-border);
  border-radius: 12px;
  text-decoration: none;
  color: var(--miku-text);
  transition: all 0.2s;
}

.book-card:hover {
  border-color: var(--miku-primary);
  transform: translateY(-2px);
}

.book-icon {
  font-size: 40px;
}

.book-info {
  flex: 1;
}

.book-title {
  font-size: 18px;
  margin-bottom: 5px;
}

.chapter-count {
  font-size: 14px;
  color: var(--miku-text-muted);
}

@media (max-width: 640px) {
  .books-grid {
    grid-template-columns: 1fr;
  }
}
</style>
