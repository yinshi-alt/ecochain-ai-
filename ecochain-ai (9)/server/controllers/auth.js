const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// 模拟JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

// 用户注册
const register = (req, res) => {
  try {
    const { email, password, name, company } = req.body;

    // 验证请求数据
    if (!email || !password || !name) {
      return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    // 检查用户是否已存在
    const existingUser = req.app.locals.db.users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'User already exists' });
    }

    // 密码哈希
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // 创建新用户
    const newUser = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      name,
      company: company || '',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 保存用户
    req.app.locals.db.users.push(newUser);

    // 生成JWT令牌
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 返回用户信息和令牌
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          company: newUser.company,
          role: newUser.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// 用户登录
const login = (req, res) => {
  try {
    const { email, password } = req.body;

    // 验证请求数据
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });
    }

    // 查找用户
    const user = req.app.locals.db.users.find(user => user.email === email);
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // 验证密码
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // 更新最后登录时间
    user.lastLogin = new Date();

    // 生成JWT令牌
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 返回用户信息和令牌
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          company: user.company,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// 获取当前用户信息
const getCurrentUser = (req, res) => {
  try {
    // 从请求对象获取用户ID
    const userId = req.user.id;

    // 查找用户
    const user = req.app.locals.db.users.find(user => user.id === userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // 返回用户信息
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          company: user.company,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// 更新用户信息
const updateUser = (req, res) => {
  try {
    // 从请求对象获取用户ID
    const userId = req.user.id;
    const { name, company, email } = req.body;

    // 查找用户
    const userIndex = req.app.locals.db.users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // 检查邮箱是否已被使用
    if (email && email !== req.app.locals.db.users[userIndex].email) {
      const emailExists = req.app.locals.db.users.some(user => user.email === email);
      if (emailExists) {
        return res.status(400).json({ status: 'error', message: 'Email already in use' });
      }
    }

    // 更新用户信息
    if (name) req.app.locals.db.users[userIndex].name = name;
    if (company) req.app.locals.db.users[userIndex].company = company;
    if (email) req.app.locals.db.users[userIndex].email = email;
    req.app.locals.db.users[userIndex].updatedAt = new Date();

    // 返回更新后的用户信息
    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: {
        user: {
          id: req.app.locals.db.users[userIndex].id,
          email: req.app.locals.db.users[userIndex].email,
          name: req.app.locals.db.users[userIndex].name,
          company: req.app.locals.db.users[userIndex].company,
          role: req.app.locals.db.users[userIndex].role,
          updatedAt: req.app.locals.db.users[userIndex].updatedAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// 忘记密码
const forgotPassword = (req, res) => {
  try {
    const { email } = req.body;

    // 查找用户
    const userIndex = req.app.locals.db.users.findIndex(user => user.email === email);
    if (userIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // 生成重置令牌
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // 保存重置令牌（在实际应用中，应该哈希存储）
    req.app.locals.db.users[userIndex].resetPasswordToken = resetToken;
    req.app.locals.db.users[userIndex].resetPasswordExpires = Date.now() + 3600000; // 1小时后过期

    // 在实际应用中，这里应该发送包含重置链接的邮件
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.status(200).json({
      status: 'success',
      message: 'Password reset email sent'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// 重置密码
const resetPassword = (req, res) => {
  try {
    const { token, password } = req.body;

    // 查找用户
    const userIndex = req.app.locals.db.users.findIndex(
      user => user.resetPasswordToken === token && user.resetPasswordExpires > Date.now()
    );

    if (userIndex === -1) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired token' });
    }

    // 密码哈希
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // 更新密码并清除重置令牌
    req.app.locals.db.users[userIndex].password = hashedPassword;
    req.app.locals.db.users[userIndex].resetPasswordToken = undefined;
    req.app.locals.db.users[userIndex].resetPasswordExpires = undefined;
    req.app.locals.db.users[userIndex].updatedAt = new Date();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateUser,
  forgotPassword,
  resetPassword
};
