import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { DataProvider } from '../components/DataContext';

// Mock the api service
jest.mock('../services/api', () => ({
  api: {
    getCurrentUser: jest.fn(() => ({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      company: 'Test Company',
      role: 'user'
    })),
    fetchDashboardData: jest.fn(() => Promise.resolve({
      records: [
        {
          id: '1',
          date: '2023-01-01',
          source: '电力',
          value: 1000,
          unit: 'kWh',
          scope: 2,
          emissionFactor: 0.0005,
          totalCo2e: 0.5,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ],
      nodes: [],
      assets: []
    })),
    login: jest.fn(() => Promise.resolve({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      company: 'Test Company',
      role: 'user',
      token: 'test-token'
    }))
  }
}));

// Mock the gemini service
jest.mock('../services/geminiService', () => ({
  analyzeAbnormalData: jest.fn(() => Promise.resolve({
    valid: true,
    reason: '数据正常'
  })),
  generateReductionStrategy: jest.fn(() => Promise.resolve('减排策略报告内容')),
  processChatMessage: jest.fn(() => Promise.resolve('AI回复内容')),
  checkApiKeyValidity: jest.fn(() => Promise.resolve(true))
}));

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders login page by default', () => {
    render(<App />);
    
    expect(screen.getByText('登录到 EcoChain AI')).toBeInTheDocument();
    expect(screen.getByLabelText('邮箱地址')).toBeInTheDocument();
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument();
  });

  test('logs in with demo credentials', async () => {
    render(<App />);
    
    // 演示账号信息已预填
    expect(screen.getByDisplayValue('demo@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('password')).toBeInTheDocument();
    
    // 点击登录按钮
    fireEvent.click(screen.getByRole('button', { name: /登录/i }));
    
    // 等待登录完成并显示仪表盘
    await waitFor(() => {
      expect(screen.getByText('仪表盘')).toBeInTheDocument();
    });
    
    // 检查导航项
    expect(screen.getByText('仪表盘')).toBeInTheDocument();
    expect(screen.getByText('生态链')).toBeInTheDocument();
    expect(screen.getByText('AI助手')).toBeInTheDocument();
    expect(screen.getByText('数据采集')).toBeInTheDocument();
    expect(screen.getByText('报告')).toBeInTheDocument();
  });

  test('navigates to different views', async () => {
    render(<App />);
    
    // 登录
    fireEvent.click(screen.getByRole('button', { name: /登录/i }));
    
    // 等待仪表盘加载
    await waitFor(() => {
      expect(screen.getByText('仪表盘')).toBeInTheDocument();
    });
    
    // 导航到数据采集
    fireEvent.click(screen.getByText('数据采集'));
    expect(await screen.findByText('数据采集')).toBeInTheDocument();
    
    // 导航到AI助手
    fireEvent.click(screen.getByText('AI助手'));
    expect(await screen.findByText('AI助手')).toBeInTheDocument();
    
    // 导航到生态链
    fireEvent.click(screen.getByText('生态链'));
    expect(await screen.findByText('生态链管理')).toBeInTheDocument();
    
    // 导航到报告
    fireEvent.click(screen.getByText('报告'));
    expect(await screen.findByText('报告中心')).toBeInTheDocument();
  });

  test('logs out successfully', async () => {
    render(<App />);
    
    // 登录
    fireEvent.click(screen.getByRole('button', { name: /登录/i }));
    
    // 等待仪表盘加载
    await waitFor(() => {
      expect(screen.getByText('仪表盘')).toBeInTheDocument();
    });
    
    // 点击退出登录
    fireEvent.click(screen.getByText('退出登录'));
    
    // 等待登录页面显示
    await waitFor(() => {
      expect(screen.getByText('登录到 EcoChain AI')).toBeInTheDocument();
    });
  });
});
