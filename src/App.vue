<template>
  <router-view />
  
  <!-- 网络状态 Toast 提示 -->
  <div
    v-if="showToast"
    class="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300"
    :class="toastType === 'success' ? 'bg-[#39c5bb] text-[#1a1a2e]' : 'bg-yellow-500 text-black'"
  >
    <div class="flex items-center gap-2">
      <svg v-if="toastType === 'success'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
      <span class="text-sm font-medium">{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNetworkStatus } from './composables/useNetworkStatus'

const { showToast, toastMessage, toastType } = useNetworkStatus()
</script>
