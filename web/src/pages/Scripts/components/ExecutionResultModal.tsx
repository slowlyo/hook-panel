import React from 'react';
import { Modal, Result, Descriptions, Tag, Button, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, CopyOutlined } from '@ant-design/icons';
import { ExecutionResult } from '@/services/scripts';
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
  if (!result) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('复制成功 📋');
    }).catch(() => {
      message.error('复制失败');
    });
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
      title={`🎯 执行结果 - ${scriptName}`}
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
      <Result
        icon={getStatusIcon()}
        title={result.success ? '执行成功' : '执行失败'}
        subTitle={`脚本于 ${result.timestamp} 执行完成`}
      />

      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="执行状态" span={1}>
          <Tag color={getStatusColor()}>
            {result.success ? '成功' : '失败'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="退出码" span={1}>
          <Tag color={result.exit_code === 0 ? 'green' : 'red'}>
            {result.exit_code}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="执行时间" span={1}>
          {result.timestamp}
        </Descriptions.Item>
        <Descriptions.Item label="耗时" span={1}>
          {result.duration}
        </Descriptions.Item>
      </Descriptions>

      {result.output && (
        <div className="outputSection">
          <div className="sectionHeader">
            <span className="sectionTitle">标准输出:</span>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(result.output)}
              className="copyButton"
            >
              复制
            </Button>
          </div>
          <div className="outputContent">
            {result.output}
          </div>
        </div>
      )}

      {result.error && (
        <div className="outputSection">
          <div className="sectionHeader">
            <span className="sectionTitle" style={{ color: '#ff6b6b' }}>错误输出:</span>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(result.error)}
              className="copyButton"
            >
              复制
            </Button>
          </div>
          <div className="outputContent errorContent">
            {result.error}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ExecutionResultModal;
