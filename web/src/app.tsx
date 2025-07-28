// Runtime configuration
import webhook from './assets/webhook.png';
import { isAuthenticated, getStoredAccessKey } from './utils/auth';
import { history, RuntimeAntdConfig, RuntimeConfig, setLocale } from '@umijs/max';
import { Space, theme, message } from 'antd';
import { getSystemConfigs, getConfigValue } from '@/services/config';

import ThemeToggle from '@/components/ThemeToggle';
import LogoutButton from '@/components/LogoutButton';

const { darkAlgorithm, defaultAlgorithm } = theme;
const THEME_STORAGE_KEY = 'hook-panel-theme';

// Global initialization data configuration for Layout user info and permission initialization
// More info: https://umijs.org/docs/api/runtime-config#getinitialstate
export async function getInitialState(): Promise<any> {
  // Check if current path is auth page
  const isAuthPage = window.location.pathname === '/auth';

  // Check if user is authenticated
  const authenticated = isAuthenticated();

  // If not authenticated and not on auth page, redirect to auth page
  if (!authenticated && !isAuthPage) {
    history.push('/auth');
    return {
      authenticated: false,
      currentLanguage: 'zh-CN', // Default Chinese
    };
  }

  // If authenticated and on auth page, redirect to home page
  if (authenticated && isAuthPage) {
    history.push('/home');
  }

  // Get system configuration (only when authenticated)
  let systemConfigs = null;
  let currentLanguage = 'zh-CN';

  if (authenticated) {
    try {
      const response = await getSystemConfigs();
      systemConfigs = response.data;
      currentLanguage = getConfigValue(systemConfigs, 'system.language') || 'zh-CN';

      // Update cached language configuration to ensure frontend-backend consistency
      setLocale(currentLanguage, false);
    } catch (error) {
      console.error('Failed to load system configs:', error);
    }
  }

  return {
    authenticated,
    systemConfigs,
    currentLanguage,
  };
}

// antd runtime configuration, set theme on app startup
export const antd: RuntimeAntdConfig = (memo) => {
  // Read saved theme from localStorage
  const savedTheme = typeof window !== 'undefined'
    ? localStorage.getItem(THEME_STORAGE_KEY)
    : null;

  memo.theme ??= {};
  memo.theme.algorithm = savedTheme === 'dark' ? [darkAlgorithm] : [defaultAlgorithm];

  return memo;
};

// locale runtime configuration
export const locale: RuntimeConfig['locale'] = {
  getLocale() {
    // Prefer saved user language from localStorage
    const savedLocale = localStorage.getItem('umi_locale');
    if (savedLocale) {
      return savedLocale;
    }

    // Fallback to browser language detection
    const browserLang = navigator.language;
    if (browserLang.startsWith('zh')) {
      return 'zh-CN';
    } else if (browserLang.startsWith('en')) {
      return 'en-US';
    }

    // Default Chinese
    return 'zh-CN';
  },
};

// Request runtime configuration
export const request = {
  // Request interceptors
  requestInterceptors: [
    (config: any) => {
      // Automatically add auth header
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
  // Response interceptors
  responseInterceptors: [
    (response: any) => {
      // Handle response
      if (response.status === 401) {
        history.push('/auth');
      }
      return response;
    },
  ],
  // Error handling
  errorConfig: {
    errorHandler: (error: any) => {
      // Only handle auth errors, let specific business code handle other errors
      if (error.response?.status === 401) {
        history.push('/auth');
        return;
      }

      // For script execution related errors, don't handle globally, let business code handle
      const isScriptExecutionError = error.config?.url?.includes('/execute') ||
                                   error.config?.url?.includes('/scripts');

      if (!isScriptExecutionError && error.response?.status >= 500) {
        message.error('Server error');
      }

      // Throw error for business code to handle
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
    // Custom top right content
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
