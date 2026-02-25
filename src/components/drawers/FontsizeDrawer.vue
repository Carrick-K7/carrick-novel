<template>
  <CDrawer :model-value="show" title="字号调节" @close="handleClose" @update:model-value="updateShow">
    <div class="fontsize-controls">
      <!-- 预览 -->
      <div class="fontsize-preview" :style="{ fontSize: size + 'px' }">
        <span>Aa</span>
        <span class="fontsize-value">{{ size }}px</span>
      </div>

      <!-- 滑块 -->
      <div class="fontsize-slider-wrapper">
        <input
          type="range"
          class="fontsize-range"
          :min="minSize"
          :max="maxSize"
          step="1"
          :value="size"
          @input="handleInput"
        />
      </div>
    </div>
  </CDrawer>
</template>

<script setup lang="ts">
import { CDrawer } from '@carrick/ui-components'

const props = defineProps<{
  show: boolean
  size: number
  minSize?: number
  maxSize?: number
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  close: []
  'update:size': [value: number]
}>()

const minSize = props.minSize ?? 12
const maxSize = props.maxSize ?? 24

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:size', parseInt(target.value, 10))
}

const handleClose = () => {
  emit('close')
}

const updateShow = (value: boolean) => {
  emit('update:show', value)
}
</script>

<style scoped>
.fontsize-controls {
  @apply space-y-6;
}

.fontsize-preview {
  @apply flex flex-col items-center justify-center gap-2 py-8;
  @apply bg-miku-secondary rounded-xl;
}

.fontsize-value {
  @apply text-sm;
  color: var(--miku-text-muted);
}

/* 字号滑块样式 */
.fontsize-slider-wrapper {
  @apply px-4 py-2;
}

.fontsize-range {
  @apply w-full h-2 rounded-full cursor-pointer;
  -webkit-appearance: none;
  appearance: none;
  background: var(--miku-bg);
  border: 1px solid var(--miku-border);
  outline: none;
}

/* Webkit (Chrome, Safari) 滑块轨道 */
.fontsize-range::-webkit-slider-runnable-track {
  @apply h-2 rounded-full;
  background: var(--miku-bg);
}

/* Webkit 滑块拇指 */
.fontsize-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  @apply w-6 h-6 -mt-2 rounded-full cursor-pointer;
  background: #39c5bb;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.fontsize-range::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 10px rgba(57, 197, 187, 0.4);
}

.fontsize-range::-webkit-slider-thumb:active {
  transform: scale(0.95);
}

/* Firefox 滑块轨道 */
.fontsize-range::-moz-range-track {
  @apply h-2 rounded-full;
  background: var(--miku-bg);
  border: 1px solid var(--miku-border);
}

/* Firefox 滑块拇指 */
.fontsize-range::-moz-range-thumb {
  @apply w-6 h-6 rounded-full cursor-pointer;
  background: #39c5bb;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.fontsize-range::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 10px rgba(57, 197, 187, 0.4);
}
</style>
