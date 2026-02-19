<template>
  <div class="p-5 max-w-3xl mx-auto">
    <header class="flex items-center gap-4 mb-5">
      <router-link to="/" class="text-miku-primary no-underline">📚 书架</router-link>
      <h1 class="text-2xl font-bold">{{ book?.title }}</h1>
    </header>
    
    <div class="flex items-center gap-2.5 mb-8 p-4 bg-miku-secondary rounded-xl">
      <span class="text-2xl">{{ book?.icon }}</span>
      <span class="text-miku-muted">{{ book?.chapters?.length || 0 }} 章</span>
    </div>
    
    <div class="flex flex-col gap-2.5">
      <router-link
        v-for="(chapter, index) in book?.chapters"
        :key="index"
        :to="`/read/${book.id}/${index}`"
        class="flex items-center gap-2.5 p-3 bg-miku border border-miku rounded-lg no-underline text-miku hover:border-miku-primary"
      >
        <span class="text-sm text-miku-muted">{{ String(index + 1).padStart(2, '0') }}</span>
        <span>{{ chapter.title }}</span>
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
