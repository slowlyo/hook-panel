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
import { ScriptForm, ScriptItem, LogsModal, ExecutionResultModal, WebhookModal } from './components';
import { getScripts, getScript, deleteScript as deleteScriptAPI, toggleScript, createScript, executeScript, getScriptLogs, ExecutionResult } from '@/services/scripts';
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





  // 获取脚本列表 - 使用标准的 ProTable request 格式
  const fetchScripts = async (params: any, sort: any, filter: any) => {
    try {
      const { current, pageSize, ...rest } = params;

      // 处理排序参数
      let sort_field = undefined;
      let sort_order = undefined;
      if (sort && Object.keys(sort).length > 0) {
        // 获取第一个排序字段
        const fieldName = Object.keys(sort)[0];
        const order = sort[fieldName];
        sort_field = fieldName;
        sort_order = order === 'ascend' ? 'asc' : 'desc';
      }

      // 构建查询参数
      const queryParams: any = {
        page: current || 1,
        page_size: pageSize || 20,
        sort_field,
        sort_order,
        ...rest,
      };

      // 处理搜索关键词
      if (params?.name || params?.description) {
        queryParams.search = params.name || params.description || '';
      }

      // 处理状态筛选
      if (params?.status) {
        queryParams.enabled = params.status === 'enabled';
      }

      // 处理执行器筛选
      if (params?.executor) {
        queryParams.executor = params.executor;
      }

      const response = await getScripts(queryParams);

      // 转换数据格式以适配前端显示
      const transformedData = response.data.map(script => ({
        id: script.id,
        name: script.name,
        description: script.description,
        content: '', // 列表页不需要内容
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
      console.error('获取脚本列表失败:', error);
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  // 切换脚本状态
  const toggleStatus = async (record: ScriptItem) => {
    try {
      const response = await toggleScript(record.id);
      message.success(response.message);
      actionRef.current?.reload();
    } catch (error: any) {
      console.error('切换脚本状态失败:', error);

      let errorMessage = '操作失败，请重试';
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    }
  };

  // 删除脚本
  const deleteScript = async (id: string) => {
    try {
      const response = await deleteScriptAPI(id);
      message.success(response.message);
      actionRef.current?.reload();
    } catch (error: any) {
      console.error('删除脚本失败:', error);

      let errorMessage = '删除失败，请重试';
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    }
  };

  // 复制脚本
  const copyScript = async (record: ScriptItem) => {
    if (copyingScriptId) {
      message.warning('有脚本正在复制中，请稍后再试');
      return;
    }

    setCopyingScriptId(record.id);
    try {
      // 先获取完整的脚本内容
      const fullScript = await getScript(record.id);

      const newScriptData = {
        name: `${record.name} (副本)`,
        description: record.description,
        content: fullScript.content, // 使用获取到的完整内容
        executor: fullScript.executor, // 使用相同的执行器
        enabled: false, // 副本默认禁用
      };

      const response = await createScript(newScriptData);
      message.success(response.message);
      actionRef.current?.reload();
    } catch (error: any) {
      console.error('复制脚本失败:', error);

      let errorMessage = '复制失败，请重试';
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

  // 表单提交成功回调
  const handleFormSuccess = () => {
    setFormVisible(false);
    setCurrentRecord(null);
    actionRef.current?.reload();
  };

  // 执行脚本
  const runScript = async (record: ScriptItem) => {
    if (executingScriptId) {
      message.warning('有脚本正在执行中，请稍后再试');
      return;
    }

    setExecutingScriptId(record.id);
    try {
      const response = await executeScript(record.id);

      // 检查执行结果
      if (response.result.success) {
        message.success(`脚本 "${record.name}" 执行成功 ✅`);
      } else {
        message.warning(`脚本 "${record.name}" 执行完成，但有错误 ⚠️`);
      }

      // 显示执行结果
      setExecutionResult(response.result);
      setExecutedScript(record);
      setExecutionResultModalVisible(true);

      // 刷新数据以显示最新的调用次数
      actionRef.current?.reload();
    } catch (error: any) {
      console.error('脚本执行失败:', error);

      // 提取后端返回的具体错误信息
      let errorMessage = '脚本执行失败，请重试';
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

  // 查看日志
  const viewLogs = (record: ScriptItem) => {
    setCurrentRecord(record);
    setLogsModalVisible(true);
  };

  // 查看 webhook
  const viewWebhook = (record: ScriptItem) => {
    setCurrentRecord(record);
    setWebhookModalVisible(true);
  };

  // 表格列定义
  const columns: ProColumns<ScriptItem>[] = [
    {
      title: '脚本名称',
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
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      search: false,
    },

    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        enabled: { text: '启用', status: 'Success' },
        disabled: { text: '禁用', status: 'Default' },
      },
      render: (_, record) => (
        <Switch
          checked={record.status === 'enabled'}
          onChange={() => toggleStatus(record)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '执行器',
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
      title: '调用次数',
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
      title: '最近调用',
      dataIndex: 'lastCallTime',
      width: 180,
      search: false,
      sorter: true,
      render: (_, record) => {
        const formattedTime = record.lastCallTime ? formatDateTime(record.lastCallTime) : null;
        return (
          <span style={{ color: formattedTime ? '#666' : '#ccc' }}>
            {formattedTime || '从未调用'}
          </span>
        );
      },
    },
    {
      title: '创建时间',
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
      title: '操作',
      valueType: 'option',
      width: 250,
      render: (_, record) => [
        <ActionButton
          key="exec"
          tooltip="执行"
          color="#52c41a"
          icon={<PlayCircleOutlined />}
          onClick={() => runScript(record)}
          loading={executingScriptId === record.id}
          disabled={!record.status || record.status === 'disabled'}
          disableHover={!record.status || record.status === 'disabled'}
        />,
        <ActionButton
          key="logs"
          tooltip="查看日志"
          color="#1677ff"
          icon={<FileTextOutlined />}
          onClick={() => viewLogs(record)}
        />,
        <ActionButton
          key="webhook"
          tooltip="Webhook"
          color="#13c2c2"
          icon={<LinkOutlined />}
          onClick={() => viewWebhook(record)}
        />,
        <ActionButton
          key="edit"
          tooltip="编辑"
          color="#fa8c16"
          icon={<EditOutlined />}
          onClick={() => {
            setCurrentRecord(record);
            setFormVisible(true);
          }}
        />,
        <ActionButton
          key="copy"
          tooltip="复制"
          color="#722ed1"
          icon={<CopyOutlined />}
          onClick={() => copyScript(record)}
          loading={copyingScriptId === record.id}
        />,
        <Popconfirm
          key="delete"
          title="确认删除"
          description="删除后无法恢复，确定要删除这个脚本吗？"
          onConfirm={() => deleteScript(record.id)}
          okText="确认"
          cancelText="取消"
        >
          <ActionButton
            tooltip="删除"
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
        headerTitle="脚本列表"
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
            新建脚本
          </Button>,
        ]}
      />

      {/* 脚本表单弹窗 */}
      <ScriptForm
        visible={formVisible}
        record={currentRecord}
        onCancel={() => {
          setFormVisible(false);
          setCurrentRecord(null);
        }}
        onSuccess={handleFormSuccess}
      />

      {/* 日志查看弹窗 */}
      <LogsModal
        visible={logsModalVisible}
        onCancel={() => {
          setLogsModalVisible(false);
          setCurrentRecord(null);
        }}
        scriptId={currentRecord?.id || ''}
        scriptName={currentRecord?.name || ''}
      />

      {/* 执行结果弹窗 */}
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

      {/* Webhook 弹窗 */}
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
