/**
 * 认证相关工具函数
 */

const ACCESS_KEY_STORAGE_KEY = 'hook_panel_access_key';

/**
 * 获取存储的访问密钥
 */
export const getStoredAccessKey = (): string | null => {
  try {
    return localStorage.getItem(ACCESS_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('获取访问密钥失败:', error);
    return null;
  }
};

/**
 * 保存访问密钥到本地存储
 */
export const setStoredAccessKey = (accessKey: string): void => {
  try {
    localStorage.setItem(ACCESS_KEY_STORAGE_KEY, accessKey);
  } catch (error) {
    console.error('保存访问密钥失败:', error);
  }
};

/**
 * 清除存储的访问密钥
 */
export const clearStoredAccessKey = (): void => {
  try {
    localStorage.removeItem(ACCESS_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('清除访问密钥失败:', error);
  }
};

/**
 * 检查是否已认证
 */
export const isAuthenticated = (): boolean => {
  const accessKey = getStoredAccessKey();
  return !!accessKey && accessKey.trim().length > 0;
};

/**
 * 验证访问密钥（暂时任意内容都通过）
 */
export const validateAccessKey = async (accessKey: string): Promise<boolean> => {
  // 暂时的验证逻辑：任意非空内容都可以通过
  return accessKey.trim().length > 0;
};

/**
 * 退出登录
 */
export const logout = (): void => {
  clearStoredAccessKey();
  // 重定向到认证页面
  window.location.href = '/auth';
};
