import React from 'react';
import { Button, ButtonProps } from 'antd';
import { useTheme } from '@/hooks/useTheme';

interface ThemeAwareButtonProps extends ButtonProps {
  children?: React.ReactNode;
}

/**
 * 主题感知按钮组件
 * 自动根据当前主题调整按钮颜色
 */
const ThemeAwareButton: React.FC<ThemeAwareButtonProps> = ({ 
  style, 
  children, 
  ...props 
}) => {
  const { getThemeVars } = useTheme();
  const themeVars = getThemeVars();

  const buttonStyle = {
    color: themeVars.colors.textSecondary,
    fontSize: '16px',
    ...style,
  };

  return (
    <Button
      type="text"
      style={buttonStyle}
      {...props}
    >
      {children}
    </Button>
  );
};

export default ThemeAwareButton;
