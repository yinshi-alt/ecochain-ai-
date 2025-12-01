import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('全局错误捕获:', event.error);
  // 实际应用中可以添加错误上报逻辑
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
