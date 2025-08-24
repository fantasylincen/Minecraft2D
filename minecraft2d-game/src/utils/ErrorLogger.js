/**
 * 客户端错误日志记录工具
 * 用于捕获和记录客户端错误信息到日志文件
 */

class ErrorLogger {
  constructor() {
    this.logFile = '/logs/client-error.log';
    this.isLogging = false;
    // 错误日志服务器地址
    this.serverUrl = 'http://localhost:3001';
  }
  
  /**
   * 初始化错误日志记录器
   */
  init() {
    if (this.isLogging) return;
    
    this.isLogging = true;
    
    // 监听全局错误
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'JavaScript Error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack || '',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });
    
    // 监听未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'Unhandled Promise Rejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack || '',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });
    
    console.log('📝 错误日志记录器已初始化');
  }
  
  /**
   * 记录错误信息
   * @param {Object} errorInfo - 错误信息对象
   */
  async logError(errorInfo) {
    try {
      // 构建日志条目
      const logEntry = this.formatLogEntry(errorInfo);
      
      // 在浏览器环境中，我们记录到控制台
      console.error('🚨 客户端错误:', logEntry);
      
      // 保存到服务器日志文件
      await this.saveToServerLogFile(logEntry);
    } catch (logError) {
      console.error('记录错误日志时发生异常:', logError);
    }
  }
  
  /**
   * 格式化日志条目
   * @param {Object} errorInfo - 错误信息对象
   * @returns {string} 格式化后的日志条目
   */
  formatLogEntry(errorInfo) {
    return `[${errorInfo.timestamp}] ${errorInfo.type}: ${errorInfo.message}
    文件: ${errorInfo.filename || 'N/A'}
    位置: ${errorInfo.lineno || 'N/A'}:${errorInfo.colno || 'N/A'}
    URL: ${errorInfo.url}
    UserAgent: ${errorInfo.userAgent}
    Stack: ${errorInfo.stack || 'N/A'}\n`;
  }
  
  /**
   * 保存到服务器日志文件
   * @param {string} logEntry - 日志条目
   */
  async saveToServerLogFile(logEntry) {
    try {
      // 发送到后端API保存日志
      const response = await fetch(`${this.serverUrl}/api/log-error`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logEntry }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅', result.message);
    } catch (error) {
      console.error('❌ 保存日志到服务器时出错:', error);
      // 如果服务器不可用，仍然在控制台记录
      console.log('📝 日志内容:', logEntry);
    }
  }
  
  /**
   * 获取错误日志内容
   */
  async getErrorLog() {
    try {
      const response = await fetch(`${this.serverUrl}/api/error-log`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.content;
    } catch (error) {
      console.error('获取错误日志时出错:', error);
      return '';
    }
  }
  
  /**
   * 清空错误日志
   */
  async clearErrorLog() {
    try {
      const response = await fetch(`${this.serverUrl}/api/error-log`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅', result.message);
    } catch (error) {
      console.error('清空错误日志时出错:', error);
    }
  }
}

// 创建单例实例
const errorLogger = new ErrorLogger();

export default errorLogger;