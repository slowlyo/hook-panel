import React, { useEffect, useState } from 'react';
import {
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormSwitch,
  ProFormSelect,
} from '@ant-design/pro-components';
import { message, Form } from 'antd';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';

import { createScript, updateScript, getScript } from '@/services/scripts';
import { getExecutorOptions, getExecutorConfig } from '@/constants/executors';

// 脚本数据类型定义（兼容前端显示）
export interface ScriptItem {
  id: string;
  name: string;
  description: string;
  content: string;
  executor: string;
  status: 'enabled' | 'disabled';
  trigger: 'webhook'; // 固定为webhook触发
  createdAt: string;
  updatedAt: string;
  lastCallTime?: string; // 最近调用时间
  callCount: number; // 调用次数
}

interface ScriptFormProps {
  /** 弹窗是否可见 */
  visible: boolean;
  /** 关闭弹窗回调 */
  onCancel: () => void;
  /** 提交成功回调 */
  onSuccess: () => void;
  /** 编辑的记录，为空时表示新增 */
  record?: ScriptItem | null;
}

const ScriptForm: React.FC<ScriptFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  record,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [scriptContent, setScriptContent] = useState('');

  // 检查是否为默认模板
  const isDefaultTemplate = (content: string) => {
    if (!content.trim()) return true;
    // 检查是否包含默认模板的特征字符串
    return content.includes('Webhook脚本示例') ||
           content.includes('在这里编写你的脚本逻辑') ||
           content.includes('脚本执行完成');
  };

  // 当编辑模式时，加载脚本内容
  useEffect(() => {
    if (visible && record) {
      setLoading(true);
      getScript(record.id)
        .then((response) => {
          setScriptContent(response.content || '');
          // 设置表单初始值
          form.setFieldsValue({
            name: record.name,
            description: record.description,
            executor: response.executor || 'bash',
            enabled: record.status === 'enabled',
          });
        })
        .catch((error) => {
          console.error('加载脚本内容失败:', error);
          message.error('加载脚本内容失败');
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (visible && !record) {
      // 新建模式，重置表单和内容
      form.resetFields();
      // 设置默认执行器为bash，并使用对应的默认模板
      const defaultExecutor = 'bash';
      const defaultConfig = getExecutorConfig(defaultExecutor);
      form.setFieldValue('executor', defaultExecutor);
      setScriptContent(defaultConfig?.defaultTemplate || '');
    }
  }, [visible, record, form]);
  // 保存脚本
  const handleSubmit = async (values: any) => {
    try {
      const submitData = {
        name: values.name,
        description: values.description || '',
        content: scriptContent,
        executor: values.executor || 'bash',
        enabled: values.enabled !== false, // 默认启用
      };

      if (record) {
        // 编辑模式
        await updateScript(record.id, submitData);
        message.success('脚本更新成功 ✅');
      } else {
        // 新增模式
        await createScript(submitData);
        message.success('脚本创建成功 🎉');
      }

      onSuccess();
      return true;
    } catch (error) {
      console.error('保存脚本失败:', error);
      message.error('保存失败，请重试');
      return false;
    }
  };

  return (
    <ModalForm
      title={record ? '编辑脚本' : '新建脚本'}
      width={600}
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
      form={form}
      onFinish={async (values) => {
        const success = await handleSubmit(values);
        return success;
      }}
      modalProps={{
        destroyOnClose: true,
        maskClosable: true,
        confirmLoading: loading,
      }}
    >
      <ProFormText
        name="name"
        label="脚本名称"
        placeholder="请输入脚本名称"
        rules={[
          { required: true, message: '请输入脚本名称' },
          { max: 50, message: '脚本名称不能超过50个字符' },
        ]}
      />
      
      <ProFormTextArea
        name="description"
        label="脚本描述"
        placeholder="请输入脚本描述（可选）"
        rules={[
          { max: 200, message: '脚本描述不能超过200个字符' },
        ]}
        fieldProps={{
          rows: 3,
          showCount: true,
          maxLength: 200,
        }}
      />

      <ProFormSelect
        name="executor"
        label="执行器类型"
        placeholder="请选择脚本执行器"
        initialValue="bash"
        rules={[
          { required: true, message: '请选择执行器类型' },
        ]}
        options={getExecutorOptions()}
        onChange={(value: string) => {
          // 当执行器改变时，如果当前脚本内容为空或为默认模板，则更新为新执行器的默认模板
          const config = getExecutorConfig(value);
          if (config && (!scriptContent || isDefaultTemplate(scriptContent))) {
            setScriptContent(config.defaultTemplate);
          }
        }}
        tooltip="选择脚本的执行环境，确保服务器已安装对应的运行时"
      />

      <ProFormSwitch
        name="enabled"
        label="启用状态"
        checkedChildren="启用"
        unCheckedChildren="禁用"
        initialValue={true}
        tooltip="新建脚本默认启用，可随时切换"
      />

      <Form.Item
        label="脚本内容"
        required
        tooltip="支持Shell、Python、Node.js等各种脚本语言"
      >
        <CodeMirror
          value={scriptContent}
          onChange={(value) => setScriptContent(value)}
          height="300px"
          theme={oneDark}
          placeholder={`#!/bin/bash
# Webhook脚本示例
echo "收到webhook请求"

# 在这里编写你的脚本逻辑
# 支持Shell、Python、Node.js等各种脚本语言

echo "脚本执行完成"`}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: false,
            highlightSelectionMatches: false,
          }}
        />
      </Form.Item>
    </ModalForm>
  );
};

export default ScriptForm;
