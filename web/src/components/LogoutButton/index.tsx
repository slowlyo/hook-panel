import React from 'react';
import { Modal, Tooltip } from 'antd';
import { LogoutOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { logout } from '@/utils/auth';
import ThemeAwareButton from '@/components/ThemeAwareButton';

/**
 * Logout button component
 * Contains confirmation logic to prevent accidental operations
 */
const LogoutButton: React.FC = () => {
  const intl = useIntl();

  const handleLogout = () => {
    Modal.confirm({
      title: intl.formatMessage({ id: 'auth.logout_confirm_title' }),
      icon: <ExclamationCircleOutlined />,
      content: intl.formatMessage({ id: 'auth.logout_confirm_content' }),
      okText: intl.formatMessage({ id: 'auth.logout_confirm_ok' }),
      cancelText: intl.formatMessage({ id: 'common.cancel' }),
      okType: 'danger',
      onOk: () => {
        logout();
      },
    });
  };

  return (
    <Tooltip title={intl.formatMessage({ id: 'auth.logout_tooltip' })}>
      <ThemeAwareButton
        icon={<LogoutOutlined />}
        onClick={handleLogout}
      />
    </Tooltip>
  );
};

export default LogoutButton;
