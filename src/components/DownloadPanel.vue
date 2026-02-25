<template>
  <CDrawer v-model="isVisible" title="批量下载" @close="close">
    <div class="download-content">
      <!-- 章节选择 -->
      <div class="select-section">
        <div class="select-row">
          <span class="select-label">从</span>
          <select v-model="startChapter" class="chapter-select">
            <option v-for="(ch, idx) in chapters" :key="idx" :value="idx">
              {{ formatChapterTitle(ch.title, idx) }}
            </option>
          </select>
        </div>
        <div class="select-row">
          <span class="select-label">到</span>
          <select v-model="endChapter" class="chapter-select">
            <option v-for="(ch, idx) in chapters" :key="idx" :value="idx">
              {{ formatChapterTitle(ch.title, idx) }}
            </option>
          </select>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-section">
        <div class="stat-item">
          <span class="stat-label">已选择</span>
          <span class="stat-value">{{ selectedCount }} 章</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">预计大小</span>
          <span class="stat-value">≈ {{ estimatedSize }}</span>
        </div>
      </div>

      <!-- 下载进度 -->
      <div v-if="isDownloading" class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-text">{{ progressText }}</div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-section">
        <button
          class="btn-cancel"
          :disabled="isDownloading"
          @click="close"
        >
          取消
        </button>
        <button
          class="btn-download"
          :disabled="isDownloading || selectedCount === 0"
          @click="startDownload"
        >
          <Download v-if="!isDownloading" class="w-4 h-4" />
          <span>{{ isDownloading ? '下载中...' : '下载' }}</span>
        </button>
      </div>
    </div>
  </CDrawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CDrawer } from '@carrick/ui-components'
import { Download } from 'lucide-vue-next'

interface Chapter {
  title: string
  file: string
}

const props = defineProps<{
  show: boolean
  bookTitle: string
  bookId: string
  chapters: Chapter[]
  currentChapter: number
}>()

const emit = defineEmits<{
  close: []
}>()

const startChapter = ref(0)
const endChapter = ref(0)
const isDownloading = ref(false)
const downloadProgress = ref(0)
const downloadTotal = ref(0)

// 双向绑定支持
const isVisible = computed({
  get: () => props.show,
  set: () => emit('close')
})

// 监听显示状态，初始化选择
watch(() => props.show, (show) => {
  if (show) {
    startChapter.value = props.currentChapter
    endChapter.value = props.currentChapter
  }
})

// 确保结束章节 >= 开始章节
watch(startChapter, (val) => {
  if (endChapter.value < val) {
    endChapter.value = val
  }
})

watch(endChapter, (val) => {
  if (val < startChapter.value) {
    startChapter.value = val
  }
})

const selectedCount = computed(() => {
  return endChapter.value - startChapter.value + 1
})

const estimatedSize = computed(() => {
  // 估算每章约 2-5KB，取中间值
  const size = selectedCount.value * 3.5
  if (size < 1024) {
    return `${Math.round(size)}KB`
  }
  return `${(size / 1024).toFixed(1)}MB`
})

const progressPercent = computed(() => {
  if (downloadTotal.value === 0) return 0
  return Math.round((downloadProgress.value / downloadTotal.value) * 100)
})

const progressText = computed(() => {
  return `${downloadProgress.value} / ${downloadTotal.value} 章`
})

const formatChapterTitle = (title: string, _index: number) => {
  // 简化章节标题显示
  const match = title.match(/第(\d+)章/)
  if (match) {
    return `第 ${match[1].padStart(3, '0')} 章`
  }
  return title.length > 15 ? title.slice(0, 15) + '...' : title
}

const close = () => {
  if (!isDownloading.value) {
    emit('close')
  }
}

// 获取章节内容
const fetchChapterContent = async (chapter: Chapter): Promise<string> => {
  try {
    const response = await fetch(`/novels/${chapter.file}`)
    if (!response.ok) throw new Error('Failed to fetch')
    return await response.text()
  } catch (e) {
    console.error(`Failed to fetch chapter: ${chapter.title}`, e)
    return `[加载失败: ${chapter.title}]`
  }
}

const startDownload = async () => {
  if (isDownloading.value || selectedCount.value === 0) return

  isDownloading.value = true
  downloadProgress.value = 0
  downloadTotal.value = selectedCount.value

  try {
    // 构建TXT内容
    let content = `${props.bookTitle}\n\n`
    content += `========================================\n`
    content += `本文件包含第 ${startChapter.value + 1} 章 至 第 ${endChapter.value + 1} 章\n`
    content += `========================================\n\n`

    // 逐章获取内容
    const selectedChapters = props.chapters.slice(startChapter.value, endChapter.value + 1)

    for (let i = 0; i < selectedChapters.length; i++) {
      const chapter = selectedChapters[i]
      const chapterContent = await fetchChapterContent(chapter)

      content += `\n${chapter.title}\n`
      content += `----------------------------------------\n\n`
      content += chapterContent
      content += `\n\n`

      downloadProgress.value = i + 1

      // 小延迟让UI更新
      if (i < selectedChapters.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }

    content += `\n\n========================================\n`
    content += `全文完\n`
    content += `========================================\n`

    // 生成并下载文件
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.bookTitle}_第${startChapter.value + 1}-${endChapter.value + 1}章.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // 显示成功提示
    showToast('下载完成！')

    // 延迟关闭
    setTimeout(() => {
      isDownloading.value = false
      emit('close')
    }, 500)

  } catch (e) {
    console.error('Download failed:', e)
    showToast('下载失败，请重试')
    isDownloading.value = false
  }
}

const showToast = (message: string) => {
  const toast = document.createElement('div')
  toast.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-3 bg-black/80 text-white rounded-lg z-[200] text-sm'
  toast.textContent = message
  document.body.appendChild(toast)
  setTimeout(() => {
    toast.remove()
  }, 2000)
}
</script>

<style scoped>
.download-content {
  @apply space-y-4;
}

/* 章节选择区域 */
.select-section {
  @apply space-y-3;
}

.select-row {
  @apply flex items-center gap-3;
}

.select-label {
  @apply text-sm font-medium w-8;
  color: var(--miku-text-muted);
}

.chapter-select {
  @apply flex-1 px-3 py-2.5 rounded-lg text-sm;
  @apply bg-miku-secondary border border-miku;
  @apply text-miku-primary;
  @apply appearance-none cursor-pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2339c5bb'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1.25rem;
  padding-right: 2rem;
}

.chapter-select:focus {
  @apply outline-none ring-2;
  --tw-ring-color: #39c5bb;
}

/* 统计信息区域 */
.stats-section {
  @apply flex gap-6 p-4 rounded-xl;
  background: rgba(57, 197, 187, 0.08);
}

.stat-item {
  @apply flex flex-col gap-1;
}

.stat-label {
  @apply text-xs;
  color: var(--miku-text-muted);
}

.stat-value {
  @apply text-sm font-semibold;
  color: #39c5bb;
}

/* 进度条区域 */
.progress-section {
  @apply py-2;
}

.progress-bar {
  @apply w-full h-2 rounded-full overflow-hidden mb-2;
  background: var(--miku-bg);
  border: 1px solid var(--miku-border);
}

.progress-fill {
  @apply h-full rounded-full transition-all duration-300;
  background: #39c5bb;
}

.progress-text {
  @apply text-xs text-center;
  color: var(--miku-text-muted);
}

/* 操作按钮区域 */
.action-section {
  @apply flex gap-3 pt-2;
}

.btn-cancel,
.btn-download {
  @apply flex-1 flex items-center justify-center gap-2 py-3 rounded-xl;
  @apply font-semibold text-sm;
  @apply transition-all;
  @apply active:scale-[0.98];
}

.btn-cancel {
  @apply bg-miku-secondary text-miku-primary;
  @apply border border-miku;
}

.btn-cancel:hover:not(:disabled) {
  opacity: 0.8;
}

.btn-download {
  background: #39c5bb;
  color: white;
}

.btn-download:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-download:disabled,
.btn-cancel:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* 移动端优化 */
@media (max-width: 360px) {
  .chapter-select {
    @apply py-2 text-xs;
  }

  .btn-cancel,
  .btn-download {
    @apply py-2.5;
  }
}
</style>
