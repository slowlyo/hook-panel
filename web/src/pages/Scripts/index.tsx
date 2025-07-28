import React, { useState, useRef } from 'react';
import {
  PageContainer,
  ProTable,
  ProColumns,
  ActionType,
} from '@ant-design/pro-components';
import {
  Button,
  Space,
  Popconfirm,
  message,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { ScriptForm, ScriptItem, LogsModal, ExecutionResultModal, WebhookModal } from './components';
import { getScripts, getScript, deleteScript as deleteScriptAPI, toggleScript, createScript, executeScript, ExecutionResult } from '@/services/scripts';
import { getExecutorValueEnum, getExecutorRenderConfig } from '@/constants/executors';
import ActionButton from '@/components/ActionButton';
import { formatDateTime } from '@/utils/dateFormat';
import styles from './index.less';



const ScriptsPage: React.FC = () => {
  const [formVisible, setFormVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ScriptItem | null>(null);
  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [executionResultModalVisible, setExecutionResultModalVisible] = useState(false);
  const [webhookModalVisible, setWebhookModalVisible] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [executingScriptId, setExecutingScriptId] = useState<string | null>(null);
  const [copyingScriptId, setCopyingScriptId] = useState<string | null>(null);
  const [executedScript, setExecutedScript] = useState<ScriptItem | null>(null);
  const actionRef = useRef<ActionType>();
  const intl = useIntl();





  // Get script list - using standard ProTable request format
  const fetchScripts = async (params: any, sort: any) => {
    try {
      const { current, pageSize, ...rest } = params;

      // Handle sort parameters
      let sort_field = undefined;
      let sort_order = undefined;
      if (sort && Object.keys(sort).length > 0) {
        // Get first sort field
        const fieldName = Object.keys(sort)[0];
        const order = sort[fieldName];
        sort_field = fieldName;
        sort_order = order === 'ascend' ? 'asc' : 'desc';
      }

      // Build query parameters
      const queryParams: any = {
        page: current || 1,
        page_size: pageSize || 20,
        sort_field,
        sort_order,
        ...rest,
      };

      // Handle search keywords
      if (params?.name || params?.description) {
        queryParams.search = params.name || params.description || '';
      }

      // Handle status filter
      if (params?.status) {
        queryParams.enabled = params.status === 'enabled';
      }

      // Handle executor filter
      if (params?.executor) {
        queryParams.executor = params.executor;
      }

      const response = await getScripts(queryParams);

      // Transform data format for frontend display
      const transformedData = response.data.map(script => ({
        id: script.id,
        name: script.name,
        description: script.description,
        content: '', // List page doesn't need content
        executor: script.executor,
        status: script.enabled ? 'enabled' as const : 'disabled' as const,
        trigger: 'webhook' as const,
        createdAt: script.created_at,
        updatedAt: script.updated_at,
        lastCallTime: script.last_call_at,
        callCount: script.call_count,
      }));

      return {
        data: transformedData,
        success: true,
        total: response.total,
      };
    } catch (error) {
      console.error(intl.formatMessage({ id: 'scripts.load_error' }), error);
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  // Toggle script status
  const toggleStatus = async (record: ScriptItem) => {
    try {
      const response = await toggleScript(record.id);
      message.success(response.message);
      actionRef.current?.reload();
    } catch (error: any) {
      console.error(intl.formatMessage({ id: 'scripts.toggle_error' }), error);

      let errorMessage = intl.formatMessage({ id: 'scripts.operation_failed' });
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    }
  };

  // Delete script
  const deleteScript = async (id: string) => {
    try {
      const response = await deleteScriptAPI(id);
      message.success(response.message);
      actionRef.current?.reload();
    } catch (error: any) {
      console.error(intl.formatMessage({ id: 'scripts.delete_failed' }), error);

      let errorMessage = intl.formatMessage({ id: 'scripts.delete_failed' });
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    }
  };

  // Copy script
  const copyScript = async (record: ScriptItem) => {
    if (copyingScriptId) {
      message.warning(intl.formatMessage({ id: 'scripts.copy_in_progress' }));
      return;
    }

    setCopyingScriptId(record.id);
    try {
      // First get complete script content
      const fullScript = await getScript(record.id);

      const newScriptData = {
        name: `${record.name}${intl.formatMessage({ id: 'scripts.copy_suffix' })}`,
        description: record.description,
        content: fullScript.content, // Use retrieved complete content
        executor: fullScript.executor, // Use same executor
        enabled: false, // Copy is disabled by default
      };

      const response = await createScript(newScriptData);
      message.success(response.message);
      actionRef.current?.reload();
    } catch (error: any) {
      console.error(intl.formatMessage({ id: 'scripts.copy_failed' }), error);

      let errorMessage = intl.formatMessage({ id: 'scripts.copy_failed' });
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    } finally {
      setCopyingScriptId(null);
    }
  };

  // Form submit success callback
  const handleFormSuccess = () => {
    setFormVisible(false);
    setCurrentRecord(null);
    actionRef.current?.reload();
  };

  // Execute script
  const runScript = async (record: ScriptItem) => {
    if (executingScriptId) {
      message.warning(intl.formatMessage({ id: 'scripts.execute_in_progress' }));
      return;
    }

    setExecutingScriptId(record.id);
    try {
      const response = await executeScript(record.id);

      // Check execution result
      if (response.result.success) {
        message.success(intl.formatMessage({ id: 'scripts.execute_success_msg' }, { name: record.name }));
      } else {
        message.warning(intl.formatMessage({ id: 'scripts.execute_warning_msg' }, { name: record.name }));
      }

      // Show execution result
      setExecutionResult(response.result);
      setExecutedScript(record);
      setExecutionResultModalVisible(true);

      // Refresh data to show latest call count
      actionRef.current?.reload();
    } catch (error: any) {
      console.error(intl.formatMessage({ id: 'scripts.execute_failed' }), error);

      // Extract specific error message from backend
      let errorMessage = intl.formatMessage({ id: 'scripts.execute_failed' });
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    } finally {
      setExecutingScriptId(null);
    }
  };

  // View logs
  const viewLogs = (record: ScriptItem) => {
    setCurrentRecord(record);
    setLogsModalVisible(true);
  };

  // View webhook
  const viewWebhook = (record: ScriptItem) => {
    setCurrentRecord(record);
    setWebhookModalVisible(true);
  };

  // Table column definitions
  const columns: ProColumns<ScriptItem>[] = [
    {
      title: intl.formatMessage({ id: 'scripts.script_name' }),
      dataIndex: 'name',
      width: 200,
      ellipsis: true,
      render: (text) => (
        <Space>
          <span style={{ color: '#1890ff' }}>📄</span>
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: intl.formatMessage({ id: 'scripts.description' }),
      dataIndex: 'description',
      ellipsis: true,
      search: false,
    },

    {
      title: intl.formatMessage({ id: 'scripts.status' }),
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        enabled: { text: intl.formatMessage({ id: 'scripts.enabled' }), status: 'Success' },
        disabled: { text: intl.formatMessage({ id: 'scripts.disabled' }), status: 'Default' },
      },
      render: (_, record) => (
        <Switch
          checked={record.status === 'enabled'}
          onChange={() => toggleStatus(record)}
          checkedChildren={intl.formatMessage({ id: 'scripts.enabled' })}
          unCheckedChildren={intl.formatMessage({ id: 'scripts.disabled' })}
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'scripts.executor' }),
      dataIndex: 'executor',
      width: 120,
      valueType: 'select',
      valueEnum: getExecutorValueEnum(),
      render: (_, record) => {
        const executorRenderConfig = getExecutorRenderConfig();
        const config = executorRenderConfig[record.executor] || executorRenderConfig.bash;
        return (
          <Space>
            <span>{config.icon}</span>
            <span style={{ color: config.color, fontWeight: 500 }}>{config.text}</span>
          </Space>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'scripts.call_count' }),
      dataIndex: 'callCount',
      width: 100,
      search: false,
      sorter: true,
      render: (_, record) => (
        <span style={{ color: record.callCount > 0 ? '#52c41a' : '#999' }}>
          {record.callCount.toLocaleString()}
        </span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'scripts.last_call' }),
      dataIndex: 'lastCallTime',
      width: 180,
      search: false,
      sorter: true,
      render: (_, record) => {
        const formattedTime = record.lastCallTime ? formatDateTime(record.lastCallTime) : null;
        return (
          <span style={{ color: formattedTime ? '#666' : '#ccc' }}>
            {formattedTime || intl.formatMessage({ id: 'scripts.never_called' })}
          </span>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'scripts.created_at' }),
      dataIndex: 'createdAt',
      width: 180,
      search: false,
      sorter: true,
      render: (_, record) => (
        <span style={{ color: '#666' }}>
          {formatDateTime(record.createdAt)}
        </span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'scripts.action' }),
      valueType: 'option',
      width: 250,
      render: (_, record) => [
        <ActionButton
          key="exec"
          tooltip={intl.formatMessage({ id: 'scripts.tooltip_execute' })}
          color="#52c41a"
          icon={<PlayCircleOutlined />}
          onClick={() => runScript(record)}
          loading={executingScriptId === record.id}
          disabled={!record.status || record.status === 'disabled'}
          disableHover={!record.status || record.status === 'disabled'}
        />,
        <ActionButton
          key="logs"
          tooltip={intl.formatMessage({ id: 'scripts.tooltip_logs' })}
          color="#1677ff"
          icon={<FileTextOutlined />}
          onClick={() => viewLogs(record)}
        />,
        <ActionButton
          key="webhook"
          tooltip={intl.formatMessage({ id: 'scripts.tooltip_webhook' })}
          color="#13c2c2"
          icon={<LinkOutlined />}
          onClick={() => viewWebhook(record)}
        />,
        <ActionButton
          key="edit"
          tooltip={intl.formatMessage({ id: 'scripts.tooltip_edit' })}
          color="#fa8c16"
          icon={<EditOutlined />}
          onClick={() => {
            setCurrentRecord(record);
            setFormVisible(true);
          }}
        />,
        <ActionButton
          key="copy"
          tooltip={intl.formatMessage({ id: 'scripts.tooltip_copy' })}
          color="#722ed1"
          icon={<CopyOutlined />}
          onClick={() => copyScript(record)}
          loading={copyingScriptId === record.id}
        />,
        <Popconfirm
          key="delete"
          title={intl.formatMessage({ id: 'scripts.confirm_delete' })}
          description={intl.formatMessage({ id: 'scripts.confirm_delete_desc' })}
          onConfirm={() => deleteScript(record.id)}
          okText={intl.formatMessage({ id: 'scripts.confirm' })}
          cancelText={intl.formatMessage({ id: 'scripts.cancel' })}
        >
          <ActionButton
            tooltip={intl.formatMessage({ id: 'scripts.tooltip_delete' })}
            color="#ff4d4f"
            icon={<DeleteOutlined />}
          />
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer
      ghost
      className={styles.scriptsContainer}
    >
      <ProTable<ScriptItem>
        columns={columns}
        actionRef={actionRef}
        request={fetchScripts}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
        }}
        scroll={{ x: 1200 }}
        dateFormatter="string"
        headerTitle={intl.formatMessage({ id: 'scripts.list_title' })}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setCurrentRecord(null);
              setFormVisible(true);
            }}
          >
            {intl.formatMessage({ id: 'scripts.new_script' })}
          </Button>,
        ]}
      />

      {/* Script Form Modal */}
      <ScriptForm
        visible={formVisible}
        record={currentRecord}
        onCancel={() => {
          setFormVisible(false);
          setCurrentRecord(null);
        }}
        onSuccess={handleFormSuccess}
      />

      {/* Logs View Modal */}
      <LogsModal
        visible={logsModalVisible}
        onCancel={() => {
          setLogsModalVisible(false);
          setCurrentRecord(null);
        }}
        scriptId={currentRecord?.id || ''}
        scriptName={currentRecord?.name || ''}
      />

      {/* Execution Result Modal */}
      <ExecutionResultModal
        visible={executionResultModalVisible}
        onCancel={() => {
          setExecutionResultModalVisible(false);
          setExecutionResult(null);
          setExecutedScript(null);
        }}
        result={executionResult}
        scriptName={executedScript?.name || ''}
      />

      {/* Webhook Modal */}
      <WebhookModal
        visible={webhookModalVisible}
        onCancel={() => {
          setWebhookModalVisible(false);
          setCurrentRecord(null);
        }}
        scriptId={currentRecord?.id || ''}
        scriptName={currentRecord?.name || ''}
      />

    </PageContainer>
  );
};

export default ScriptsPage;
