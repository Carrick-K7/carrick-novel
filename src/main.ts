import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/index.css'

// 注册 PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

createApp(App).use(router).mount('#app')
