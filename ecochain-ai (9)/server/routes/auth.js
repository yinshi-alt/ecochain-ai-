const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  register,
  login,
  getCurrentUser,
  updateUser,
  forgotPassword,
  resetPassword
} = require('../controllers/auth');

// 公共路由
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// 受保护的路由
router.get('/me', authenticate, getCurrentUser);
router.put('/me', authenticate, updateUser);

module.exports = router;
