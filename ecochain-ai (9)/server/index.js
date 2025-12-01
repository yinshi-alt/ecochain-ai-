const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// 初始化Express应用
const app = express();

// 中间件
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 模拟数据库
const mockDb = {
  users: [
    {
      id: '1',
      email: 'admin@example.com',
      password: '$2a$10$6YQJ1J6X3Q1L5D5F5G5H5J5K5L5M5N5O5P5Q5R5S5T5U5V5W5X5Y5Z', // password: admin123
      name: 'Admin User',
      company: 'EcoChain Inc',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      email: 'user@example.com',
      password: '$2a$10$6YQJ1J6X3Q1L5D5F5G5H5J5K5L5M5N5O5P5Q5R5S5T5U5V5W5X5Y5Z', // password: user123
      name: 'Regular User',
      company: 'GreenTech Corp',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  records: [],
  nodes: [],
  assets: [],
  strategies: [],
  chats: [],
  importJobs: []
};

// 全局变量，存储模拟数据
app.locals.db = mockDb;

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/records', require('./routes/records'));
app.use('/api/nodes', require('./routes/nodes'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/strategies', require('./routes/strategies'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/import', require('./routes/import'));
app.use('/api/integrations', require('./routes/integrations'));

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Not found' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
