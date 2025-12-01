import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Download, Filter, RefreshCw, Trash2 } from 'lucide-react';
import { useData } from './DataContext';
import { api } from '../services/api';
import { CarbonRecord } from '../types';

// 颜色配置
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const Dashboard: React.FC = () => {
  const { records, loading, error, refreshData, deleteRecord } = useData();
  
  // 使用useMemo缓存计算结果，避免每次渲染都重新计算
  const { 
    totalEmissions, 
    pieData, 
    chartData, 
    recentRecords 
  } = useMemo(() => {
    // 计算总排放量
    const totalEmissions = records.reduce((sum, record) => sum + record.totalCo2e, 0);
    
    // 按排放源统计排放量
    const sourceData = records.reduce((acc, record) => {
      const source = record.source;
      acc[source] = (acc[source] || 0) + record.totalCo2e;
      return acc;
    }, {} as Record<string, number>);
    
    // 转换为饼图数据
    const pieData = Object.entries(sourceData).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));
    
    // 按日期统计排放量
    const dateData = records.reduce((acc, record) => {
      const date = record.date;
      acc[date] = (acc[date] || 0) + record.totalCo2e;
      return acc;
    }, {} as Record<string, number>);
    
    // 转换为柱状图数据并排序
    const chartData = Object.entries(dateData)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // 获取最近的记录
    const recentRecords = [...records]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    
    return {
      totalEmissions,
      pieData,
      chartData,
      recentRecords
    };
  }, [records]);
  
  // 处理报告生成
  const handleGenerateReport = async () => {
    try {
      await api.generateReport('碳排放概览', records);
    } catch (err) {
      console.error('生成报告失败:', err);
      alert('生成报告失败，请重试');
    }
  };
  
  // 处理记录删除
  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      try {
        await deleteRecord(id);
      } catch (err) {
        console.error('删除记录失败:', err);
        alert('删除记录失败，请重试');
      }
    }
  };
  
  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-10 w-10 text-emerald-600 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">仪表盘</h1>
          <p className="text-gray-600 dark:text-gray-400">碳排放数据概览</p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            onClick={refreshData}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </button>
          
          <button
            onClick={handleGenerateReport}
            className="flex items-center px-4 py-2 bg-emerald-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800"
          >
            <Download className="h-4 w-4 mr-2" />
            生成报告
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700 dark:bg-red-900 dark:border-red-800 dark:text-red-300">
          {error}
        </div>
      )}
      
      {/* 总排放量卡片 */}
      <div className="p-6 mb-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">总排放量</p>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalEmissions.toFixed(2)} <span className="text-lg">tCO₂e</span>
            </h2>
          </div>
          
          <div className="p-3 bg-emerald-100 rounded-full dark:bg-emerald-900">
            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 排放量趋势图 */}
        <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">排放量趋势</h3>
          
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              暂无数据
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#666' }}
                    tickLine={{ stroke: '#666' }}
                    axisLine={{ stroke: '#666' }}
                  />
                  <YAxis 
                    tick={{ fill: '#666' }}
                    tickLine={{ stroke: '#666' }}
                    axisLine={{ stroke: '#666' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderColor: '#e2e8f0',
                      borderRadius: '0.375rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    formatter={(value) => [`${value.toFixed(2)} tCO₂e`, '排放量']}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
        {/* 排放源分布图 */}
        <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">排放源分布</h3>
          
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              暂无数据
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderColor: '#e2e8f0',
                      borderRadius: '0.375rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    formatter={(value) => [`${value.toFixed(2)} tCO₂e`, '排放量']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
      
      {/* 最近记录 */}
      <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">最近记录</h3>
          
          <button className="flex items-center text-sm text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">
            <Filter className="h-4 w-4 mr-1" />
            筛选
          </button>
        </div>
        
        {recentRecords.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            暂无记录
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    日期
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    排放源
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    活动数据
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    范围
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    排放量 (tCO₂e)
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {recentRecords.map((record: CarbonRecord) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {record.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {record.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {record.value} {record.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      范围 {record.scope}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {record.totalCo2e.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        aria-label="删除"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
