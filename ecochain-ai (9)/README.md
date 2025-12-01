# EcoChain AI - 碳足迹追踪与管理平台

EcoChain AI 是一个基于人工智能的碳足迹追踪与管理平台，帮助企业和个人精确计算、分析和减少碳排放。

## 功能特点

### 核心功能
- **碳足迹追踪**：记录和追踪各类活动产生的碳排放
- **数据分析**：可视化分析碳排放趋势和模式
- **减排策略**：AI驱动的减排建议和优化方案
- **生态链管理**：追踪供应链和价值链中的碳排放

### 新增功能（后端集成与数据源扩展）
- **用户认证系统**：完整的注册、登录、密码重置功能
- **多数据源集成**：
  - API集成：连接外部系统API获取数据
  - 数据库连接：支持PostgreSQL、MySQL、MongoDB、SQL Server、Snowflake
  - 定时同步：自动定期同步数据源数据
  - 数据映射：自定义数据源字段到系统字段的映射

## 技术栈

- **前端**：React, TypeScript, Tailwind CSS
- **后端**：Node.js, Express
- **数据库**：支持多种数据库系统
- **认证**：JWT (JSON Web Tokens)
- **API**：RESTful API设计

## 快速开始

### 环境要求
- Node.js 14+
- npm 6+

### 安装步骤

1. 克隆代码库
```bash
git clone https://github.com/yourusername/ecochain-ai.git
cd ecochain-ai
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建 `.env` 文件，添加以下内容：
```
# API URL
VITE_API_URL=http://localhost:5000/api

# 后端配置
PORT=5000
NODE_ENV=development

# JWT配置
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
```

4. 启动开发服务器
```bash
# 启动前端
npm run dev

# 启动后端
npm run server
```

5. 访问应用
前端：http://localhost:3000
后端：http://localhost:5000

## 使用指南

### 用户认证
- 注册新用户：点击登录页面的注册链接
- 登录：使用注册的邮箱和密码登录
- 密码重置：点击登录页面的"忘记密码"链接

### 数据源集成
1. 登录后，点击左侧菜单的"数据源集成"
2. 点击"添加数据源"按钮
3. 选择数据源类型（API、PostgreSQL、MySQL等）
4. 填写数据源配置信息
5. （可选）配置定时同步
6. 点击"保存"按钮创建数据源
7. 点击"测试连接"验证配置是否正确
8. 点击"同步数据"立即同步数据

### 数据映射
数据源集成支持自定义字段映射，允许您将外部数据源的字段映射到系统的标准字段。映射格式为JSON对象，例如：
```json
{
  "date": "timestamp",
  "source": "category",
  "value": "amount",
  "unit": "unit",
  "scope": "emission_scope"
}
```

## API文档

API文档可在后端运行后访问：http://localhost:5000/api/docs

## 许可证

MIT License
