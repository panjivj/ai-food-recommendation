import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import TabsPage from '@/pages/TabsPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/app/home',
  },
  {
    path: '/app/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/app/home',
      },
      {
        path: 'home',
        name: 'home',
        component: () => import('@/pages/HomePage.vue'),
      },
      {
        path: 'recommendations',
        name: 'recommendations',
        component: () => import('@/pages/RecommendationPage.vue'),
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/pages/ProfilePage.vue'),
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/RegisterPage.vue'),
  },
  {
    path: '/profile/setup',
    name: 'profile-setup',
    component: () => import('@/pages/ProfileSetupPage.vue'),
  },
  {
    path: '/profile/edit',
    name: 'profile-edit',
    component: () => import('@/pages/EditProfilePage.vue'),
  },
  {
    path: '/menus/:menuId',
    name: 'menu-detail',
    component: () => import('@/pages/MenuDetailPage.vue'),
  },
  {
    path: '/demo/states',
    name: 'system-states',
    component: () => import('@/pages/SystemStatesPage.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/app/home',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
