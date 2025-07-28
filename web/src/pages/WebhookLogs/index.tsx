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
import { useIntl } from '@umijs/max';
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
  const intl = useIntl();

  // Get script list for filter options
  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const response = await getScripts({ page: 1, page_size: 1000 });
        setScripts(response.data);
      } catch (error) {
        console.error(intl.formatMessage({ id: 'webhook_logs.load_scripts_error' }), error);
      }
    };
    fetchScripts();
  }, [intl]);

  // Get status tag
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

  // Get webhook call logs (using backend pagination)
  const fetchWebhookLogs = async (params: any, sorter: any) => {
    try {
      const { script_id, status, current = 1, pageSize = 20 } = params;

      // Build query parameters
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

      // Handle sort parameters
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

      // Call backend API - backend already preloads script info
      const response = await getAllWebhookLogs(queryParams);

      // Backend already includes script info via Preload("Script")
      // Convert to expected format for type safety
      const logsWithScript: WebhookLogWithScript[] = response.data.map((log: WebhookLog) => ({
        ...log,
        script: log.script || {
          id: log.script_id,
          name: intl.formatMessage({ id: 'webhook_logs.unknown_script' })
        } as Script,
      }));

      return {
        data: logsWithScript,
        success: true,
        total: response.total,
      };
    } catch (error: any) {
      console.error(intl.formatMessage({ id: 'webhook_logs.load_logs_error' }), error);
      message.error(intl.formatMessage({ id: 'webhook_logs.load_logs_error' }));
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  // View call details
  const viewLogDetail = (log: WebhookLogWithScript) => {
    setCurrentLog(log);
    setDetailDrawerVisible(true);
  };

  // Format JSON string
  const formatJson = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonStr;
    }
  };

  // Table column definitions
  const columns: ProColumns<WebhookLogWithScript>[] = [
    {
      title: intl.formatMessage({ id: 'webhook_logs.call_time' }),
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
      title: intl.formatMessage({ id: 'webhook_logs.script_name' }),
      dataIndex: ['script', 'name'],
      key: 'script_id',
      ellipsis: true,
      valueType: 'select',
      fieldProps: {
        placeholder: intl.formatMessage({ id: 'webhook_logs.select_script' }),
        allowClear: true,
        options: scripts.map(script => ({
          label: script.name,
          value: script.id,
        })),
      },
      render: (_, record) => (
        <Space>
          <span style={{ color: token.colorPrimary }}>📄</span>
          <Text strong>{record.script?.name || intl.formatMessage({ id: 'webhook_logs.unknown_script' })}</Text>
        </Space>
      ),
    },
    {
      title: intl.formatMessage({ id: 'webhook_logs.status' }),
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        200: { text: intl.formatMessage({ id: 'webhook_logs.status_success_2xx' }), status: 'Success' },
        400: { text: intl.formatMessage({ id: 'webhook_logs.status_client_error_4xx' }), status: 'Warning' },
        500: { text: intl.formatMessage({ id: 'webhook_logs.status_server_error_5xx' }), status: 'Error' },
      },
      fieldProps: {
        placeholder: intl.formatMessage({ id: 'webhook_logs.select_status' }),
        allowClear: true,
      },
      render: (status) => getStatusTag(status as number),
    },
    {
      title: intl.formatMessage({ id: 'webhook_logs.source_ip' }),
      dataIndex: 'source_ip',
      search: false,
      render: (ip) => (
        <Text code style={{ fontSize: '12px' }}>
          {ip || intl.formatMessage({ id: 'webhook_logs.no_data' })}
        </Text>
      ),
    },
    {
      title: intl.formatMessage({ id: 'webhook_logs.response_time' }),
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
      title: intl.formatMessage({ id: 'webhook_logs.error_message' }),
      dataIndex: 'error_msg',
      ellipsis: true,
      search: false,
      render: (msg) => (
        <Text type={msg ? 'danger' : 'secondary'} style={{ fontSize: '12px' }}>
          {msg || intl.formatMessage({ id: 'webhook_logs.no_error' })}
        </Text>
      ),
    },
    {
      title: intl.formatMessage({ id: 'webhook_logs.action' }),
      search: false,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => viewLogDetail(record)}
        >
          {intl.formatMessage({ id: 'webhook_logs.detail' })}
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
          showTotal: (total, range) => intl.formatMessage(
            { id: 'webhook_logs.pagination_total' },
            { start: range[0], end: range[1], total }
          ),
        }}
        scroll={{ x: 900 }}
        dateFormatter="string"
        headerTitle={intl.formatMessage({ id: 'webhook_logs.title' })}
      />

      {/* Call Details Drawer */}
      <Drawer
        title={intl.formatMessage({ id: 'webhook_logs.detail_title' })}
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
              <Descriptions.Item label={intl.formatMessage({ id: 'webhook_logs.script_name' })}>
                <Space>
                  <span style={{ color: token.colorPrimary }}>📄</span>
                  <Text strong>{currentLog.script.name}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: 'webhook_logs.call_time' })}>
                {formatDateTime(currentLog.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: 'webhook_logs.request_method' })}>
                <Tag color="blue">{currentLog.method}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: 'webhook_logs.response_status' })}>
                {getStatusTag(currentLog.status)}
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: 'webhook_logs.source_ip' })}>
                <Text code>{currentLog.source_ip}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: 'webhook_logs.user_agent' })}>
                <Text code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                  {currentLog.user_agent || intl.formatMessage({ id: 'webhook_logs.no_data' })}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: 'webhook_logs.response_time' })}>
                <Text>{currentLog.response_time}ms</Text>
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: 'webhook_logs.error_message' })}>
                <Text type="danger">{currentLog?.error_msg}</Text>
              </Descriptions.Item>
            </Descriptions>

            {/* Request Headers */}
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                {intl.formatMessage({ id: 'webhook_logs.request_headers' })}:
              </Text>
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

            {/* Request Body */}
            {currentLog.body && (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  {intl.formatMessage({ id: 'webhook_logs.request_body' })}:
                </Text>
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
