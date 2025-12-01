import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  CarbonRecord, 
  DataEntryFormData, 
  EcoNode, 
  CarbonAsset, 
  User, 
  ChatHistory, 
  Message,
  StrategyResult
} from '../types';

// 模拟延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟数据库
const db = {
  records: new Map<string, CarbonRecord>(),
  nodes: new Map<string, EcoNode>(),
  assets: new Map<string, CarbonAsset>(),
  users: new Map<string, User>(),
  chatHistories: new Map<string, ChatHistory>(),
  strategies: new Map<string, StrategyResult>(),
  
  // 初始化示例数据
  init() {
    // 添加示例用户
    this.users.set('1', {
      id: '1',
      email: 'demo@example.com',
      name: 'Demo User',
      company: 'Demo Company',
      role: 'admin'
    });
    
    // 添加示例节点
    this.nodes.set('1', {
      id: '1',
      name: '工厂A',
      type: '生产',
      connections: ['2'],
      carbonIntensity: 0.5
    });
    
    this.nodes.set('2', {
      id: '2',
      name: '物流中心B',
      type: '运输',
      connections: ['1', '3'],
      carbonIntensity: 0.8
    });
    
    this.nodes.set('3', {
      id: '3',
      name: '仓库C',
      type: '存储',
      connections: ['2'],
      carbonIntensity: 0.3
    });
    
    // 添加示例资产
    this.assets.set('1', {
      id: '1',
      name: '光伏项目',
      type: '可再生能源',
      quantity: 1000,
      price: 50,
      projectId: 'proj-1'
    });
    
    // 添加示例记录
    const today = new Date().toISOString().split('T')[0];
    this.records.set('1', {
      id: '1',
      date: today,
      source: '电力',
      value: 1000,
      unit: 'kWh',
      scope: 2,
      emissionFactor: 0.0005,
      totalCo2e: 0.5,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
};

// 初始化数据库
db.init();

// 缓存机制
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

export class ApiService {
  private static instance: ApiService;
  
  // 单例模式
  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }
  
  // 用户登录
  async login(email: string, password: string): Promise<User> {
    await delay(800);
    
    // 在实际应用中，这里应该是调用后端API进行验证
    // 这里简化为查找示例用户
    const user = Array.from(db.users.values()).find(u => u.email === email);
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 实际应用中应该验证密码哈希
    if (password !== 'password') {
      throw new Error('密码错误');
    }
    
    // 生成模拟token
    const token = `mock-token-${Date.now()}`;
    localStorage.setItem('authToken', token);
    
    return { ...user, token };
  }
  
  // 用户登出
  logout(): void {
    localStorage.removeItem('authToken');
  }
  
  // 获取当前用户
  getCurrentUser(): User | null {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return null;
    }
    
    // 在实际应用中，这里应该验证token并从后端获取用户信息
    // 这里简化为返回示例用户
    return Array.from(db.users.values())[0];
  }
  
  // 获取仪表盘数据
  async fetchDashboardData(): Promise<{ 
    records: CarbonRecord[], 
    nodes: EcoNode[], 
    assets: CarbonAsset[] 
  }> {
    const cacheKey = 'dashboardData';
    const cached = cache.get(cacheKey);
    
    // 如果缓存存在且未过期，则使用缓存
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    
    await delay(600);
    
    const records = Array.from(db.records.values());
    const nodes = Array.from(db.nodes.values());
    const assets = Array.from(db.assets.values());
    
    const result = { records, nodes, assets };
    
    // 更新缓存
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return result;
  }
  
  // 创建碳排放记录
  async createRecord(data: DataEntryFormData, userId: string): Promise<CarbonRecord> {
    await delay(800);
    
    // 生成ID
    const id = Date.now().toString();
    
    // 计算总CO2e
    const emissionFactor = data.customFactor && data.emissionFactor 
      ? data.emissionFactor 
      : this.getDefaultEmissionFactor(data.source);
    
    const totalCo2e = data.value! * emissionFactor;
    
    // 确定范围
    const scope = this.determineScope(data.source);
    
    const record: CarbonRecord = {
      id,
      date: data.date,
      source: data.source,
      value: data.value!,
      unit: data.unit,
      scope,
      emissionFactor,
      totalCo2e,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // 保存记录
    db.records.set(id, record);
    
    // 清除缓存
    this.clearCache('dashboardData');
    
    return record;
  }
  
  // 获取碳排放记录
  async getRecords(filters?: { 
    startDate?: string; 
    endDate?: string; 
    source?: string;
    scope?: number;
  }): Promise<CarbonRecord[]> {
    await delay(400);
    
    let records = Array.from(db.records.values());
    
    // 应用过滤器
    if (filters) {
      if (filters.startDate) {
        records = records.filter(r => r.date >= filters.startDate!);
      }
      
      if (filters.endDate) {
        records = records.filter(r => r.date <= filters.endDate!);
      }
      
      if (filters.source) {
        records = records.filter(r => r.source === filters.source!);
      }
      
      if (filters.scope !== undefined) {
        records = records.filter(r => r.scope === filters.scope!);
      }
    }
    
    // 按日期排序
    return records.sort((a, b) => b.date.localeCompare(a.date));
  }
  
  // 删除碳排放记录
  async deleteRecord(id: string): Promise<void> {
    await delay(600);
    
    if (!db.records.has(id)) {
      throw new Error('记录不存在');
    }
    
    db.records.delete(id);
    
    // 清除缓存
    this.clearCache('dashboardData');
  }
  
  // 获取生态链节点
  async getEcoNodes(): Promise<EcoNode[]> {
    await delay(400);
    return Array.from(db.nodes.values());
  }
  
  // 更新生态链节点
  async updateEcoNode(node: EcoNode): Promise<EcoNode> {
    await delay(600);
    
    if (!db.nodes.has(node.id)) {
      throw new Error('节点不存在');
    }
    
    const updatedNode = {
      ...node,
      updatedAt: Date.now()
    };
    
    db.nodes.set(node.id, updatedNode);
    
    return updatedNode;
  }
  
  // 获取碳资产
  async getCarbonAssets(): Promise<CarbonAsset[]> {
    await delay(400);
    return Array.from(db.assets.values());
  }
  
  // 交易碳资产
  async tradeAsset(
    assetId: string, 
    quantity: number, 
    type: 'buy' | 'sell', 
    userId: string
  ): Promise<CarbonAsset> {
    await delay(1000);
    
    const asset = db.assets.get(assetId);
    
    if (!asset) {
      throw new Error('资产不存在');
    }
    
    // 检查数量是否足够
    if (type === 'sell' && asset.quantity < quantity) {
      throw new Error('资产数量不足');
    }
    
    // 更新资产数量
    const updatedAsset = {
      ...asset,
      quantity: type === 'buy' ? asset.quantity + quantity : asset.quantity - quantity,
      updatedAt: Date.now()
    };
    
    db.assets.set(assetId, updatedAsset);
    
    // 记录交易日志
    console.log(`用户 ${userId} ${type} 了 ${quantity} 单位的 ${asset.name}`);
    
    return updatedAsset;
  }
  
  // 获取聊天历史
  async getChatHistories(userId: string): Promise<ChatHistory[]> {
    await delay(400);
    
    // 在实际应用中，这里应该根据userId过滤
    return Array.from(db.chatHistories.values());
  }
  
  // 获取聊天记录
  async getChatHistory(id: string): Promise<ChatHistory | null> {
    await delay(400);
    return db.chatHistories.get(id) || null;
  }
  
  // 添加聊天消息
  async addChatMessage(
    historyId: string | null, 
    message: Message, 
    userId: string
  ): Promise<ChatHistory> {
    await delay(600);
    
    let history: ChatHistory;
    
    if (historyId && db.chatHistories.has(historyId)) {
      // 更新现有历史
      history = db.chatHistories.get(historyId)!;
      history.messages.push(message);
      history.updatedAt = Date.now();
    } else {
      // 创建新历史
      const id = Date.now().toString();
      history = {
        id,
        title: message.content.substring(0, 30) + (message.content.length > 30 ? '...' : ''),
        messages: [message],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }
    
    db.chatHistories.set(history.id, history);
    return history;
  }
  
  // 保存减排策略
  async saveStrategy(
    title: string, 
    content: string, 
    recordsUsed: string[], 
    industry: string, 
    userId: string
  ): Promise<StrategyResult> {
    await delay(600);
    
    const id = Date.now().toString();
    
    const strategy: StrategyResult = {
      id,
      title,
      content,
      createdAt: Date.now(),
      recordsUsed,
      industry
    };
    
    db.strategies.set(id, strategy);
    return strategy;
  }
  
  // 获取减排策略
  async getStrategies(): Promise<StrategyResult[]> {
    await delay(400);
    return Array.from(db.strategies.values()).sort((a, b) => b.createdAt - a.createdAt);
  }
  
  // 生成报告
  async generateReport(type: string, records: CarbonRecord[]): Promise<void> {
    try {
      await delay(1000);
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // 添加标题
      doc.setFontSize(20);
      doc.text("EcoChain AI - 碳合规报告", 14, 22);
      
      doc.setFontSize(11);
      doc.text(`报告类型: ${type}`, 14, 30);
      doc.text(`生成日期: ${new Date().toLocaleDateString()}`, 14, 36);
      
      // 汇总数据
      const total = records.reduce((s, r) => s + r.totalCo2e, 0).toFixed(2);
      doc.text(`总排放量: ${total} tCO2e`, 14, 44);

      // 表格数据
      const tableData = records.map(r => [
        r.date, 
        r.scope, 
        r.source, 
        `${r.value} ${r.unit}`, 
        `${r.totalCo2e.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: 50,
        head: [['日期', '范围', '排放源', '活动数据', '吨二氧化碳当量']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 10 }
      });

      // 页脚
      doc.setFontSize(10);
      doc.text("由EcoChain AI平台生成，已通过区块链验证", 14, doc.internal.pageSize.height - 10);

      doc.save(`EcoChain_${type}_报告_${Date.now()}.pdf`);
      return Promise.resolve();
    } catch (error) {
      console.error("报告生成失败:", error);
      return Promise.reject(new Error("报告生成失败，请重试"));
    }
  }
  
  // 获取默认排放因子
  private getDefaultEmissionFactor(source: string): number {
    // 实际应用中应该从数据库或API获取
    const factors: Record<string, number> = {
      '电力': 0.0005,
      '天然气': 0.002,
      '汽油': 0.0023,
      '柴油': 0.0026,
      '煤炭': 0.0024,
      '废弃物': 0.001,
      '水': 0.0001
    };
    
    return factors[source] || 0.001;
  }
  
  // 确定排放范围
  private determineScope(source: string): number {
    // 实际应用中应该有更复杂的逻辑
    const scope1Sources = ['天然气', '汽油', '柴油', '煤炭'];
    const scope2Sources = ['电力', '水'];
    const scope3Sources = ['废弃物', '运输'];
    
    if (scope1Sources.includes(source)) return 1;
    if (scope2Sources.includes(source)) return 2;
    return 3;
  }
  
  // 清除缓存
  private clearCache(key?: string): void {
    if (key) {
      cache.delete(key);
    } else {
      cache.clear();
    }
  }
}

// 导出单例实例
export const api = ApiService.getInstance();
