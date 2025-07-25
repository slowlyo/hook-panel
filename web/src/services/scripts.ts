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

// 获取脚本的 webhook URL
export async function getWebhookURL(id: string) {
  return request<{
    webhook_url: string;
    signature: string;
    script_id: string;
    script_name: string;
  }>(`/api/scripts/${id}/webhook`, {
    method: 'GET',
  });
}

// Webhook 调用记录类型定义
export interface WebhookLog {
  id: string;
  script_id: string;
  method: string;
  headers: string;
  body: string;
  source_ip: string;
  user_agent: string;
  status: number;
  response_time: number;
  error_msg: string;
  created_at: string;
  script?: Script;
}

// Webhook 调用记录列表响应
export interface WebhookLogListResponse {
  data: WebhookLog[];
  total: number;
  page: number;
  page_size: number;
}

// Webhook 调用统计
export interface WebhookLogStats {
  total_calls: number;
  success_calls: number;
  failed_calls: number;
  success_rate: number;
  avg_response_time: number;
  last_call_time?: string;
}

// 获取 webhook 调用记录
export async function getWebhookLogs(id: string, params?: {
  status?: number;
  start_time?: string;
  end_time?: string;
  page?: number;
  page_size?: number;
}) {
  return request<WebhookLogListResponse>(`/api/scripts/${id}/webhook-logs`, {
    method: 'GET',
    params,
  });
}

// 获取 webhook 调用统计
export async function getWebhookLogStats(id: string) {
  return request<WebhookLogStats>(`/api/scripts/${id}/webhook-stats`, {
    method: 'GET',
  });
}

// 清空 webhook 调用记录
export async function clearWebhookLogs(id: string) {
  return request<{ message: string; deleted: number }>(`/api/scripts/${id}/webhook-logs`, {
    method: 'DELETE',
  });
}

// 获取全局 webhook 调用记录（用于 WebhookLogs 页面）
export async function getAllWebhookLogs(params?: {
  script_id?: string;
  status?: number;
  start_time?: string;
  end_time?: string;
  page?: number;
  page_size?: number;
  sort_field?: string;
  sort_order?: 'asc' | 'desc';
}) {
  return request<WebhookLogListResponse>('/api/webhook-logs', {
    method: 'GET',
    params,
  });
}

// 仪表板统计数据类型
export interface DashboardStats {
  total_scripts: number;
  enabled_scripts: number;
  disabled_scripts: number;
  total_calls: number;
  success_calls: number;
  failed_calls: number;
  success_rate: number;
  avg_response_time: number;
  last_call_time?: string;
  today_calls: number;
}

// 获取仪表板统计数据
export async function getDashboardStats() {
  return request<DashboardStats>('/api/dashboard/stats', {
    method: 'GET',
  });
}
