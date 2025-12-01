const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createDataSource,
  getDataSources,
  getDataSource,
  updateDataSource,
  deleteDataSource,
  testDataSourceConnection,
  syncDataSource
} = require('../controllers/integrations');

// 所有路由都需要身份验证
router.use(auth);

// 创建数据源
router.post('/', createDataSource);

// 获取所有数据源
router.get('/', getDataSources);

// 获取单个数据源
router.get('/:id', getDataSource);

// 更新数据源
router.put('/:id', updateDataSource);

// 删除数据源
router.delete('/:id', deleteDataSource);

// 测试数据源连接
router.post('/:id/test', testDataSourceConnection);

// 同步数据源数据
router.post('/:id/sync', syncDataSource);

module.exports = router;
