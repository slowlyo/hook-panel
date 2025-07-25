import React from 'react';
import { Button, Tooltip, ButtonProps } from 'antd';
import { useTheme } from '@/hooks/useTheme';

export interface ActionButtonProps extends Omit<ButtonProps, 'type' | 'color'> {
  /** 按钮颜色 */
  color: string;
  /** 提示文本 */
  tooltip?: string;
  /** 是否禁用悬浮效果 */
  disableHover?: boolean;
  children?: React.ReactNode;
}

/**
 * 行内操作按钮组件
 * 自动根据主题和颜色计算悬浮背景色，减少重复代码
 */
const ActionButton: React.FC<ActionButtonProps> = ({
  color,
  tooltip,
  disableHover = false,
  style,
  onMouseEnter,
  onMouseLeave,
  disabled,
  children,
  ...props
}) => {
  const { isDark } = useTheme();

  /**
   * 将十六进制颜色转换为 RGB
   */
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  /**
   * 将 RGB 转换为 HSL
   */
  const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  /**
   * 将 HSL 转换为 RGB
   */
  const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  };

  /**
   * 根据主题和颜色自动计算悬浮背景色
   */
  const getHoverBackgroundColor = (baseColor: string): string => {
    const rgb = hexToRgb(baseColor);
    if (!rgb) return 'transparent';

    if (isDark) {
      // 暗色主题：使用低透明度的原色
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
    } else {
      // 亮色主题：计算高亮度、低饱和度的背景色
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

      // 调整为高亮度(90-95%)、低饱和度(15-25%)的颜色
      const lightHsl = {
        h: hsl.h,
        s: Math.min(hsl.s * 0.3, 25), // 降低饱和度到原来的30%，最大25%
        l: Math.max(92, Math.min(95, 100 - hsl.l * 0.1)), // 亮度设为92-95%
      };

      const lightRgb = hslToRgb(lightHsl.h, lightHsl.s, lightHsl.l);
      return `rgb(${lightRgb.r}, ${lightRgb.g}, ${lightRgb.b})`;
    }
  };

  const buttonStyle: React.CSSProperties = {
    color: disabled ? 'var(--ant-color-text-disabled)' : color,
    transition: 'all 0.2s ease',
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (!disabled && !disableHover) {
      e.currentTarget.style.backgroundColor = getHoverBackgroundColor(color);
      e.currentTarget.style.borderColor = color;
    }
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (!disableHover) {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.borderColor = 'transparent';
    }
    onMouseLeave?.(e);
  };

  const button = (
    <Button
      type="text"
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );

  // 如果有 tooltip，包装在 Tooltip 组件中
  if (tooltip) {
    return <Tooltip title={tooltip}>{button}</Tooltip>;
  }

  return button;
};

export default ActionButton;
