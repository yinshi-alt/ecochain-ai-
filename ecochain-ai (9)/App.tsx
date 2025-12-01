import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './components/DataContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import { Loader2 } from 'lucide-react';
import { backendApi } from './services/backendApi';

// 懒加载组件
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const EcoChain = lazy(() => import('./components/EcoChain').then(m => ({ default: m.EcoChain })));
const AiAssistant = lazy(() => import('./components/AiAssistant').then(m => ({ default: m.AiAssistant })));
const DataEntry = lazy(() => import('./components/DataEntry').then(m => ({ default: m.DataEntry })));
const Reports = lazy(() => import('./components/Reports').then(m => ({ default: m.Reports })));
const Login = lazy(() => import('./components/Login').then(m => ({ default: m.Login })));
const Integrations = lazy(() => import('./components/Integrations').then(m => ({ default: m.Integrations })));

// 加载状态组件
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 size={32} className="text-emerald-600 animate-spin" />
  </div>
);

// 受保护的路由组件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setIsAuthenticated(false);
          return;
        }
        
        // 验证token有效性
        await backendApi.getCurrentUser();
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await backendApi.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };

    // 检查是否有token
    const token = localStorage.getItem('authToken');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = async () => {
    try {
      const user = await backendApi.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load user after login:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setCurrentUser(null);
  };

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary fallback={<div className="p-6 text-center">应用加载失败，请刷新页面重试</div>}>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={
              currentUser ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Suspense fallback={<LoadingFallback />}>
                  <Login onLoginSuccess={handleLoginSuccess} />
                </Suspense>
              )
            } />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout currentUser={currentUser} onLogout={handleLogout} />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={
                <Suspense fallback={<LoadingFallback />}>
                  <Dashboard />
                </Suspense>
              } />
              <Route path="eco-chain" element={
                <Suspense fallback={<LoadingFallback />}>
                  <EcoChain />
                </Suspense>
              } />
              <Route path="ai-assistant" element={
                <Suspense fallback={<LoadingFallback />}>
                  <AiAssistant />
                </Suspense>
              } />
              <Route path="data-entry" element={
                <Suspense fallback={<LoadingFallback />}>
                  <DataEntry />
                </Suspense>
              } />
              <Route path="reports" element={
                <Suspense fallback={<LoadingFallback />}>
                  <Reports />
                </Suspense>
              } />
              <Route path="integrations" element={
                <Suspense fallback={<LoadingFallback />}>
                  <Integrations />
                </Suspense>
              } />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </ErrorBoundary>
  );
};

export default App;
