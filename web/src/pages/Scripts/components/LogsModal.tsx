import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, message, Popconfirm } from 'antd';
import { ReloadOutlined, DownloadOutlined, ClearOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
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
  const intl = useIntl();

  // Load logs
  const loadLogs = async () => {
    if (!scriptId) return;

    setLoading(true);
    try {
      const response = await getScriptLogs(scriptId);
      setLogs(response.logs || '');
    } catch (error: any) {
      console.error(intl.formatMessage({ id: 'scripts.logs.load_error' }), error);

      let errorMessage = intl.formatMessage({ id: 'scripts.logs.load_error' });
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

  // Download logs
  const downloadLogs = () => {
    if (!logs) {
      message.warning(intl.formatMessage({ id: 'scripts.logs.no_content' }));
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
    message.success(intl.formatMessage({ id: 'scripts.logs.download_success' }));
  };

  // Clear logs
  const handleClearLogs = async () => {
    if (!scriptId) return;

    setClearing(true);
    try {
      const response = await clearScriptLogs(scriptId);
      message.success(response.message);
      setLogs(''); // Clear locally displayed logs
    } catch (error: any) {
      console.error(intl.formatMessage({ id: 'scripts.logs.clear_error' }), error);

      let errorMessage = intl.formatMessage({ id: 'scripts.logs.clear_error' });
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

  // Load logs when modal opens
  useEffect(() => {
    if (visible) {
      loadLogs();
    }
  }, [visible, scriptId]);

  return (
    <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>📋 {intl.formatMessage({ id: 'scripts.logs.title' }, { name: scriptName })}</span>
            <div>
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={loadLogs}
                loading={loading}
                size="small"
              >
                {intl.formatMessage({ id: 'scripts.logs.refresh' })}
              </Button>
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={downloadLogs}
                disabled={!logs}
                size="small"
              >
                {intl.formatMessage({ id: 'scripts.logs.download' })}
              </Button>
              <Popconfirm
                title={intl.formatMessage({ id: 'scripts.logs.confirm_clear' })}
                description={intl.formatMessage({ id: 'scripts.logs.confirm_clear_desc' })}
                onConfirm={handleClearLogs}
                okText={intl.formatMessage({ id: 'scripts.logs.confirm_ok' })}
                cancelText={intl.formatMessage({ id: 'scripts.logs.confirm_cancel' })}
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
                  {intl.formatMessage({ id: 'scripts.logs.clear' })}
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
            {intl.formatMessage({ id: 'scripts.logs.close' })}
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
          emptyDescription={intl.formatMessage({ id: 'scripts.logs.empty_description' })}
          loadingDescription={intl.formatMessage({ id: 'scripts.logs.loading_description' })}
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
