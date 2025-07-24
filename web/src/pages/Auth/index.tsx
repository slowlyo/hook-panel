import React, { useState } from 'react';
import { Form, Input, Button, message, Typography, ConfigProvider } from 'antd';
import { SendOutlined, KeyOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
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

  const handleSubmit = async (values: { accessKey: string }) => {
    setLoading(true);
    try {
      // 使用认证工具函数验证密钥
      const isValid = await validateAccessKey(values.accessKey);

      if (isValid) {
        // 使用认证工具函数保存密钥
        setStoredAccessKey(values.accessKey);
        message.success('认证成功！🎉');

        // 重定向到首页
        setTimeout(() => {
          history.push('/home');
          // 移除页面刷新，避免暗色模式闪烁
        }, 500);
      } else {
        message.error('访问密钥无效，请重试');
      }
    } catch (error) {
      console.error('认证过程出错:', error);
      message.error('认证失败，请重试');
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
        {/* 主题切换按钮 */}
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
                { required: true, message: '请输入访问密钥' },
                { min: 1, message: '访问密钥不能为空' },
              ]}
              style={{ marginBottom: 0 }}
            >
              <div className={styles.inputGroup}>
                <Input.Password
                  prefix={<KeyOutlined />}
                  placeholder="请输入访问密钥"
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
