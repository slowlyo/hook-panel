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
  locale: {
    default: 'zh-CN',
    antd: true,
    baseNavigator: true,
    baseSeparator: '-',
    useLocalStorage: true,
  },
  history:{
    type: 'hash'
  },
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      name: 'auth',
      path: '/auth',
      component: './Auth',
      layout: false, // 认证页面不使用布局
    },
    {
      name: 'home',
      path: '/home',
      component: './Home',
      icon: 'HomeOutlined',
    },
    {
      name: 'scripts',
      path: '/scripts',
      component: './Scripts',
      icon: 'CodeOutlined',
    },
    {
      name: 'webhook-logs',
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

