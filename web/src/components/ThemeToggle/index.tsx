import React from 'react';
import { Tooltip } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { useTheme } from '@/hooks/useTheme';
import ThemeAwareButton from '@/components/ThemeAwareButton';

/**
 * 主题切换按钮组件
 * 使用自定义 Hook 实现主题切换，支持持久化和多语言
 */
const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const intl = useIntl();

  return (
    <Tooltip title={isDark
      ? intl.formatMessage({ id: 'theme.toggle_to_light' })
      : intl.formatMessage({ id: 'theme.toggle_to_dark' })
    }>
      <ThemeAwareButton
        icon={isDark ? <MoonOutlined /> : <SunOutlined />}
        onClick={toggleTheme}
      />
    </Tooltip>
  );
};

export default ThemeToggle;
