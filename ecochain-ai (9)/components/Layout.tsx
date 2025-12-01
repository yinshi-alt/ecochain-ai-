import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Chain, 
  FileText, 
  PlusSquare, 
  User, 
  LogOut, 
  Menu, 
  X,
  Sun,
  Moon,
  Database,
  Settings
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useData } from './DataContext';

interface LayoutProps {
  children: React.ReactNode;
  currentUser?: any;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 切换深色模式
  useEffect(() => {
    // 检查本地存储中的主题设置
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      // 根据系统主题自动设置
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);

  // 应用深色模式
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // 处理导航
  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  // 处理登出
  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  // 获取当前路由是否为活动状态
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // 导航项
  const navItems = [
    { path: '/dashboard', label: '仪表盘', icon: <BarChart3 size={20} /> },
    { path: '/eco-chain', label: '生态链', icon: <Chain size={20} /> },
    { path: '/ai-assistant', label: 'AI助手', icon: <User size={20} /> },
    { path: '/data-entry', label: '数据采集', icon: <PlusSquare size={20} /> },
    { path: '/reports', label: '报告', icon: <FileText size={20} /> },
    { path: '/integrations', label: '数据源集成', icon: <Database size={20} /> },
  ];

  return (
    <div className={`flex h-screen bg-gray-50 text-gray-900 ${darkMode ? 'dark' : ''}`}>
      {/* 深色模式样式 */}
      <style>
        {`
          .dark {
            background-color: #1a202c;
            color: #e2e8f0;
          }
          .dark .bg-white {
            background-color: #2d3748;
          }
          .dark .text-gray-900 {
            color: #e2e8f0;
          }
          .dark .text-gray-700 {
            color: #cbd5e0;
          }
          .dark .border-gray-200 {
            border-color: #4a5568;
          }
          .dark .shadow-md {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
        `}
      </style>

      {/* 侧边栏 - 桌面版 */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">EcoChain AI</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => handleNavClick(item.path)}
                  className={`flex items-center w-full px-4 py-2 text-left rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="切换主题"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-lg dark:text-red-400 dark:hover:bg-gray-700"
            >
              <LogOut size={16} className="mr-2" />
              退出登录
            </button>
          </div>
          
          {currentUser && (
            <div className="flex items-center p-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                {currentUser.name.charAt(0)}
              </div>
              <div className="ml-2">
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.company}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 移动端菜单按钮 */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-3 bg-emerald-600 text-white rounded-full shadow-lg"
          aria-label="菜单"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-lg shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">菜单</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="关闭菜单"
              >
                <X size={20} />
              </button>
            </div>
            
            <nav className="p-4">
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <button
                      onClick={() => handleNavClick(item.path)}
                      className={`flex items-center w-full px-4 py-2 text-left rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
                
                <li>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="flex items-center w-full px-4 py-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span className="mr-3">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</span>
                    <span>{darkMode ? '浅色模式' : '深色模式'}</span>
                  </button>
                </li>
                
                <li>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-left rounded-lg text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                  >
                    <span className="mr-3"><LogOut size={20} /></span>
                    <span>退出登录</span>
                  </button>
                </li>
              </ul>
            </nav>
            
            {currentUser && (
              <div className="flex items-center p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.company}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
};

export default Layout;
