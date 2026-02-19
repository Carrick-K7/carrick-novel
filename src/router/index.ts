import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import BookDetail from '../views/books/BookDetail.vue'
import Read from '../views/read/Read.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/book/ak-daily'
    },
    {
      path: '/book/:id',
      name: 'book',
      component: BookDetail,
      props: true
    },
    {
      path: '/read/:id/:chapter',
      name: 'read',
      component: Read,
      props: true
    }
  ]
})

export default router
