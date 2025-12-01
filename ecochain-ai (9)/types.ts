export interface CarbonRecord {
  id: string;
  date: string;
  source: string;
  value: number;
  unit: string;
  scope: number;
  emissionFactor: number;
  totalCo2e: number;
  createdAt: number;
  updatedAt: number;
}

export interface DataEntryFormData {
  source: string;
  value: number | undefined;
  unit: string;
  date: string;
  customFactor: boolean;
  emissionFactor?: number;
}

export interface EcoNode {
  id: string;
  name: string;
  type: string;
  connections: string[];
  carbonIntensity: number;
}

export interface CarbonAsset {
  id: string;
  name: string;
  type: string;
  quantity: number;
  price: number;
  projectId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  company: string;
  role: string;
  token?: string;
  lastLogin?: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

export interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface StrategyResult {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  recordsUsed: string[];
  industry: string;
}

export interface ValidationResult {
  valid: boolean;
  reason: string;
}

export interface ImportJob {
  id: string;
  userId: string;
  type: 'csv' | 'excel' | 'json';
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalRecords: number;
  importedRecords: number;
  failedRecords: number;
  errorLog: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataSourceSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
}

export interface DataSource {
  id: string;
  userId: string;
  name: string;
  type: 'api' | 'postgres' | 'mysql' | 'mongodb' | 'mssql' | 'snowflake';
  config: any;
  description: string;
  schedule: DataSourceSchedule;
  status: 'active' | 'error' | 'syncing';
  lastSync: string | null;
  nextSync: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DataSourceConfig {
  // API 配置
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  mapping?: Record<string, string>;
  apiKey?: string;
  username?: string;
  password?: string;
  
  // 数据库配置
  host?: string;
  port?: number;
  database?: string;
  collection?: string;
  query?: string | Record<string, any>;
  
  // MongoDB 特定
  uri?: string;
  
  // Snowflake 特定
  account?: string;
  warehouse?: string;
  schema?: string;
}

export interface SyncResult {
  totalRecords: number;
  importedRecords: number;
  failedRecords: number;
}
