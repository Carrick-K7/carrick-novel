<template>
  <CDrawer :model-value="show" title="目录" @close="handleClose" @update:model-value="updateShow">
    <div class="toc-list">
      <div
        v-for="(chapter, index) in chapters"
        :key="index"
        class="toc-item"
        :class="{ active: index === currentIndex }"
        @click="handleSelect(index)"
      >
        <span class="toc-number">第{{ index + 1 }}章</span>
        <span class="toc-name">{{ chapter.title }}</span>
      </div>
    </div>
  </CDrawer>
</template>

<script setup lang="ts">
import { CDrawer } from '@carrick/ui-components'

interface Chapter {
  title: string
  file: string
}

const props = defineProps<{
  show: boolean
  chapters: Chapter[]
  currentIndex: number
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  close: []
  select: [index: number]
}>()

const handleSelect = (index: number) => {
  emit('select', index)
  emit('close')
}

const handleClose = () => {
  emit('close')
}

const updateShow = (value: boolean) => {
  emit('update:show', value)
}
</script>

<style scoped>
.toc-list {
  @apply space-y-1;
}

.toc-item {
  @apply flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer;
  @apply transition-colors;
  @apply hover:bg-miku-secondary;
}

.toc-item.active {
  background: rgba(57, 197, 187, 0.15);
}

.toc-item.active .toc-number,
.toc-item.active .toc-name {
  color: #39c5bb;
}

.toc-number {
  @apply text-sm flex-shrink-0;
  color: var(--miku-text-muted);
}

.toc-name {
  @apply text-sm truncate;
  color: var(--miku-text);
}
</style>
