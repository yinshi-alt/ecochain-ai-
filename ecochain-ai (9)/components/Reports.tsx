import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Filter, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  Info,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useData } from './DataContext';
import { api } from '../services/api';
import { CarbonRecord, StrategyResult } from '../types';

// 报告类型定义
type ReportType = 'overview' | 'detailed' | 'strategy' | 'custom';

export const Reports: React.FC = () => {
  const { records, loading, refreshData } = useData();
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('overview');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: new Date().toISOString().split('T')[0]
  });
  const [sourceFilter, setSourceFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState<number | 'all'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<StrategyResult[]>([]);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info' | null;
    text: string;
  }>({
    type: null,
    text: ''
  });
  
  // 获取所有可用的排放源
  const availableSources = useMemo(() => {
    const sources = new Set(records.map(record => record.source));
    return Array.from(sources);
  }, [records]);
  
  // 获取策略列表
  useEffect(() => {
    const loadStrategies = async () => {
      try {
        const strategiesList = await api.getStrategies();
        setStrategies(strategiesList);
      } catch (error) {
        console.error('加载策略失败:', error);
        showMessage('error', '加载策略失败');
      }
    };
    
    loadStrategies();
  }, []);
  
  // 显示消息
  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage({ type: null, text: '' });
    }, 5000);
  };
  
  // 处理报告生成
  const handleGenerateReport = async () => {
    if (records.length === 0) {
      showMessage('error', '暂无数据，无法生成报告');
      return;
    }
    
    setIsGenerating(true);
    setGeneratedReport(null);
    
    try {
      // 应用过滤器
      let filteredRecords = [...records];
      
      if (dateRange.startDate) {
        filteredRecords = filteredRecords.filter(record => record.date >= dateRange.startDate!);
      }
      
      if (dateRange.endDate) {
        filteredRecords = filteredRecords.filter(record => record.date <= dateRange.endDate!);
      }
      
      if (sourceFilter !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.source === sourceFilter);
      }
      
      if (scopeFilter !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.scope === scopeFilter);
      }
      
      if (filteredRecords.length === 0) {
        showMessage('info', '没有符合条件的数据');
        setIsGenerating(false);
        return;
      }
      
      // 根据报告类型生成不同的报告
      switch (selectedReportType) {
        case 'overview':
          await api.generateReport('碳排放概览', filteredRecords);
          showMessage('success', '概览报告已生成');
          break;
        case 'detailed':
          await api.generateReport('详细分析', filteredRecords);
          showMessage('success', '详细报告已生成');
          break;
        case 'strategy':
          if (strategies.length === 0) {
            showMessage('error', '暂无减排策略，请先在AI助手页面生成');
            break;
          }
          
          // 使用最新的策略
          const latestStrategy = strategies[0];
          setGeneratedReport(latestStrategy.content);
          showMessage('success', '减排策略报告已加载');
          break;
        case 'custom':
          // 自定义报告逻辑
          showMessage('info', '自定义报告功能正在开发中');
          break;
      }
    } catch (error: any) {
      console.error('生成报告失败:', error);
      showMessage('error', error.message || '生成报告失败');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // 处理导出报告
  const handleExportReport = () => {
    if (!generatedReport) {
      showMessage('error', '没有可导出的报告');
      return;
    }
    
    const blob = new Blob([generatedReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `减排策略报告_${new Date().toLocaleDateString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('success', '报告已导出');
  };
  
  // 计算报告统计数据
  const calculateReportStats = () => {
    if (records.length === 0) return null;
    
    // 应用过滤器
    let filteredRecords = [...records];
    
    if (dateRange.startDate) {
      filteredRecords = filteredRecords.filter(record => record.date >= dateRange.startDate!);
    }
    
    if (dateRange.endDate) {
      filteredRecords = filteredRecords.filter(record => record.date <= dateRange.endDate!);
    }
    
    if (sourceFilter !== 'all') {
      filteredRecords = filteredRecords.filter(record => record.source === sourceFilter);
    }
    
    if (scopeFilter !== 'all') {
      filteredRecords = filteredRecords.filter(record => record.scope === scopeFilter);
    }
    
    if (filteredRecords.length === 0) return null;
    
    // 计算统计数据
    const totalEmissions = filteredRecords.reduce((sum, record) => sum + record.totalCo2e, 0);
    const avgEmissions = totalEmissions / filteredRecords.length;
    
    // 按排放源统计
    const emissionsBySource = filteredRecords.reduce((acc, record) => {
      if (!acc[record.source]) {
        acc[record.source] = 0;
      }
      acc[record.source] += record.totalCo2e;
      return acc;
    }, {} as Record<string, number>);
    
    // 按范围统计
    const emissionsByScope = filteredRecords.reduce((acc, record) => {
      const scopeKey = `scope${record.scope}`;
      if (!acc[scopeKey]) {
        acc[scopeKey] = 0;
      }
      acc[scopeKey] += record.totalCo2e;
      return acc;
    }, {} as Record<string, number>);
    
    // 找出最大排放源
    let maxSource = '';
    let maxEmissions = 0;
    
    for (const [source, emissions] of Object.entries(emissionsBySource)) {
      if (emissions > maxEmissions) {
        maxEmissions = emissions;
        maxSource = source;
      }
    }
    
    return {
      totalEmissions,
      avgEmissions,
      emissionsBySource,
      emissionsByScope,
      maxSource,
      maxEmissions,
      recordCount: filteredRecords.length
    };
  };
  
  const reportStats = calculateReportStats();
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">报告中心</h1>
          <p className="text-gray-600 dark:text-gray-400">生成和管理碳排放报告</p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            onClick={refreshData}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Loader2 className="h-4 w-4 mr-2" />
            刷新
          </button>
        </div>
      </div>
      
      {/* 消息提示 */}
      {message.type && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 border border-green-200 text-green-700 dark:bg-green-900 dark:border-green-800 dark:text-green-300'
            : message.type === 'error'
            ? 'bg-red-100 border border-red-200 text-red-700 dark:bg-red-900 dark:border-red-800 dark:text-red-300'
            : 'bg-blue-100 border border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-800 dark:text-blue-300'
        }`}>
          <div className="flex items-start">
            {message.type === 'success' && <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />}
            {message.type === 'error' && <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />}
            {message.type === 'info' && <Info className="h-5 w-5 mr-2 flex-shrink-0" />}
            <p className="text-sm">{message.text}</p>
          </div>
        </div>
      )}
      
      {/* 报告生成选项 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">生成报告</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 报告类型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              报告类型
            </label>
            <div className="space-y-2">
              {[
                { id: 'overview', label: '碳排放概览' },
                { id: 'detailed', label: '详细分析报告' },
                { id: 'strategy', label: '减排策略报告' },
                { id: 'custom', label: '自定义报告' }
              ].map((type) => (
                <div key={type.id} className="flex items-center">
                  <input
                    type="radio"
                    id={`report-type-${type.id}`}
                    name="report-type"
                    value={type.id}
                    checked={selectedReportType === type.id as ReportType}
                    onChange={() => setSelectedReportType(type.id as ReportType)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label
                    htmlFor={`report-type-${type.id}`}
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* 日期范围选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              日期范围
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-date" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  开始日期
                </label>
                <input
                  type="date"
                  id="start-date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  结束日期
                </label>
                <input
                  type="date"
                  id="end-date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>
          
          {/* 排放源过滤 */}
          <div>
            <label htmlFor="source-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              排放源过滤
            </label>
            <select
              id="source-filter"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">全部排放源</option>
              {availableSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>
          
          {/* 范围过滤 */}
          <div>
            <label htmlFor="scope-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              范围过滤
            </label>
            <select
              id="scope-filter"
              value={scopeFilter}
              onChange={(e) => {
                const value = e.target.value;
                setScopeFilter(value === 'all' ? 'all' : parseInt(value));
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">全部范围</option>
              <option value="1">范围 1 (直接排放)</option>
              <option value="2">范围 2 (间接排放)</option>
              <option value="3">范围 3 (其他间接排放)</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating || records.length === 0}
            className="flex items-center px-4 py-2 bg-emerald-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                生成中...
              </div>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                生成报告
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* 报告预览 */}
      {generatedReport && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">报告预览</h2>
            
            <button
              onClick={handleExportReport}
              className="flex items-center text-sm text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              <Download className="h-4 w-4 mr-1" />
              导出报告
            </button>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto whitespace-pre-line">
            <p className="text-gray-900 dark:text-white">{generatedReport}</p>
          </div>
        </div>
      )}
      
      {/* 报告统计摘要 */}
      {reportStats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">数据摘要</h2>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              基于 {reportStats.recordCount} 条记录
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">总排放量</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {reportStats.totalEmissions.toFixed(2)} <span className="text-sm">tCO₂e</span>
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">平均排放量</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {reportStats.avgEmissions.toFixed(2)} <span className="text-sm">tCO₂e/条</span>
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">最大排放源</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{reportStats.maxSource}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {reportStats.maxEmissions.toFixed(2)} tCO₂e
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">数据覆盖时间</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {dateRange.startDate 
                  ? `${dateRange.startDate} 至 ${dateRange.endDate}` 
                  : `至 ${dateRange.endDate}`}
              </p>
            </div>
          </div>
          
          {/* 排放源分布 */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">排放源分布</h3>
            <div className="space-y-2">
              {Object.entries(reportStats.emissionsBySource).map(([source, emissions]) => {
                const percentage = (emissions / reportStats.totalEmissions) * 100;
                
                return (
                  <div key={source} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{source}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {emissions.toFixed(2)} tCO₂e ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className="bg-emerald-600 h-2.5 rounded-full dark:bg-emerald-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* 范围分布 */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">范围分布</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((scope) => {
                const emissions = reportStats.emissionsByScope[`scope${scope}`] || 0;
                const percentage = reportStats.totalEmissions > 0 
                  ? (emissions / reportStats.totalEmissions) * 100 
                  : 0;
                
                let scopeLabel = '';
                switch (scope) {
                  case 1:
                    scopeLabel = '直接排放';
                    break;
                  case 2:
                    scopeLabel = '间接排放';
                    break;
                  case 3:
                    scopeLabel = '其他间接排放';
                    break;
                }
                
                return (
                  <div key={`scope-${scope}`} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">范围 {scope}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{scopeLabel}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-600">
                      <div
                        className={`h-2 rounded-full ${
                          scope === 1 ? 'bg-blue-500' : scope === 2 ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {emissions.toFixed(2)} tCO₂e
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
