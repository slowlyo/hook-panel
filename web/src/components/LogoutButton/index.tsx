import React from 'react';
import { Modal, Tooltip } from 'antd';
import { LogoutOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { logout } from '@/utils/auth';
import ThemeAwareButton from '@/components/ThemeAwareButton';

/**
 * 注销按钮组件
 * 包含确认逻辑，防止误操作
 */
const LogoutButton: React.FC = () => {
  const handleLogout = () => {
    Modal.confirm({
      title: '确认注销',
      icon: <ExclamationCircleOutlined />,
      content: '您确定要注销当前账户吗？注销后需要重新输入访问密钥。',
      okText: '确认注销',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        logout();
      },
    });
  };

  return (
    <Tooltip title="注销">
      <ThemeAwareButton
        icon={<LogoutOutlined />}
        onClick={handleLogout}
      />
    </Tooltip>
  );
};

export default LogoutButton;
