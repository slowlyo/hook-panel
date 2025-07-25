/**
 * 格式化日期时间
 * @param dateTime 日期时间字符串或 Date 对象
 * @param format 格式类型
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (
  dateTime: string | Date,
  format: 'full' | 'date' | 'time' = 'full'
): string => {
  try {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour12: false,
    };

    if (format === 'full' || format === 'time') {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
    }

    if (format === 'time') {
      delete options.year;
      delete options.month;
      delete options.day;
    }

    return date.toLocaleString('zh-CN', options);
  } catch (error) {
    return typeof dateTime === 'string' ? dateTime : dateTime.toString();
  }
};

/**
 * 格式化相对时间
 * @param dateTime 日期时间字符串或 Date 对象
 * @returns 相对时间字符串（如：2分钟前、1小时前）
 */
export const formatRelativeTime = (dateTime: string | Date): string => {
  try {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return '刚刚';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return formatDateTime(date, 'date');
    }
  } catch (error) {
    return typeof dateTime === 'string' ? dateTime : dateTime.toString();
  }
};
