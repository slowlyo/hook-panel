import React from 'react';
import { Tooltip } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTheme } from '@/hooks/useTheme';
import ThemeAwareButton from '@/components/ThemeAwareButton';

/**
 * 主题切换按钮组件
 * 使用自定义 Hook 实现主题切换，支持持久化
 */
const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Tooltip title={isDark ? '切换到亮色模式' : '切换到暗色模式'}>
      <ThemeAwareButton
        icon={isDark ? <MoonOutlined /> : <SunOutlined />}
        onClick={toggleTheme}
      />
    </Tooltip>
  );
};

export default ThemeToggle;
