import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, message, Popconfirm } from 'antd';
import { ReloadOutlined, DownloadOutlined, ClearOutlined } from '@ant-design/icons';
import { getScriptLogs, clearScriptLogs } from '@/services/scripts';
import OutputDisplay, { OutputDisplayRef } from '@/components/OutputDisplay';

interface LogsModalProps {
  visible: boolean;
  onCancel: () => void;
  scriptId: string;
  scriptName: string;
}

const LogsModal: React.FC<LogsModalProps> = ({
  visible,
  onCancel,
  scriptId,
  scriptName,
}) => {
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const outputDisplayRef = useRef<OutputDisplayRef>(null);

  // 加载日志
  const loadLogs = async () => {
    if (!scriptId) return;

    setLoading(true);
    try {
      const response = await getScriptLogs(scriptId);
      setLogs(response.logs || '');
    } catch (error: any) {
      console.error('获取日志失败:', error);

      let errorMessage = '获取日志失败';
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 下载日志
  const downloadLogs = () => {
    if (!logs) {
      message.warning('暂无日志内容');
      return;
    }

    const blob = new Blob([logs], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${scriptName}_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('日志下载成功 📥');
  };

  // 清空日志
  const handleClearLogs = async () => {
    if (!scriptId) return;

    setClearing(true);
    try {
      const response = await clearScriptLogs(scriptId);
      message.success(response.message);
      setLogs(''); // 清空本地显示的日志
    } catch (error: any) {
      console.error('清空日志失败:', error);

      let errorMessage = '清空日志失败';
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    } finally {
      setClearing(false);
    }
  };

  // 当弹窗打开时加载日志
  useEffect(() => {
    if (visible) {
      loadLogs();
    }
  }, [visible, scriptId]);

  return (
    <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>📋 执行日志 - {scriptName}</span>
            <div>
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={loadLogs}
                loading={loading}
                size="small"
              >
                刷新
              </Button>
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={downloadLogs}
                disabled={!logs}
                size="small"
              >
                下载
              </Button>
              <Popconfirm
                title="确认清空日志"
                description="清空后无法恢复，确定要清空所有日志吗？"
                onConfirm={handleClearLogs}
                okText="确定"
                cancelText="取消"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  icon={<ClearOutlined />}
                  disabled={!logs}
                  loading={clearing}
                  size="small"
                  danger
                >
                  清空
                </Button>
              </Popconfirm>
            </div>
          </div>
        }
        open={visible}
        onCancel={onCancel}
        width={800}
        footer={[
          <Button key="close" onClick={onCancel}>
            关闭
          </Button>,
        ]}
        destroyOnHidden
        closeIcon={false}
      >
        <OutputDisplay
          ref={outputDisplayRef}
          content={logs}
          loading={loading}
          maxHeight={500}
          minHeight={100}
          autoScrollToBottom={true}
          emptyDescription="暂无执行日志"
          loadingDescription="加载日志中..."
          className="dark-theme"
          fontSize={12}
          lineHeight={1.5}
          useCodeMirror={true}
          language="text"
          showLineNumbers={true}
        />
    </Modal>
  );
};

export default LogsModal;
