import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Space, message, Typography, Divider, Alert, theme } from 'antd';
import { CopyOutlined, LinkOutlined, ReloadOutlined } from '@ant-design/icons';
import { getWebhookURL } from '@/services/scripts';

const { Text, Paragraph } = Typography;

interface WebhookModalProps {
  visible: boolean;
  onCancel: () => void;
  scriptId: string;
  scriptName: string;
}

interface WebhookInfo {
  webhook_url: string;
  signature: string;
  script_id: string;
  script_name: string;
}

const WebhookModal: React.FC<WebhookModalProps> = ({
  visible,
  onCancel,
  scriptId,
  scriptName,
}) => {
  const [loading, setLoading] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null);
  const { token } = theme.useToken();

  // 获取 webhook 信息
  const fetchWebhookInfo = async () => {
    if (!scriptId) return;
    
    setLoading(true);
    try {
      const response = await getWebhookURL(scriptId);
      setWebhookInfo(response);
    } catch (error: any) {
      console.error('获取 webhook URL 失败:', error);
      message.error('获取 webhook URL 失败');
    } finally {
      setLoading(false);
    }
  };

  // 复制到剪贴板
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(`${label} 已复制到剪贴板 📋`);
    } catch (error) {
      console.error('复制失败:', error);
      message.error('复制失败，请手动复制');
    }
  };

  // 当模态框打开时获取数据
  useEffect(() => {
    if (visible && scriptId) {
      fetchWebhookInfo();
    }
  }, [visible, scriptId]);

  return (
    <Modal
      title={
        <Space>
          <LinkOutlined style={{ color: '#1677ff' }} />
          <span>Webhook 调用地址</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="refresh" icon={<ReloadOutlined />} onClick={fetchWebhookInfo} loading={loading}>
          刷新
        </Button>,
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>,
      ]}
      width={700}
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>脚本名称：</Text>
        <Text>{scriptName}</Text>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary">正在获取 webhook 信息...</Text>
        </div>
      ) : webhookInfo ? (
        <>
          <Alert
            message="使用说明"
            description={
              <div>
                <p>• 使用 POST 方法调用此 URL 来触发脚本执行</p>
                <p>• 签名参数用于验证请求的合法性，防止未授权访问</p>
                <p>• 脚本将异步执行，webhook 会立即返回响应</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <div style={{ marginBottom: 16 }}>
            <Text strong>Webhook URL：</Text>
            <Input.Group compact style={{ marginTop: 8 }}>
              <Input
                value={webhookInfo.webhook_url}
                readOnly
                style={{ width: 'calc(100% - 40px)' }}
              />
              <Button
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(webhookInfo.webhook_url, 'Webhook URL')}
              />
            </Input.Group>
          </div>

          <Divider />

          <div style={{ marginBottom: 16 }}>
            <Text strong>签名参数：</Text>
            <Input.Group compact style={{ marginTop: 8 }}>
              <Input
                value={webhookInfo.signature}
                readOnly
                style={{ width: 'calc(100% - 40px)' }}
              />
              <Button
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(webhookInfo.signature, '签名')}
              />
            </Input.Group>
          </div>

          <Alert
            message="调用示例"
            description={
              <div>
                <Paragraph>
                  <Text strong>cURL 示例：</Text>
                </Paragraph>
                <Paragraph
                  code
                  copyable={{
                    text: `curl -X POST "${webhookInfo.webhook_url}"`,
                  }}
                  style={{
                    backgroundColor: token.colorFillSecondary,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    wordBreak: 'break-all'
                  }}
                >
                  curl -X POST "{webhookInfo.webhook_url}"
                </Paragraph>
                
                <Paragraph>
                  <Text strong>或者在 Header 中传递签名：</Text>
                </Paragraph>
                <Paragraph
                  code
                  copyable={{
                    text: `curl -X POST "${webhookInfo.webhook_url.split('?')[0]}" -H "X-Hook-Signature: ${webhookInfo.signature}"`,
                  }}
                  style={{
                    backgroundColor: token.colorFillSecondary,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    wordBreak: 'break-all'
                  }}
                >
                  curl -X POST "{webhookInfo.webhook_url.split('?')[0]}" -H "X-Hook-Signature: {webhookInfo.signature}"
                </Paragraph>
              </div>
            }
            type="success"
            showIcon
          />
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary">暂无数据</Text>
        </div>
      )}
    </Modal>
  );
};

export default WebhookModal;
