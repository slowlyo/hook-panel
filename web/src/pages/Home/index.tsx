import {
  buildConfigUpdateRequest,
  ConfigCategory,
  ConfigResponse,
  getSystemConfigs,
  updateSystemConfigs,
} from '@/services/config';
import { DashboardStats, getDashboardStats } from '@/services/scripts';
import { formatDateTime } from '@/utils/dateFormat';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  DashboardOutlined,
  ExclamationCircleOutlined,
  GlobalOutlined,
  HistoryOutlined,
  PlusOutlined,
  RocketOutlined,
  SaveOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { PageContainer, StatisticCard } from '@ant-design/pro-components';
import { FormattedMessage, history, setLocale, useIntl } from '@umijs/max';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  theme,
} from 'antd';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const HomePage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [configForm] = Form.useForm();
  const [configCategories, setConfigCategories] = useState<ConfigCategory[]>(
    [],
  );
  const [configLoading, setConfigLoading] = useState(false);
  const { token } = theme.useToken();
  const intl = useIntl();

  // Get configuration item icon
  const getConfigIcon = (key: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'system.domain': <GlobalOutlined />,
      'webhook.timeout': <ClockCircleOutlined />,
      'system.language': <TranslationOutlined />,
    };
    return iconMap[key] || <SettingOutlined />;
  };

  // Fetch system configuration
  const fetchConfigs = async () => {
    try {
      const response = await getSystemConfigs();
      setConfigCategories(response.data);

      // Set form initial values
      const initialValues: Record<string, string> = {};
      response.data.forEach((category) => {
        category.configs.forEach((config) => {
          initialValues[config.key] = config.value;
        });
      });

      // If domain is empty, use current domain as default
      if (!initialValues['system.domain']) {
        initialValues['system.domain'] = window.location.origin;
      }

      configForm.setFieldsValue(initialValues);
    } catch (error) {
      console.error(intl.formatMessage({ id: 'error.load_config' }), error);
      message.error(
        intl.formatMessage({ id: 'home.system_config.load_error' }),
      );
    }
  };

  // Handle language switching
  const handleLanguageChange = async (language: string) => {
    try {
      // Update backend configuration
      const updateRequest = buildConfigUpdateRequest({
        'system.language': language,
      });
      await updateSystemConfigs(updateRequest);

      // Use UmiJS setLocale to switch language
      setLocale(language, false); // false means no page refresh

      // Re-fetch configuration to update form labels and descriptions
      await fetchConfigs();

      message.success(
        intl.formatMessage({ id: 'home.system_config.save_success' }),
      );
    } catch (error) {
      console.error(intl.formatMessage({ id: 'error.switch_language' }), error);
      message.error(
        intl.formatMessage({ id: 'home.system_config.save_error' }),
      );
    }
  };

  // Render configuration form item
  const renderConfigFormItem = (config: ConfigResponse) => {
    const commonProps = {
      label: (
        <Space>
          {getConfigIcon(config.key)}
          {config.label}
        </Space>
      ),
      name: config.key,
      rules: config.required
        ? [
            {
              required: true,
              message: intl.formatMessage(
                { id: 'common.required' },
                { field: config.label },
              ),
            },
          ]
        : [],
      tooltip: config.description,
    };

    switch (config.type) {
      case 'url':
        return (
          <Form.Item
            {...commonProps}
            rules={[
              ...(commonProps.rules || []),
              {
                type: 'url',
                message: intl.formatMessage({ id: 'validation.url' }),
              },
            ]}
          >
            <Input placeholder="https://your-domain.com" />
          </Form.Item>
        );

      case 'number':
        return (
          <Form.Item
            {...commonProps}
            rules={[
              ...(commonProps.rules || []),
              {
                pattern: /^\d+$/,
                message: intl.formatMessage({ id: 'validation.number' }),
              },
            ]}
          >
            <Input
              placeholder="30"
              suffix={
                config.key === 'webhook.timeout'
                  ? intl.formatMessage({ id: 'common.seconds' })
                  : undefined
              }
              type="number"
            />
          </Form.Item>
        );

      case 'select':
        let options: { label: string; value: string }[] = [];
        if (config.options) {
          try {
            options = JSON.parse(config.options);
          } catch (e) {
            console.error(intl.formatMessage({ id: 'error.parse_options' }), e);
          }
        }

        // Special handling for language selector
        if (config.key === 'system.language') {
          return (
            <Form.Item {...commonProps}>
              <Select
                placeholder={intl.formatMessage({ id: 'language.switch' })}
                options={options}
                onChange={handleLanguageChange}
              />
            </Form.Item>
          );
        }

        return (
          <Form.Item {...commonProps}>
            <Select
              placeholder={intl.formatMessage(
                { id: 'form.placeholder.select' },
                { field: config.label },
              )}
              options={options}
            />
          </Form.Item>
        );

      default:
        return (
          <Form.Item {...commonProps}>
            <Input
              placeholder={intl.formatMessage(
                { id: 'form.placeholder.input' },
                { field: config.label },
              )}
            />
          </Form.Item>
        );
    }
  };

  // Get dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await getDashboardStats();
        setStats(response);
      } catch (error) {
        console.error(intl.formatMessage({ id: 'error.load_stats' }), error);
        message.error(intl.formatMessage({ id: 'error.load_stats' }));
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Get system configuration
  useEffect(() => {
    fetchConfigs();
  }, [configForm]);

  // Save configuration
  const handleSaveConfig = async (values: any) => {
    try {
      setConfigLoading(true);
      const updateRequest = buildConfigUpdateRequest(values);
      await updateSystemConfigs(updateRequest);
      message.success(
        intl.formatMessage({ id: 'home.system_config.save_success' }),
      );
    } catch (error) {
      console.error(intl.formatMessage({ id: 'error.save_config' }), error);
      message.error(
        intl.formatMessage({ id: 'home.system_config.save_error' }),
      );
    } finally {
      setConfigLoading(false);
    }
  };

  return (
    <PageContainer
      ghost
      header={{
        title: <FormattedMessage id="home.title" />,
        subTitle: <FormattedMessage id="home.subtitle" />,
      }}
    >
      <div className={styles.container}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              loading={loading}
              statistic={{
                title: intl.formatMessage({
                  id: 'home.dashboard.total_scripts',
                }),
                value: stats?.total_scripts || 0,
                icon: <CodeOutlined style={{ color: token.colorPrimary }} />,
              }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              loading={loading}
              statistic={{
                title: intl.formatMessage({
                  id: 'home.dashboard.enabled_scripts',
                }),
                value: stats?.enabled_scripts || 0,
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
              }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              loading={loading}
              statistic={{
                title: intl.formatMessage({ id: 'home.dashboard.total_calls' }),
                value: stats?.total_calls || 0,
                icon: <ThunderboltOutlined style={{ color: '#fa8c16' }} />,
              }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              loading={loading}
              statistic={{
                title: intl.formatMessage({
                  id: 'home.dashboard.success_calls',
                }),
                value: stats?.today_calls || 0,
                icon: <CalendarOutlined style={{ color: '#722ed1' }} />,
              }}
            />
          </Col>
        </Row>

        {/* Second Row Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              loading={loading}
              statistic={{
                title: intl.formatMessage({
                  id: 'home.dashboard.success_rate',
                }),
                value: stats?.success_rate || 0,
                suffix: '%',
                precision: 1,
                icon: <DashboardOutlined style={{ color: '#13c2c2' }} />,
              }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              loading={loading}
              statistic={{
                title: intl.formatMessage({
                  id: 'home.dashboard.avg_response_time',
                }),
                value: stats?.avg_response_time || 0,
                suffix: 'ms',
                precision: 0,
                icon: <ClockCircleOutlined style={{ color: '#eb2f96' }} />,
              }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              loading={loading}
              statistic={{
                title: intl.formatMessage({
                  id: 'home.dashboard.failed_calls',
                }),
                value: stats?.failed_calls || 0,
                icon: (
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                ),
              }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              loading={loading}
              statistic={{
                title: intl.formatMessage({
                  id: 'home.dashboard.recent_calls',
                }),
                value: stats?.last_call_time
                  ? formatDateTime(stats.last_call_time)
                  : intl.formatMessage({
                      id: 'home.dashboard.recent_calls.empty',
                    }),
                icon: <HistoryOutlined style={{ color: '#faad14' }} />,
              }}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {/* Quick Actions */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <RocketOutlined />
                  <FormattedMessage id="home.quick_actions.title" />
                </Space>
              }
              size="small"
            >
              <Row gutter={[12, 12]}>
                <Col span={8}>
                  <Card
                    hoverable
                    className={styles.actionCard}
                    onClick={() => history.push('/scripts')}
                  >
                    <div className={styles.actionContent}>
                      <PlusOutlined
                        className={styles.actionIcon}
                        style={{ color: token.colorPrimary }}
                      />
                      <div
                        className={styles.actionText}
                        style={{ color: token.colorText }}
                      >
                        <FormattedMessage id="home.quick_actions.create_script" />
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card
                    hoverable
                    className={styles.actionCard}
                    onClick={() => history.push('/scripts')}
                  >
                    <div className={styles.actionContent}>
                      <CodeOutlined
                        className={styles.actionIcon}
                        style={{ color: token.colorPrimary }}
                      />
                      <div
                        className={styles.actionText}
                        style={{ color: token.colorText }}
                      >
                        <FormattedMessage id="home.quick_actions.manage_scripts" />
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card
                    hoverable
                    className={styles.actionCard}
                    onClick={() => history.push('/webhook-logs')}
                  >
                    <div className={styles.actionContent}>
                      <HistoryOutlined
                        className={styles.actionIcon}
                        style={{ color: token.colorPrimary }}
                      />
                      <div
                        className={styles.actionText}
                        style={{ color: token.colorText }}
                      >
                        <FormattedMessage id="home.quick_actions.view_logs" />
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* System Configuration */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <SettingOutlined />
                  <FormattedMessage id="home.system_config.title" />
                </Space>
              }
              size="small"
            >
              <Form
                form={configForm}
                layout="vertical"
                onFinish={handleSaveConfig}
              >
                {configCategories
                  .filter((category) => category.category === 'system')
                  .map((category) =>
                    category.configs.map((config) => (
                      <div key={config.key}>{renderConfigFormItem(config)}</div>
                    )),
                  )}

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={configLoading}
                  >
                    <FormattedMessage id="home.system_config.save" />
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </PageContainer>
  );
};

export default HomePage;
