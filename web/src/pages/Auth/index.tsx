import React, { useState } from 'react';
import { Form, Input, Button, message, Typography, ConfigProvider } from 'antd';
import { SendOutlined, KeyOutlined } from '@ant-design/icons';
import { history, useIntl } from '@umijs/max';
import webhook from '@/assets/webhook.png';
import styles from './index.less';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';
import { setStoredAccessKey, validateAccessKey } from '@/utils/auth';

const { Title } = Typography;

const AuthPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { theme: currentTheme } = useTheme();
  const intl = useIntl();

  const handleSubmit = async (values: { accessKey: string }) => {
    setLoading(true);
    try {
      // Use auth utility function to validate key
      const isValid = await validateAccessKey(values.accessKey);

      if (isValid) {
        // Use auth utility function to save key
        setStoredAccessKey(values.accessKey);
        message.success(intl.formatMessage({ id: 'auth.login_success' }));

        // Redirect to home page
        setTimeout(() => {
          history.push('/home');
          // Remove page refresh to avoid dark mode flicker
        }, 500);
      } else {
        message.error(intl.formatMessage({ id: 'auth.access_key.invalid' }));
      }
    } catch (error) {
      console.error(intl.formatMessage({ id: 'auth.process_error' }), error);
      message.error(intl.formatMessage({ id: 'auth.login_error' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider>
      <div
        className={styles.authContainer}
        data-theme={currentTheme}
      >
        {/* Theme Toggle Button */}
        <div className={styles.themeToggle}>
          <ThemeToggle />
        </div>

        <div className={styles.authBox}>
          <div className={styles.centerContent}>
            <div className={styles.logoTitle}>
              <img src={webhook} alt="Logo" className={styles.logo} />
              <Title
                level={2}
                style={{
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                Hook Panel
              </Title>
            </div>

          <Form
            form={form}
            name="auth"
            onFinish={handleSubmit}
            autoComplete="off"
            size="large"
            style={{ width: '100%', maxWidth: '320px' }}
          >
            <Form.Item
              name="accessKey"
              rules={[
                { required: true, message: intl.formatMessage({ id: 'auth.access_key.required' }) },
                { min: 1, message: intl.formatMessage({ id: 'auth.access_key.empty' }) },
              ]}
              style={{ marginBottom: 0 }}
            >
              <div className={styles.inputGroup}>
                <Input.Password
                  prefix={<KeyOutlined />}
                  placeholder={intl.formatMessage({ id: 'auth.access_key.placeholder' })}
                  autoFocus
                  style={{ flex: 1 }}
                />
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SendOutlined />}
                />
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
    </ConfigProvider>
  );
};

export default AuthPage;
