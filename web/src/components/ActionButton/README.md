# ActionButton 组件

一个智能的行内操作按钮组件，自动根据主题和颜色计算悬浮背景色。

## 特性

- 🎨 **智能颜色计算**：自动根据基础颜色计算悬浮背景色
- 🌙 **主题感知**：支持亮色/暗色主题自动适配
- 🔧 **高度可配置**：支持所有 Antd Button 属性
- 💡 **内置 Tooltip**：可选的提示文本支持
- 🚀 **零配置**：开箱即用，无需手动设置悬浮色

## 颜色算法

### 暗色主题
使用原色的低透明度版本：`rgba(r, g, b, 0.1)`

### 亮色主题
通过 HSL 色彩空间计算：
1. 将 RGB 转换为 HSL
2. 降低饱和度到原来的 30%（最大 25%）
3. 提高亮度到 92-95%
4. 转换回 RGB

## 使用示例

```tsx
import ActionButton from '@/components/ActionButton';

// 基础用法
<ActionButton
  color="#52c41a"
  icon={<PlayCircleOutlined />}
  onClick={handleClick}
  tooltip="执行"
/>

// 禁用状态
<ActionButton
  color="#1677ff"
  icon={<EditOutlined />}
  disabled={true}
  disableHover={true}
  tooltip="编辑"
/>

// 加载状态
<ActionButton
  color="#722ed1"
  icon={<CopyOutlined />}
  loading={isLoading}
  tooltip="复制"
/>
```

## 颜色示例

| 原色 | 亮色主题背景 | 暗色主题背景 |
|------|-------------|-------------|
| `#52c41a` (绿色) | 计算得出的浅绿色 | `rgba(82, 196, 26, 0.1)` |
| `#1677ff` (蓝色) | 计算得出的浅蓝色 | `rgba(22, 119, 255, 0.1)` |
| `#fa8c16` (橙色) | 计算得出的浅橙色 | `rgba(250, 140, 22, 0.1)` |
| `#722ed1` (紫色) | 计算得出的浅紫色 | `rgba(114, 46, 209, 0.1)` |
| `#ff4d4f` (红色) | 计算得出的浅红色 | `rgba(255, 77, 79, 0.1)` |
