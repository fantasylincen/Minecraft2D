/**
 * 错误日志服务器
 * 用于接收客户端错误日志并保存到文件
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 确保日志目录存在
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 日志文件路径
const logFile = path.join(logDir, 'client-error.log');

/**
 * 记录错误日志到文件
 * @param {string} logEntry - 日志条目
 */
function appendToLogFile(logEntry) {
  try {
    fs.appendFileSync(logFile, logEntry, 'utf8');
    console.log('📝 错误日志已保存到文件');
  } catch (error) {
    console.error('保存日志到文件时出错:', error);
  }
}

// API路由 - 接收错误日志
app.post('/api/log-error', (req, res) => {
  try {
    const { logEntry } = req.body;
    
    if (!logEntry) {
      return res.status(400).json({ error: '缺少日志条目' });
    }
    
    // 保存到日志文件
    appendToLogFile(logEntry);
    
    res.json({ success: true, message: '错误日志已保存' });
  } catch (error) {
    console.error('处理错误日志时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// API路由 - 获取错误日志
app.get('/api/error-log', (req, res) => {
  try {
    if (!fs.existsSync(logFile)) {
      return res.json({ content: '' });
    }
    
    const content = fs.readFileSync(logFile, 'utf8');
    res.json({ content });
  } catch (error) {
    console.error('读取日志文件时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// API路由 - 清空错误日志
app.delete('/api/error-log', (req, res) => {
  try {
    if (fs.existsSync(logFile)) {
      fs.writeFileSync(logFile, '', 'utf8');
    }
    
    res.json({ success: true, message: '错误日志已清空' });
  } catch (error) {
    console.error('清空日志文件时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 错误日志服务器运行在端口 ${PORT}`);
  console.log(`📝 日志文件路径: ${logFile}`);
});

module.exports = app;