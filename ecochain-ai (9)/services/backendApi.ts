import axios from 'axios';
import { 
  User, 
  CarbonRecord, 
  DataEntryFormData, 
  EcoNode, 
  CarbonAsset, 
  ChatHistory, 
  Message,
  StrategyResult,
  ImportJob,
  DataSource,
  DataSourceSchedule,
  SyncResult
} from '../types';

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器，添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器，处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 处理401未授权错误
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export class BackendApiService {
  private static instance: BackendApiService;
  
  // 单例模式
  static getInstance(): BackendApiService {
    if (!BackendApiService.instance) {
      BackendApiService.instance = new BackendApiService();
    }
    return BackendApiService.instance;
  }
  
  // 用户登录
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data.data;
    
    // 保存token
    localStorage.setItem('authToken', token);
    
    return { user, token };
  }
  
  // 用户注册
  async register(userData: { 
    email: string; 
    password: string; 
    name: string; 
    company?: string 
  }): Promise<{ user: User; token: string }> {
    const response = await api.post('/auth/register', userData);
    const { user, token } = response.data.data;
    
    // 保存token
    localStorage.setItem('authToken', token);
    
    return { user, token };
  }
  
  // 用户登出
  logout(): void {
    localStorage.removeItem('authToken');
  }
  
  // 获取当前用户
  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  }
  
  // 更新用户信息
  async updateUser(userData: { 
    name?: string; 
    company?: string; 
    email?: string 
  }): Promise<User> {
    const response = await api.put('/auth/me', userData);
    return response.data.data.user;
  }
  
  // 忘记密码
  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  }
  
  // 重置密码
  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password });
  }
  
  // 获取仪表盘数据
  async fetchDashboardData(): Promise<{ 
    records: CarbonRecord[], 
    nodes: EcoNode[], 
    assets: CarbonAsset[] 
  }> {
    const response = await api.get('/dashboard');
    return response.data.data;
  }
  
  // 创建碳排放记录
  async createRecord(data: DataEntryFormData): Promise<CarbonRecord> {
    const response = await api.post('/records', data);
    return response.data.data.record;
  }
  
  // 获取碳排放记录
  async getRecords(filters?: { 
    startDate?: string; 
    endDate?: string; 
    source?: string;
    scope?: number;
  }): Promise<CarbonRecord[]> {
    const response = await api.get('/records', { params: filters });
    return response.data.data.records;
  }
  
  // 删除碳排放记录
  async deleteRecord(id: string): Promise<void> {
    await api.delete(`/records/${id}`);
  }
  
  // 获取生态链节点
  async getEcoNodes(): Promise<EcoNode[]> {
    const response = await api.get('/nodes');
    return response.data.data.nodes;
  }
  
  // 创建生态链节点
  async createEcoNode(node: Omit<EcoNode, 'id'>): Promise<EcoNode> {
    const response = await api.post('/nodes', node);
    return response.data.data.node;
  }
  
  // 更新生态链节点
  async updateEcoNode(id: string, node: Partial<EcoNode>): Promise<EcoNode> {
    const response = await api.put(`/nodes/${id}`, node);
    return response.data.data.node;
  }
  
  // 删除生态链节点
  async deleteEcoNode(id: string): Promise<void> {
    await api.delete(`/nodes/${id}`);
  }
  
  // 获取碳资产
  async getCarbonAssets(): Promise<CarbonAsset[]> {
    const response = await api.get('/assets');
    return response.data.data.assets;
  }
  
  // 创建碳资产
  async createCarbonAsset(asset: Omit<CarbonAsset, 'id'>): Promise<CarbonAsset> {
    const response = await api.post('/assets', asset);
    return response.data.data.asset;
  }
  
  // 更新碳资产
  async updateCarbonAsset(id: string, asset: Partial<CarbonAsset>): Promise<CarbonAsset> {
    const response = await api.put(`/assets/${id}`, asset);
    return response.data.data.asset;
  }
  
  // 删除碳资产
  async deleteCarbonAsset(id: string): Promise<void> {
    await api.delete(`/assets/${id}`);
  }
  
  // 交易碳资产
  async tradeAsset(
    assetId: string, 
    quantity: number, 
    type: 'buy' | 'sell'
  ): Promise<CarbonAsset> {
    const response = await api.post(`/assets/${assetId}/trade`, { quantity, type });
    return response.data.data.asset;
  }
  
  // 获取聊天历史
  async getChatHistories(): Promise<ChatHistory[]> {
    const response = await api.get('/chats');
    return response.data.data.chats;
  }
  
  // 获取聊天记录
  async getChatHistory(id: string): Promise<ChatHistory | null> {
    const response = await api.get(`/chats/${id}`);
    return response.data.data.chat;
  }
  
  // 添加聊天消息
  async addChatMessage(
    historyId: string | null, 
    message: Message
  ): Promise<ChatHistory> {
    if (historyId) {
      const response = await api.post(`/chats/${historyId}/messages`, { message });
      return response.data.data.chat;
    } else {
      const response = await api.post('/chats', { message });
      return response.data.data.chat;
    }
  }
  
  // 保存减排策略
  async saveStrategy(
    title: string, 
    content: string, 
    recordsUsed: string[], 
    industry: string
  ): Promise<StrategyResult> {
    const response = await api.post('/strategies', {
      title,
      content,
      recordsUsed,
      industry
    });
    return response.data.data.strategy;
  }
  
  // 获取减排策略
  async getStrategies(): Promise<StrategyResult[]> {
    const response = await api.get('/strategies');
    return response.data.data.strategies;
  }
  
  // 获取导入任务
  async getImportJobs(): Promise<ImportJob[]> {
    const response = await api.get('/import/jobs');
    return response.data.data.importJobs;
  }
  
  // 创建导入任务
  async createImportJob(type: 'csv' | 'excel' | 'json'): Promise<ImportJob> {
    const response = await api.post('/import/jobs', { type });
    return response.data.data.importJob;
  }
  
  // 获取导入任务状态
  async getImportJobStatus(id: string): Promise<ImportJob> {
    const response = await api.get(`/import/jobs/${id}`);
    return response.data.data.importJob;
  }
  
  // 获取导入模板
  async getImportTemplate(type: string): Promise<any> {
    const response = await api.get(`/import/templates/${type}`);
    return response.data.data.template;
  }
  
  // 数据源集成
  async createDataSource(dataSource: Omit<DataSource, 'id' | 'userId' | 'status' | 'lastSync' | 'nextSync' | 'createdAt' | 'updatedAt'>): Promise<DataSource> {
    const response = await api.post('/integrations', dataSource);
    return response.data.data.dataSource;
  }
  
  async getDataSources(): Promise<DataSource[]> {
    const response = await api.get('/integrations');
    return response.data.data.dataSources;
  }
  
  async getDataSource(id: string): Promise<DataSource> {
    const response = await api.get(`/integrations/${id}`);
    return response.data.data.dataSource;
  }
  
  async updateDataSource(id: string, dataSource: Partial<DataSource>): Promise<DataSource> {
    const response = await api.put(`/integrations/${id}`, dataSource);
    return response.data.data.dataSource;
  }
  
  async deleteDataSource(id: string): Promise<void> {
    await api.delete(`/integrations/${id}`);
  }
  
  async testDataSourceConnection(id: string): Promise<{ connected: boolean; message: string }> {
    const response = await api.post(`/integrations/${id}/test`);
    return response.data.data;
  }
  
  async syncDataSource(id: string): Promise<{ syncResult: SyncResult; dataSource: DataSource }> {
    const response = await api.post(`/integrations/${id}/sync`);
    return response.data.data;
  }
}

// 导出单例实例
export const backendApi = BackendApiService.getInstance();
