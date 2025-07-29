import React, { useEffect, useState } from 'react';
import {
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormSwitch,
  ProFormSelect,
} from '@ant-design/pro-components';
import { message, Form } from 'antd';
import { useIntl } from '@umijs/max';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';

import { createScript, updateScript, getScript } from '@/services/scripts';
import { getExecutorOptions, getExecutorConfig } from '@/constants/executors';

// Script data type definition (compatible with frontend display)
export interface ScriptItem {
  id: string;
  name: string;
  description: string;
  content: string;
  executor: string;
  status: 'enabled' | 'disabled';
  trigger: 'webhook'; // Fixed to webhook trigger
  createdAt: string;
  updatedAt: string;
  lastCallTime?: string; // Last call time
  callCount: number; // Call count
}

interface ScriptFormProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Close modal callback */
  onCancel: () => void;
  /** Submit success callback */
  onSuccess: () => void;
  /** Record to edit, null means create new */
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
  const intl = useIntl();

  // Check if it's default template
  const isDefaultTemplate = (content: string) => {
    if (!content.trim()) return true;
    // Check if contains default template characteristic strings
    return content.includes('Webhook Script Example') ||
           content.includes('Write your script logic here') ||
           content.includes('Script execution completed');
  };

  // Load script content when in edit mode
  useEffect(() => {
    if (visible && record) {
      setLoading(true);
      getScript(record.id)
        .then((response) => {
          setScriptContent(response.content || '');
          // Set form initial values
          form.setFieldsValue({
            name: record.name,
            description: record.description,
            executor: response.executor || 'bash',
            enabled: record.status === 'enabled',
          });
        })
        .catch((error) => {
          console.error(intl.formatMessage({ id: 'scripts.form.load_content_error' }), error);
          message.error(intl.formatMessage({ id: 'scripts.form.load_content_error' }));
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (visible && !record) {
      // Create mode, reset form and content
      form.resetFields();
      // Set default executor to bash and use corresponding default template
      const defaultExecutor = 'bash';
      const defaultConfig = getExecutorConfig(defaultExecutor);
      form.setFieldValue('executor', defaultExecutor);
      setScriptContent(defaultConfig?.defaultTemplate || '');
    }
  }, [visible, record, form, intl]);
  // Save script
  const handleSubmit = async (values: any) => {
    try {
      const submitData = {
        name: values.name,
        description: values.description || '',
        content: scriptContent,
        executor: values.executor || 'bash',
        enabled: values.enabled !== false, // Default enabled
      };

      if (record) {
        // Edit mode
        await updateScript(record.id, submitData);
        message.success(intl.formatMessage({ id: 'scripts.form.update_success' }));
      } else {
        // Create mode
        await createScript(submitData);
        message.success(intl.formatMessage({ id: 'scripts.form.create_success' }));
      }

      onSuccess();
      return true;
    } catch (error) {
      console.error(intl.formatMessage({ id: 'scripts.form.save_failed' }), error);
      message.error(intl.formatMessage({ id: 'scripts.form.save_failed' }));
      return false;
    }
  };

  return (
    <ModalForm
      title={record ? intl.formatMessage({ id: 'scripts.form.edit_title' }) : intl.formatMessage({ id: 'scripts.form.create_title' })}
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
        label={intl.formatMessage({ id: 'scripts.form.name_label' })}
        placeholder={intl.formatMessage({ id: 'scripts.form.name_placeholder' })}
        rules={[
          { required: true, message: intl.formatMessage({ id: 'scripts.form.name_required' }) },
          { max: 50, message: intl.formatMessage({ id: 'scripts.form.name_max_length' }) },
        ]}
      />

      <ProFormTextArea
        name="description"
        label={intl.formatMessage({ id: 'scripts.form.description_label' })}
        placeholder={intl.formatMessage({ id: 'scripts.form.description_placeholder' })}
        rules={[
          { max: 200, message: intl.formatMessage({ id: 'scripts.form.description_max_length' }) },
        ]}
        fieldProps={{
          rows: 3,
          showCount: true,
          maxLength: 200,
        }}
      />

      <ProFormSelect
        name="executor"
        label={intl.formatMessage({ id: 'scripts.form.executor_label' })}
        placeholder={intl.formatMessage({ id: 'scripts.form.executor_placeholder' })}
        initialValue="bash"
        rules={[
          { required: true, message: intl.formatMessage({ id: 'scripts.form.executor_required' }) },
        ]}
        options={getExecutorOptions()}
        onChange={(value: string) => {
          // When executor changes, if current script content is empty or default template, update to new executor's default template
          const config = getExecutorConfig(value);
          if (config && (!scriptContent || isDefaultTemplate(scriptContent))) {
            setScriptContent(config.defaultTemplate);
          }
        }}
        tooltip={intl.formatMessage({ id: 'scripts.form.executor_tooltip' })}
      />

      <ProFormSwitch
        name="enabled"
        label={intl.formatMessage({ id: 'scripts.form.enabled_label' })}
        checkedChildren={intl.formatMessage({ id: 'scripts.enabled' })}
        unCheckedChildren={intl.formatMessage({ id: 'scripts.disabled' })}
        initialValue={true}
        tooltip={intl.formatMessage({ id: 'scripts.form.enabled_tooltip' })}
      />

      <Form.Item
        label={intl.formatMessage({ id: 'scripts.form.content_label' })}
        required
        tooltip={intl.formatMessage({ id: 'scripts.form.content_tooltip' })}
      >
        <CodeMirror
          value={scriptContent}
          onChange={(value) => setScriptContent(value)}
          height="300px"
          theme={oneDark}
          placeholder={`#!/bin/bash
# Webhook Script Example
echo "Webhook request received"

# Write your script logic here
# Supports Shell, Python, Node.js and other scripting languages

echo "Script execution completed"`}
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
