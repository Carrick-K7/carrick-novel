<template>
  <CDrawer :model-value="show" title="自动播放" @close="handleClose" @update:model-value="updateShow">
    <div class="autoplay-controls">
      <!-- 速度选择 -->
      <div class="speed-section">
        <span class="section-label">播放速度</span>
        <div class="speed-selector">
          <button
            class="speed-btn"
            :class="{ active: speed === 'slow' }"
            @click="handleSpeedChange('slow')"
          >
            <span class="speed-name">慢</span>
            <span class="speed-value">5秒</span>
          </button>
          <button
            class="speed-btn"
            :class="{ active: speed === 'medium' }"
            @click="handleSpeedChange('medium')"
          >
            <span class="speed-name">中</span>
            <span class="speed-value">3秒</span>
          </button>
          <button
            class="speed-btn"
            :class="{ active: speed === 'fast' }"
            @click="handleSpeedChange('fast')"
          >
            <span class="speed-name">快</span>
            <span class="speed-value">1.5秒</span>
          </button>
        </div>
      </div>

      <!-- 播放控制 -->
      <div class="play-control-section">
        <button class="play-toggle-btn" @click="handleToggle">
          <Play v-if="!isPlaying" class="w-6 h-6" />
          <Pause v-else class="w-6 h-6" />
          <span>{{ isPlaying ? '暂停播放' : '开始播放' }}</span>
        </button>
      </div>
    </div>
  </CDrawer>
</template>

<script setup lang="ts">
import { CDrawer } from '@carrick/ui-components'
import { Play, Pause } from 'lucide-vue-next'

type SpeedType = 'slow' | 'medium' | 'fast'

const props = defineProps<{
  show: boolean
  speed: SpeedType
  isPlaying: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  close: []
  'update:speed': [value: SpeedType]
  toggle: []
}>()

const handleSpeedChange = (newSpeed: SpeedType) => {
  emit('update:speed', newSpeed)
}

const handleToggle = () => {
  emit('toggle')
}

const handleClose = () => {
  emit('close')
}

const updateShow = (value: boolean) => {
  emit('update:show', value)
}
</script>

<style scoped>
.autoplay-controls {
  @apply space-y-6;
}

.speed-section {
  @apply space-y-3;
}

.section-label {
  @apply text-sm font-medium block;
  color: var(--miku-text-muted);
}

.speed-selector {
  @apply grid grid-cols-3 gap-3;
}

.speed-btn {
  @apply flex flex-col items-center gap-1 p-4 rounded-xl;
  @apply border border-miku;
  @apply bg-miku-secondary;
  @apply transition-all;
}

.speed-btn:hover {
  border-color: var(--miku-primary);
}

.speed-btn.active {
  background: rgba(57, 197, 187, 0.15);
  border-color: #39c5bb;
}

.speed-btn .speed-name {
  @apply text-base font-semibold;
  color: var(--miku-text);
}

.speed-btn.active .speed-name {
  color: #39c5bb;
}

.speed-btn .speed-value {
  @apply text-xs;
  color: var(--miku-text-muted);
}

.speed-btn.active .speed-value {
  color: #39c5bb;
}

.play-control-section {
  @apply pt-2;
}

.play-toggle-btn {
  @apply w-full flex items-center justify-center gap-2 py-4 rounded-xl;
  @apply font-semibold text-white;
  background: #39c5bb;
  @apply transition-all;
}

.play-toggle-btn:hover {
  opacity: 0.9;
}

.play-toggle-btn:active {
  transform: scale(0.98);
}
</style>
