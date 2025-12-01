import React, { useState, useRef, useEffect } from 'react';
import { Send, Save, FileText, RefreshCw, Info, X, Menu, Loader2 } from 'lucide-react';
import { useData } from './DataContext';
import { generateReductionStrategy, processChatMessage } from '../services/geminiService';
import { api } from '../services/api';
import { Message, StrategyResult } from '../types';

export const AiAssistant: React.FC = () => {
  const { records, user } = useData();
  const [mode, setMode] = useState<'chat' | 'strategy'>('chat');
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [strategyResult, setStrategyResult] = useState('');
  const [strategies, setStrategies] = useState<StrategyResult[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState('制造业');
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [availableChats, setAvailableChats] = useState<{ id: string; title: string }[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 行业选项
  const industryOptions = [
    '制造业', '能源', '交通', '建筑', '农业', '信息技术', '金融', '零售', '医疗', '教育'
  ];
  
  // 加载策略列表
  useEffect(() => {
    const loadStrategies = async () => {
      try {
        const strategiesList = await api.getStrategies();
        setStrategies(strategiesList);
      } catch (error) {
        console.error('加载策略失败:', error);
      }
    };
    
    const loadChats = async () => {
      try {
        if (user) {
          const chats = await api.getChatHistories(user.id);
          setAvailableChats(chats.map(chat => ({ id: chat.id, title: chat.title })));
        }
      } catch (error) {
        console.error('加载聊天历史失败:', error);
      }
    };
    
    loadStrategies();
    loadChats();
  }, [user]);
  
  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // 处理发送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;
    
    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    
    try {
      // 处理AI回复
      const aiResponse = await processChatMessage(
        inputMessage,
        messages.map(m => `${m.sender === 'user' ? '用户' : 'AI'}: ${m.content}`).join('\n')
      );
      
      // 添加AI消息
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // 保存聊天历史
      if (user) {
        const chatTitle = messages.length === 0 
          ? inputMessage.substring(0, 30) + (inputMessage.length > 30 ? '...' : '')
          : undefined;
        
        await api.addChatMessage(
          messages.length === 0 ? null : messages[0].id, // 使用第一个消息的ID作为历史ID
          userMessage,
          user.id
        );
        
        if (aiMessage) {
          await api.addChatMessage(
            messages.length === 0 ? null : messages[0].id,
            aiMessage,
            user.id
          );
        }
      }
    } catch (error: any) {
      console.error('处理消息失败:', error);
      
      // 添加错误消息
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: `抱歉，处理消息时出错: ${error.message || '未知错误'}`,
        sender: 'ai',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理生成减排策略
  const handleGenerateStrategy = async () => {
    if (records.length === 0) {
      alert("暂无碳排放记录，无法分析。请先在【数据采集】页面录入数据。");
      return;
    }
    
    setLoading(true);
    setStrategyResult('');
    setLoadingStep('正在提取关键排放热点...');
    
    try {
      setLoadingStep('正在提取关键排放热点...');
      await new Promise(r => setTimeout(r, 800));
      
      setLoadingStep(`基于【${selectedIndustry}】知识库匹配减排技术...`);
      await new Promise(r => setTimeout(r, 800));
      
      setLoadingStep('正在生成 ROI 分析与最终报告...');
      const result = await generateReductionStrategy(records, selectedIndustry);
      
      setStrategyResult(result);
      
      // 保存策略
      if (user) {
        await api.saveStrategy(
          `减排策略_${new Date().toLocaleDateString()}`,
          result,
          records.map(r => r.id),
          selectedIndustry,
          user.id
        );
        
        // 更新策略列表
        setStrategies(prev => [
          {
            id: Date.now().toString(),
            title: `减排策略_${new Date().toLocaleDateString()}`,
            content: result,
            createdAt: Date.now(),
            recordsUsed: records.map(r => r.id),
            industry: selectedIndustry
          },
          ...prev
        ]);
      }
    } catch (error: any) {
      console.error('生成策略失败:', error);
      setStrategyResult(`生成失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };
  
  // 处理加载历史策略
  const handleLoadStrategy = (strategy: StrategyResult) => {
    setStrategyResult(strategy.content);
    setSelectedIndustry(strategy.industry);
  };
  
  // 处理加载聊天历史
  const handleLoadChat = async (chatId: string) => {
    try {
      setLoading(true);
      const chat = await api.getChatHistory(chatId);
      
      if (chat) {
        setMessages(chat.messages);
      }
    } catch (error) {
      console.error('加载聊天历史失败:', error);
    } finally {
      setLoading(false);
      setChatHistoryOpen(false);
    }
  };
  
  // 处理清除聊天
  const handleClearChat = () => {
    if (window.confirm('确定要清除当前聊天记录吗？')) {
      setMessages([]);
    }
  };
  
  // 处理导出聊天
  const handleExportChat = () => {
    if (messages.length === 0) {
      alert('没有可导出的聊天记录');
      return;
    }
    
    const chatText = messages.map(m => `${m.sender === 'user' ? '你' : 'EcoBot'}: ${m.content}`).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EcoBot_聊天记录_${new Date().toLocaleDateString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // 处理导出策略
  const handleExportStrategy = () => {
    if (!strategyResult) {
      alert('没有可导出的策略报告');
      return;
    }
    
    const blob = new Blob([strategyResult], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `减排策略报告_${new Date().toLocaleDateString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI助手</h1>
          <p className="text-gray-600 dark:text-gray-400">智能碳排放管理助手</p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <div className="relative">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'chat' | 'strategy')}
              className="block appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
            >
              <option value="chat">聊天模式</option>
              <option value="strategy">减排策略</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <Menu size={16} />
            </div>
          </div>
        </div>
      </div>
      
      {/* 聊天模式 */}
      {mode === 'chat' && (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden dark:bg-gray-800">
          {/* 聊天头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                <span className="font-bold">E</span>
              </div>
              <div className="ml-2">
                <h2 className="font-medium text-gray-900 dark:text-white">EcoBot</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">智能助手</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setChatHistoryOpen(!chatHistoryOpen)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label="聊天历史"
              >
                <FileText size={18} />
              </button>
              
              <button
                onClick={handleExportChat}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label="导出聊天"
              >
                <Save size={18} />
              </button>
              
              <button
                onClick={handleClearChat}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label="清除聊天"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          {/* 聊天历史侧边栏 */}
          {chatHistoryOpen && (
            <div className="absolute top-0 left-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-lg z-10 overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white">聊天历史</h3>
                <button
                  onClick={() => setChatHistoryOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  aria-label="关闭"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-2">
                {availableChats.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 p-4 text-center">暂无聊天历史</p>
                ) : (
                  <ul>
                    {availableChats.map(chat => (
                      <li key={chat.id}>
                        <button
                          onClick={() => handleLoadChat(chat.id)}
                          className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                        >
                          {chat.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
          
          {/* 聊天内容 */}
          <div className="h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mb-4">
                  <FileText size={32} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">欢迎使用EcoBot</h3>
                <p className="text-center max-w-md">
                  我是您的智能碳排放管理助手，可以回答您关于碳管理的问题，提供减排建议，以及帮助您分析碳排放数据。
                </p>
                <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-md">
                  <button
                    onClick={() => setInputMessage('什么是碳排放范围1、2、3？')}
                    className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    什么是碳排放范围1、2、3？
                  </button>
                  <button
                    onClick={() => setInputMessage('如何计算我的碳足迹？')}
                    className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    如何计算我的碳足迹？
                  </button>
                  <button
                    onClick={() => setInputMessage('有哪些常见的减排措施？')}
                    className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    有哪些常见的减排措施？
                  </button>
                  <button
                    onClick={() => setInputMessage('帮我分析我的碳排放数据')}
                    className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    帮我分析我的碳排放数据
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === 'user'
                            ? 'text-emerald-100'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 max-w-[80%]">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500 dark:text-gray-400" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">正在思考...</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* 聊天输入框 */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="输入您的问题..."
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !inputMessage.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-emerald-700 dark:hover:bg-emerald-800"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 减排策略模式 */}
      {mode === 'strategy' && (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden dark:bg-gray-800">
          {/* 策略头部 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 className="font-medium text-gray-900 dark:text-white">智能减排策略生成</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">基于您的碳排放数据生成定制化减排策略</p>
          </div>
          
          {/* 策略生成选项 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  所属行业
                </label>
                <div className="relative">
                  <select
                    id="industry"
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                  >
                    {industryOptions.map(industry => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                    <Menu size={16} />
                  </div>
                </div>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={handleGenerateStrategy}
                  disabled={loading || records.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-emerald-700 dark:hover:bg-emerald-800"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      生成中...
                    </div>
                  ) : (
                    '生成减排策略'
                  )}
                </button>
              </div>
            </div>
            
            {records.length === 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-300">
                <div className="flex items-start">
                  <Info className="h-5 w-5 mr-2 flex-shrink-0" />
                  <p className="text-sm">
                    暂无碳排放记录，无法生成减排策略。请先在【数据采集】页面录入数据。
                  </p>
                </div>
              </div>
            )}
            
            {/* 生成步骤指示器 */}
            {loading && loadingStep && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 dark:bg-blue-900 dark:border-blue-800 dark:text-blue-300">
                <div className="flex items-start">
                  <Loader2 className="h-5 w-5 mr-2 flex-shrink-0 animate-spin" />
                  <p className="text-sm">{loadingStep}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* 策略结果 */}
          <div className="grid grid-cols-1 lg:grid-cols-3">
            {/* 策略列表 */}
            <div className="border-r border-gray-200 dark:border-gray-700 p-4 lg:col-span-1">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">历史策略</h3>
              
              {strategies.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2">
                    <FileText size={24} />
                  </div>
                  <p className="text-sm">暂无保存的策略</p>
                  <p className="text-xs mt-1">生成策略后将显示在这里</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {strategies.map((strategy) => (
                    <div
                      key={strategy.id}
                      className={`p-3 rounded-lg cursor-pointer ${
                        strategyResult === strategy.content
                          ? 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-900 dark:border-emerald-800'
                          : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                      onClick={() => handleLoadStrategy(strategy)}
                    >
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {strategy.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(strategy.createdAt).toLocaleDateString()} · {strategy.industry}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* 策略内容 */}
            <div className="p-4 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 dark:text-white">策略内容</h3>
                
                <button
                  onClick={handleExportStrategy}
                  disabled={!strategyResult}
                  className="flex items-center text-sm text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} className="mr-1" />
                  导出策略
                </button>
              </div>
              
              {!strategyResult ? (
                <div className="flex flex-col items-center justify-center h-96 text-gray-500 dark:text-gray-400">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <FileText size={32} />
                  </div>
                  <h4 className="text-lg font-medium mb-2">策略报告将显示在这里</h4>
                  <p className="text-center max-w-md">
                    请选择一个行业并点击"生成减排策略"按钮，系统将基于您的碳排放数据生成定制化的减排策略报告。
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto whitespace-pre-line">
                  <p className="text-gray-900 dark:text-white">{strategyResult}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
