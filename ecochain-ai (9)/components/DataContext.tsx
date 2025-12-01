import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CarbonRecord, User, Message, ChatHistory, StrategyResult, DataEntryFormData } from '../types';
import { backendApi } from '../services/backendApi';

interface DataContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  records: CarbonRecord[];
  chatHistory: ChatHistory | null;
  strategies: StrategyResult[];
  
  // 用户相关
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getCurrentUser: () => Promise<User | null>;
  
  // 数据记录相关
  fetchRecords: () => Promise<void>;
  createRecord: (data: DataEntryFormData) => Promise<CarbonRecord>;
  deleteRecord: (id: string) => Promise<void>;
  
  // AI助手相关
  fetchChatHistory: (id?: string) => Promise<void>;
  sendMessage: (content: string) => Promise<Message>;
  
  // 策略相关
  fetchStrategies: () => Promise<void>;
  saveStrategy: (title: string, content: string, recordsUsed: string[], industry: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<CarbonRecord[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistory | null>(null);
  const [strategies, setStrategies] = useState<StrategyResult[]>([]);
  
  // 清除错误
  const clearError = () => setError(null);
  
  // 用户登录
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      clearError();
      
      const { user } = await backendApi.login(email, password);
      setUser(user);
    } catch (err: any) {
      setError(err.message || '登录失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // 用户登出
  const logout = () => {
    backendApi.logout();
    setUser(null);
    setRecords([]);
    setChatHistory(null);
    setStrategies([]);
  };
  
  // 获取当前用户
  const getCurrentUser = async () => {
    try {
      setLoading(true);
      clearError();
      
      const userData = await backendApi.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (err: any) {
      setError(err.message || '获取用户信息失败');
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // 获取碳排放记录
  const fetchRecords = async () => {
    try {
      setLoading(true);
      clearError();
      
      const recordsData = await backendApi.getRecords();
      setRecords(recordsData);
    } catch (err: any) {
      setError(err.message || '获取记录失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 创建碳排放记录
  const createRecord = async (data: DataEntryFormData) => {
    try {
      setLoading(true);
      clearError();
      
      const newRecord = await backendApi.createRecord(data);
      
      // 更新本地记录列表
      setRecords([newRecord, ...records]);
      
      return newRecord;
    } catch (err: any) {
      setError(err.message || '创建记录失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // 删除碳排放记录
  const deleteRecord = async (id: string) => {
    try {
      setLoading(true);
      clearError();
      
      await backendApi.deleteRecord(id);
      
      // 更新本地记录列表
      setRecords(records.filter(record => record.id !== id));
    } catch (err: any) {
      setError(err.message || '删除记录失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // 获取聊天历史
  const fetchChatHistory = async (id?: string) => {
    try {
      setLoading(true);
      clearError();
      
      if (id) {
        // 获取特定聊天历史
        const history = await backendApi.getChatHistory(id);
        setChatHistory(history);
      } else {
        // 获取最新的聊天历史
        const histories = await backendApi.getChatHistories();
        if (histories.length > 0) {
          setChatHistory(histories[0]);
        } else {
          setChatHistory(null);
        }
      }
    } catch (err: any) {
      setError(err.message || '获取聊天历史失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 发送消息
  const sendMessage = async (content: string) => {
    if (!content.trim()) {
      throw new Error('消息内容不能为空');
    }
    
    try {
      setLoading(true);
      clearError();
      
      // 创建用户消息
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        sender: 'user',
        timestamp: Date.now()
      };
      
      // 更新本地聊天历史
      let updatedHistory: ChatHistory;
      
      if (chatHistory) {
        updatedHistory = {
          ...chatHistory,
          messages: [...chatHistory.messages, userMessage],
          updatedAt: Date.now()
        };
      } else {
        updatedHistory = {
          id: Date.now().toString(),
          title: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
          messages: [userMessage],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      }
      
      setChatHistory(updatedHistory);
      
      // 保存聊天历史到后端
      const savedHistory = await backendApi.addChatMessage(
        chatHistory?.id || null,
        userMessage
      );
      
      // 模拟AI回复（实际应用中应该由后端处理）
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `我已收到您的消息: "${content}"。这是一个自动回复。在实际应用中，AI助手会根据您的问题提供专业的碳排放分析和建议。`,
        sender: 'ai',
        timestamp: Date.now() + 1000
      };
      
      // 更新本地聊天历史
      const finalHistory = {
        ...savedHistory,
        messages: [...savedHistory.messages, aiMessage],
        updatedAt: Date.now()
      };
      
      setChatHistory(finalHistory);
      
      return aiMessage;
    } catch (err: any) {
      setError(err.message || '发送消息失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // 获取减排策略
  const fetchStrategies = async () => {
    try {
      setLoading(true);
      clearError();
      
      const strategiesData = await backendApi.getStrategies();
      setStrategies(strategiesData);
    } catch (err: any) {
      setError(err.message || '获取策略失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 保存减排策略
  const saveStrategy = async (
    title: string, 
    content: string, 
    recordsUsed: string[], 
    industry: string
  ) => {
    try {
      setLoading(true);
      clearError();
      
      const strategy = await backendApi.saveStrategy(title, content, recordsUsed, industry);
      
      // 更新本地策略列表
      setStrategies([strategy, ...strategies]);
    } catch (err: any) {
      setError(err.message || '保存策略失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // 初始化数据
  useEffect(() => {
    const initData = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // 获取用户信息
          await getCurrentUser();
          
          // 获取记录
          await fetchRecords();
          
          // 获取策略
          await fetchStrategies();
          
          // 获取聊天历史
          await fetchChatHistory();
        } catch (err) {
          console.error('初始化数据失败:', err);
        }
      }
    };
    
    initData();
  }, []);
  
  const value = {
    user,
    loading,
    error,
    records,
    chatHistory,
    strategies,
    
    login,
    logout,
    getCurrentUser,
    
    fetchRecords,
    createRecord,
    deleteRecord,
    
    fetchChatHistory,
    sendMessage,
    
    fetchStrategies,
    saveStrategy
  };
  
  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
