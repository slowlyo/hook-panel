import React, { useState, useRef, useEffect } from 'react';
import {
  PageContainer,
  ProTable,
  ProColumns,
  ActionType,
} from '@ant-design/pro-components';
import {
  Button,
  Space,
  Tag,
  message,
  Typography,
  Drawer,
  Descriptions,
  theme,
} from 'antd';
import {
  EyeOutlined,
} from '@ant-design/icons';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { getScripts, getAllWebhookLogs, WebhookLog, Script } from '@/services/scripts';
import { formatDateTime } from '@/utils/dateFormat';
import styles from './index.less';

const { Text } = Typography;

interface WebhookLogWithScript extends WebhookLog {
  script: Script;
}

const WebhookLogsPage: React.FC = () => {
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState<WebhookLogWithScript | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const actionRef = useRef<ActionType>();
  const { token } = theme.useToken();

  // 获取脚本列表
  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const response = await getScripts({ page: 1, page_size: 1000 });
        setScripts(response.data);
      } catch (error) {
        console.error('获取脚本列表失败:', error);
      }
    };
    fetchScripts();
  }, []);

  // 获取状态标签
  const getStatusTag = (status: number) => {
    if (status >= 200 && status < 300) {
      return <Tag color="success">{status}</Tag>;
    } else if (status >= 400 && status < 500) {
      return <Tag color="warning">{status}</Tag>;
    } else if (status >= 500) {
      return <Tag color="error">{status}</Tag>;
    } else {
      return <Tag color="default">{status}</Tag>;
    }
  };

  // 获取 webhook 调用记录（使用后端分页）
  const fetchWebhookLogs = async (params: any, sorter: any) => {
    try {
      const { script_id, status, current = 1, pageSize = 20 } = params;

      // 构建查询参数
      const queryParams: any = {
        page: current,
        page_size: pageSize,
      };

      if (script_id) {
        queryParams.script_id = script_id;
      }

      if (status) {
        queryParams.status = status;
      }

      // 处理排序参数
      if (sorter && Object.keys(sorter).length > 0) {
        const sortField = Object.keys(sorter)[0];
        const sortOrder = sorter[sortField];

        if (sortField === 'created_at') {
          queryParams.sort_field = 'created_at';
          queryParams.sort_order = sortOrder === 'ascend' ? 'asc' : 'desc';
        }
        if (sortField === 'response_time') {
          queryParams.sort_field = 'response_time';
          queryParams.sort_order = sortOrder === 'ascend' ? 'asc' : 'desc';
        }
      }

      // 调用后端 API
      const response = await getAllWebhookLogs(queryParams);

      // 为每个日志记录添加脚本信息
      const logsWithScript: WebhookLogWithScript[] = response.data.map((log: WebhookLog) => {
        const script = scripts.find(s => s.id === log.script_id);
        return {
          ...log,
          script: script || { id: log.script_id, name: '未知脚本' } as Script,
        };
      });

      return {
        data: logsWithScript,
        success: true,
        total: response.total,
      };
    } catch (error: any) {
      console.error('获取 webhook 日志失败:', error);
      message.error('获取 webhook 日志失败');
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  // 查看调用详情
  const viewLogDetail = (log: WebhookLogWithScript) => {
    setCurrentLog(log);
    setDetailDrawerVisible(true);
  };

  // 格式化 JSON 字符串
  const formatJson = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonStr;
    }
  };

  // 表格列定义
  const columns: ProColumns<WebhookLogWithScript>[] = [
    {
      title: '调用时间',
      dataIndex: 'created_at',
      sorter: true,
      search: false,
      render: (text) => (
        <Text style={{ fontSize: '12px' }}>
          {formatDateTime(text as string)}
        </Text>
      ),
    },
    {
      title: '脚本名称',
      dataIndex: ['script', 'name'],
      key: 'script_id',
      ellipsis: true,
      valueType: 'select',
      fieldProps: {
        placeholder: '选择脚本',
        allowClear: true,
        options: scripts.map(script => ({
          label: script.name,
          value: script.id,
        })),
      },
      render: (text) => (
        <Space>
          <span style={{ color: token.colorPrimary }}>📄</span>
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        200: { text: '成功 (2xx)', status: 'Success' },
        400: { text: '客户端错误 (4xx)', status: 'Warning' },
        500: { text: '服务器错误 (5xx)', status: 'Error' },
      },
      fieldProps: {
        placeholder: '选择状态',
        allowClear: true,
      },
      render: (status) => getStatusTag(status as number),
    },
    {
      title: '来源IP',
      dataIndex: 'source_ip',
      search: false,
      render: (ip) => (
        <Text code style={{ fontSize: '12px' }}>
          {ip || '-'}
        </Text>
      ),
    },
    {
      title: '响应时间',
      dataIndex: 'response_time',
      sorter: true,
      search: false,
      render: (time) => (
        <Text style={{ fontSize: '12px' }}>
          {time}ms
        </Text>
      ),
    },
    {
      title: '错误信息',
      dataIndex: 'error_msg',
      ellipsis: true,
      search: false,
      render: (msg) => (
        <Text type={msg ? 'danger' : 'secondary'} style={{ fontSize: '12px' }}>
          {msg || '无'}
        </Text>
      ),
    },
    {
      title: '操作',
      search: false,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => viewLogDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      ghost
      className={styles.webhooksContainer}
    >
      <ProTable<WebhookLogWithScript>
        columns={columns}
        actionRef={actionRef}
        request={fetchWebhookLogs}
        rowKey="id"
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
        scroll={{ x: 900 }}
        dateFormatter="string"
        headerTitle="调用记录"
      />

      {/* 调用详情抽屉 */}
      <Drawer
        title="调用详情"
        open={detailDrawerVisible}
        onClose={() => {
          setDetailDrawerVisible(false);
          setCurrentLog(null);
        }}
        width={800}
      >
        {currentLog && (
          <div>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="脚本名称">
                <Space>
                  <span style={{ color: token.colorPrimary }}>📄</span>
                  <Text strong>{currentLog.script.name}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="调用时间">
                {formatDateTime(currentLog.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="请求方法">
                <Tag color="blue">{currentLog.method}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="响应状态">
                {getStatusTag(currentLog.status)}
              </Descriptions.Item>
              <Descriptions.Item label="来源IP">
                <Text code>{currentLog.source_ip}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="User-Agent">
                <Text code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                  {currentLog.user_agent || '-'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="响应时间">
                <Text>{currentLog.response_time}ms</Text>
              </Descriptions.Item>
              <Descriptions.Item label="错误信息">
                <Text type="danger">{currentLog?.error_msg}</Text>
              </Descriptions.Item>
            </Descriptions>

            {/* 请求头 */}
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>请求头:</Text>
              <CodeMirror
                value={formatJson(currentLog.headers)}
                extensions={[json()]}
                theme={oneDark}
                editable={false}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  dropCursor: false,
                  allowMultipleSelections: false,
                }}
              />
            </div>

            {/* 请求体 */}
            {currentLog.body && (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>请求体:</Text>
                <CodeMirror
                  value={currentLog.body.startsWith('{') || currentLog.body.startsWith('[')
                    ? formatJson(currentLog.body)
                    : currentLog.body}
                  extensions={[json()]}
                  theme={oneDark}
                  editable={false}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    dropCursor: false,
                    allowMultipleSelections: false,
                  }}
                />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default WebhookLogsPage;
