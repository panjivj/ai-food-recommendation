import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import TabsPage from '@/pages/TabsPage.vue'
import { ApiError } from '@/services/api/client'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/app/home',
  },
  {
    path: '/app/',
    component: TabsPage,
    meta: { requiresAuth: true },
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
        path: 'recommendations/week',
        name: 'weekly-recommendations',
        component: () => import('@/pages/WeeklyRecommendationPage.vue'),
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
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/RegisterPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/profile/setup',
    name: 'profile-setup',
    component: () => import('@/pages/ProfileSetupPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/edit',
    name: 'profile-edit',
    component: () => import('@/pages/EditProfilePage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/menus/:menuId',
    name: 'menu-detail',
    component: () => import('@/pages/MenuDetailPage.vue'),
    meta: { requiresAuth: true },
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

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const profiles = useProfileStore()

  await auth.initialize()

  const requiresAuth = to.matched.some(
    (route) => route.meta.requiresAuth === true,
  )
  const guestOnly = to.matched.some((route) => route.meta.guestOnly === true)

  if (requiresAuth && !auth.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (guestOnly && auth.isAuthenticated) {
    return { name: 'home' }
  }

  if (!requiresAuth || !auth.isAuthenticated) {
    return true
  }

  if (!profiles.loaded) {
    try {
      await profiles.fetch()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return { name: 'login' }
      }

      return true
    }
  }

  if (!profiles.profile && to.name !== 'profile-setup') {
    return { name: 'profile-setup' }
  }

  if (profiles.profile && to.name === 'profile-setup') {
    return { name: 'home' }
  }

  return true
})

export default router
