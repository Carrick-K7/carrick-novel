import { ref, onMounted, onUnmounted } from 'vue'

export function useNetworkStatus() {
  const isOnline = ref(navigator.onLine)
  const showToast = ref(false)
  const toastMessage = ref('')
  const toastType = ref<'success' | 'warning'>('success')

  const displayToast = (message: string, type: 'success' | 'warning' = 'success') => {
    toastMessage.value = message
    toastType.value = type
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, 3000)
  }

  const handleOnline = () => {
    isOnline.value = true
    displayToast('已连接到网络', 'success')
  }

  const handleOffline = () => {
    isOnline.value = false
    displayToast('进入离线模式，已缓存内容可继续阅读', 'warning')
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return {
    isOnline,
    showToast,
    toastMessage,
    toastType
  }
}
