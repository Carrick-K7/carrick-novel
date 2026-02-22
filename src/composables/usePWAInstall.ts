import { ref, onMounted, onUnmounted } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWAInstall() {
  const canInstall = ref(false)
  const isInstalled = ref(false)
  const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)

  const handleBeforeInstallPrompt = (e: Event) => {
    // 阻止默认行为
    e.preventDefault()
    // 保存事件以便稍后触发
    deferredPrompt.value = e as BeforeInstallPromptEvent
    // 显示安装按钮
    canInstall.value = true
  }

  const handleAppInstalled = () => {
    // 隐藏安装按钮
    canInstall.value = false
    isInstalled.value = true
    deferredPrompt.value = null
  }

  const installPWA = async () => {
    if (!deferredPrompt.value) {
      return { success: false, message: '无法安装' }
    }

    // 显示安装提示
    await deferredPrompt.value.prompt()

    // 等待用户选择
    const { outcome } = await deferredPrompt.value.userChoice
    
    if (outcome === 'accepted') {
      deferredPrompt.value = null
      canInstall.value = false
      return { success: true, message: '应用已安装' }
    } else {
      return { success: false, message: '已取消安装' }
    }
  }

  onMounted(() => {
    // 检查是否已安装 (standalone 模式或显示模式为 standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled.value = true
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.removeEventListener('appinstalled', handleAppInstalled)
  })

  return {
    canInstall,
    isInstalled,
    installPWA
  }
}
