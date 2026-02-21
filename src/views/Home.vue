<template>
  <div class="py-10 px-5 max-w-6xl mx-auto">
    <header class="text-center mb-10">
      <h1 class="text-[32px] mb-2.5">📚 我的书架</h1>
      <p class="text-miku-muted">轻小说阅读平台</p>
    </header>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="novel in novels"
        :key="novel.id"
        @click="goToBook(novel.id)"
        class="flex items-center gap-4 p-5 bg-miku border border-miku rounded-xl no-underline text-miku transition-all duration-200 hover:border-miku-primary hover:-translate-y-0.5 cursor-pointer"
      >
        <span class="text-[40px]">{{ novel.icon }}</span>
        <div class="flex-1">
          <h3 class="text-lg mb-1.5">{{ novel.title }}</h3>
          <span class="text-sm text-miku-muted">{{ novel.chapters.length }} 章</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import novelsData from '../../public/novels.json'

const router = useRouter()
const novels = novelsData.novels

// 点击书本：有阅读记录则进入最近阅读章节，否则进入目录页
const goToBook = (bookId: string) => {
  const history = JSON.parse(localStorage.getItem(`reading_history_${bookId}`) || '[]')
  if (history.length > 0) {
    const lastChapter = history[history.length - 1]
    // URL使用1-based索引，存储的是0-based，需要+1
    router.push(`/read/${bookId}/${lastChapter + 1}`)
  } else {
    router.push(`/book/${bookId}`)
  }
}
</script>
