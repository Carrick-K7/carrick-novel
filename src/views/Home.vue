<template>
  <div class="py-10 px-5 max-w-6xl mx-auto">
    <header class="text-center mb-10">
      <h1 class="text-[32px] mb-2.5">📚 我的书架</h1>
      <p class="text-miku-muted">轻小说阅读平台</p>
      
      <!-- PWA 安装提示 -->
      <div v-if="canInstall && !isInstalled" class="mt-4 flex justify-center">
        <button 
          @click="installPWA"
          class="flex items-center gap-2 px-4 py-2 bg-[#39c5bb] text-[#1a1a2e] rounded-lg font-medium hover:opacity-90 transition-all"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>安装到主屏幕</span>
        </button>
      </div>
      
      <!-- 已安装提示 -->
      <div v-else-if="isInstalled" class="mt-4 flex justify-center items-center gap-2 text-sm text-miku-muted">
        <svg class="w-4 h-4 text-[#39c5bb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        <span>已安装到主屏幕</span>
      </div>
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
import { usePWAInstall } from '../composables/usePWAInstall'
import novelsData from '../../public/novels.json'

const router = useRouter()
const novels = novelsData.novels
const { canInstall, isInstalled, installPWA } = usePWAInstall()

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
