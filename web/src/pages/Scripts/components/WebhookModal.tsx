import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Space, message, Typography, Divider, Alert, theme } from 'antd';
import { CopyOutlined, LinkOutlined, ReloadOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { getWebhookURL } from '@/services/scripts';
import { copyToClipboard } from '@/utils/clipboard';

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
  const intl = useIntl();

  // Get webhook information
  const fetchWebhookInfo = async () => {
    if (!scriptId) return;

    setLoading(true);
    try {
      const response = await getWebhookURL(scriptId);
      setWebhookInfo(response);
    } catch (error: any) {
      console.error(intl.formatMessage({ id: 'scripts.webhook.load_error' }), error);
      message.error(intl.formatMessage({ id: 'scripts.webhook.load_error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      message.success(intl.formatMessage({ id: 'scripts.webhook.copy_success' }, { label }));
    } else {
      message.error(intl.formatMessage({ id: 'scripts.webhook.copy_failed' }));
    }
  };

  // Get data when modal opens
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
          <span>{intl.formatMessage({ id: 'scripts.webhook.title' })}</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="refresh" icon={<ReloadOutlined />} onClick={fetchWebhookInfo} loading={loading}>
          {intl.formatMessage({ id: 'scripts.webhook.refresh' })}
        </Button>,
        <Button key="close" onClick={onCancel}>
          {intl.formatMessage({ id: 'scripts.webhook.close' })}
        </Button>,
      ]}
      width={700}
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>{intl.formatMessage({ id: 'scripts.webhook.script_name' })}：</Text>
        <Text>{scriptName}</Text>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary">{intl.formatMessage({ id: 'scripts.webhook.loading' })}</Text>
        </div>
      ) : webhookInfo ? (
        <>
          <Alert
            message={intl.formatMessage({ id: 'scripts.webhook.usage_title' })}
            description={
              <div>
                <p>{intl.formatMessage({ id: 'scripts.webhook.usage_desc1' })}</p>
                <p>{intl.formatMessage({ id: 'scripts.webhook.usage_desc2' })}</p>
                <p>{intl.formatMessage({ id: 'scripts.webhook.usage_desc3' })}</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <div style={{ marginBottom: 16 }}>
            <Text strong>{intl.formatMessage({ id: 'scripts.webhook.url_label' })}：</Text>
            <Input.Group compact style={{ marginTop: 8 }}>
              <Input
                value={webhookInfo.webhook_url}
                readOnly
                style={{ width: 'calc(100% - 40px)' }}
              />
              <Button
                icon={<CopyOutlined />}
                onClick={() => handleCopy(webhookInfo.webhook_url, intl.formatMessage({ id: 'scripts.webhook.copy_url' }))}
              />
            </Input.Group>
          </div>

          <Divider />

          <div style={{ marginBottom: 16 }}>
            <Text strong>{intl.formatMessage({ id: 'scripts.webhook.signature_label' })}：</Text>
            <Input.Group compact style={{ marginTop: 8 }}>
              <Input
                value={webhookInfo.signature}
                readOnly
                style={{ width: 'calc(100% - 40px)' }}
              />
              <Button
                icon={<CopyOutlined />}
                onClick={() => handleCopy(webhookInfo.signature, intl.formatMessage({ id: 'scripts.webhook.copy_signature' }))}
              />
            </Input.Group>
          </div>

          <Alert
            message={intl.formatMessage({ id: 'scripts.webhook.example_title' })}
            description={
              <div>
                <Paragraph>
                  <Text strong>{intl.formatMessage({ id: 'scripts.webhook.curl_example' })}</Text>
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
                  <Text strong>{intl.formatMessage({ id: 'scripts.webhook.header_example' })}</Text>
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
          <Text type="secondary">{intl.formatMessage({ id: 'scripts.webhook.no_data' })}</Text>
        </div>
      )}
    </Modal>
  );
};

export default WebhookModal;
