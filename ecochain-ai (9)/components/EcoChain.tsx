import React, { useState, useEffect } from 'react';
import { 
  Network, 
  PlusCircle, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  RefreshCw, 
  Info, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useData } from './DataContext';
import { EcoNode } from '../types';

export const EcoChain: React.FC = () => {
  const { nodes, assets, updateNode, tradeAsset, loading, refreshData } = useData();
  const [editingNode, setEditingNode] = useState<EcoNode | null>(null);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [newNode, setNewNode] = useState<Partial<EcoNode>>({
    name: '',
    type: '生产',
    connections: [],
    carbonIntensity: 0.5
  });
  const [tradeModal, setTradeModal] = useState<{
    show: boolean;
    assetId: string | null;
    type: 'buy' | 'sell';
    quantity: number;
  }>({
    show: false,
    assetId: null,
    type: 'buy',
    quantity: 1
  });
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info' | null;
    text: string;
  }>({
    type: null,
    text: ''
  });
  
  // 节点类型选项
  const nodeTypeOptions = [
    { value: '生产', label: '生产' },
    { value: '运输', label: '运输' },
    { value: '存储', label: '存储' },
    { value: '消费', label: '消费' },
    { value: '回收', label: '回收' }
  ];
  
  // 显示消息
  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage({ type: null, text: '' });
    }, 5000);
  };
  
  // 处理节点编辑
  const handleEditNode = (node: EcoNode) => {
    setEditingNode({ ...node });
  };
  
  // 处理节点更新
  const handleUpdateNode = async () => {
    if (!editingNode) return;
    
    try {
      await updateNode(editingNode);
      showMessage('success', '节点已更新');
      setEditingNode(null);
    } catch (error: any) {
      showMessage('error', error.message || '更新节点失败');
    }
  };
  
  // 处理取消编辑
  const handleCancelEdit = () => {
    setEditingNode(null);
  };
  
  // 处理添加节点
  const handleAddNode = async () => {
    if (!newNode.name) {
      showMessage('error', '请输入节点名称');
      return;
    }
    
    try {
      const node: EcoNode = {
        id: Date.now().toString(),
        name: newNode.name || '',
        type: newNode.type || '生产',
        connections: newNode.connections || [],
        carbonIntensity: newNode.carbonIntensity || 0.5
      };
      
      await updateNode(node);
      showMessage('success', '节点已添加');
      setShowAddNodeModal(false);
      setNewNode({
        name: '',
        type: '生产',
        connections: [],
        carbonIntensity: 0.5
      });
    } catch (error: any) {
      showMessage('error', error.message || '添加节点失败');
    }
  };
  
  // 处理连接节点
  const handleConnectNodes = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) {
      showMessage('error', '不能连接节点到自身');
      return;
    }
    
    const sourceNode = nodes.find(n => n.id === sourceId);
    const targetNode = nodes.find(n => n.id === targetId);
    
    if (!sourceNode || !targetNode) {
      showMessage('error', '节点不存在');
      return;
    }
    
    // 检查连接是否已存在
    if (sourceNode.connections.includes(targetId)) {
      showMessage('info', '连接已存在');
      return;
    }
    
    // 更新源节点的连接
    const updatedSourceNode = {
      ...sourceNode,
      connections: [...sourceNode.connections, targetId]
    };
    
    setEditingNode(updatedSourceNode);
  };
  
  // 处理断开连接
  const handleDisconnectNode = (sourceId: string, targetId: string) => {
    const sourceNode = nodes.find(n => n.id === sourceId);
    
    if (!sourceNode) {
      showMessage('error', '节点不存在');
      return;
    }
    
    // 更新源节点的连接
    const updatedSourceNode = {
      ...sourceNode,
      connections: sourceNode.connections.filter(id => id !== targetId)
    };
    
    setEditingNode(updatedSourceNode);
  };
  
  // 处理碳资产交易
  const handleTradeAsset = async () => {
    if (!tradeModal.assetId) {
      showMessage('error', '请选择资产');
      return;
    }
    
    if (tradeModal.quantity <= 0) {
      showMessage('error', '请输入有效的数量');
      return;
    }
    
    try {
      await tradeAsset(tradeModal.assetId, tradeModal.quantity, tradeModal.type);
      showMessage('success', `${tradeModal.type === 'buy' ? '购买' : '出售'}资产成功`);
      setTradeModal({
        show: false,
        assetId: null,
        type: 'buy',
        quantity: 1
      });
    } catch (error: any) {
      showMessage('error', error.message || '交易失败');
    }
  };
  
  // 准备交易
  const prepareTrade = (assetId: string, type: 'buy' | 'sell') => {
    setTradeModal({
      show: true,
      assetId,
      type,
      quantity: 1
    });
  };
  
  // 渲染网络图
  const renderNetwork = () => {
    if (nodes.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <Network size={48} className="mx-auto mb-4 opacity-50" />
            <p>暂无节点数据</p>
            <button
              onClick={() => setShowAddNodeModal(true)}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800"
            >
              <PlusCircle size={18} className="inline mr-2" />
              添加节点
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="relative h-96 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
        {/* 连接线 */}
        {nodes.map(node => 
          node.connections.map(targetId => {
            const targetNode = nodes.find(n => n.id === targetId);
            if (!targetNode) return null;
            
            // 计算连接线的位置
            const sourceIndex = nodes.indexOf(node);
            const targetIndex = nodes.indexOf(targetNode);
            
            // 简单的布局算法
            const sourceX = 100 + (sourceIndex % 3) * 200;
            const sourceY = 100 + Math.floor(sourceIndex / 3) * 150;
            const targetX = 100 + (targetIndex % 3) * 200;
            const targetY = 100 + Math.floor(targetIndex / 3) * 150;
            
            return (
              <svg key={`${node.id}-${targetId}`} className="absolute inset-0 w-full h-full pointer-events-none">
                <line
                  x1={sourceX + 30}
                  y1={sourceY + 30}
                  x2={targetX + 30}
                  y2={targetY + 30}
                  stroke="#94a3b8"
                  strokeWidth={2}
                />
                {/* 箭头 */}
                <defs>
                  <marker
                    id={`arrow-${node.id}-${targetId}`}
                    markerWidth="10"
                    markerHeight="7"
                    refX="10"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                  </marker>
                </defs>
                <line
                  x1={sourceX + 30}
                  y1={sourceY + 30}
                  x2={targetX + 30}
                  y2={targetY + 30}
                  stroke="#94a3b8"
                  strokeWidth={2}
                  markerEnd={`url(#arrow-${node.id}-${targetId})`}
                />
              </svg>
            );
          })
        )}
        
        {/* 节点 */}
        {nodes.map((node, index) => {
          // 简单的布局算法
          const x = 100 + (index % 3) * 200;
          const y = 100 + Math.floor(index / 3) * 150;
          
          // 确定节点颜色
          let nodeColor = '#10b981'; // 默认绿色
          switch (node.type) {
            case '生产':
              nodeColor = '#10b981'; // 绿色
              break;
            case '运输':
              nodeColor = '#3b82f6'; // 蓝色
              break;
            case '存储':
              nodeColor = '#f59e0b'; // 橙色
              break;
            case '消费':
              nodeColor = '#8b5cf6'; // 紫色
              break;
            case '回收':
              nodeColor = '#ec4899'; // 粉色
              break;
            default:
              nodeColor = '#10b981'; // 绿色
          }
          
          return (
            <div
              key={node.id}
              className="absolute rounded-full shadow-lg flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: '60px',
                height: '60px',
                backgroundColor: nodeColor,
                color: 'white'
              }}
            >
              <span className="text-xs font-bold">{node.name.charAt(0)}</span>
              <span className="text-xs mt-1">{node.type}</span>
              
              {/* 节点操作菜单 */}
              <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-700 shadow-lg rounded-lg p-2 w-48 hidden group-hover:block">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">节点操作</div>
                <div className="space-y-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditNode(node);
                    }}
                    className="w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <Edit size={14} className="inline mr-1" />
                    编辑节点
                  </button>
                  
                  <div className="relative group">
                    <button className="w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                      <Network size={14} className="inline mr-1" />
                      连接到
                    </button>
                    
                    <div className="absolute left-full top-0 ml-1 bg-white dark:bg-gray-700 shadow-lg rounded-lg p-2 w-40 hidden group-hover:block">
                      {nodes
                        .filter(n => n.id !== node.id && !node.connections.includes(n.id))
                        .map(targetNode => (
                          <button
                            key={targetNode.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConnectNodes(node.id, targetNode.id);
                            }}
                            className="w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            {targetNode.name}
                          </button>
                        )}
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <button className="w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                      <X size={14} className="inline mr-1" />
                      断开连接
                    </button>
                    
                    <div className="absolute left-full top-0 ml-1 bg-white dark:bg-gray-700 shadow-lg rounded-lg p-2 w-40 hidden group-hover:block">
                      {node.connections.map(targetId => {
                        const targetNode = nodes.find(n => n.id === targetId);
                        if (!targetNode) return null;
                        
                        return (
                          <button
                            key={targetId}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDisconnectNode(node.id, targetId);
                            }}
                            className="w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            {targetNode.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">生态链管理</h1>
          <p className="text-gray-600 dark:text-gray-400">管理碳排放节点和连接</p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            onClick={() => refreshData()}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </button>
          
          <button
            onClick={() => setShowAddNodeModal(true)}
            className="flex items-center px-4 py-2 bg-emerald-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            添加节点
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
      
      {/* 网络图 */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">节点网络</h2>
        {renderNetwork()}
      </div>
      
      {/* 碳资产列表 */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">碳资产</h2>
        
        {assets.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            暂无碳资产
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    名称
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    类型
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    数量
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    价格 (元/单位)
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {assets.map((asset) => (
                  <tr key={asset.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {asset.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {asset.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {asset.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {asset.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => prepareTrade(asset.id, 'buy')}
                        className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 mr-4"
                      >
                        购买
                      </button>
                      <button
                        onClick={() => prepareTrade(asset.id, 'sell')}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        出售
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* 编辑节点模态框 */}
      {editingNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">编辑节点</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="node-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  节点名称
                </label>
                <input
                  type="text"
                  id="node-name"
                  value={editingNode.name}
                  onChange={(e) => setEditingNode({ ...editingNode, name: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label htmlFor="node-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  节点类型
                </label>
                <select
                  id="node-type"
                  value={editingNode.type}
                  onChange={(e) => setEditingNode({ ...editingNode, type: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {nodeTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  )}
                </select>
              </div>
              
              <div>
                <label htmlFor="carbon-intensity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  碳强度 (tCO₂e/单位)
                </label>
                <input
                  type="number"
                  id="carbon-intensity"
                  step="0.01"
                  min="0"
                  value={editingNode.carbonIntensity}
                  onChange={(e) => setEditingNode({ ...editingNode, carbonIntensity: parseFloat(e.target.value) })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  连接到的节点
                </label>
                <div className="flex flex-wrap gap-2">
                  {nodes
                    .filter(node => node.id !== editingNode.id)
                    .map(node => (
                      <div key={node.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`connection-${node.id}`}
                          checked={editingNode.connections.includes(node.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingNode({
                                ...editingNode,
                                connections: [...editingNode.connections, node.id]
                              });
                            } else {
                              setEditingNode({
                                ...editingNode,
                                connections: editingNode.connections.filter(id => id !== node.id)
                              });
                            }
                          }}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                        />
                        <label htmlFor={`connection-${node.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {node.name}
                        </label>
                      </div>
                    )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateNode}
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      保存中...
                    </div>
                  ) : (
                    '保存'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 添加节点模态框 */}
      {showAddNodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">添加节点</h3>
              <button
                onClick={() => setShowAddNodeModal(false)}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="new-node-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  节点名称
                </label>
                <input
                  type="text"
                  id="new-node-name"
                  value={newNode.name || ''}
                  onChange={(e) => setNewNode({ ...newNode, name: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label htmlFor="new-node-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  节点类型
                </label>
                <select
                  id="new-node-type"
                  value={newNode.type || '生产'}
                  onChange={(e) => setNewNode({ ...newNode, type: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {nodeTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  )}
                </select>
              </div>
              
              <div>
                <label htmlFor="new-carbon-intensity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  碳强度 (tCO₂e/单位)
                </label>
                <input
                  type="number"
                  id="new-carbon-intensity"
                  step="0.01"
                  min="0"
                  value={newNode.carbonIntensity || 0.5}
                  onChange={(e) => setNewNode({ ...newNode, carbonIntensity: parseFloat(e.target.value) })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowAddNodeModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  取消
                </button>
                <button
                  onClick={handleAddNode}
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      添加中...
                    </div>
                  ) : (
                    '添加'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 交易模态框 */}
      {tradeModal.show && tradeModal.assetId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {tradeModal.type === 'buy' ? '购买碳资产' : '出售碳资产'}
              </h3>
              <button
                onClick={() => setTradeModal({ ...tradeModal, show: false })}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            
            {assets.find(a => a.id === tradeModal.assetId) && (
              <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">资产名称</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{asset.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">类型</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{asset.type}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">当前价格</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{asset.price.toFixed(2)} 元/单位</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">可用数量</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{asset.quantity}</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="trade-quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  交易数量
                </label>
                <input
                  type="number"
                  id="trade-quantity"
                  min="1"
                  max={tradeModal.type === 'sell' ? asset.quantity : undefined}
                  value={tradeModal.quantity}
                  onChange={(e) => setTradeModal({
                    ...tradeModal,
                    quantity: Math.max(1, parseInt(e.target.value) || 1)
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="flex justify-between items-center text-lg font-medium text-gray-900 dark:text-white">
                <span>交易总额</span>
                <span>{(tradeModal.quantity * asset.price).toFixed(2)} 元</span>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setTradeModal({ ...tradeModal, show: false })}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  取消
                </button>
                <button
                  onClick={handleTradeAsset}
                  disabled={loading}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                    tradeModal.type === 'buy'
                      ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800'
                      : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      处理中...
                    </div>
                  ) : (
                    tradeModal.type === 'buy' ? '确认购买' : '确认出售'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
