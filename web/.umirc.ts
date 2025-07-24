import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {
    configProvider: {},
  },
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: 'Hook Panel',
  },
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      name: '认证',
      path: '/auth',
      component: './Auth',
      layout: false, // 认证页面不使用布局
    },
    {
      name: '首页',
      path: '/home',
      component: './Home',
      icon: 'HomeOutlined',
    },
    {
      name: '脚本管理',
      path: '/scripts',
      component: './Scripts',
      icon: 'CodeOutlined',
    },
  ],
  npmClient: 'pnpm',
  // 代理配置
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' },
    },
    '/health': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
});

