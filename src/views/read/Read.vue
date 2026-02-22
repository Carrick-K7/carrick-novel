<template>
  <div class="min-h-screen flex flex-col relative" :class="{ 'immersive-mode': isImmersiveMode }"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- 遮罩层 - 点击关闭抽屉 -->
    <Transition name="fade-overlay">
      <div v-if="currentDrawer" class="drawer-overlay" @click="closeDrawer"></div>
    </Transition>

    <!-- 目录抽屉 -->
    <Transition name="drawer-slide">
      <div v-if="currentDrawer === 'toc'" class="bottom-drawer">
        <div class="drawer-header">
          <span class="drawer-title">目录</span>
          <button class="drawer-close" @click="closeDrawer">✕</button>
        </div>
        <div class="drawer-content toc-list">
          <div
            v-for="(chapter, index) in book?.chapters"
            :key="index"
            class="toc-item"
            :class="{ active: index === chapterIndex }"
            @click="goToChapter(index)"
          >
            <span class="toc-number">第{{ index + 1 }}章</span>
            <span class="toc-name">{{ chapter.title }}</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 自动播放抽屉 -->
    <Transition name="drawer-slide">
      <div v-if="currentDrawer === 'autoplay'" class="bottom-drawer">
        <div class="drawer-header">
          <span class="drawer-title">自动播放</span>
          <button class="drawer-close" @click="closeDrawer">✕</button>
        </div>
        <div class="drawer-content autoplay-controls">
          <div class="speed-section">
            <span class="section-label">播放速度</span>
            <div class="speed-selector-drawer">
              <button
                class="speed-btn-drawer"
                :class="{ active: autoPlaySpeed === 'slow' }"
                @click="setAutoPlaySpeed('slow')"
              >
                <span class="speed-name">慢</span>
                <span class="speed-value">5秒</span>
              </button>
              <button
                class="speed-btn-drawer"
                :class="{ active: autoPlaySpeed === 'medium' }"
                @click="setAutoPlaySpeed('medium')"
              >
                <span class="speed-name">中</span>
                <span class="speed-value">3秒</span>
              </button>
              <button
                class="speed-btn-drawer"
                :class="{ active: autoPlaySpeed === 'fast' }"
                @click="setAutoPlaySpeed('fast')"
              >
                <span class="speed-name">快</span>
                <span class="speed-value">1.5秒</span>
              </button>
            </div>
          </div>
          <div class="play-control-section">
            <button class="play-toggle-btn" @click="toggleAutoPlay">
              <svg v-if="!isAutoPlay" class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg v-else class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
              <span>{{ isAutoPlay ? '暂停播放' : '开始播放' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 字号调节抽屉 -->
    <Transition name="drawer-slide">
      <div v-if="currentDrawer === 'fontsize'" class="bottom-drawer">
        <div class="drawer-header">
          <span class="drawer-title">字号调节</span>
          <button class="drawer-close" @click="closeDrawer">✕</button>
        </div>
        <div class="drawer-content fontsize-controls">
          <div class="fontsize-preview" :style="{ fontSize: fontSize + 'px' }">
            <span>Aa</span>
            <span class="fontsize-value">{{ fontSize }}px</span>
          </div>
          <div class="fontsize-slider-wrapper">
            <input
              type="range"
              class="fontsize-range"
              :min="minFontSize"
              :max="maxFontSize"
              step="1"
              v-model.number="fontSize"
              @input="onFontSizeChange"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- 滑动提示遮罩 -->
    <Transition name="fade-overlay">
      <div v-if="showSwipeHint" class="swipe-hint-overlay" :class="swipeHintDirection">
        <div class="swipe-hint-icon">
          <svg v-if="swipeHintDirection === 'left'" class="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
          <svg v-else class="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </div>
        <div class="swipe-hint-text">
          {{ swipeHintDirection === 'left' ? '下一章' : '上一章' }}
        </div>
      </div>
    </Transition>

    <!-- 上拉加载提示 -->
    <Transition name="fade-overlay">
      <div v-if="showPullUpHint" class="pull-up-hint-overlay">
        <div class="pull-up-hint-content">
          <svg class="w-8 h-8 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M19 12l-7 7-7-7"/>
          </svg>
          <span class="pull-up-hint-text">释放加载下一章</span>
        </div>
      </div>
    </Transition>

    <!-- 顶部导航栏 -->
    <header
      class="fixed top-0 left-0 right-0 flex items-center gap-3 px-4 py-3 bg-miku border-b border-miku z-[100] transition-transform duration-300 cursor-pointer hover:opacity-80 transition-opacity"
      :class="isImmersiveMode ? '-translate-y-full' : 'translate-y-0'"
      @click="$router.push('/')"
      title="返回书架"
    >
      <span class="text-miku-primary flex-shrink-0 text-lg">←</span>
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
      <!-- 章节内容过渡区域 -->
      <Transition 
        name="chapter-fade" 
        mode="out-in"
        @enter="onChapterEnter"
        @after-leave="endChapterTransition"
      >
        <!-- 加载中状态 (isLoading) -->
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
            <span v-if="targetChapter" class="loading-chapter-title">
              {{ targetChapter.title }}
            </span>
            <span v-else class="loading-chapter-number">
              第 {{ chapterIndex + 1 }} 章
            </span>
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
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        <span class="nav-tooltip">上一章</span>
      </button>

      <!-- 中间：目录 + 字号 + 自动播放 -->
      <div class="flex items-center gap-1">
        <!-- 目录按钮 -->
        <button @click="openDrawer('toc')" class="nav-btn" title="目录" aria-label="目录">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span class="nav-tooltip">目录</span>
        </button>

        <!-- 字号调节按钮 -->
        <button @click="openDrawer('fontsize')" class="nav-btn" title="字号" aria-label="字号">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 7V4h16v3"/>
            <path d="M9 20h6"/>
            <path d="M12 4v16"/>
          </svg>
          <span class="nav-tooltip">字号</span>
        </button>

        <!-- 自动播放按钮 -->
        <button 
          @click="openDrawer('autoplay')" 
          class="nav-btn"
          :class="{ 'nav-btn-active': isAutoPlay }"
          title="自动播放" 
          aria-label="自动播放"
        >
          <svg v-if="!isAutoPlay" class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <svg v-else class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
          </svg>
          <span class="nav-tooltip">自动播放</span>
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
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
        <span class="nav-tooltip">下一章</span>
      </button>
    </div>

    <!-- 沉浸模式退出提示条（屏幕顶部边缘） -->
    <div 
      v-if="isImmersiveMode"
      class="fixed top-0 left-0 right-0 h-2 z-[101] cursor-pointer group"
      @click="toggleImmersiveMode"
      title="点击退出沉浸模式"
    >
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-miku-muted/50 rounded-b-lg group-hover:bg-miku-primary/50 transition-colors"></div>
    </div>

    <!-- 沉浸模式悬浮退出按钮 -->
    <button
      v-if="isImmersiveMode"
      @click="toggleImmersiveMode"
      class="fixed bottom-4 right-4 z-[101] w-10 h-10 bg-miku-secondary/90 border border-miku rounded-full flex items-center justify-center text-miku-primary hover:bg-miku-primary hover:text-white transition-all duration-300 shadow-lg opacity-0 hover:opacity-100 focus:opacity-100"
      title="退出沉浸模式"
    >
      <span class="text-sm">⛶</span>
    </button>

    <!-- 右下角回到顶部按钮 -->
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
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 19V5"/>
        <path d="M5 12l7-7 7 7"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import novelsData from '../../../public/novels.json'

// ============ 抽屉相关 ============
type DrawerType = 'toc' | 'autoplay' | 'fontsize' | null
const currentDrawer = ref<DrawerType>(null)

const openDrawer = (type: DrawerType) => {
  currentDrawer.value = type
}

const closeDrawer = () => {
  currentDrawer.value = null
}

// 跳转到指定章节
const goToChapter = (index: number) => {
  closeDrawer()
  if (index !== chapterIndex.value) {
    router.push(`/read/${props.id}/${index + 1}`)
  }
}

// ============ 字号调节相关 ============
const DEFAULT_FONT_SIZE = 16
const MIN_FONT_SIZE = 12
const MAX_FONT_SIZE = 24
const FONT_SIZE_KEY = 'novel_reader_font_size'

const fontSize = ref(DEFAULT_FONT_SIZE)
const minFontSize = MIN_FONT_SIZE
const maxFontSize = MAX_FONT_SIZE

// 加载保存的字号
const loadFontSize = () => {
  const saved = localStorage.getItem(FONT_SIZE_KEY)
  if (saved) {
    const size = parseInt(saved, 10)
    if (!isNaN(size) && size >= MIN_FONT_SIZE && size <= MAX_FONT_SIZE) {
      fontSize.value = size
    }
  }
}

// 保存字号
const saveFontSize = () => {
  localStorage.setItem(FONT_SIZE_KEY, fontSize.value.toString())
}

// 字号滑块变化时保存
const onFontSizeChange = () => {
  saveFontSize()
}

// ============ 加载动画相关 ============
const isLoading = ref(false)

// ============ 自动播放相关 ============
const isAutoPlay = ref(false)
const autoPlaySpeed = ref<'slow' | 'medium' | 'fast'>('medium')
const autoPlayTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const isAtBottom = ref(false)

// 自动播放 localStorage key
const AUTOPLAY_KEY = 'novel_reader_autoplay'
const AUTOPLAY_SPEED_KEY = 'novel_reader_autoplay_speed'

// 速度映射表
const speedMap = {
  slow: 5000,
  medium: 3000,
  fast: 1500
}

// 加载自动播放设置
const loadAutoPlaySettings = () => {
  const savedAutoPlay = localStorage.getItem(AUTOPLAY_KEY)
  if (savedAutoPlay !== null) {
    isAutoPlay.value = JSON.parse(savedAutoPlay)
  }
  const savedSpeed = localStorage.getItem(AUTOPLAY_SPEED_KEY)
  if (savedSpeed !== null && ['slow', 'medium', 'fast'].includes(savedSpeed)) {
    autoPlaySpeed.value = savedSpeed as 'slow' | 'medium' | 'fast'
  }
}

// 保存自动播放设置
const saveAutoPlaySettings = () => {
  localStorage.setItem(AUTOPLAY_KEY, JSON.stringify(isAutoPlay.value))
  localStorage.setItem(AUTOPLAY_SPEED_KEY, autoPlaySpeed.value)
}

// 切换自动播放
const toggleAutoPlay = () => {
  isAutoPlay.value = !isAutoPlay.value
  saveAutoPlaySettings()
  if (isAutoPlay.value) {
    // 开启自动播放时，检查是否已经在底部
    checkIfAtBottom()
    if (isAtBottom.value) {
      startAutoPlayTimer()
    }
  } else {
    // 关闭自动播放时，清除计时器
    clearAutoPlayTimer()
  }
}

// 设置自动播放速度
const setAutoPlaySpeed = (speed: 'slow' | 'medium' | 'fast') => {
  autoPlaySpeed.value = speed
  saveAutoPlaySettings()
  // 如果正在自动播放且已经在底部，重置计时器
  if (isAutoPlay.value && isAtBottom.value) {
    clearAutoPlayTimer()
    startAutoPlayTimer()
  }
}

// 启动自动播放计时器
const startAutoPlayTimer = () => {
  // 清除旧计时器
  clearAutoPlayTimer()
  
  // 如果不是最后一章，启动新计时器
  if (chapterIndex.value < (book.value?.chapters?.length || 0) - 1) {
    const delay = speedMap[autoPlaySpeed.value]
    autoPlayTimer.value = setTimeout(() => {
      nextChapter()
    }, delay)
  }
}

// 清除自动播放计时器
const clearAutoPlayTimer = () => {
  if (autoPlayTimer.value) {
    clearTimeout(autoPlayTimer.value)
    autoPlayTimer.value = null
  }
}

// 检查是否在底部
const checkIfAtBottom = () => {
  const scrollTop = window.scrollY
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  // 允许 50px 的误差范围
  const atBottom = scrollTop + windowHeight >= documentHeight - 50
  
  if (atBottom && !isAtBottom.value && isAutoPlay.value) {
    // 刚到达底部，启动计时器
    isAtBottom.value = true
    startAutoPlayTimer()
  } else if (!atBottom && isAtBottom.value) {
    // 离开底部，清除计时器
    isAtBottom.value = false
    clearAutoPlayTimer()
  }
  
  return atBottom
}

// ============ 触摸滑动相关 ============
const touchStart = ref({ x: 0, y: 0, time: 0 })
const touchEnd = ref({ x: 0, y: 0, time: 0 })
const isSwiping = ref(false)
const showSwipeHint = ref(false)
const swipeHintDirection = ref<'left' | 'right' | null>(null)
const swipeHintTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// 上拉加载相关
const showPullUpHint = ref(false)
const isPullingUp = ref(false)
const pullUpThreshold = 80 // 上拉触发阈值（像素）
const swipeThreshold = 120 // 水平滑动阈值（增加阈值防止误触发）
const swipeMaxVertical = 80 // 最大垂直偏移（防止斜滑）
const swipeMinDuration = 50 // 最小滑动持续时间（毫秒），防止快速点击误触发

// 触摸开始
const handleTouchStart = (e: TouchEvent) => {
  const touch = e.touches[0]
  touchStart.value = {
    x: touch.clientX,
    y: touch.clientY,
    time: Date.now()
  }
  isSwiping.value = false
  isPullingUp.value = false
}

// 触摸移动
const handleTouchMove = (e: TouchEvent) => {
  const touch = e.touches[0]
  touchEnd.value = {
    x: touch.clientX,
    y: touch.clientY,
    time: Date.now()
  }

  const diffX = touchStart.value.x - touchEnd.value.x
  const diffY = touchStart.value.y - touchEnd.value.y
  const absDiffX = Math.abs(diffX)
  const absDiffY = Math.abs(diffY)

  // 检测是否为水平滑动
  if (absDiffX > absDiffY && absDiffX > 20 && absDiffY < swipeMaxVertical) {
    isSwiping.value = true

    // 检测是否有上一章/下一章可切换
    if (diffX > 30 && chapterIndex.value < (book.value?.chapters?.length || 0) - 1) {
      // 左滑 - 显示下一章提示
      swipeHintDirection.value = 'left'
      showSwipeHint.value = true
    } else if (diffX < -30 && chapterIndex.value > 0) {
      // 右滑 - 显示上一章提示
      swipeHintDirection.value = 'right'
      showSwipeHint.value = true
    } else {
      showSwipeHint.value = false
    }
  }

  // 检测是否为上拉（在页面底部时）
  const scrollTop = window.scrollY
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  const atBottom = scrollTop + windowHeight >= documentHeight - 10

  if (atBottom && diffY < -30 && chapterIndex.value < (book.value?.chapters?.length || 0) - 1) {
    // 在底部且向上拉
    isPullingUp.value = true
    const pullUpDistance = Math.abs(diffY)

    if (pullUpDistance > pullUpThreshold) {
      showPullUpHint.value = true
    } else {
      showPullUpHint.value = false
    }
  } else if (!atBottom) {
    showPullUpHint.value = false
    isPullingUp.value = false
  }
}

// 触摸结束
const handleTouchEnd = (e: TouchEvent) => {
  const touch = e.changedTouches[0]
  touchEnd.value = {
    x: touch.clientX,
    y: touch.clientY,
    time: Date.now()
  }

  // 隐藏滑动提示
  showSwipeHint.value = false
  showPullUpHint.value = false

  // 处理滑动
  handleSwipe()

  // 清理状态
  isSwiping.value = false
  isPullingUp.value = false
}

// 处理滑动逻辑
const handleSwipe = () => {
  const diffX = touchStart.value.x - touchEnd.value.x
  const diffY = touchStart.value.y - touchEnd.value.y
  const absDiffX = Math.abs(diffX)
  const absDiffY = Math.abs(diffY)
  const duration = touchEnd.value.time - touchStart.value.time

  // 过滤掉快速点击（持续时间太短）
  if (duration < swipeMinDuration) {
    return
  }

  // 必须是水平滑动主导，且超过阈值
  if (absDiffX > absDiffY && absDiffX > swipeThreshold && absDiffY < swipeMaxVertical) {
    if (diffX > 0) {
      // 左滑 - 下一章
      nextChapter()
    } else {
      // 右滑 - 上一章
      prevChapter()
    }
    return
  }

  // 处理上拉加载下一章（快速上拉或超过阈值）
  const scrollTop = window.scrollY
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  const atBottom = scrollTop + windowHeight >= documentHeight - 10

  if (atBottom && diffY < -pullUpThreshold) {
    // 上拉超过阈值，加载下一章
    nextChapter()
    return
  }

  // 处理快速滑动（提高速度阈值到 0.8，防止轻微快速滑动误触发）
  const velocity = absDiffX / duration
  if (velocity > 0.8 && absDiffY < swipeMaxVertical && absDiffX > 60) {
    if (diffX > 0) {
      nextChapter()
    } else {
      prevChapter()
    }
  }
}

// ============ 章节切换动画 ============
const isTransitioning = ref(false)
const transitionDirection = ref<'left' | 'right' | null>(null)

// 开始切换动画
const startChapterTransition = (direction: 'left' | 'right') => {
  isTransitioning.value = true
  transitionDirection.value = direction
}

// 结束切换动画
const endChapterTransition = () => {
  // 动画结束后清理状态
  setTimeout(() => {
    isTransitioning.value = false
    transitionDirection.value = null
  }, 50)
}

// 章节内容进入时的处理
const onChapterEnter = () => {
  // 如果是章节切换导致的过渡，滚动到顶部
  if (transitionDirection.value) {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }, 10)
  }
}

// ============ 节流函数 ============
function throttle<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let lastTime = 0
  return function (...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn(...args)
    }
  }
}

const props = defineProps<{
  id: string
  chapter: string
}>()

const router = useRouter()
const content = ref('')
const isImmersiveMode = ref(false)
const showBackToTop = ref(false)
const scrollTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const SCROLL_THRESHOLD = 300
const HIDE_DELAY = 2000 // 2秒
const chapterIndex = computed(() => {
  const index = parseInt(props.chapter) || 0
  // 让用户友好的URL对应正确章节
  // /1 对应第1章(chapters[0])，/15 对应第15章(chapters[14])
  return Math.max(0, index - 1)
})

const book = computed(() => {
  return novelsData.novels.find(n => n.id === props.id)
})

const currentChapter = computed(() => {
  return book.value?.chapters?.[chapterIndex.value]
})

// 目标章节（用于动画过渡显示）
const targetChapter = computed(() => {
  if (!isTransitioning.value || !transitionDirection.value) return null
  const targetIndex = transitionDirection.value === 'left' 
    ? chapterIndex.value - 1 
    : chapterIndex.value + 1
  return book.value?.chapters?.[targetIndex] || null
})

// 修改后的 markdown 渲染 - 支持初音色样式
const renderedContent = computed(() => {
  if (!content.value) return ''
  
  let html = content.value
    .replace(/# (.*)/, '<h1>$1</h1>')
    .replace(/## (.*)/, '<h2>$1</h2>')
  
  // 初音色渲染：先处理特殊格式（在粗体转换之前！）
  // 场景格式1: **【场景：...】** 
  html = html.replace(/^(\*\*【场景[：:].*?】\*\*)$/gm, '<div style="color: #39c5bb; font-weight: bold; margin: 1em 0;">$1</div>')
  // 场景格式2: ## 场景X：...
  html = html.replace(/^(## 场景[一二三四五六七八九十\d]+[：:].+)$/gm, '<h2 style="color: #39c5bb;">$1</h2>')
  
  // 章节结束格式（在粗体转换之前）
  // 格式1: **【第四章完】** 或 **【第100章·完】**
  html = html.replace(/^(\*\*【第\d+章[·\s]?完】\*\*)$/gm, '<div style="color: #39c5bb; text-align: center; font-size: 1.2em; margin: 2em 0;">$1</div>')
  // 格式2: **（第6章 完）**
  html = html.replace(/^(\*\*[（(]第\d+章\s*完[）)]\*\*)$/gm, '<div style="color: #39c5bb; text-align: center; font-size: 1.2em; margin: 2em 0;">$1</div>')
  
  // 然后再转换普通粗体
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
  // 初音色渲染：检测 --- 或 *** 替换为分割线（降低宽度到1px），并移除后续换行
  html = html.replace(/^(---|\*\*\*)\n*$/gm, '<hr style="border: none; border-top: 1px solid #39c5bb; margin: 2em 0;">')
  
  // 处理普通段落（但在特定元素后不添加额外换行）
  html = html.replace(/\n/g, '<br>')
  
  // 移除分割线后的 <br>
  html = html.replace(/(<hr[^\u003e]*>)<br>*/g, '$1')
  // 移除场景div后的 <br>
  html = html.replace(/(<div style="color: #39c5bb[^"]*">.*?)<\/div><br>*/g, '$1</div>')
  // 移除章节结束div后的 <br>
  html = html.replace(/(<div style="color: #39c5bb; text-align: center[^"]*">.*?)<\/div><br>*/g, '$1</div>')
  
  return html
})

const loadContent = async () => {
  if (!currentChapter.value) return
  
  // 开始加载，显示加载动画
  isLoading.value = true
  
  try {
    const response = await fetch(`/novels/${currentChapter.value.file}`)
    content.value = await response.text()
    // 记录阅读历史到 localStorage
    recordReadingHistory()
  } catch (e) {
    content.value = '加载失败'
  }
  
  // 内容加载完成后，关闭加载动画
  isLoading.value = false
  
  // 内容加载完成后，执行滚动操作
  // 如果有目标章节（即正在执行切换动画），则滚动到顶部
  if (isTransitioning.value) {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' })
      // 章节切换后，如果自动播放开启，检查是否需要启动计时器
      if (isAutoPlay.value) {
        // 重置底部状态，等待滚动检测
        isAtBottom.value = false
        // 延迟检查是否在底部，启动自动播放计时器
        setTimeout(() => {
          checkIfAtBottom()
        }, 500)
      }
    }, 10)
  }
}

// ============ 滚动位置记忆功能 ============

// 生成 localStorage key
const getScrollPositionKey = (bookId: string, chIndex: number) => {
  return `scroll_position_${bookId}_${chIndex}`
}

// 保存滚动位置（节流）
const saveScrollPosition = throttle(() => {
  if (!props.id) return
  const key = getScrollPositionKey(props.id, chapterIndex.value)
  const data = {
    scrollY: window.scrollY,
    timestamp: Date.now()
  }
  localStorage.setItem(key, JSON.stringify(data))
  console.log(`[Scroll] Saved position for chapter ${chapterIndex.value}:`, data.scrollY)
}, 300)

// 显示按钮并启动隐藏定时器
const showButton = () => {
  showBackToTop.value = true
  startHideTimer()
}

// 启动隐藏定时器
const startHideTimer = () => {
  // 先清除旧的 timer
  if (scrollTimer.value) {
    clearTimeout(scrollTimer.value)
    scrollTimer.value = null
  }

  // 创建新的 timer
  scrollTimer.value = setTimeout(() => {
    if (window.scrollY > SCROLL_THRESHOLD) {
      showBackToTop.value = false
    }
  }, HIDE_DELAY)
}

// 控制回到顶部按钮显示/隐藏（滚动停止2秒后自动隐藏）
const handleBackToTopVisibility = throttle(() => {
  if (window.scrollY > SCROLL_THRESHOLD) {
    showButton()
  } else {
    showBackToTop.value = false
    if (scrollTimer.value) {
      clearTimeout(scrollTimer.value)
      scrollTimer.value = null
    }
  }
}, 100)

// 恢复滚动位置
const restoreScrollPosition = () => {
  if (!props.id) return
  const key = getScrollPositionKey(props.id, chapterIndex.value)
  const saved = localStorage.getItem(key)
  if (saved) {
    try {
      const { scrollY } = JSON.parse(saved)
      // 使用 setTimeout 确保内容渲染完成后再恢复位置
      setTimeout(() => {
        window.scrollTo({ top: scrollY, behavior: 'smooth' })
        console.log(`[Scroll] Restored position for chapter ${chapterIndex.value}:`, scrollY)
      }, 100)
    } catch (e) {
      console.error('[Scroll] Failed to restore position:', e)
    }
  }
}

// 回到顶部
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  // 回到顶部后立即隐藏按钮
  showBackToTop.value = false
  // 清除 timer
  if (scrollTimer.value) {
    clearTimeout(scrollTimer.value)
    scrollTimer.value = null
  }
  // 保存顶部位置
  saveScrollPosition()
}

// 记录阅读历史
const recordReadingHistory = () => {
  if (!book.value || !currentChapter.value) return
  
  const historyKey = `reading_history_${props.id}`
  const history = JSON.parse(localStorage.getItem(historyKey) || '[]')
  
  // 添加当前章节到历史（如果不在列表中）
  if (!history.includes(chapterIndex.value)) {
    history.push(chapterIndex.value)
    // 按章节索引排序
    history.sort((a: number, b: number) => a - b)
    localStorage.setItem(historyKey, JSON.stringify(history))
  }
}

const prevChapter = () => {
  if (chapterIndex.value > 0) {
    console.log('[Swipe] 右滑 - 切换到上一章')
    // 清除自动播放计时器
    clearAutoPlayTimer()
    isAtBottom.value = false
    startChapterTransition('left')
    // URL参数 = chapterIndex + 1 (用户友好的1-based索引)
    router.push(`/read/${props.id}/${chapterIndex.value}`)
  } else {
    console.log('[Swipe] 已经是第一章')
    // 显示提示：已经是第一章
    showSwipeHintWithText('已经是第一章了')
  }
}

const nextChapter = () => {
  if (chapterIndex.value < (book.value?.chapters?.length || 0) - 1) {
    console.log('[Swipe] 左滑/上拉 - 切换到下一章')
    // 清除自动播放计时器
    clearAutoPlayTimer()
    isAtBottom.value = false
    startChapterTransition('right')
    // URL参数 = chapterIndex + 1 (用户友好的1-based索引)
    router.push(`/read/${props.id}/${chapterIndex.value + 2}`)
  } else {
    console.log('[Swipe] 已经是最后一章')
    // 显示提示：已经是最后一章
    showSwipeHintWithText('已经是最后一章了')
    // 关闭自动播放
    if (isAutoPlay.value) {
      isAutoPlay.value = false
      clearAutoPlayTimer()
    }
  }
}

// 显示滑动提示文字
const showSwipeHintWithText = (text: string) => {
  // 使用 toast 或简单的提示
  const toast = document.createElement('div')
  toast.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-3 bg-black/70 text-white rounded-lg z-[200] text-sm'
  toast.textContent = text
  document.body.appendChild(toast)
  setTimeout(() => {
    toast.remove()
  }, 1500)
}

// 切换沉浸模式
const toggleImmersiveMode = () => {
  isImmersiveMode.value = !isImmersiveMode.value
  // 保存用户偏好到 localStorage
  localStorage.setItem('immersiveMode', JSON.stringify(isImmersiveMode.value))
}

// 处理内容区域点击 - 点击切换沉浸模式
const handleContentClick = () => {
  // 点击内容区域切换沉浸模式
  toggleImmersiveMode()
}

// 键盘快捷键支持
const handleKeyDown = (event: KeyboardEvent) => {
  // ESC 键退出沉浸模式
  if (event.key === 'Escape' && isImmersiveMode.value) {
    toggleImmersiveMode()
  }
  // F11 键切换沉浸模式
  if (event.key === 'F11') {
    event.preventDefault()
    toggleImmersiveMode()
  }
}

// 页面可见性变化处理（修复切换标签页后 timer 失效问题）
const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    // 页面隐藏时清除 timer
    if (scrollTimer.value) {
      clearTimeout(scrollTimer.value)
      scrollTimer.value = null
    }
    if (autoPlayTimer.value) {
      clearTimeout(autoPlayTimer.value)
      autoPlayTimer.value = null
    }
  } else if (document.visibilityState === 'visible' && window.scrollY > SCROLL_THRESHOLD) {
    // 页面重新可见时，重新启动 timer
    startHideTimer()
    // 如果自动播放开启且在底部，重新启动计时器
    if (isAutoPlay.value && isAtBottom.value) {
      startAutoPlayTimer()
    }
  }
}

// 滚动事件处理（包含自动播放检测）
const handleScroll = throttle(() => {
  saveScrollPosition()
  handleBackToTopVisibility()
  checkIfAtBottom()
}, 100)

onMounted(() => {
  // 加载保存的字号
  loadFontSize()

  // 加载自动播放设置
  loadAutoPlaySettings()

  // 恢复用户偏好
  const savedMode = localStorage.getItem('immersiveMode')
  if (savedMode !== null) {
    isImmersiveMode.value = JSON.parse(savedMode)
  }

  // 恢复当前章节的滚动位置
  restoreScrollPosition()

  // 添加滚动事件监听（包含自动播放检测）
  window.addEventListener('scroll', handleScroll)
  // 初始化按钮状态
  handleBackToTopVisibility()

  // 页面可见性变化处理
  document.addEventListener('visibilitychange', handleVisibilityChange)

  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  // 保存当前滚动位置
  saveScrollPosition()

  // 清理 timer
  if (scrollTimer.value) {
    clearTimeout(scrollTimer.value)
  }
  if (swipeHintTimer.value) {
    clearTimeout(swipeHintTimer.value)
  }
  if (autoPlayTimer.value) {
    clearTimeout(autoPlayTimer.value)
  }

  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

watch(currentChapter, loadContent, { immediate: true })

// 监听章节变化，保存旧章节位置并恢复新章节位置
watch(chapterIndex, (_newIndex, oldIndex) => {
  // 如果是通过正常导航（不是页面刷新），记录位置
  if (oldIndex !== undefined && !isTransitioning.value) {
    // 保存旧章节的滚动位置
    const oldKey = getScrollPositionKey(props.id, oldIndex)
    localStorage.setItem(oldKey, JSON.stringify({
      scrollY: window.scrollY,
      timestamp: Date.now()
    }))
    console.log(`[Scroll] Saved position for chapter ${oldIndex} before switching`)
  }
  
  // 恢复新章节的滚动位置
  // 只有在非过渡状态下才恢复位置
  if (!isTransitioning.value) {
    restoreScrollPosition()
  }
})
</script>

<style scoped>
/* 沉浸模式样式 - 仅调整布局，不调整字号 */
.immersive-mode {
  /* 沉浸模式下的样式调整 */
}

/* 确保过渡动画流畅 */
header, .fixed.bottom-0 {
  will-change: transform;
}

/* 沉浸模式下内容区域优化 */
.immersive-mode :deep(.markdown-body) {
  h1 {
    margin-top: 0;
  }
}

/* ========================================
   初音色样式 (Miku Color #39c5bb)
   ======================================== */
.miku-divider {
  border: none;
  border-top: 1px solid #39c5bb;
  margin: 2em 0;
}

.miku-scene {
  color: #39c5bb;
  font-weight: bold;
}

.miku-end {
  color: #39c5bb;
  text-align: center;
  font-size: 1.2em;
  margin: 2em 0;
}

/* ========================================
   底部上拉抽屉样式
   ======================================== */

.drawer-overlay {
  @apply fixed inset-0 z-[150];
  background: rgba(0, 0, 0, 0.5);
}

.bottom-drawer {
  @apply fixed bottom-0 left-0 right-0 z-[160];
  @apply bg-miku rounded-t-2xl;
  @apply shadow-2xl;
  max-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
}

.drawer-header {
  @apply flex items-center justify-between px-4 py-3;
  @apply border-b border-miku;
}

.drawer-title {
  @apply text-lg font-semibold;
  color: var(--miku-primary);
}

.drawer-close {
  @apply w-8 h-8 flex items-center justify-center rounded-full;
  @apply text-miku-muted hover:text-miku-primary;
  @apply transition-colors;
  font-size: 1.25rem;
}

.drawer-content {
  @apply flex-1 overflow-y-auto p-4;
  /* 滚动条样式 - 确保可见 */
  scrollbar-width: 8px;
  scrollbar-color: #39c5bb var(--miku-bg-secondary);
}

/* Webkit 滚动条样式 */
.drawer-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.drawer-content::-webkit-scrollbar-track {
  background: var(--miku-bg-secondary);
  border-radius: 4px;
}

.drawer-content::-webkit-scrollbar-thumb {
  background: #39c5bb;
  border-radius: 4px;
  border: 2px solid var(--miku-bg-secondary);
}

.drawer-content::-webkit-scrollbar-thumb:hover {
  background: #2da8a0;
}

/* 抽屉滑入动画 */
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.3s ease-out;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateY(100%);
}

/* 目录列表样式 */
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

/* 自动播放控制样式 */
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

.speed-selector-drawer {
  @apply grid grid-cols-3 gap-3;
}

.speed-btn-drawer {
  @apply flex flex-col items-center gap-1 p-4 rounded-xl;
  @apply border border-miku;
  @apply bg-miku-secondary;
  @apply transition-all;
}

.speed-btn-drawer:hover {
  border-color: var(--miku-primary);
}

.speed-btn-drawer.active {
  background: rgba(57, 197, 187, 0.15);
  border-color: #39c5bb;
}

.speed-btn-drawer .speed-name {
  @apply text-base font-semibold;
  color: var(--miku-text);
}

.speed-btn-drawer.active .speed-name {
  color: #39c5bb;
}

.speed-btn-drawer .speed-value {
  @apply text-xs;
  color: var(--miku-text-muted);
}

.speed-btn-drawer.active .speed-value {
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

.play-icon {
  @apply w-6 h-6;
}

/* 字号调节样式 */
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

/* ========================================
   底部图标导航栏样式 - 无边框初色
   ======================================== */

/* 图标按钮基础样式 - 无边框透明背景 */
.nav-btn {
  @apply relative flex items-center justify-center w-11 h-11 rounded-xl cursor-pointer;
  @apply border-none bg-transparent;
  @apply transition-all duration-200;
  color: #39c5bb;
  @apply active:scale-95;
  @apply touch-manipulation;
  -webkit-tap-highlight-color: transparent;
}

.nav-btn:hover {
  opacity: 0.8;
}

/* 上一章/下一章特殊间距 */
.nav-btn-left {
  @apply -ml-1;
}

.nav-btn-right {
  @apply -mr-1;
}

/* 禁用状态 */
.nav-btn-disabled {
  @apply opacity-30 cursor-not-allowed pointer-events-none;
}

/* 激活状态（自动播放中） */
.nav-btn-active {
  background: rgba(57, 197, 187, 0.15);
}

/* 图标尺寸 */
.nav-icon {
  @apply w-5 h-5;
  stroke-width: 1.8;
}

@media (min-width: 640px) {
  .nav-icon {
    @apply w-[1.35rem] h-[1.35rem];
  }
}

/* 工具提示 */
.nav-tooltip {
  @apply absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap;
  background-color: var(--miku-primary);
  color: white;
  @apply opacity-0 invisible;
  @apply transition-all duration-200;
  pointer-events: none;
  z-index: 200;
}

/* 工具提示箭头 */
.nav-tooltip::after {
  content: '';
  @apply absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45;
  background-color: var(--miku-primary);
}

/* 显示工具提示 */
.nav-btn:hover .nav-tooltip,
.nav-btn:focus-visible .nav-tooltip {
  @apply opacity-100 visible -top-10;
}

/* 移动端触摸优化 */
@media (hover: none) {
  .nav-btn:hover {
    opacity: 1;
  }
  
  .nav-btn:active {
    opacity: 0.8;
  }
  
  /* 移动端隐藏工具提示（触摸设备不需要hover提示） */
  .nav-tooltip {
    display: none;
  }
}

/* 小屏手机适配 */
@media (max-width: 360px) {
  .nav-btn {
    @apply w-10 h-10;
  }
  
  .nav-icon {
    width: 1.125rem;
    height: 1.125rem;
  }
}

/* 大屏幕增强 */
@media (min-width: 768px) {
  .nav-btn {
    @apply w-12 h-12;
  }
  
  .nav-icon {
    @apply w-6 h-6;
  }
}

/* 聚焦样式（无障碍支持） */
.nav-btn:focus-visible {
  @apply outline-none ring-2 ring-offset-2;
  --tw-ring-color: #39c5bb;
  --tw-ring-offset-color: var(--miku-bg);
}

/* 底部导航栏安全区域适配（iPhone底部横条） */
@supports (padding: max(0px)) {
  .fixed.bottom-0 {
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  }
  
  .bottom-drawer {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
}

/* ========================================
   章节切换动画样式
   ======================================== */

/* 加载指示器样式 */
.loading-indicator {
  @apply flex flex-col items-center justify-center;
  @apply min-h-[300px] py-12;
  @apply text-center;
}

.loading-spinner {
  @apply w-10 h-10 mb-4;
  @apply rounded-full;
  @apply border-2 border-miku;
  @apply border-t-miku-primary;
  @apply animate-spin;
}

.loading-text {
  @apply flex flex-col items-center gap-2;
  @apply text-miku-muted;
}

.loading-label {
  @apply text-sm font-medium;
}

.loading-chapter-title {
  @apply text-base font-semibold text-miku-primary;
  @apply max-w-md px-4;
  @apply truncate;
}

.loading-chapter-number {
  @apply text-base;
  color: var(--miku-text);
}

/* 章节内容容器 */
.chapter-content {
  @apply w-full;
  touch-action: manipulation;
  -webkit-touch-callout: none;
}

/* Vue Transition 动画 - 淡入淡出 */
.chapter-fade-enter-active,
.chapter-fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.chapter-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.chapter-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 从目录点击时的淡入效果 */
.chapter-fade-enter-active {
  transition-delay: 0.05s;
}

/* 加载状态的脉冲效果 */
@keyframes pulse-miku {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.loading-indicator .loading-spinner {
  animation: spin 0.8s linear infinite, pulse-miku 1.5s ease-in-out infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ========================================
   滑动提示样式
   ======================================== */

.swipe-hint-overlay {
  @apply fixed inset-0 z-[150] flex flex-col items-center justify-center;
  @apply pointer-events-none;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
}

.swipe-hint-overlay.left {
  @apply items-end pr-20;
}

.swipe-hint-overlay.right {
  @apply items-start pl-20;
}

.swipe-hint-icon {
  @apply w-20 h-20 rounded-full flex items-center justify-center mb-4;
  @apply text-white shadow-lg;
  @apply animate-pulse;
  background-color: rgba(57, 197, 187, 0.9);
}

.swipe-hint-text {
  @apply text-lg font-semibold text-white drop-shadow-md;
  @apply px-4 py-2 rounded-full;
  background: rgba(0, 0, 0, 0.5);
}

/* ========================================
   上拉加载提示样式
   ======================================== */

.pull-up-hint-overlay {
  @apply fixed bottom-0 left-0 right-0 z-[150] flex items-center justify-center;
  @apply pointer-events-none;
  height: 120px;
  background: linear-gradient(to top, rgba(57, 197, 187, 0.15), transparent);
}

.pull-up-hint-content {
  @apply flex flex-col items-center gap-2;
  @apply text-miku-primary font-medium;
  @apply animate-bounce;
}

.pull-up-hint-text {
  @apply text-sm;
}

/* 淡入淡出过渡 */
.fade-overlay-enter-active,
.fade-overlay-leave-active {
  transition: opacity 0.2s ease;
}

.fade-overlay-enter-from,
.fade-overlay-leave-to {
  opacity: 0;
}

/* ========================================
   触摸滑动优化
   ======================================== */

/* 防止触摸时的默认行为 */
.chapter-content {
  @apply touch-pan-y;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

/* 允许文本选择（长按复制） */
.chapter-content :deep(*) {
  -webkit-user-select: text;
  user-select: text;
}

/* 移动端滑动区域优化 */
@media (hover: none) {
  .markdown-body {
    @apply cursor-default;
  }
}
</style>

<style>
@reference "tailwindcss";

.markdown-body :deep(h1) {
  @apply text-2xl mb-5;
}

.markdown-body :deep(h2) {
  @apply text-xl my-5;
}

/* 初音色样式 - 全局作用域 */
:deep(.miku-divider) {
  border: none;
  border-top: 1px solid #39c5bb;
  margin: 2em 0;
}

:deep(.miku-scene) {
  color: #39c5bb;
  font-weight: bold;
}

:deep(.miku-end) {
  color: #39c5bb;
  text-align: center;
  font-size: 1.2em;
  margin: 2em 0;
}
</style>
