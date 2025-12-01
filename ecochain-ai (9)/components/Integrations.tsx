import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Database, 
  Code, 
  RefreshCw, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Save, 
  X,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { backendApi } from '../services/backendApi';
import { DataSource, DataSourceSchedule } from '../types';

// 数据源类型配置组件
interface DataSourceConfigProps {
  type: string;
  config: any;
  onChange: (config: any) => void;
}

const DataSourceConfig: React.FC<DataSourceConfigProps> = ({ type, config, onChange }) => {
  const [localConfig, setLocalConfig] = useState<any>({ ...config });

  const handleChange = (field: string, value: any) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    const newConfig = { 
      ...localConfig, 
      [parent]: { ...localConfig[parent], [field]: value } 
    };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  // API配置表单
  const renderApiConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          API URL
        </label>
        <input
          type="text"
          value={localConfig.url || ''}
          onChange={(e) => handleChange('url', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
          placeholder="https://api.example.com/data"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          请求方法
        </label>
        <select
          value={localConfig.method || 'GET'}
          onChange={(e) => handleChange('method', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          API密钥
        </label>
        <input
          type="password"
          value={localConfig.apiKey || ''}
          onChange={(e) => handleChange('apiKey', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
          placeholder="sk_..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          数据映射
        </label>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            映射源数据字段到系统字段（JSON格式）
          </p>
          <textarea
            value={localConfig.mapping ? JSON.stringify(localConfig.mapping, null, 2) : '{}'}
            onChange={(e) => {
              try {
                const mapping = JSON.parse(e.target.value);
                handleChange('mapping', mapping);
              } catch (error) {
                // 忽略无效JSON
              }
            }}
            className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white text-sm"
            placeholder='{"date": "timestamp", "source": "category", "value": "amount"}'
          />
        </div>
      </div>
    </div>
  );

  // 数据库配置表单
  const renderDatabaseConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          主机
        </label>
        <input
          type="text"
          value={localConfig.host || ''}
          onChange={(e) => handleChange('host', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
          placeholder="localhost"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          端口
        </label>
        <input
          type="number"
          value={localConfig.port || ''}
          onChange={(e) => handleChange('port', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
          placeholder={type === 'postgres' ? '5432' : type === 'mysql' ? '3306' : type === 'mssql' ? '1433' : ''}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          数据库名
        </label>
        <input
          type="text"
          value={localConfig.database || ''}
          onChange={(e) => handleChange('database', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
          placeholder="carbon_data"
        />
      </div>
      
      {type === 'mongodb' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            集合名
          </label>
          <input
            type="text"
            value={localConfig.collection || ''}
            onChange={(e) => handleChange('collection', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
            placeholder="emissions"
          />
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          用户名
        </label>
        <input
          type="text"
          value={localConfig.username || ''}
          onChange={(e) => handleChange('username', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
          placeholder="dbuser"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          密码
        </label>
        <input
          type="password"
          value={localConfig.password || ''}
          onChange={(e) => handleChange('password', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
          placeholder="••••••••"
        />
      </div>
      
      {type !== 'mongodb' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            查询语句
          </label>
          <textarea
            value={localConfig.query || ''}
            onChange={(e) => handleChange('query', e.target.value)}
            className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white text-sm"
            placeholder={type === 'postgres' || type === 'mysql' || type === 'mssql' 
              ? 'SELECT date, source, value FROM emissions' 
              : ''}
          />
        </div>
      )}
      
      {type === 'mongodb' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            查询条件 (JSON)
          </label>
          <textarea
            value={localConfig.query ? JSON.stringify(localConfig.query, null, 2) : '{}'}
            onChange={(e) => {
              try {
                const query = JSON.parse(e.target.value);
                handleChange('query', query);
              } catch (error) {
                // 忽略无效JSON
              }
            }}
            className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white text-sm"
            placeholder='{"date": {"$gte": "2023-01-01"}}'
          />
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          数据映射
        </label>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            映射源数据字段到系统字段（JSON格式）
          </p>
          <textarea
            value={localConfig.mapping ? JSON.stringify(localConfig.mapping, null, 2) : '{}'}
            onChange={(e) => {
              try {
                const mapping = JSON.parse(e.target.value);
                handleChange('mapping', mapping);
              } catch (error) {
                // 忽略无效JSON
              }
            }}
            className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white text-sm"
            placeholder='{"date": "timestamp", "source": "category", "value": "amount"}'
          />
        </div>
      </div>
    </div>
  );

  // Snowflake配置表单
  const renderSnowflakeConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          账户名
        </label>
        <input
          type="text"
          value={localConfig.account || ''}
          onChange={(e) => handleChange('account', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
          placeholder="abc123"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          用户名
        </label>
        <input
          type="text"
          value={localConfig.username || ''}
          onChange={(e) => handleChange('username', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
          placeholder="snowflake_user"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          密码
        </label>
        <input
          type="password"
          value={localConfig.password || ''}
          onChange={(e) => handleChange('password', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
          placeholder="••••••••"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          仓库
        </label>
        <input
          type="text"
          value={localConfig.warehouse || ''}
          onChange={(e) => handleChange('warehouse', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
          placeholder="COMPUTE_WH"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          数据库
        </label>
        <input
          type="text"
          value={localConfig.database || ''}
          onChange={(e) => handleChange('database', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
          placeholder="CARBON_DB"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          模式
        </label>
        <input
          type="text"
          value={localConfig.schema || ''}
          onChange={(e) => handleChange('schema', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
          placeholder="PUBLIC"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          查询语句
        </label>
        <textarea
          value={localConfig.query || ''}
          onChange={(e) => handleChange('query', e.target.value)}
          className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white text-sm"
          placeholder="SELECT date, source, value FROM emissions"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          数据映射
        </label>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            映射源数据字段到系统字段（JSON格式）
          </p>
          <textarea
            value={localConfig.mapping ? JSON.stringify(localConfig.mapping, null, 2) : '{}'}
            onChange={(e) => {
              try {
                const mapping = JSON.parse(e.target.value);
                handleChange('mapping', mapping);
              } catch (error) {
                // 忽略无效JSON
              }
            }}
            className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white text-sm"
            placeholder='{"date": "timestamp", "source": "category", "value": "amount"}'
          />
        </div>
      </div>
    </div>
  );

  // 根据数据源类型渲染不同的配置表单
  switch (type) {
    case 'api':
      return renderApiConfig();
    case 'postgres':
    case 'mysql':
    case 'mongodb':
    case 'mssql':
      return renderDatabaseConfig();
    case 'snowflake':
      return renderSnowflakeConfig();
    default:
      return <div>不支持的数据源类型</div>;
  }
};

// 数据源列表组件
const DataSourceList: React.FC = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // 获取数据源列表
  useEffect(() => {
    const fetchDataSources = async () => {
      try {
        setLoading(true);
        const sources = await backendApi.getDataSources();
        setDataSources(sources);
        setError(null);
      } catch (err: any) {
        setError(err.message || '获取数据源失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDataSources();
  }, []);
  
  // 删除数据源
  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这个数据源吗？')) {
      try {
        await backendApi.deleteDataSource(id);
        setDataSources(dataSources.filter(source => source.id !== id));
      } catch (err: any) {
        setError(err.message || '删除数据源失败');
      }
    }
  };
  
  // 同步数据源
  const handleSync = async (id: string) => {
    try {
      // 更新UI状态为同步中
      setDataSources(dataSources.map(source => 
        source.id === id ? { ...source, status: 'syncing' } : source
      ));
      
      await backendApi.syncDataSource(id);
      
      // 重新获取数据源列表
      const sources = await backendApi.getDataSources();
      setDataSources(sources);
    } catch (err: any) {
      setError(err.message || '同步数据源失败');
      
      // 恢复UI状态
      setDataSources(dataSources.map(source => 
        source.id === id ? { ...source, status: 'error' } : source
      ));
    }
  };
  
  // 测试数据源连接
  const handleTestConnection = async (id: string) => {
    try {
      const result = await backendApi.testDataSourceConnection(id);
      
      if (result.connected) {
        alert('连接成功！');
      } else {
        alert(`连接失败: ${result.message}`);
      }
    } catch (err: any) {
      alert(`测试连接失败: ${err.message}`);
    }
  };
  
  // 获取数据源类型图标
  const getDataSourceIcon = (type: string) => {
    switch (type) {
      case 'api':
        return <Code className="h-5 w-5 text-blue-500" />;
      case 'postgres':
      case 'mysql':
      case 'mongodb':
      case 'mssql':
        return <Database className="h-5 w-5 text-green-500" />;
      case 'snowflake':
        return <Database className="h-5 w-5 text-purple-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // 获取数据源状态标签
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            正常
          </span>
        );
      case 'syncing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            同步中
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            错误
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">数据源集成</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-800"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          添加数据源
        </button>
      </div>
      
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300" role="alert">
          <AlertCircle className="inline-flex h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" />
        </div>
      ) : dataSources.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-5 sm:p-6 text-center">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg leading-6 font-medium text-gray-900 dark:text-white">
              暂无数据源
            </h3>
            <div className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
              <p>
                您还没有配置任何数据源。点击"添加数据源"按钮开始配置。
              </p>
            </div>
            <div className="mt-5">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-800"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                添加数据源
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {dataSources.map((source) => (
              <li key={source.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getDataSourceIcon(source.type)}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {source.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {source.type.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      {getStatusBadge(source.status)}
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {source.lastSync 
                          ? new Date(source.lastSync).toLocaleDateString() 
                          : '从未同步'}
                      </p>
                      {source.schedule.enabled && (
                        <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0 sm:ml-6">
                          <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {source.schedule.frequency === 'daily' ? '每天' : 
                           source.schedule.frequency === 'weekly' ? '每周' : '每月'}
                          {source.schedule.time}
                        </p>
                      )}
                    </div>
                    <div className="mt-2 flex items-center text-sm font-medium sm:mt-0">
                      <button
                        onClick={() => handleTestConnection(source.id)}
                        className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 mr-4"
                      >
                        测试连接
                      </button>
                      <button
                        onClick={() => handleSync(source.id)}
                        className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 mr-4"
                        disabled={source.status === 'syncing'}
                      >
                        {source.status === 'syncing' ? (
                          <>
                            <RefreshCw className="inline h-4 w-4 animate-spin mr-1" />
                            同步中
                          </>
                        ) : (
                          '同步数据'
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(source.id)}
                        className="text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 添加数据源模态框 */}
      {showAddModal && (
        <AddDataSourceModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            // 重新获取数据源列表
            backendApi.getDataSources().then(sources => setDataSources(sources));
          }}
        />
      )}
    </div>
  );
};

// 添加数据源模态框
interface AddDataSourceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddDataSourceModal: React.FC<AddDataSourceModalProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('api');
  const [description, setDescription] = useState('');
  const [config, setConfig] = useState<any>({});
  const [schedule, setSchedule] = useState<DataSourceSchedule>({
    enabled: false,
    frequency: 'daily',
    time: '00:00'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      setError('请输入数据源名称');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const dataSource = {
        name,
        type,
        description,
        config,
        schedule
      };
      
      await backendApi.createDataSource(dataSource);
      onSuccess();
    } catch (err: any) {
      setError(err.message || '创建数据源失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 切换定时同步
  const toggleSchedule = () => {
    setSchedule({ ...schedule, enabled: !schedule.enabled });
  };
  
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              添加数据源
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {error && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300" role="alert">
              <AlertCircle className="inline-flex h-4 w-4 mr-2" />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  数据源名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
                  placeholder="例如：企业ERP系统"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  数据源类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="api">API</option>
                  <option value="postgres">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="mongodb">MongoDB</option>
                  <option value="mssql">SQL Server</option>
                  <option value="snowflake">Snowflake</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
                  rows={3}
                  placeholder="描述数据源的用途和内容"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  数据源配置 <span className="text-red-500">*</span>
                </label>
                <DataSourceConfig 
                  type={type} 
                  config={config} 
                  onChange={setConfig} 
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    定时同步
                  </label>
                  <button
                    type="button"
                    onClick={toggleSchedule}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    {schedule.enabled ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-500" />
                        启用
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1.5 text-gray-400" />
                        禁用
                      </>
                    )}
                  </button>
                </div>
                
                {schedule.enabled && (
                  <div className="mt-3 space-y-3 bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        同步频率
                      </label>
                      <select
                        value={schedule.frequency}
                        onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="daily">每天</option>
                        <option value="weekly">每周</option>
                        <option value="monthly">每月</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        同步时间
                      </label>
                      <input
                        type="time"
                        value={schedule.time}
                        onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:ml-3 sm:w-auto sm:text-sm dark:bg-emerald-700 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    保存
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// 主组件
export const Integrations: React.FC = () => {
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <DataSourceList />
      </div>
    </div>
  );
};

export default Integrations;
