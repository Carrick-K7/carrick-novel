<template>
  <div 
    class="min-h-screen flex flex-col relative" 
    :class="{ 'immersive-mode': isImmersiveMode }"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- 顶部导航栏 -->
    <header
      class="fixed top-0 left-0 right-0 flex items-center gap-3 px-4 py-3 bg-miku border-b border-miku z-[100] transition-transform duration-300 cursor-pointer hover:opacity-80"
      :class="isImmersiveMode ? '-translate-y-full' : 'translate-y-0'"
      @click="$router.push('/')"
      title="返回书架"
    >
      <ChevronLeft class="text-miku-primary flex-shrink-0 w-5 h-5" />
      <div class="flex-1 min-w-0 flex items-center gap-2 text-sm pointer-events-none">
        <span class="truncate text-miku-primary" :title="book?.title">{{ book?.title }}</span>
        <span class="text-miku-muted flex-shrink-0">-</span>
        <span class="truncate font-semibold" :title="currentChapter?.title">{{ currentChapter?.title }}</span>
      </div>
    </header>

    <!-- 阅读区域 -->
    <div 
      class="flex-1 px-5 max-w-3xl mx-auto w-full transition-all duration-300"
      :class="isImmersiveMode ? 'py-6 pb-6' : 'py-20 pb-24'"
    >
      <Transition name="chapter-fade" mode="out-in" @enter="onChapterEnter" @after-leave="endChapterTransition">
        <!-- 加载中状态 -->
        <div v-if="isLoading" key="loading" class="loading-indicator">
          <div class="loading-spinner"></div>
          <div class="loading-text">
            <span class="loading-label">正在加载</span>
            <span class="loading-chapter-number">第 {{ chapterIndex + 1 }} 章</span>
          </div>
        </div>

        <!-- 章节过渡状态 -->
        <div v-else-if="isTransitioning" key="transitioning" class="loading-indicator">
          <div class="loading-spinner"></div>
          <div class="loading-text">
            <span class="loading-label">正在加载</span>
            <span v-if="targetChapter" class="loading-chapter-title">{{ targetChapter.title }}</span>
            <span v-else class="loading-chapter-number">第 {{ chapterIndex + 1 }} 章</span>
          </div>
        </div>

        <!-- 章节内容 -->
        <div v-else-if="content" key="content" class="chapter-content">
          <div 
            class="markdown-body leading-relaxed cursor-pointer" 
            :style="{ fontSize: fontSize + 'px', lineHeight: '1.8' }"
            v-html="renderedContent" 
            @click="handleContentClick" 
          />
        </div>

        <!-- 默认空状态 -->
        <div v-else key="empty" class="text-center py-12 text-miku-muted">
          <div class="loading-spinner mb-4"></div>
          加载中...
        </div>
      </Transition>
    </div>

    <!-- 底部图标导航栏 -->
    <div 
      class="fixed bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-miku border-t border-miku transition-transform duration-300 z-[100]"
      :class="isImmersiveMode ? 'translate-y-full' : 'translate-y-0'"
    >
      <!-- 左侧：上一章 -->
      <button 
        :disabled="chapterIndex <= 0" 
        @click="prevChapter"
        class="nav-btn nav-btn-left"
        :class="{ 'nav-btn-disabled': chapterIndex <= 0 }"
        title="上一章"
        aria-label="上一章"
      >
        <ChevronLeft class="nav-icon" />
        <span class="nav-tooltip">上一章</span>
      </button>

      <!-- 中间：目录 + 字号 + 自动播放 + 下载 -->
      <div class="flex items-center gap-1">
        <button @click="openDrawer('toc')" class="nav-btn" title="目录" aria-label="目录">
          <BookOpen class="nav-icon" />
          <span class="nav-tooltip">目录</span>
        </button>

        <button @click="openDrawer('fontsize')" class="nav-btn" title="字号" aria-label="字号">
          <Type class="nav-icon" />
          <span class="nav-tooltip">字号</span>
        </button>

        <button 
          @click="openDrawer('autoplay')" 
          class="nav-btn"
          :class="{ 'nav-btn-active': isAutoPlay }"
          title="自动播放" 
          aria-label="自动播放"
        >
          <Play v-if="!isAutoPlay" class="nav-icon" />
          <Pause v-else class="nav-icon" />
          <span class="nav-tooltip">自动播放</span>
        </button>

        <button @click="openDrawer('download')" class="nav-btn" title="批量下载" aria-label="批量下载">
          <Download class="nav-icon" />
          <span class="nav-tooltip">批量下载</span>
        </button>
      </div>

      <!-- 右侧：下一章 -->
      <button 
        :disabled="chapterIndex >= (book?.chapters?.length || 0) - 1" 
        @click="nextChapter"
        class="nav-btn nav-btn-right"
        :class="{ 'nav-btn-disabled': chapterIndex >= (book?.chapters?.length || 0) - 1 }"
        title="下一章"
        aria-label="下一章"
      >
        <ChevronRight class="nav-icon" />
        <span class="nav-tooltip">下一章</span>
      </button>
    </div>

    <!-- 滑动提示遮罩 -->
    <Transition name="fade-overlay">
      <div v-if="showSwipeHint" class="swipe-hint-overlay" :class="swipeHintDirection">
        <div class="swipe-hint-icon">
          <ChevronRight v-if="swipeHintDirection === 'left'" class="w-16 h-16" />
          <ChevronLeft v-else class="w-16 h-16" />
        </div>
        <div class="swipe-hint-text">{{ swipeHintDirection === 'left' ? '下一章' : '上一章' }}</div>
      </div>
    </Transition>

    <!-- 上拉加载提示 -->
    <Transition name="fade-overlay">
      <div v-if="showPullUpHint" class="pull-up-hint-overlay">
        <div class="pull-up-hint-content">
          <ArrowDown class="w-8 h-8 animate-bounce" />
          <span class="pull-up-hint-text">释放加载下一章</span>
        </div>
      </div>
    </Transition>

    <!-- 沉浸模式悬浮退出按钮 -->
    <button
      v-if="isImmersiveMode"
      @click="toggleImmersiveMode"
      class="fixed bottom-4 right-4 z-[101] w-10 h-10 bg-miku-secondary/90 border border-miku rounded-full flex items-center justify-center text-miku-primary hover:bg-miku-primary hover:text-white transition-all duration-300 shadow-lg opacity-0 hover:opacity-100 focus:opacity-100"
      title="退出沉浸模式"
    >
      <Maximize2 class="w-4 h-4" />
    </button>

    <!-- 回到顶部按钮 -->
    <button
      class="fixed right-5 z-[110] w-12 h-12 rounded-full bg-miku-primary text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl"
      :class="{
        'opacity-0 translate-y-4 pointer-events-none': !showBackToTop,
        'opacity-100 translate-y-0': showBackToTop,
        'bottom-5': isImmersiveMode,
        'bottom-[80px]': !isImmersiveMode
      }"
      @click="scrollToTop"
      title="回到顶部"
      aria-label="回到顶部"
    >
      <ArrowUp class="w-6 h-6" />
    </button>

    <!-- 抽屉组件 -->
    <TocDrawer
      v-model:show="drawerState.toc"
      :chapters="book?.chapters || []"
      :current-index="chapterIndex"
      @select="goToChapter"
      @close="closeDrawer"
    />

    <AutoplayDrawer
      v-model:show="drawerState.autoplay"
      v-model:speed="autoPlaySpeed"
      :is-playing="isAutoPlay"
      @toggle="toggleAutoPlay"
      @close="closeDrawer"
    />

    <FontsizeDrawer
      v-model:show="drawerState.fontsize"
      v-model:size="fontSize"
      :min-size="MIN_FONT_SIZE"
      :max-size="MAX_FONT_SIZE"
      @close="closeDrawer"
    />

    <DownloadPanel
      :show="drawerState.download"
      :book-title="book?.title || ''"
      :book-id="props.id"
      :chapters="book?.chapters || []"
      :current-chapter="chapterIndex"
      @close="closeDrawer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ChevronLeft, ChevronRight, BookOpen, Type, Play, Pause, 
  Download, ArrowDown, ArrowUp, Maximize2 
} from 'lucide-vue-next'
import novelsData from '../../../public/novels.json'
import DownloadPanel from '../../components/DownloadPanel.vue'
import TocDrawer from '../../components/drawers/TocDrawer.vue'
import AutoplayDrawer from '../../components/drawers/AutoplayDrawer.vue'
import FontsizeDrawer from '../../components/drawers/FontsizeDrawer.vue'

// ============ 常量 ============
const DEFAULT_FONT_SIZE = 16
const MIN_FONT_SIZE = 12
const MAX_FONT_SIZE = 24
const FONT_SIZE_KEY = 'novel_reader_font_size'
const AUTOPLAY_KEY = 'novel_reader_autoplay'
const AUTOPLAY_SPEED_KEY = 'novel_reader_autoplay_speed'
const SCROLL_THRESHOLD = 300
const HIDE_DELAY = 2000
const swipeThreshold = 50
const swipeMaxVertical = 80
const swipeMinDuration = 50
const pullUpThreshold = 80

const speedMap = { slow: 5000, medium: 3000, fast: 1500 }

// ============ Props ============
const props = defineProps<{ id: string; chapter: string }>()
const router = useRouter()

// ============ 状态 ============
type DrawerType = 'toc' | 'autoplay' | 'fontsize' | 'download'
const drawerState = reactive<Record<DrawerType, boolean>>({
  toc: false, autoplay: false, fontsize: false, download: false
})

const content = ref('')
const isLoading = ref(false)
const isTransitioning = ref(false)
const transitionDirection = ref<'left' | 'right' | null>(null)
const isImmersiveMode = ref(false)
const showBackToTop = ref(false)
const fontSize = ref(DEFAULT_FONT_SIZE)
const isAutoPlay = ref(false)
const autoPlaySpeed = ref<'slow' | 'medium' | 'fast'>('medium')
const autoPlayTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const isAtBottom = ref(false)
const scrollTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const showSwipeHint = ref(false)
const swipeHintDirection = ref<'left' | 'right' | null>(null)
const showPullUpHint = ref(false)
const touchStart = ref({ x: 0, y: 0, time: 0 })
const touchEnd = ref({ x: 0, y: 0, time: 0 })
const isSwiping = ref(false)
const isPullingUp = ref(false)

// ============ 计算属性 ============
const chapterIndex = computed(() => Math.max(0, (parseInt(props.chapter) || 0) - 1))
const book = computed(() => novelsData.novels.find(n => n.id === props.id))
const currentChapter = computed(() => book.value?.chapters?.[chapterIndex.value])
const targetChapter = computed(() => {
  if (!isTransitioning.value || !transitionDirection.value) return null
  const targetIndex = transitionDirection.value === 'left' ? chapterIndex.value - 1 : chapterIndex.value + 1
  return book.value?.chapters?.[targetIndex] || null
})

const renderedContent = computed(() => {
  if (!content.value) return ''
  let html = content.value
    .replace(/# (.*)/, '<h1>$1</h1>')
    .replace(/## (.*)/, '<h2>$1</h2>')
  html = html.replace(/^(\*\*【场景[：:].*?】\*\*)$/gm, '<div style="color: #39c5bb; font-weight: bold; margin: 1em 0;">$1</div>')
  html = html.replace(/^(## 场景[一二三四五六七八九十\d]+[：:].+)$/gm, '<h2 style="color: #39c5bb;">$1</h2>')
  html = html.replace(/^(\*\*【第\d+章[·\s]?完】\*\*)$/gm, '<div style="color: #39c5bb; text-align: center; font-size: 1.2em; margin: 2em 0;">$1</div>')
  html = html.replace(/^(\*\*[（(]第\d+章\s*完[）)]\*\*)$/gm, '<div style="color: #39c5bb; text-align: center; font-size: 1.2em; margin: 2em 0;">$1</div>')
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/^(---|\*\*\*)\n*$/gm, '<hr style="border: none; border-top: 1px solid #39c5bb; margin: 2em 0;">')
  html = html.replace(/\n/g, '<br>')
  html = html.replace(/(<hr[^\u003e]*>)<br>*/g, '$1')
  html = html.replace(/(<div style="color: #39c5bb[^"]*">.*?)<\/div><br>*/g, '$1</div>')
  html = html.replace(/(<div style="color: #39c5bb; text-align: center[^"]*">.*?)<\/div><br>*/g, '$1</div>')
  return html
})

// ============ 抽屉控制 ============
const openDrawer = (type: DrawerType) => { drawerState[type] = true }
const closeDrawer = () => { Object.keys(drawerState).forEach(k => drawerState[k as DrawerType] = false) }
const goToChapter = (index: number) => {
  closeDrawer()
  if (index !== chapterIndex.value) router.push(`/read/${props.id}/${index + 1}`)
}

// ============ 字号 ============
const loadFontSize = () => {
  const saved = localStorage.getItem(FONT_SIZE_KEY)
  if (saved) {
    const size = parseInt(saved, 10)
    if (!isNaN(size) && size >= MIN_FONT_SIZE && size <= MAX_FONT_SIZE) fontSize.value = size
  }
}
watch(fontSize, () => localStorage.setItem(FONT_SIZE_KEY, fontSize.value.toString()))

// ============ 自动播放 ============
const loadAutoPlaySettings = () => {
  const savedAutoPlay = localStorage.getItem(AUTOPLAY_KEY)
  if (savedAutoPlay !== null) isAutoPlay.value = JSON.parse(savedAutoPlay)
  const savedSpeed = localStorage.getItem(AUTOPLAY_SPEED_KEY)
  if (savedSpeed !== null && ['slow', 'medium', 'fast'].includes(savedSpeed)) {
    autoPlaySpeed.value = savedSpeed as 'slow' | 'medium' | 'fast'
  }
}
const saveAutoPlaySettings = () => {
  localStorage.setItem(AUTOPLAY_KEY, JSON.stringify(isAutoPlay.value))
  localStorage.setItem(AUTOPLAY_SPEED_KEY, autoPlaySpeed.value)
}
const toggleAutoPlay = () => {
  isAutoPlay.value = !isAutoPlay.value
  saveAutoPlaySettings()
  if (isAutoPlay.value) {
    checkIfAtBottom()
    if (isAtBottom.value) startAutoPlayTimer()
  } else {
    clearAutoPlayTimer()
  }
}
const startAutoPlayTimer = () => {
  clearAutoPlayTimer()
  if (chapterIndex.value < (book.value?.chapters?.length || 0) - 1) {
    autoPlayTimer.value = setTimeout(() => nextChapter(), speedMap[autoPlaySpeed.value])
  }
}
const clearAutoPlayTimer = () => {
  if (autoPlayTimer.value) { clearTimeout(autoPlayTimer.value); autoPlayTimer.value = null }
}
const checkIfAtBottom = () => {
  const scrollTop = window.scrollY
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  const atBottom = scrollTop + windowHeight >= documentHeight - 50
  if (atBottom && !isAtBottom.value && isAutoPlay.value) { isAtBottom.value = true; startAutoPlayTimer() }
  else if (!atBottom && isAtBottom.value) { isAtBottom.value = false; clearAutoPlayTimer() }
  return atBottom
}

// ============ 触摸滑动 ============
const handleTouchStart = (e: TouchEvent) => {
  const touch = e.touches[0]
  touchStart.value = { x: touch.clientX, y: touch.clientY, time: Date.now() }
  isSwiping.value = false
  isPullingUp.value = false
}
const handleTouchMove = (e: TouchEvent) => {
  const touch = e.touches[0]
  touchEnd.value = { x: touch.clientX, y: touch.clientY, time: Date.now() }
  const diffX = touchStart.value.x - touchEnd.value.x
  const diffY = touchStart.value.y - touchEnd.value.y
  const absDiffX = Math.abs(diffX)
  const absDiffY = Math.abs(diffY)

  if (absDiffX > absDiffY && absDiffX > 20 && absDiffY < swipeMaxVertical) {
    isSwiping.value = true
    if (diffX > 30 && chapterIndex.value < (book.value?.chapters?.length || 0) - 1) {
      swipeHintDirection.value = 'left'; showSwipeHint.value = true
    } else if (diffX < -30 && chapterIndex.value > 0) {
      swipeHintDirection.value = 'right'; showSwipeHint.value = true
    } else { showSwipeHint.value = false }
  }

  const scrollTop = window.scrollY
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  const atBottom = scrollTop + windowHeight >= documentHeight - 10
  if (atBottom && diffY < -30 && chapterIndex.value < (book.value?.chapters?.length || 0) - 1) {
    isPullingUp.value = true
    showPullUpHint.value = Math.abs(diffY) > pullUpThreshold
  } else if (!atBottom) { showPullUpHint.value = false; isPullingUp.value = false }
}
const handleTouchEnd = () => {
  if (drawerState.fontsize) {
    showSwipeHint.value = false; showPullUpHint.value = false; isSwiping.value = false; isPullingUp.value = false
    return
  }
  showSwipeHint.value = false; showPullUpHint.value = false
  handleSwipe()
  isSwiping.value = false; isPullingUp.value = false
}
const handleSwipe = () => {
  if (drawerState.fontsize) return
  const diffX = touchStart.value.x - touchEnd.value.x
  const diffY = touchStart.value.y - touchEnd.value.y
  const absDiffX = Math.abs(diffX)
  const absDiffY = Math.abs(diffY)
  const duration = touchEnd.value.time - touchStart.value.time

  if (duration < swipeMinDuration) return

  if (absDiffX > absDiffY && absDiffX > swipeThreshold && absDiffY < swipeMaxVertical) {
    if (diffX > 0) nextChapter() 
    else prevChapter()
    return
  }

  const scrollTop = window.scrollY
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  const atBottom = scrollTop + windowHeight >= documentHeight - 10
  if (atBottom && diffY < -pullUpThreshold) { nextChapter(); return }

  const velocity = absDiffX / duration
  if (velocity > 0.8 && absDiffY < swipeMaxVertical && absDiffX > 60) {
    if (diffX > 0) nextChapter() 
    else prevChapter()
  }
}

// ============ 章节切换 ============
const startChapterTransition = (direction: 'left' | 'right') => {
  isTransitioning.value = true
  transitionDirection.value = direction
}
const endChapterTransition = () => { setTimeout(() => { isTransitioning.value = false; transitionDirection.value = null }, 50) }
const onChapterEnter = () => {
  if (transitionDirection.value) setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 10)
}

const loadContent = async () => {
  if (!currentChapter.value) return
  isLoading.value = true
  try {
    const response = await fetch(`/novels/${currentChapter.value.file}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    content.value = await response.text()
    recordReadingHistory()
  } catch (e) {
    console.error('加载章节失败:', e)
    content.value = '加载失败'
  }
  isLoading.value = false
  if (isTransitioning.value) {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' })
      if (isAutoPlay.value) { isAtBottom.value = false; setTimeout(() => checkIfAtBottom(), 500) }
    }, 10)
  }
}

const prevChapter = () => {
  if (chapterIndex.value > 0) {
    clearAutoPlayTimer(); isAtBottom.value = false; startChapterTransition('left')
    router.push(`/read/${props.id}/${chapterIndex.value}`)
  } else { showSwipeHintWithText('已经是第一章了') }
}
const nextChapter = () => {
  if (chapterIndex.value < (book.value?.chapters?.length || 0) - 1) {
    clearAutoPlayTimer(); isAtBottom.value = false; startChapterTransition('right')
    router.push(`/read/${props.id}/${chapterIndex.value + 2}`)
  } else {
    showSwipeHintWithText('已经是最后一章了')
    if (isAutoPlay.value) { isAutoPlay.value = false; clearAutoPlayTimer() }
  }
}
const showSwipeHintWithText = (text: string) => {
  const toast = document.createElement('div')
  toast.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-3 bg-black/70 text-white rounded-lg z-[200] text-sm'
  toast.textContent = text
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 1500)
}

// ============ 滚动处理 ============
function throttle<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let lastTime = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastTime >= delay) { lastTime = now; fn(...args) }
  }
}

const getScrollPositionKey = (bookId: string, chIndex: number) => `scroll_position_${bookId}_${chIndex}`
const saveScrollPosition = throttle(() => {
  if (!props.id) return
  localStorage.setItem(getScrollPositionKey(props.id, chapterIndex.value), JSON.stringify({ scrollY: window.scrollY, timestamp: Date.now() }))
}, 300)
const restoreScrollPosition = () => {
  if (!props.id) return
  const saved = localStorage.getItem(getScrollPositionKey(props.id, chapterIndex.value))
  if (saved) {
    try {
      const { scrollY } = JSON.parse(saved)
      setTimeout(() => window.scrollTo({ top: scrollY, behavior: 'smooth' }), 100)
    } catch {}
  }
}

const startHideTimer = () => {
  if (scrollTimer.value) { clearTimeout(scrollTimer.value); scrollTimer.value = null }
  scrollTimer.value = setTimeout(() => { if (window.scrollY > SCROLL_THRESHOLD) showBackToTop.value = false }, HIDE_DELAY)
}
const handleBackToTopVisibility = throttle(() => {
  if (window.scrollY > SCROLL_THRESHOLD) { showBackToTop.value = true; startHideTimer() }
  else { showBackToTop.value = false; if (scrollTimer.value) { clearTimeout(scrollTimer.value); scrollTimer.value = null } }
}, 100)
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  showBackToTop.value = false
  if (scrollTimer.value) { clearTimeout(scrollTimer.value); scrollTimer.value = null }
  saveScrollPosition()
}

const recordReadingHistory = () => {
  if (!book.value || !currentChapter.value) return
  const historyKey = `reading_history_${props.id}`
  const history = JSON.parse(localStorage.getItem(historyKey) || '[]')
  if (!history.includes(chapterIndex.value)) {
    history.push(chapterIndex.value)
    history.sort((a: number, b: number) => a - b)
    localStorage.setItem(historyKey, JSON.stringify(history))
  }
}

// ============ 沉浸模式 ============
const toggleImmersiveMode = () => {
  isImmersiveMode.value = !isImmersiveMode.value
  localStorage.setItem('immersiveMode', JSON.stringify(isImmersiveMode.value))
}
const handleContentClick = () => toggleImmersiveMode()
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isImmersiveMode.value) toggleImmersiveMode()
  if (event.key === 'F11') { event.preventDefault(); toggleImmersiveMode() }
}
const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    if (scrollTimer.value) { clearTimeout(scrollTimer.value); scrollTimer.value = null }
    if (autoPlayTimer.value) { clearTimeout(autoPlayTimer.value); autoPlayTimer.value = null }
  } else if (document.visibilityState === 'visible' && window.scrollY > SCROLL_THRESHOLD) {
    startHideTimer()
    if (isAutoPlay.value && isAtBottom.value) startAutoPlayTimer()
  }
}

const handleScroll = throttle(() => {
  saveScrollPosition()
  handleBackToTopVisibility()
  checkIfAtBottom()
}, 100)

// ============ 生命周期 ============
onMounted(() => {
  loadFontSize()
  loadAutoPlaySettings()
  const savedMode = localStorage.getItem('immersiveMode')
  if (savedMode !== null) isImmersiveMode.value = JSON.parse(savedMode)
  restoreScrollPosition()
  window.addEventListener('scroll', handleScroll)
  handleBackToTopVisibility()
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  saveScrollPosition()
  if (scrollTimer.value) clearTimeout(scrollTimer.value)
  if (autoPlayTimer.value) clearTimeout(autoPlayTimer.value)
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

watch(currentChapter, loadContent, { immediate: true })

watch(chapterIndex, (_newIndex, oldIndex) => {
  if (oldIndex !== undefined && !isTransitioning.value) {
    localStorage.setItem(getScrollPositionKey(props.id, oldIndex), JSON.stringify({ scrollY: window.scrollY, timestamp: Date.now() }))
  }
  if (!isTransitioning.value) restoreScrollPosition()
})
</script>

<style scoped>
/* 导航按钮样式 */
.nav-btn {
  @apply relative flex items-center justify-center w-11 h-11 rounded-xl cursor-pointer;
  @apply border-none bg-transparent;
  @apply transition-all duration-200;
  color: #39c5bb;
  @apply active:scale-95 touch-manipulation;
  -webkit-tap-highlight-color: transparent;
}
.nav-btn:hover { opacity: 0.8; }
.nav-btn-left { @apply -ml-1; }
.nav-btn-right { @apply -mr-1; }
.nav-btn-disabled { @apply opacity-30 cursor-not-allowed pointer-events-none; }
.nav-btn-active { background: rgba(57, 197, 187, 0.15); }
.nav-icon { @apply w-5 h-5; stroke-width: 1.8; }
@media (min-width: 640px) { .nav-icon { @apply w-[1.35rem] h-[1.35rem]; } }
.nav-tooltip {
  @apply absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap;
  background-color: var(--miku-primary);
  color: white;
  @apply opacity-0 invisible transition-all duration-200;
  pointer-events: none; z-index: 200;
}
.nav-tooltip::after {
  content: '';
  @apply absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45;
  background-color: var(--miku-primary);
}
.nav-btn:hover .nav-tooltip, .nav-btn:focus-visible .nav-tooltip { @apply opacity-100 visible -top-10; }
@media (hover: none) {
  .nav-btn:hover { opacity: 1; }
  .nav-btn:active { opacity: 0.8; }
  .nav-tooltip { display: none; }
}
@media (max-width: 360px) { .nav-btn { @apply w-10 h-10; } .nav-icon { width: 1.125rem; height: 1.125rem; } }
@media (min-width: 768px) { .nav-btn { @apply w-12 h-12; } .nav-icon { @apply w-6 h-6; } }
.nav-btn:focus-visible { @apply outline-none ring-2 ring-offset-2; --tw-ring-color: #39c5bb; --tw-ring-offset-color: var(--miku-bg); }
@supports (padding: max(0px)) { .fixed.bottom-0 { padding-bottom: max(0.75rem, env(safe-area-inset-bottom)); } }

/* 加载指示器 */
.loading-indicator { @apply flex flex-col items-center justify-center min-h-[300px] py-12 text-center; }
.loading-spinner { @apply w-10 h-10 mb-4 rounded-full border-2 border-miku border-t-miku-primary animate-spin; }
.loading-text { @apply flex flex-col items-center gap-2 text-miku-muted; }
.loading-label { @apply text-sm font-medium; }
.loading-chapter-title { @apply text-base font-semibold text-miku-primary max-w-md px-4 truncate; }
.loading-chapter-number { @apply text-base; color: var(--miku-text); }

/* 章节内容 */
.chapter-content { @apply w-full touch-pan-y; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
.chapter-content :deep(*) { -webkit-user-select: text; user-select: text; }

/* 章节过渡动画 - 淡入淡出 */
.chapter-fade-enter-active, .chapter-fade-leave-active { transition: opacity 0.35s ease; }
.chapter-fade-enter-from { opacity: 0; }
.chapter-fade-leave-to { opacity: 0; }
.chapter-fade-enter-active { transition-delay: 0.05s; }
@keyframes pulse-miku { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
.loading-indicator .loading-spinner { animation: spin 0.8s linear infinite, pulse-miku 1.5s ease-in-out infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* 滑动提示 */
.swipe-hint-overlay { @apply fixed inset-0 z-[150] flex flex-col items-center justify-center pointer-events-none; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(2px); }
.swipe-hint-overlay.left { @apply items-end pr-20; }
.swipe-hint-overlay.right { @apply items-start pl-20; }
.swipe-hint-icon { @apply w-20 h-20 rounded-full flex items-center justify-center mb-4 text-white shadow-lg animate-pulse; background-color: rgba(57, 197, 187, 0.9); }
.swipe-hint-text { @apply text-lg font-semibold text-white drop-shadow-md px-4 py-2 rounded-full; background: rgba(0, 0, 0, 0.5); }

/* 上拉加载提示 */
.pull-up-hint-overlay { @apply fixed bottom-0 left-0 right-0 z-[150] flex items-center justify-center pointer-events-none; height: 120px; background: linear-gradient(to top, rgba(57, 197, 187, 0.15), transparent); }
.pull-up-hint-content { @apply flex flex-col items-center gap-2 text-miku-primary font-medium animate-bounce; }
.pull-up-hint-text { @apply text-sm; }

/* 淡入淡出 */
.fade-overlay-enter-active, .fade-overlay-leave-active { transition: opacity 0.2s ease; }
.fade-overlay-enter-from, .fade-overlay-leave-to { opacity: 0; }

/* ========== PC 端样式 (>=1024px) ========== */
@media (min-width: 1024px) {
  /* 顶部导航栏 - PC 端 */
  .fixed.top-0.left-0.right-0 {
    max-width: 1200px;
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%) !important;
    width: 90%;
  }

  /* 底部导航栏 - PC 端优化 */
  .fixed.bottom-0.left-0.right-0 {
    max-width: 1200px;
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%) !important;
    width: 90%;
    border-radius: 1rem 1rem 0 0;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  }

  /* PC 端导航按钮更大 */
  .nav-btn {
    width: 3.25rem;
    height: 3.25rem;
  }

  .nav-icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .nav-tooltip {
    font-size: 0.875rem;
    padding: 0.625rem 1rem;
  }

  /* PC 端阅读区域优化 */
  .px-5.max-w-3xl {
    padding-left: 3rem;
    padding-right: 3rem;
    max-width: 960px;
  }

  /* PC 端抽屉优化 - 居中弹窗样式 */
  .bottom-drawer {
    max-width: 500px;
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%) !important;
    border-radius: 1rem;
    box-shadow: 0 10px 50px rgba(0, 0, 0, 0.2);
  }

  /* PC 端抽屉进入离开动画 - 从中心淡入淡出 */
  .drawer-slide-enter-active,
  .drawer-slide-leave-active {
    transition: opacity 0.25s ease, transform 0.25s ease;
  }

  .drawer-slide-enter-from {
    opacity: 0;
    transform: translateX(-50%) scale(0.95);
  }

  .drawer-slide-leave-to {
    opacity: 0;
    transform: translateX(-50%) scale(0.95);
  }
}
</style>

<style>
@reference "tailwindcss";
.markdown-body :deep(h1) { @apply text-2xl mb-5; }
.markdown-body :deep(h2) { @apply text-xl my-5; }
</style>
