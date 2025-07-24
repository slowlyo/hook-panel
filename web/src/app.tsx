// 运行时配置
import webhook from './assets/webhook.png';
import { isAuthenticated, getStoredAccessKey } from './utils/auth';
import { history, RuntimeAntdConfig } from '@umijs/max';
import { Space, theme, message } from 'antd';

import ThemeToggle from '@/components/ThemeToggle';
import LogoutButton from '@/components/LogoutButton';

const { darkAlgorithm, defaultAlgorithm } = theme;
const THEME_STORAGE_KEY = 'hook-panel-theme';

// 全局初始化数据配置，用于 Layout 用户信息和权限初始化
// 更多信息见文档：https://umijs.org/docs/api/runtime-config#getinitialstate
export async function getInitialState(): Promise<any> {
  // 检查当前路径是否为认证页面
  const isAuthPage = window.location.pathname === '/auth';

  // 检查是否已认证
  const authenticated = isAuthenticated();

  // 如果未认证且不在认证页面，重定向到认证页面
  if (!authenticated && !isAuthPage) {
    history.push('/auth');
    return {
      authenticated: false,
    };
  }

  // 如果已认证且在认证页面，重定向到首页
  if (authenticated && isAuthPage) {
    history.push('/home');
  }

  return {
    authenticated,
  };
}

// antd 运行时配置，在应用启动时设置主题
export const antd: RuntimeAntdConfig = (memo) => {
  // 从 localStorage 读取保存的主题
  const savedTheme = typeof window !== 'undefined'
    ? localStorage.getItem(THEME_STORAGE_KEY)
    : null;

  memo.theme ??= {};
  memo.theme.algorithm = savedTheme === 'dark' ? [darkAlgorithm] : [defaultAlgorithm];

  return memo;
};

// request 运行时配置
export const request = {
  // 请求拦截器
  requestInterceptors: [
    (config: any) => {
      // 自动添加认证头
      const accessKey = getStoredAccessKey();
      if (accessKey) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${accessKey}`,
        };
      }
      return config;
    },
  ],
  // 响应拦截器
  responseInterceptors: [
    (response: any) => {
      // 处理响应
      if (response.status === 401) {
        message.error('认证失败，请重新登录');
        history.push('/auth');
      }
      return response;
    },
  ],
  // 错误处理
  errorConfig: {
    errorHandler: (error: any) => {
      if (error.response?.status === 401) {
        message.error('认证失败，请重新登录');
        history.push('/auth');
      } else if (error.response?.status >= 500) {
        message.error('服务器错误，请稍后重试');
      } else if (error.message) {
        message.error(error.message);
      }
      throw error;
    },
  },
};

export const layout = () => {
  return {
    logo: webhook,
    menu: {
      locale: true,
    },
    layout: 'top',
    dark: true,
    // 自定义顶部右侧内容
    rightContentRender: () => {
      return (
        <Space style={{ marginRight: '16px' }}>
          <ThemeToggle />
          <LogoutButton />
        </Space>
      );
    },
  };
};
