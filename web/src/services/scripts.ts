import { request } from '@umijs/max';

// 脚本数据类型定义
export interface Script {
  id: string;
  name: string;
  description: string;
  executor: string;
  enabled: boolean;
  call_count: number;
  last_call_at?: string;
  created_at: string;
  updated_at: string;
}

// 脚本响应类型（包含内容）
export interface ScriptResponse extends Script {
  content: string;
}

// 脚本列表响应
export interface ScriptListResponse {
  data: Script[];
  total: number;
  page: number;
  pageSize: number;
}

// 创建脚本请求
export interface CreateScriptRequest {
  name: string;
  description?: string;
  content?: string;
  executor: string;
  enabled?: boolean;
}

// 更新脚本请求
export interface UpdateScriptRequest {
  name?: string;
  description?: string;
  content?: string;
  executor?: string;
  enabled?: boolean;
}

// 获取脚本列表
export async function getScripts(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  enabled?: boolean;
  sort_field?: string;
  sort_order?: 'asc' | 'desc';
}) {
  return request<ScriptListResponse>('/api/scripts', {
    method: 'GET',
    params,
  });
}

// 获取单个脚本（包含内容）
export async function getScript(id: string) {
  return request<ScriptResponse>(`/api/scripts/${id}`, {
    method: 'GET',
  });
}

// 创建脚本
export async function createScript(data: CreateScriptRequest) {
  return request<{ message: string; data: Script }>('/api/scripts', {
    method: 'POST',
    data,
  });
}

// 更新脚本
export async function updateScript(id: string, data: UpdateScriptRequest) {
  return request<{ message: string }>(`/api/scripts/${id}`, {
    method: 'PUT',
    data,
  });
}

// 删除脚本
export async function deleteScript(id: string) {
  return request<{ message: string }>(`/api/scripts/${id}`, {
    method: 'DELETE',
  });
}

// 切换脚本启用状态
export async function toggleScript(id: string) {
  return request<{ message: string; enabled: boolean }>(`/api/scripts/${id}/toggle`, {
    method: 'POST',
  });
}

// 增加调用次数
export async function incrementCallCount(id: string) {
  return request<{ message: string }>(`/api/scripts/${id}/call`, {
    method: 'POST',
  });
}

// 执行结果类型定义
export interface ExecutionResult {
  success: boolean;
  output: string;
  error: string;
  exit_code: number;
  duration: string;
  timestamp: string;
}

// 执行脚本
export async function executeScript(id: string) {
  return request<{ message: string; result: ExecutionResult }>(`/api/scripts/${id}/execute`, {
    method: 'POST',
  });
}

// 获取脚本日志
export async function getScriptLogs(id: string) {
  return request<{ logs: string }>(`/api/scripts/${id}/logs`, {
    method: 'GET',
  });
}

// 清空脚本日志
export async function clearScriptLogs(id: string) {
  return request<{ message: string }>(`/api/scripts/${id}/logs`, {
    method: 'DELETE',
  });
}
