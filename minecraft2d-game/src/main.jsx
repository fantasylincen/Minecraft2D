import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('🚀 启动Minecraft2D应用...');

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('✅ React应用启动成功');
} catch (error) {
  console.error('❌ React应用启动失败:', error);
}
