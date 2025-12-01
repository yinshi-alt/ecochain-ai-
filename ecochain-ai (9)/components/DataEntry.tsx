import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useData } from './DataContext';
import { DataEntryFormData } from '../types';

export const DataEntry: React.FC = () => {
  const { addRecord, validateData, validationResult, loading } = useData();
  const [aiChecking, setAiChecking] = useState(false);
  const [aiCheckResult, setAiCheckResult] = useState<{ valid: boolean | null; message: string }>({
    valid: null,
    message: ''
  });
  
  // 使用react-hook-form进行表单管理
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<DataEntryFormData>({
    defaultValues: {
      source: '',
      value: undefined,
      unit: 'kWh',
      date: new Date().toISOString().split('T')[0],
      customFactor: false
    }
  });
  
  // 监听表单值变化，触发AI验证
  const watchSource = watch('source');
  const watchValue = watch('value');
  const watchUnit = watch('unit');
  
  // 当表单值变化时，触发AI验证（防抖处理）
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (watchSource && watchValue && watchUnit) {
        handleAiCheck();
      }
    }, 800); // 防抖延迟，避免频繁调用
    
    return () => clearTimeout(delayDebounceFn);
  }, [watchSource, watchValue, watchUnit]);
  
  // 处理AI数据验证
  const handleAiCheck = async () => {
    if (!watchSource || !watchValue || !watchUnit) return;
    
    setAiChecking(true);
    setAiCheckResult({ valid: null, message: 'AI正在验证数据...' });
    
    try {
      const result = await validateData(watchSource, watchValue, watchUnit);
      setAiCheckResult({
        valid: result.valid,
        message: result.reason
      });
    } catch (error: any) {
      setAiCheckResult({
        valid: null,
        message: error.message || 'AI验证失败，请稍后重试'
      });
    } finally {
      setAiChecking(false);
    }
  };
  
  // 处理表单提交
  const onSubmit = async (data: DataEntryFormData) => {
    try {
      await addRecord(data);
      
      // 显示成功消息
      alert('数据已成功添加！');
      
      // 重置表单
      reset({
        source: '',
        value: undefined,
        unit: 'kWh',
        date: new Date().toISOString().split('T')[0],
        customFactor: false
      });
      
      // 重置AI验证结果
      setAiCheckResult({ valid: null, message: '' });
    } catch (error: any) {
      alert(`添加失败: ${error.message}`);
    }
  };
  
  // 排放源选项
  const sourceOptions = [
    { value: '电力', label: '电力' },
    { value: '天然气', label: '天然气' },
    { value: '汽油', label: '汽油' },
    { value: '柴油', label: '柴油' },
    { value: '煤炭', label: '煤炭' },
    { value: '废弃物', label: '废弃物' },
    { value: '水', label: '水' }
  ];
  
  // 单位选项
  const unitOptions = [
    { value: 'kWh', label: '千瓦时 (kWh)' },
    { value: 'm³', label: '立方米 (m³)' },
    { value: 'L', label: '升 (L)' },
    { value: 'kg', label: '千克 (kg)' },
    { value: 't', label: '吨 (t)' }
  ];
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">数据采集</h1>
      
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* 排放源选择 */}
          <div className="mb-4">
            <label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              排放源 <span className="text-red-500">*</span>
            </label>
            <select
              id="source"
              {...register('source', {
                required: '请选择排放源',
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">请选择排放源</option>
              {sourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.source && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                {errors.source.message}
              </p>
            )}
          </div>
          
          {/* 数值输入 */}
          <div className="mb-4">
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              数值 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center">
              <input
                type="number"
                id="value"
                step="0.01"
                min="0"
                {...register('value', {
                  required: '请输入数值',
                  min: { value: 0, message: '数值不能为负数' },
                  validate: (value) => {
                    if (value && value > 1000000) {
                      return '数值过大，请检查单位是否正确';
                    }
                    return true;
                  }
                })}
                className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="请输入数值"
              />
              <select
                {...register('unit')}
                className="rounded-r-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {unitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value}
                  </option>
                ))}
              </select>
            </div>
            {errors.value && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                {errors.value.message}
              </p>
            )}
          </div>
          
          {/* 日期选择 */}
          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="date"
              {...register('date', {
                required: '请选择日期',
                validate: (value) => {
                  if (new Date(value) > new Date()) {
                    return '日期不能晚于今天';
                  }
                  return true;
                }
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                {errors.date.message}
              </p>
            )}
          </div>
          
          {/* 自定义排放因子 */}
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="customFactor"
                {...register('customFactor')}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="customFactor" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                使用自定义排放因子
              </label>
            </div>
          </div>
          
          {/* 排放因子输入（仅当自定义因子被选中时显示） */}
          {watch('customFactor') && (
            <div className="mb-4">
              <label htmlFor="emissionFactor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                排放因子 (tCO₂e/单位) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="emissionFactor"
                step="0.0001"
                min="0"
                {...register('emissionFactor', {
                  required: '请输入排放因子',
                  min: { value: 0, message: '排放因子不能为负数' }
                })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="例如：0.0005"
              />
              {errors.emissionFactor && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="inline h-4 w-4 mr-1" />
                  {errors.emissionFactor.message}
                </p>
              )}
            </div>
          )}
          
          {/* AI验证结果 */}
          {(aiChecking || aiCheckResult.valid !== null || aiCheckResult.message) && (
            <div className={`mb-4 p-3 rounded-md ${
              aiCheckResult.valid === true 
                ? 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-900 dark:border-green-800 dark:text-green-300' 
                : aiCheckResult.valid === false 
                ? 'bg-yellow-50 border border-yellow-200 text-yellow-700 dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-300'
                : 'bg-gray-50 border border-gray-200 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
            }`}>
              <div className="flex items-start">
                {aiChecking ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2 flex-shrink-0" />
                ) : aiCheckResult.valid === true ? (
                  <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                ) : aiCheckResult.valid === false ? (
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                )}
                <p className="text-sm">{aiCheckResult.message}</p>
              </div>
            </div>
          )}
          
          {/* 提交按钮 */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              提交数据
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
