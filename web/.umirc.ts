import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {
    configProvider: {},
    theme: {
      token: {
        colorPrimary: '#13c2c2'
      }
    }
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
    {
      name: '调用记录',
      path: '/webhook-logs',
      component: './WebhookLogs',
      icon: 'HistoryOutlined',
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

