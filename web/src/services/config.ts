import { request } from '@umijs/max';

// 配置项类型定义
export interface ConfigResponse {
  key: string;
  value: string;
  type: string;
  category: string;
  label: string;
  description: string;
  options?: string; // JSON格式的选项数据
  required: boolean;
}

// 配置分类类型定义
export interface ConfigCategory {
  category: string;
  label: string;
  configs: ConfigResponse[];
}

// 配置更新请求
export interface ConfigUpdateRequest {
  configs: ConfigItem[];
}

// 配置项
export interface ConfigItem {
  key: string;
  value: string;
}

// 获取系统配置
export async function getSystemConfigs() {
  return request<{
    data: ConfigCategory[];
  }>('/api/config', {
    method: 'GET',
  });
}

// 更新系统配置
export async function updateSystemConfigs(data: ConfigUpdateRequest) {
  return request<{
    message: string;
  }>('/api/config', {
    method: 'PUT',
    data,
  });
}

// 获取单个配置值的辅助函数
export function getConfigValue(categories: ConfigCategory[], key: string): string {
  for (const category of categories) {
    const config = category.configs.find(c => c.key === key);
    if (config) {
      return config.value;
    }
  }
  return '';
}

// 构建配置更新请求的辅助函数
export function buildConfigUpdateRequest(formValues: Record<string, any>): ConfigUpdateRequest {
  const configs: ConfigItem[] = [];
  
  for (const [key, value] of Object.entries(formValues)) {
    configs.push({
      key,
      value: String(value || ''),
    });
  }
  
  return { configs };
}
