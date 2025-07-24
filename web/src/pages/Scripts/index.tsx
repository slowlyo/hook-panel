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
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { ScriptForm, ScriptItem, LogsModal, ExecutionResultModal } from './components';
import { getScripts, deleteScript as deleteScriptAPI, toggleScript, createScript, executeScript, getScriptLogs, ExecutionResult } from '@/services/scripts';
import styles from './index.less';



const ScriptsPage: React.FC = () => {
  const [formVisible, setFormVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ScriptItem | null>(null);
  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [executionResultModalVisible, setExecutionResultModalVisible] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [executingScriptId, setExecutingScriptId] = useState<string | null>(null);
  const [executedScript, setExecutedScript] = useState<ScriptItem | null>(null);
  const actionRef = useRef<ActionType>();

  // 格式化日期时间
  const formatDateTime = (dateTime?: string) => {
    if (!dateTime) return null;
    try {
      const date = new Date(dateTime);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch (error) {
      return dateTime; // 如果格式化失败，返回原始值
    }
  };





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
        page_size: pageSize || 10,
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
      const response = await getScripts(queryParams);

      // 转换数据格式以适配前端显示
      const transformedData = response.data.map(script => ({
        id: script.id,
        name: script.name,
        description: script.description,
        content: '', // 列表页不需要内容
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
    } catch (error) {
      console.error('切换脚本状态失败:', error);
      message.error('操作失败，请重试');
    }
  };

  // 删除脚本
  const deleteScript = async (id: string) => {
    try {
      const response = await deleteScriptAPI(id);
      message.success(response.message);
      actionRef.current?.reload();
    } catch (error) {
      console.error('删除脚本失败:', error);
      message.error('删除失败，请重试');
    }
  };

  // 复制脚本
  const copyScript = async (record: ScriptItem) => {
    try {
      const newScriptData = {
        name: `${record.name} (副本)`,
        description: record.description,
        content: record.content,
        enabled: false, // 副本默认禁用
      };

      const response = await createScript(newScriptData);
      message.success(response.message);
      actionRef.current?.reload();
    } catch (error) {
      console.error('复制脚本失败:', error);
      message.error('复制失败，请重试');
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
      message.success(`脚本 "${record.name}" 执行完成 🎯`);

      // 显示执行结果
      setExecutionResult(response.result);
      setExecutedScript(record);
      setExecutionResultModalVisible(true);

      // 刷新数据以显示最新的调用次数
      actionRef.current?.reload();
    } catch (error) {
      console.error('脚本执行失败:', error);
      message.error('脚本执行失败，请重试');
    } finally {
      setExecutingScriptId(null);
    }
  };

  // 查看日志
  const viewLogs = (record: ScriptItem) => {
    setCurrentRecord(record);
    setLogsModalVisible(true);
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
        const formattedTime = formatDateTime(record.lastCallTime);
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
      width: 280,
      render: (_, record) => [
        <Tooltip key="exec" title="执行">
          <Button
            type="text"
            icon={<PlayCircleOutlined />}
            onClick={() => runScript(record)}
            loading={executingScriptId === record.id}
            disabled={!record.status || record.status === 'disabled'}
            style={{ color: '#52c41a' }}
          />
        </Tooltip>,
        <Tooltip key="logs" title="查看日志">
          <Button
            type="text"
            icon={<FileTextOutlined />}
            onClick={() => viewLogs(record)}
            style={{ color: '#1890ff' }}
          />
        </Tooltip>,
        <Tooltip key="edit" title="编辑">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setCurrentRecord(record);
              setFormVisible(true);
            }}
          />
        </Tooltip>,
        <Tooltip key="copy" title="复制">
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => copyScript(record)}
          />
        </Tooltip>,
        <Popconfirm
          key="delete"
          title="确认删除"
          description="删除后无法恢复，确定要删除这个脚本吗？"
          onConfirm={() => deleteScript(record.id)}
          okText="确认"
          cancelText="取消"
        >
          <Tooltip title="删除">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Tooltip>
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
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
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


    </PageContainer>
  );
};

export default ScriptsPage;
