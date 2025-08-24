import React, { useState, useEffect } from 'react';
import errorLogger from '../utils/ErrorLogger.js';

/**
 * 错误日志查看器组件
 * 用于查看和管理客户端错误日志
 */
export function ErrorLogViewer() {
  const [logContent, setLogContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 加载错误日志
   */
  const loadErrorLog = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const content = await errorLogger.getErrorLog();
      setLogContent(content);
    } catch (err) {
      setError('加载错误日志失败: ' + err.message);
      console.error('加载错误日志失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 清空错误日志
   */
  const clearErrorLog = async () => {
    if (!window.confirm('确定要清空所有错误日志吗？此操作不可撤销。')) {
      return;
    }
    
    try {
      await errorLogger.clearErrorLog();
      setLogContent('');
      alert('错误日志已清空');
    } catch (err) {
      setError('清空错误日志失败: ' + err.message);
      console.error('清空错误日志失败:', err);
    }
  };

  /**
   * 下载错误日志
   */
  const downloadErrorLog = () => {
    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'client-error.log';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 组件挂载时加载日志
  useEffect(() => {
    loadErrorLog();
  }, []);

  return (
    <div className="error-log-viewer">
      <div className="error-log-header">
        <h3>客户端错误日志</h3>
        <div className="error-log-actions">
          <button onClick={loadErrorLog} disabled={isLoading}>
            {isLoading ? '加载中...' : '刷新'}
          </button>
          <button onClick={downloadErrorLog} disabled={!logContent}>
            下载
          </button>
          <button onClick={clearErrorLog} disabled={!logContent}>
            清空
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          错误: {error}
        </div>
      )}
      
      <div className="error-log-content">
        {isLoading ? (
          <div className="loading">加载中...</div>
        ) : logContent ? (
          <pre className="log-text">{logContent}</pre>
        ) : (
          <div className="no-logs">暂无错误日志</div>
        )}
      </div>
      
      <style jsx>{`
        .error-log-viewer {
          position: fixed;
          top: 50px;
          right: 20px;
          width: 500px;
          max-height: 600px;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }
        
        .error-log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #eee;
        }
        
        .error-log-header h3 {
          margin: 0;
          color: #333;
        }
        
        .error-log-actions {
          display: flex;
          gap: 8px;
        }
        
        .error-log-actions button {
          padding: 6px 12px;
          border: 1px solid #ddd;
          background: #f8f9fa;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .error-log-actions button:hover:not(:disabled) {
          background: #e9ecef;
        }
        
        .error-log-actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .error-message {
          padding: 16px;
          background: #f8d7da;
          color: #721c24;
          border-bottom: 1px solid #f5c6cb;
        }
        
        .error-log-content {
          flex: 1;
          overflow: auto;
          padding: 16px;
          background: #f8f9fa;
        }
        
        .loading {
          text-align: center;
          padding: 32px;
          color: #666;
        }
        
        .no-logs {
          text-align: center;
          padding: 32px;
          color: #999;
        }
        
        .log-text {
          margin: 0;
          padding: 0;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          white-space: pre-wrap;
          word-wrap: break-word;
          color: #333;
        }
      `}</style>
    </div>
  );
}