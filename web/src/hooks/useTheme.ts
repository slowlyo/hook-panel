import { useState, useEffect, useCallback } from 'react';
import { theme } from 'antd';
import { useAntdConfig, useAntdConfigSetter } from '@umijs/max';

const { darkAlgorithm, defaultAlgorithm } = theme;
const THEME_STORAGE_KEY = 'hook-panel-theme';

export type ThemeMode = 'light' | 'dark';

/**
 * 主题切换 Hook
 * 统一管理主题状态，支持持久化存储和跨组件同步
 */
export const useTheme = () => {
  const setAntdConfig = useAntdConfigSetter();
  const antdConfig = useAntdConfig();
  
  // 检查当前是否为暗色主题
  const algorithm = antdConfig?.theme?.algorithm;
  const isDark = Array.isArray(algorithm)
    ? algorithm.includes(darkAlgorithm)
    : algorithm === darkAlgorithm;
  
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(isDark ? 'dark' : 'light');

  // 初始化主题
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (savedTheme && savedTheme !== currentTheme) {
      setCurrentTheme(savedTheme);
      setAntdConfig({
        theme: {
          algorithm: savedTheme === 'dark' ? [darkAlgorithm] : [defaultAlgorithm],
        },
      });
    }
  }, [setAntdConfig, currentTheme]);

  // 监听主题变化事件
  useEffect(() => {
    const handleStorageChange = () => {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (savedTheme && savedTheme !== currentTheme) {
        setCurrentTheme(savedTheme);
      }
    };

    const handleThemeChange = (e: CustomEvent<{ theme: ThemeMode }>) => {
      setCurrentTheme(e.detail.theme);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeChange', handleThemeChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChange', handleThemeChange as EventListener);
    };
  }, [currentTheme]);

  // 切换主题
  const toggleTheme = useCallback(() => {
    const newTheme: ThemeMode = currentTheme === 'dark' ? 'light' : 'dark';
    
    // 保存到 localStorage
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    
    // 更新状态
    setCurrentTheme(newTheme);
    
    // 更新 antd 配置
    setAntdConfig({
      theme: {
        algorithm: newTheme === 'dark' ? [darkAlgorithm] : [defaultAlgorithm],
      },
    });

    // 发送自定义事件，通知其他组件主题变化
    window.dispatchEvent(new CustomEvent('themeChange', {
      detail: { theme: newTheme }
    }));
  }, [currentTheme, setAntdConfig]);

  // 设置指定主题
  const setTheme = useCallback((theme: ThemeMode) => {
    if (theme === currentTheme) return;
    
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    setCurrentTheme(theme);
    
    setAntdConfig({
      theme: {
        algorithm: theme === 'dark' ? [darkAlgorithm] : [defaultAlgorithm],
      },
    });

    window.dispatchEvent(new CustomEvent('themeChange', {
      detail: { theme }
    }));
  }, [currentTheme, setAntdConfig]);

  // 获取主题相关的样式变量
  const getThemeVars = useCallback(() => {
    return {
      isDark: currentTheme === 'dark',
      isLight: currentTheme === 'light',
      // 常用颜色变量
      colors: {
        background: currentTheme === 'dark' ? '#141414' : '#ffffff',
        containerBg: currentTheme === 'dark' ? '#1f1f1f' : '#f5f5f5',
        text: currentTheme === 'dark' ? '#ffffff' : '#000000',
        textSecondary: currentTheme === 'dark' ? '#a6a6a6' : '#666666',
        border: currentTheme === 'dark' ? '#303030' : '#e5e7eb',
        primary: '#1890ff',
      }
    };
  }, [currentTheme]);

  return {
    theme: currentTheme,
    isDark: currentTheme === 'dark',
    isLight: currentTheme === 'light',
    toggleTheme,
    setTheme,
    getThemeVars,
  };
};

export default useTheme;
