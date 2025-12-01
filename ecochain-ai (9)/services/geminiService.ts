import { GoogleGenerativeAI } from '@google/generative-ai';
import { CarbonRecord, ValidationResult } from '../types';

// 从环境变量获取API密钥
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

/**
 * 分析异常数据
 * @param source 排放源
 * @param value 数值
 * @param unit 单位
 * @returns 验证结果
 */
export const analyzeAbnormalData = async (
  source: string, 
  value: number, 
  unit: string
): Promise<ValidationResult> => {
  if (!model) {
    throw new Error("AI服务未配置，请检查API密钥");
  }

  try {
    const prompt = `分析以下碳排放数据是否异常：
      排放源：${source}
      数值：${value} ${unit}
      请判断是否合理，并给出理由（简洁回答）`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 简单解析结果
    const valid = !text.toLowerCase().includes('异常');
    return { valid, reason: text };
  } catch (error) {
    console.error("AI分析失败:", error);
    throw new Error("数据验证失败，请稍后重试");
  }
};

/**
 * 生成减排策略
 * @param records 碳排放记录
 * @param industry 行业
 * @returns 减排策略
 */
export const generateReductionStrategy = async (
  records: CarbonRecord[], 
  industry: string
): Promise<string> => {
  if (!model) {
    throw new Error("AI服务未配置，请检查API密钥");
  }

  // 处理记录数据，仅传递必要字段以减少token使用
  const simplifiedRecords = records.map(r => ({
    date: r.date,
    scope: r.scope,
    source: r.source,
    totalCo2e: r.totalCo2e
  }));

  try {
    const prompt = `作为${industry}的碳管理专家，请基于以下碳排放记录生成减排策略报告：
      ${JSON.stringify(simplifiedRecords, null, 2)}
      报告应包括：主要排放源分析、针对性减排技术、预期减排量和投资回报分析。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("策略生成失败:", error);
    throw new Error("策略生成失败，请稍后重试");
  }
};

/**
 * 处理用户聊天消息
 * @param message 用户消息
 * @param context 上下文
 * @returns AI回复
 */
export const processChatMessage = async (
  message: string, 
  context?: string
): Promise<string> => {
  if (!model) {
    throw new Error("AI服务未配置，请检查API密钥");
  }

  try {
    const prompt = context 
      ? `${context}\n用户: ${message}\n请基于上述上下文，用专业知识回答用户关于碳管理的问题。`
      : `用户: ${message}\n请用专业知识回答用户关于碳管理的问题。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("聊天处理失败:", error);
    throw new Error("消息处理失败，请稍后重试");
  }
};

/**
 * 检查API密钥有效性
 * @returns 是否有效
 */
export const checkApiKeyValidity = async (): Promise<boolean> => {
  if (!GEMINI_API_KEY) return false;
  
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // 发送一个简单的测试请求
    const result = await model.generateContent("测试API连接");
    await result.response;
    
    return true;
  } catch (error) {
    console.error("API密钥验证失败:", error);
    return false;
  }
};
