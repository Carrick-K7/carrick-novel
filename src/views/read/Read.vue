<template>
  <div class="min-h-screen flex flex-col relative" :class="{ 'immersive-mode': isImmersiveMode }"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
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
            class="markdown-body leading-relaxed text-base cursor-pointer" 
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

      <!-- 中间：目录 + 自动播放控制 -->
      <div class="flex items-center gap-2">
        <!-- 自动播放控制栏 -->
        <div v-if="isAutoPlay" class="auto-play-controls">
          <button @click="toggleAutoPlay" class="auto-play-btn" title="暂停自动播放">
            <span class="text-lg">⏸️</span>
          </button>
          <div class="speed-selector">
            <button 
              @click="setAutoPlaySpeed('slow')" 
              class="speed-btn"
              :class="{ active: autoPlaySpeed === 'slow' }"
              title="慢速 (5秒)"
            >慢</button>
            <button 
              @click="setAutoPlaySpeed('medium')" 
              class="speed-btn"
              :class="{ active: autoPlaySpeed === 'medium' }"
              title="中速 (3秒)"
            >中</button>
            <button 
              @click="setAutoPlaySpeed('fast')" 
              class="speed-btn"
              :class="{ active: autoPlaySpeed === 'fast' }"
              title="快速 (1.5秒)"
            >快</button>
          </div>
        </div>
        <button v-else @click="toggleAutoPlay" class="nav-btn" title="自动播放" aria-label="自动播放">
          <span class="text-lg">▶️</span>
          <span class="nav-tooltip">自动播放</span>
        </button>

        <router-link :to="`/book/${id}?chapter=${chapterIndex + 1}`" class="nav-btn" title="目录" aria-label="目录">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span class="nav-tooltip">目录</span>
        </router-link>
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

// ============ 加载动画相关 ============
const isLoading = ref(false)

// ============ 自动播放相关 ============
const isAutoPlay = ref(false)
const autoPlaySpeed = ref<'slow' | 'medium' | 'fast'>('medium')
const autoPlayTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const isAtBottom = ref(false)

// 速度映射表
const speedMap = {
  slow: 5000,
  medium: 3000,
  fast: 1500
}

// 切换自动播放
const toggleAutoPlay = () => {
  isAutoPlay.value = !isAutoPlay.value
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
const swipeThreshold = 50 // 水平滑动阈值
const swipeMaxVertical = 100 // 最大垂直偏移（防止斜滑）

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

  // 处理快速滑动（即使距离不够，但速度快）
  const velocity = absDiffX / duration
  if (velocity > 0.5 && absDiffY < swipeMaxVertical) {
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
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
  // 初音色渲染：检测 --- 或 *** 替换为分割线（降低宽度到1px）
  html = html.replace(/^(---|\*\*\*)$/gm, '<hr class="miku-divider" style="border-top: 1px solid #39c5bb;">')
  
  // 初音色渲染：检测 【场景：...】或 ## 场景X：... 格式
  html = html.replace(/^(\*\*【场景[：:].*?】\*\*)$/gm, '<div class="miku-scene" style="color: #39c5bb; font-weight: bold; margin: 1em 0;">$1</div>')
  html = html.replace(/^(## 场景[一二三四五六七八九十\d]+[：:].+)$/gm, '<h2 class="miku-scene" style="color: #39c5bb;">$1</h2>')
  
  // 初音色渲染：检测 章节结束（3种格式）
  // 格式1: 【第四章完】或【第100章·完】
  html = html.replace(/^(\*\*【第\d+章[·\s]?完】\*\*)$/gm, '<div class="miku-end" style="color: #39c5bb; text-align: center; font-size: 1.2em; margin: 2em 0;">$1</div>')
  // 格式2: （第6章 完）
  html = html.replace(/^(\*\*[（(]第\d+章\s*完[）)]\*\*)$/gm, '<div class="miku-end" style="color: #39c5bb; text-align: center; font-size: 1.2em; margin: 2em 0;">$1</div>')
  
  // 处理普通段落
  html = html.replace(/\n/g, '<br>')
  
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
/* 沉浸模式样式 */
.immersive-mode .markdown-body {
  font-size: 1.1rem;
  line-height: 1.8;
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
   自动播放控制栏样式
   ======================================== */
.auto-play-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  background-color: var(--miku-bg-secondary);
  border: 1px solid var(--miku-border);
  border-radius: 0.5rem;
}

.auto-play-btn {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
}

.auto-play-btn:hover {
  background-color: rgba(57, 197, 187, 0.1);
}

.speed-selector {
  display: flex;
  gap: 0.125rem;
}

.speed-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  background-color: var(--miku-bg);
  border: 1px solid var(--miku-border);
  color: var(--miku-text-muted);
  transition: all 0.2s;
}

.speed-btn:hover {
  border-color: var(--miku-primary);
  color: var(--miku-primary);
}

.speed-btn.active {
  background-color: #39c5bb;
  color: white;
  border-color: #39c5bb;
}

/* ========================================
   底部图标导航栏样式
   ======================================== */

/* 图标按钮基础样式 */
.nav-btn {
  @apply relative flex items-center justify-center w-11 h-11 rounded-xl cursor-pointer transition-all duration-200;
  @apply bg-miku-secondary border border-miku;
  @apply text-miku;
  @apply active:scale-95;
  @apply touch-manipulation;
  -webkit-tap-highlight-color: transparent;
}

.nav-btn:hover {
  border-color: var(--miku-primary);
  color: var(--miku-primary);
  background-color: rgba(57, 197, 187, 0.1);
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
    border-color: var(--miku-border);
    color: var(--miku-text);
    background-color: var(--miku-bg-secondary);
  }
  
  .nav-btn:active {
    border-color: var(--miku-primary);
    color: var(--miku-primary);
    background-color: rgba(57, 197, 187, 0.2);
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
  
  .speed-btn {
    padding: 0.125rem 0.375rem;
    font-size: 0.625rem;
  }
  
  .auto-play-controls {
    padding: 0.125rem 0.375rem;
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
  --tw-ring-color: var(--miku-primary);
  --tw-ring-offset-color: var(--miku-bg);
}

/* 底部导航栏安全区域适配（iPhone底部横条） */
@supports (padding: max(0px)) {
  .fixed.bottom-0 {
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
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
