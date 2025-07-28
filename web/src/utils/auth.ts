/**
 * Authentication related utility functions
 */

const ACCESS_KEY_STORAGE_KEY = 'hook_panel_access_key';

/**
 * Get stored access key
 */
export const getStoredAccessKey = (): string | null => {
  try {
    return localStorage.getItem(ACCESS_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to get access key:', error);
    return null;
  }
};

/**
 * Save access key to local storage
 */
export const setStoredAccessKey = (accessKey: string): void => {
  try {
    localStorage.setItem(ACCESS_KEY_STORAGE_KEY, accessKey);
  } catch (error) {
    console.error('Failed to save access key:', error);
  }
};

/**
 * Clear stored access key
 */
export const clearStoredAccessKey = (): void => {
  try {
    localStorage.removeItem(ACCESS_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear access key:', error);
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const accessKey = getStoredAccessKey();
  return !!accessKey && accessKey.trim().length > 0;
};

/**
 * Validate access key (temporarily any content passes)
 */
export const validateAccessKey = async (accessKey: string): Promise<boolean> => {
  // Temporary validation logic: any non-empty content can pass
  return accessKey.trim().length > 0;
};

/**
 * Logout
 */
export const logout = (): void => {
  clearStoredAccessKey();
  // Redirect to auth page
  window.location.href = '/auth';
};
