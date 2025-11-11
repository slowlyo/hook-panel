/**
 * 统一的复制到剪贴板工具函数
 * 支持现代浏览器的 Clipboard API 和传统浏览器的降级方案
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // 优先使用 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // 降级方案：使用传统的 execCommand
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    textarea.setAttribute('readonly', '');
    
    document.body.appendChild(textarea);
    
    // 选择文本
    if (navigator.userAgent.match(/ipad|iphone/i)) {
      // iOS 设备特殊处理
      const range = document.createRange();
      range.selectNodeContents(textarea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textarea.setSelectionRange(0, textarea.value.length);
    } else {
      textarea.select();
    }
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    if (!successful) {
      throw new Error('execCommand copy failed');
    }
    
    return true;
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    return false;
  }
};
