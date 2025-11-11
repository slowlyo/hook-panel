import React from 'react';
import { Modal, Result, Descriptions, Tag, Button, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, CopyOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { ExecutionResult } from '@/services/scripts';
import OutputDisplay from '@/components/OutputDisplay';
import { copyToClipboard } from '@/utils/clipboard';
import './ExecutionResultModal.less';

interface ExecutionResultModalProps {
  visible: boolean;
  onCancel: () => void;
  result: ExecutionResult | null;
  scriptName: string;
}

const ExecutionResultModal: React.FC<ExecutionResultModalProps> = ({
  visible,
  onCancel,
  result,
  scriptName,
}) => {
  const intl = useIntl();

  if (!result) return null;

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      message.success(intl.formatMessage({ id: 'scripts.execution.copy_success' }));
    } else {
      message.error(intl.formatMessage({ id: 'scripts.execution.copy_failed' }));
    }
  };

  const getStatusIcon = () => {
    return result.success ? (
      <CheckCircleOutlined style={{ color: '#52c41a' }} />
    ) : (
      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
    );
  };

  const getStatusColor = () => {
    return result.success ? 'success' : 'error';
  };

  return (
    <Modal
      title={`🎯 ${intl.formatMessage({ id: 'scripts.execution.title' }, { name: scriptName })}`}
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="close" onClick={onCancel}>
          {intl.formatMessage({ id: 'scripts.execution.close' })}
        </Button>,
      ]}
      destroyOnHidden
      closeIcon={false}
    >
      <Result
        icon={getStatusIcon()}
        title={result.success ? intl.formatMessage({ id: 'scripts.execution.success_title' }) : intl.formatMessage({ id: 'scripts.execution.failed_title' })}
        subTitle={intl.formatMessage({ id: 'scripts.execution.completed_at' }, { time: result.timestamp })}
      />

      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label={intl.formatMessage({ id: 'scripts.execution.status_label' })} span={1}>
          <Tag color={getStatusColor()}>
            {result.success ? intl.formatMessage({ id: 'scripts.execution.success_status' }) : intl.formatMessage({ id: 'scripts.execution.failed_status' })}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: 'scripts.execution.exit_code_label' })} span={1}>
          <Tag color={result.exit_code === 0 ? 'green' : 'red'}>
            {result.exit_code}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: 'scripts.execution.time_label' })} span={1}>
          {result.timestamp}
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: 'scripts.execution.duration_label' })} span={1}>
          {result.duration}
        </Descriptions.Item>
      </Descriptions>

      {result.output && (
        <div className="outputSection">
          <div className="sectionHeader">
            <span className="sectionTitle">{intl.formatMessage({ id: 'scripts.execution.stdout_title' })}:</span>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(result.output)}
              className="copyButton"
            >
              {intl.formatMessage({ id: 'scripts.execution.copy' })}
            </Button>
          </div>
          <OutputDisplay
            content={result.output}
            maxHeight={200}
            minHeight={50}
            autoScrollToBottom={false}
            emptyDescription={intl.formatMessage({ id: 'scripts.execution.no_output' })}
            className="dark-theme"
            fontSize={12}
            lineHeight={1.4}
            useCodeMirror={true}
            language="text"
            showLineNumbers={false}
          />
        </div>
      )}

      {result.error && (
        <div className="outputSection">
          <div className="sectionHeader">
            <span className="sectionTitle" style={{ color: '#ff6b6b' }}>{intl.formatMessage({ id: 'scripts.execution.stderr_title' })}:</span>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(result.error)}
              className="copyButton"
            >
              {intl.formatMessage({ id: 'scripts.execution.copy' })}
            </Button>
          </div>
          <OutputDisplay
            content={result.error}
            maxHeight={200}
            minHeight={50}
            autoScrollToBottom={false}
            emptyDescription={intl.formatMessage({ id: 'scripts.execution.no_error' })}
            className="error-theme"
            fontSize={12}
            lineHeight={1.4}
            useCodeMirror={true}
            language="text"
            showLineNumbers={false}
          />
        </div>
      )}
    </Modal>
  );
};

export default ExecutionResultModal;
