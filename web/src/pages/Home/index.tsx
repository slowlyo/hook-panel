import React, { useState, useEffect } from 'react';
import { PageContainer, StatisticCard } from '@ant-design/pro-components';
import {
  Card,
  Row,
  Col,
  Space,
  Button,
  Form,
  Input,
  message,
  theme,
} from 'antd';
import {
  RocketOutlined,
  CodeOutlined,
  HistoryOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
  GlobalOutlined,
  SaveOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import { getDashboardStats, DashboardStats } from '@/services/scripts';
import { getSystemConfigs, updateSystemConfigs, buildConfigUpdateRequest, ConfigCategory } from '@/services/config';
import { formatDateTime } from '@/utils/dateFormat';
import styles from './index.less';



const HomePage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [configForm] = Form.useForm();
  const [configCategories, setConfigCategories] = useState<ConfigCategory[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const { token } = theme.useToken();

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await getDashboardStats();
        setStats(response);
      } catch (error) {
        console.error('获取统计数据失败:', error);
        message.error('获取统计数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // 获取系统配置
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const response = await getSystemConfigs();
        setConfigCategories(response.data);

        // 设置表单初始值
        const initialValues: Record<string, string> = {};
        response.data.forEach(category => {
          category.configs.forEach(config => {
            initialValues[config.key] = config.value;
          });
        });

        // 如果域名为空，使用当前域名作为默认值
        if (!initialValues['system.domain']) {
          initialValues['system.domain'] = window.location.origin;
        }

        configForm.setFieldsValue(initialValues);
      } catch (error) {
        console.error('获取系统配置失败:', error);
        message.error('获取系统配置失败');
      }
    };
    fetchConfigs();
  }, [configForm]);

  // 保存配置
  const handleSaveConfig = async (values: any) => {
    try {
      setConfigLoading(true);
      const updateRequest = buildConfigUpdateRequest(values);
      await updateSystemConfigs(updateRequest);
      message.success('配置保存成功 ✅');
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存配置失败');
    } finally {
      setConfigLoading(false);
    }
  };

  return (
    <PageContainer
      ghost
      header={{
        title: '🚀 Hook Panel',
        subTitle: '轻量级 Webhook 脚本管理平台',
      }}
    >
      <div className={styles.container}>
        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              loading={loading}
              statistic={{
                title: '脚本总数',
                value: stats?.total_scripts || 0,
                icon: <CodeOutlined style={{ color: token.colorPrimary }} />,
              }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              loading={loading}
              statistic={{
                title: '启用脚本',
                value: stats?.enabled_scripts || 0,
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
              }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              loading={loading}
              statistic={{
                title: '总调用次数',
                value: stats?.total_calls || 0,
                icon: <ThunderboltOutlined style={{ color: '#fa8c16' }} />,
              }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              loading={loading}
              statistic={{
                title: '今日调用',
                value: stats?.today_calls || 0,
                icon: <CalendarOutlined style={{ color: '#722ed1' }} />,
              }}
            />
          </Col>
        </Row>

        {/* 第二行统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              loading={loading}
              statistic={{
                title: '成功率',
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
                title: '平均响应时间',
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
                title: '失败调用',
                value: stats?.failed_calls || 0,
                icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
              }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              loading={loading}
              statistic={{
                title: '最近调用',
                value: stats?.last_call_time ? formatDateTime(stats.last_call_time) : '暂无',
                icon: <HistoryOutlined style={{ color: '#faad14' }} />,
              }}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {/* 快速操作 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <RocketOutlined />
                  快速操作
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
                        创建脚本
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
                        管理脚本
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
                        调用记录
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 系统配置 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <SettingOutlined />
                  系统配置
                </Space>
              }
              size="small"
            >
              <Form
                form={configForm}
                layout="vertical"
                onFinish={handleSaveConfig}
              >
                <Form.Item
                  label={
                    <Space>
                      <GlobalOutlined />
                      系统域名
                    </Space>
                  }
                  name="system.domain"
                  rules={[
                    { required: true, message: '请输入系统域名' },
                    { type: 'url', message: '请输入有效的域名格式' },
                  ]}
                  tooltip="用于生成 Webhook URL 的系统域名"
                >
                  <Input placeholder="https://your-domain.com" />
                </Form.Item>

                <Form.Item
                  label={
                    <Space>
                      <ClockCircleOutlined />
                      执行超时时间
                    </Space>
                  }
                  name="webhook.timeout"
                  rules={[
                    { required: true, message: '请输入超时时间' },
                    {
                      pattern: /^\d+$/,
                      message: '请输入有效的数字'
                    },
                  ]}
                  tooltip="脚本执行的超时时间（秒）"
                >
                  <Input
                    placeholder="30"
                    suffix="秒"
                    type="number"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={configLoading}
                  >
                    保存配置
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
