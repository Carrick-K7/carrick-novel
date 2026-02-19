<template>
  <div class="py-10 px-5 max-w-6xl mx-auto">
    <header class="text-center mb-10">
      <h1 class="text-[32px] mb-2.5">📚 人机AK的日常</h1>
      <p class="text-miku-muted">轻小说阅读平台</p>
    </header>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <router-link
        v-for="novel in novels"
        :key="novel.id"
        :to="`/book/${novel.id}`"
        class="flex items-center gap-4 p-5 bg-miku border border-miku rounded-xl no-underline text-miku transition-all duration-200 hover:border-miku-primary hover:-translate-y-0.5"
      >
        <span class="text-[40px]">{{ novel.icon }}</span>
        <div class="flex-1">
          <h3 class="text-lg mb-1.5">{{ novel.title }}</h3>
          <span class="text-sm text-miku-muted">{{ novel.chapters.length }} 章</span>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import novelsData from '../../public/novels.json'

const novels = novelsData.novels
</script>
