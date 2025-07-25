import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Spin, Empty } from 'antd';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import './index.less';

export interface OutputDisplayProps {
  /** 输出内容 */
  content?: string;
  /** 是否加载中 */
  loading?: boolean;
  /** 最大高度，支持数字(px)或字符串 */
  maxHeight?: number | string;
  /** 最小高度，支持数字(px)或字符串 */
  minHeight?: number | string;
  /** 是否自动滚动到底部 */
  autoScrollToBottom?: boolean;
  /** 空状态描述 */
  emptyDescription?: string;
  /** 加载状态描述 */
  loadingDescription?: string;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 字体大小 */
  fontSize?: number | string;
  /** 行高 */
  lineHeight?: number | string;
  /** 是否显示行号 */
  showLineNumbers?: boolean;
  /** 是否使用 CodeMirror 显示（默认 true） */
  useCodeMirror?: boolean;
  /** 语言类型，用于语法高亮 */
  language?: 'javascript' | 'bash' | 'python' | 'text';
}

export interface OutputDisplayRef {
  /** 滚动到底部 */
  scrollToBottom: () => void;
  /** 滚动到顶部 */
  scrollToTop: () => void;
  /** 获取容器元素 */
  getContainer: () => HTMLDivElement | null;
}

const OutputDisplay = forwardRef<OutputDisplayRef, OutputDisplayProps>(({
  content,
  loading = false,
  maxHeight = 500,
  minHeight = 100,
  autoScrollToBottom = true,
  emptyDescription = '暂无内容',
  loadingDescription = '加载中...',
  className = '',
  style = {},
  fontSize = 12,
  lineHeight = 1.5,
  showLineNumbers = false,
  useCodeMirror = true,
  language = 'text',
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const codeMirrorRef = useRef<any>(null);

  // 获取语言扩展
  const getLanguageExtension = () => {
    switch (language) {
      case 'javascript':
        return [javascript()];
      case 'bash':
      case 'python':
      case 'text':
      default:
        return [];
    }
  };

  // 统一使用暗色主题
  const getTheme = () => {
    return oneDark;
  };

  // 滚动到底部
  const scrollToBottom = () => {
    if (useCodeMirror && codeMirrorRef.current?.view) {
      // CodeMirror 滚动到底部
      const view = codeMirrorRef.current.view;
      view.dispatch({
        selection: { anchor: view.state.doc.length },
        scrollIntoView: true,
      });
    } else if (containerRef.current) {
      // 普通容器滚动到底部
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  // 滚动到顶部
  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  // 获取容器元素
  const getContainer = () => {
    if (useCodeMirror && codeMirrorRef.current?.editor) {
      return codeMirrorRef.current.editor;
    }
    return containerRef.current;
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    scrollToBottom,
    scrollToTop,
    getContainer,
  }));

  // 自动滚动到底部
  useEffect(() => {
    if (autoScrollToBottom && content && !loading) {
      // 延迟执行，确保内容已渲染
      setTimeout(scrollToBottom, 50);
    }
  }, [content, loading, autoScrollToBottom]);

  // 处理高度值
  const formatHeight = (height: number | string) => {
    return typeof height === 'number' ? `${height}px` : height;
  };

  // CodeMirror 自带行号，不需要自定义格式化

  const containerStyle: React.CSSProperties = {
    ...style,
  };

  const contentStyle: React.CSSProperties = {
    fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
    lineHeight: typeof lineHeight === 'number' ? lineHeight : lineHeight,
  };

  // CodeMirror 扩展配置
  const extensions = [
    ...getLanguageExtension(),
    EditorView.theme({
      '&': {
        fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
        maxHeight: formatHeight(maxHeight),
        minHeight: formatHeight(minHeight),
      },
      '.cm-content': {
        lineHeight: typeof lineHeight === 'number' ? `${lineHeight}` : lineHeight,
      },
      '.cm-scroller': {
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        maxHeight: formatHeight(maxHeight),
        minHeight: formatHeight(minHeight),
      },
    }),
    EditorView.lineWrapping,
  ];

  return (
    <div
      ref={containerRef}
      className={`output-display-container ${className}`}
      style={containerStyle}
    >
      {loading ? (
        <div className="output-display-loading">
          <Spin size="large" />
          <div className="output-display-loading-text">{loadingDescription}</div>
        </div>
      ) : content ? (
        useCodeMirror ? (
          <CodeMirror
            ref={codeMirrorRef}
            value={content}
            theme={getTheme()}
            extensions={extensions}
            editable={false}
            readOnly={true}
            basicSetup={{
              lineNumbers: showLineNumbers,
              foldGutter: false,
              dropCursor: false,
              allowMultipleSelections: false,
              indentOnInput: false,
              bracketMatching: false,
              closeBrackets: false,
              autocompletion: false,
              highlightSelectionMatches: false,
              searchKeymap: false, // 禁用搜索快捷键
            }}
            style={{
              fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
            }}
          />
        ) : (
          <pre className="output-display-content" style={contentStyle}>
            {content}
          </pre>
        )
      ) : (
        <Empty
          description={emptyDescription}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </div>
  );
});

OutputDisplay.displayName = 'OutputDisplay';

export default OutputDisplay;
