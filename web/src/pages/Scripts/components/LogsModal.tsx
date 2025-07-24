import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Spin, message, Empty } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import { getScriptLogs } from '@/services/scripts';
import './LogsModal.less';

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
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // 设置滚动到底部
  const setScrollToBottom = () => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  };

  // 加载日志
  const loadLogs = async () => {
    if (!scriptId) return;

    setLoading(true);
    try {
      const response = await getScriptLogs(scriptId);
      setLogs(response.logs || '');
      // 延迟设置滚动位置到底部，确保内容已渲染
      setTimeout(setScrollToBottom, 50);
    } catch (error) {
      console.error('获取日志失败:', error);
      message.error('获取日志失败');
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
      <div
        ref={logsContainerRef}
        className="logsContainer"
      >
        {loading ? (
          <div className="loadingContainer">
            <Spin size="large" />
            <div className="loadingText">加载日志中...</div>
          </div>
        ) : logs ? (
          <pre className="logsContent">
            {logs}
          </pre>
        ) : (
          <Empty
            description="暂无执行日志"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
    </Modal>
  );
};

export default LogsModal;
