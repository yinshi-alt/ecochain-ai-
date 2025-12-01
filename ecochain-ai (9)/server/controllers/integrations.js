const axios = require('axios');
const { Pool } = require('pg');
const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');

// 数据源集成控制器
const createDataSource = async (req, res) => {
  try {
    const { 
      name, 
      type, 
      config,
      description,
      schedule 
    } = req.body;
    
    // 验证数据源类型
    const validTypes = ['api', 'postgres', 'mysql', 'mongodb', 'mssql', 'snowflake'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid data source type. Must be one of: ${validTypes.join(', ')}`
      });
    }
    
    // 验证配置
    if (!config || typeof config !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid configuration'
      });
    }
    
    // 创建数据源
    const dataSource = {
      id: Date.now().toString(),
      userId: req.user.id,
      name,
      type,
      config,
      description: description || '',
      schedule: schedule || {
        enabled: false,
        frequency: 'daily',
        time: '00:00'
      },
      status: 'active',
      lastSync: null,
      nextSync: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 保存数据源
    req.app.locals.db.dataSources = req.app.locals.db.dataSources || [];
    req.app.locals.db.dataSources.push(dataSource);
    
    // 如果启用了定时同步，设置下次同步时间
    if (dataSource.schedule.enabled) {
      dataSource.nextSync = calculateNextSync(dataSource.schedule);
    }
    
    res.status(201).json({
      status: 'success',
      message: 'Data source created successfully',
      data: {
        dataSource: {
          id: dataSource.id,
          name: dataSource.name,
          type: dataSource.type,
          description: dataSource.description,
          status: dataSource.status,
          schedule: dataSource.schedule,
          createdAt: dataSource.createdAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// 获取所有数据源
const getDataSources = async (req, res) => {
  try {
    const dataSources = req.app.locals.db.dataSources || [];
    
    // 只返回当前用户的数据源
    const userDataSources = dataSources.filter(
      source => source.userId === req.user.id
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        dataSources: userDataSources.map(source => ({
          id: source.id,
          name: source.name,
          type: source.type,
          description: source.description,
          status: source.status,
          schedule: source.schedule,
          lastSync: source.lastSync,
          nextSync: source.nextSync,
          createdAt: source.createdAt,
          updatedAt: source.updatedAt
        })),
        total: userDataSources.length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// 获取单个数据源
const getDataSource = async (req, res) => {
  try {
    const { id } = req.params;
    const dataSources = req.app.locals.db.dataSources || [];
    
    // 查找数据源
    const dataSource = dataSources.find(
      source => source.id === id && source.userId === req.user.id
    );
    
    if (!dataSource) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Data source not found' 
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        dataSource: {
          id: dataSource.id,
          name: dataSource.name,
          type: dataSource.type,
          description: dataSource.description,
          config: {
            ...dataSource.config,
            // 隐藏敏感信息
            password: dataSource.config.password ? '******' : undefined,
            apiKey: dataSource.config.apiKey ? '******' : undefined,
            token: dataSource.config.token ? '******' : undefined
          },
          status: dataSource.status,
          schedule: dataSource.schedule,
          lastSync: dataSource.lastSync,
          nextSync: dataSource.nextSync,
          createdAt: dataSource.createdAt,
          updatedAt: dataSource.updatedAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// 更新数据源
const updateDataSource = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      config,
      description,
      schedule,
      status
    } = req.body;
    
    const dataSources = req.app.locals.db.dataSources || [];
    
    // 查找数据源
    const sourceIndex = dataSources.findIndex(
      source => source.id === id && source.userId === req.user.id
    );
    
    if (sourceIndex === -1) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Data source not found' 
      });
    }
    
    // 更新数据源
    const dataSource = dataSources[sourceIndex];
    
    if (name) dataSource.name = name;
    if (description) dataSource.description = description;
    if (status) dataSource.status = status;
    if (config && typeof config === 'object') {
      dataSource.config = { ...dataSource.config, ...config };
    }
    if (schedule && typeof schedule === 'object') {
      dataSource.schedule = { ...dataSource.schedule, ...schedule };
      
      // 如果启用了定时同步，更新下次同步时间
      if (dataSource.schedule.enabled) {
        dataSource.nextSync = calculateNextSync(dataSource.schedule);
      } else {
        dataSource.nextSync = null;
      }
    }
    
    dataSource.updatedAt = new Date();
    
    // 保存更新
    dataSources[sourceIndex] = dataSource;
    req.app.locals.db.dataSources = dataSources;
    
    res.status(200).json({
      status: 'success',
      message: 'Data source updated successfully',
      data: {
        dataSource: {
          id: dataSource.id,
          name: dataSource.name,
          type: dataSource.type,
          description: dataSource.description,
          status: dataSource.status,
          schedule: dataSource.schedule,
          lastSync: dataSource.lastSync,
          nextSync: dataSource.nextSync,
          updatedAt: dataSource.updatedAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// 删除数据源
const deleteDataSource = async (req, res) => {
  try {
    const { id } = req.params;
    const dataSources = req.app.locals.db.dataSources || [];
    
    // 查找数据源
    const sourceIndex = dataSources.findIndex(
      source => source.id === id && source.userId === req.user.id
    );
    
    if (sourceIndex === -1) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Data source not found' 
      });
    }
    
    // 删除数据源
    dataSources.splice(sourceIndex, 1);
    req.app.locals.db.dataSources = dataSources;
    
    res.status(200).json({
      status: 'success',
      message: 'Data source deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// 测试数据源连接
const testDataSourceConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const dataSources = req.app.locals.db.dataSources || [];
    
    // 查找数据源
    const dataSource = dataSources.find(
      source => source.id === id && source.userId === req.user.id
    );
    
    if (!dataSource) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Data source not found' 
      });
    }
    
    let connectionStatus = false;
    let errorMessage = null;
    
    // 根据数据源类型测试连接
    switch (dataSource.type) {
      case 'api':
        connectionStatus = await testApiConnection(dataSource.config);
        break;
        
      case 'postgres':
        connectionStatus = await testPostgresConnection(dataSource.config);
        break;
        
      case 'mysql':
        connectionStatus = await testMysqlConnection(dataSource.config);
        break;
        
      case 'mongodb':
        connectionStatus = await testMongoConnection(dataSource.config);
        break;
        
      case 'mssql':
        connectionStatus = await testMssqlConnection(dataSource.config);
        break;
        
      case 'snowflake':
        connectionStatus = await testSnowflakeConnection(dataSource.config);
        break;
        
      default:
        errorMessage = `Unsupported data source type: ${dataSource.type}`;
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        connected: connectionStatus,
        message: connectionStatus ? 'Connection successful' : errorMessage || 'Connection failed'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// 同步数据源数据
const syncDataSource = async (req, res) => {
  try {
    const { id } = req.params;
    const dataSources = req.app.locals.db.dataSources || [];
    
    // 查找数据源
    const dataSource = dataSources.find(
      source => source.id === id && source.userId === req.user.id
    );
    
    if (!dataSource) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Data source not found' 
      });
    }
    
    // 更新数据源状态
    dataSource.status = 'syncing';
    dataSource.updatedAt = new Date();
    
    // 保存更新
    const sourceIndex = dataSources.findIndex(source => source.id === id);
    dataSources[sourceIndex] = dataSource;
    req.app.locals.db.dataSources = dataSources;
    
    // 开始同步
    try {
      let syncResult;
      
      // 根据数据源类型同步数据
      switch (dataSource.type) {
        case 'api':
          syncResult = await syncApiData(dataSource, req.app.locals.db);
          break;
          
        case 'postgres':
          syncResult = await syncPostgresData(dataSource, req.app.locals.db);
          break;
          
        case 'mysql':
          syncResult = await syncMysqlData(dataSource, req.app.locals.db);
          break;
          
        case 'mongodb':
          syncResult = await syncMongoData(dataSource, req.app.locals.db);
          break;
          
        case 'mssql':
          syncResult = await syncMssqlData(dataSource, req.app.locals.db);
          break;
          
        case 'snowflake':
          syncResult = await syncSnowflakeData(dataSource, req.app.locals.db);
          break;
          
        default:
          throw new Error(`Unsupported data source type: ${dataSource.type}`);
      }
      
      // 更新同步状态
      dataSource.status = 'active';
      dataSource.lastSync = new Date();
      
      // 如果启用了定时同步，更新下次同步时间
      if (dataSource.schedule.enabled) {
        dataSource.nextSync = calculateNextSync(dataSource.schedule);
      }
      
      dataSource.updatedAt = new Date();
      
      // 保存更新
      dataSources[sourceIndex] = dataSource;
      req.app.locals.db.dataSources = dataSources;
      
      res.status(200).json({
        status: 'success',
        message: 'Data synchronized successfully',
        data: {
          syncResult,
          dataSource: {
            id: dataSource.id,
            lastSync: dataSource.lastSync,
            nextSync: dataSource.nextSync,
            status: dataSource.status
          }
        }
      });
    } catch (error) {
      // 更新同步状态为失败
      dataSource.status = 'error';
      dataSource.updatedAt = new Date();
      
      // 保存更新
      dataSources[sourceIndex] = dataSource;
      req.app.locals.db.dataSources = dataSources;
      
      throw error;
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Sync failed', 
      error: error.message 
    });
  }
};

// 测试API连接
const testApiConnection = async (config) => {
  try {
    const { url, method = 'GET', headers = {} } = config;
    
    if (!url) {
      throw new Error('API URL is required');
    }
    
    // 添加认证头
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    } else if (config.username && config.password) {
      const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }
    
    // 发送测试请求
    const response = await axios({
      url,
      method,
      headers,
      timeout: 5000
    });
    
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error('API connection test failed:', error.message);
    return false;
  }
};

// 测试PostgreSQL连接
const testPostgresConnection = async (config) => {
  try {
    const { host, port, database, username, password } = config;
    
    const pool = new Pool({
      host,
      port,
      database,
      user: username,
      password,
      connectionTimeoutMillis: 5000
    });
    
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    pool.end();
    
    return true;
  } catch (error) {
    console.error('PostgreSQL connection test failed:', error.message);
    return false;
  }
};

// 测试MySQL连接
const testMysqlConnection = async (config) => {
  try {
    const { host, port, database, username, password } = config;
    
    const connection = await mysql.createConnection({
      host,
      port,
      database,
      user: username,
      password,
      connectTimeout: 5000
    });
    
    await connection.execute('SELECT NOW()');
    await connection.end();
    
    return true;
  } catch (error) {
    console.error('MySQL connection test failed:', error.message);
    return false;
  }
};

// 测试MongoDB连接
const testMongoConnection = async (config) => {
  try {
    const { uri, database } = config;
    
    if (!uri) {
      throw new Error('MongoDB URI is required');
    }
    
    const client = await mongoose.connect(uri, {
      dbName: database,
      serverSelectionTimeoutMS: 5000
    });
    
    await client.connection.close();
    
    return true;
  } catch (error) {
    console.error('MongoDB connection test failed:', error.message);
    return false;
  }
};

// 测试MSSQL连接
const testMssqlConnection = async (config) => {
  try {
    const { host, port, database, username, password } = config;
    
    // 使用tedious库测试MSSQL连接
    const { Connection } = require('tedious');
    
    return new Promise((resolve) => {
      const connection = new Connection({
        server: host,
        port,
        authentication: {
          type: 'default',
          options: {
            userName: username,
            password
          }
        },
        options: {
          database,
          connectTimeout: 5000
        }
      });
      
      connection.on('connect', (err) => {
        if (err) {
          console.error('MSSQL connection test failed:', err.message);
          resolve(false);
        } else {
          connection.close();
          resolve(true);
        }
      });
      
      connection.on('error', (err) => {
        console.error('MSSQL connection error:', err.message);
        resolve(false);
      });
    });
  } catch (error) {
    console.error('MSSQL connection test failed:', error.message);
    return false;
  }
};

// 测试Snowflake连接
const testSnowflakeConnection = async (config) => {
  try {
    const { account, username, password, warehouse, database, schema } = config;
    
    // 使用snowflake-sdk测试连接
    const snowflake = require('snowflake-sdk');
    
    return new Promise((resolve) => {
      const connection = snowflake.createConnection({
        account,
        username,
        password,
        warehouse,
        database,
        schema
      });
      
      connection.connect((err, conn) => {
        if (err) {
          console.error('Snowflake connection test failed:', err.message);
          resolve(false);
        } else {
          connection.destroy();
          resolve(true);
        }
      });
    });
  } catch (error) {
    console.error('Snowflake connection test failed:', error.message);
    return false;
  }
};

// 同步API数据
const syncApiData = async (dataSource, db) => {
  try {
    const { url, method = 'GET', headers = {}, query, body, mapping } = dataSource.config;
    
    if (!url) {
      throw new Error('API URL is required');
    }
    
    // 添加认证头
    if (dataSource.config.apiKey) {
      headers['Authorization'] = `Bearer ${dataSource.config.apiKey}`;
    } else if (dataSource.config.username && dataSource.config.password) {
      const auth = Buffer.from(`${dataSource.config.username}:${dataSource.config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }
    
    // 发送API请求
    const response = await axios({
      url,
      method,
      headers,
      params: query,
      data: body,
      timeout: 30000
    });
    
    // 处理API响应
    let records = response.data;
    
    // 如果响应是对象而不是数组，将其包装成数组
    if (!Array.isArray(records)) {
      records = [records];
    }
    
    // 应用数据映射
    let mappedRecords = records;
    if (mapping && typeof mapping === 'object') {
      mappedRecords = records.map(record => {
        const mapped = {};
        
        // 应用每个字段的映射
        for (const [targetField, sourcePath] of Object.entries(mapping)) {
          // 支持嵌套字段路径，如 "user.name"
          const pathParts = sourcePath.split('.');
          let value = record;
          
          for (const part of pathParts) {
            if (value && typeof value === 'object' && part in value) {
              value = value[part];
            } else {
              value = undefined;
              break;
            }
          }
          
          mapped[targetField] = value;
        }
        
        return mapped;
      });
    }
    
    // 导入记录到数据库
    const result = importRecords(mappedRecords, dataSource, db);
    
    return {
      totalRecords: records.length,
      importedRecords: result.imported,
      failedRecords: result.failed
    };
  } catch (error) {
    console.error('API data sync failed:', error.message);
    throw error;
  }
};

// 同步PostgreSQL数据
const syncPostgresData = async (dataSource, db) => {
  try {
    const { host, port, database, username, password, query, mapping } = dataSource.config;
    
    const pool = new Pool({
      host,
      port,
      database,
      user: username,
      password,
      connectionTimeoutMillis: 30000
    });
    
    const client = await pool.connect();
    
    try {
      // 执行查询
      const result = await client.query(query);
      const records = result.rows;
      
      // 应用数据映射
      let mappedRecords = records;
      if (mapping && typeof mapping === 'object') {
        mappedRecords = records.map(record => {
          const mapped = {};
          
          // 应用每个字段的映射
          for (const [targetField, sourceField] of Object.entries(mapping)) {
            mapped[targetField] = record[sourceField];
          }
          
          return mapped;
        });
      }
      
      // 导入记录到数据库
      const importResult = importRecords(mappedRecords, dataSource, db);
      
      return {
        totalRecords: records.length,
        importedRecords: importResult.imported,
        failedRecords: importResult.failed
      };
    } finally {
      client.release();
      pool.end();
    }
  } catch (error) {
    console.error('PostgreSQL data sync failed:', error.message);
    throw error;
  }
};

// 同步MySQL数据
const syncMysqlData = async (dataSource, db) => {
  try {
    const { host, port, database, username, password, query, mapping } = dataSource.config;
    
    const connection = await mysql.createConnection({
      host,
      port,
      database,
      user: username,
      password,
      connectTimeout: 30000
    });
    
    try {
      // 执行查询
      const [records] = await connection.execute(query);
      
      // 应用数据映射
      let mappedRecords = records;
      if (mapping && typeof mapping === 'object') {
        mappedRecords = records.map(record => {
          const mapped = {};
          
          // 应用每个字段的映射
          for (const [targetField, sourceField] of Object.entries(mapping)) {
            mapped[targetField] = record[sourceField];
          }
          
          return mapped;
        });
      }
      
      // 导入记录到数据库
      const importResult = importRecords(mappedRecords, dataSource, db);
      
      return {
        totalRecords: records.length,
        importedRecords: importResult.imported,
        failedRecords: importResult.failed
      };
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('MySQL data sync failed:', error.message);
    throw error;
  }
};

// 同步MongoDB数据
const syncMongoData = async (dataSource, db) => {
  try {
    const { uri, database, collection, query = {}, mapping } = dataSource.config;
    
    if (!uri) {
      throw new Error('MongoDB URI is required');
    }
    
    const client = await mongoose.connect(uri, {
      dbName: database,
      serverSelectionTimeoutMS: 30000
    });
    
    try {
      const mongoDb = client.connection.db;
      const mongoCollection = mongoDb.collection(collection);
      
      // 执行查询
      const records = await mongoCollection.find(query).toArray();
      
      // 应用数据映射
      let mappedRecords = records;
      if (mapping && typeof mapping === 'object') {
        mappedRecords = records.map(record => {
          const mapped = {};
          
          // 应用每个字段的映射
          for (const [targetField, sourcePath] of Object.entries(mapping)) {
            // 支持嵌套字段路径，如 "user.name"
            const pathParts = sourcePath.split('.');
            let value = record;
            
            for (const part of pathParts) {
              if (value && typeof value === 'object' && part in value) {
                value = value[part];
              } else {
                value = undefined;
                break;
              }
            }
            
            mapped[targetField] = value;
          }
          
          return mapped;
        });
      }
      
      // 导入记录到数据库
      const importResult = importRecords(mappedRecords, dataSource, db);
      
      return {
        totalRecords: records.length,
        importedRecords: importResult.imported,
        failedRecords: importResult.failed
      };
    } finally {
      await client.connection.close();
    }
  } catch (error) {
    console.error('MongoDB data sync failed:', error.message);
    throw error;
  }
};

// 同步MSSQL数据
const syncMssqlData = async (dataSource, db) => {
  try {
    const { host, port, database, username, password, query, mapping } = dataSource.config;
    
    // 使用tedious库连接MSSQL
    const { Connection, Request } = require('tedious');
    
    return new Promise((resolve, reject) => {
      const connection = new Connection({
        server: host,
        port,
        authentication: {
          type: 'default',
          options: {
            userName: username,
            password
          }
        },
        options: {
          database,
          connectTimeout: 30000,
          rowCollectionOnRequestCompletion: true
        }
      });
      
      connection.on('connect', (err) => {
        if (err) {
          console.error('MSSQL connection error:', err.message);
          reject(err);
          return;
        }
        
        const request = new Request(query, (err, rowCount, rows) => {
          if (err) {
            console.error('MSSQL query error:', err.message);
            reject(err);
            return;
          }
          
          // 处理查询结果
          const records = rows.map(row => {
            const record = {};
            row.forEach(column => {
              record[column.metadata.colName] = column.value;
            });
            return record;
          });
          
          // 应用数据映射
          let mappedRecords = records;
          if (mapping && typeof mapping === 'object') {
            mappedRecords = records.map(record => {
              const mapped = {};
              
              // 应用每个字段的映射
              for (const [targetField, sourceField] of Object.entries(mapping)) {
                mapped[targetField] = record[sourceField];
              }
              
              return mapped;
            });
          }
          
          // 导入记录到数据库
          const importResult = importRecords(mappedRecords, dataSource, db);
          
          connection.close();
          
          resolve({
            totalRecords: records.length,
            importedRecords: importResult.imported,
            failedRecords: importResult.failed
          });
        });
        
        connection.execSql(request);
      });
      
      connection.on('error', (err) => {
        console.error('MSSQL connection error:', err.message);
        reject(err);
      });
    });
  });
} catch (error) {
  console.error('MSSQL data sync failed:', error.message);
  throw error;
}
};

// 同步Snowflake数据
const syncSnowflakeData = async (dataSource, db) => {
  try {
    const { account, username, password, warehouse, database, schema, query, mapping } = dataSource.config;
    
    // 使用snowflake-sdk连接Snowflake
    const snowflake = require('snowflake-sdk');
    
    return new Promise((resolve, reject) => {
      const connection = snowflake.createConnection({
        account,
        username,
        password,
        warehouse,
        database,
        schema
      });
      
      connection.connect((err, conn) => {
        if (err) {
          console.error('Snowflake connection error:', err.message);
          reject(err);
          return;
        }
        
        connection.execute({
          sqlText: query,
          complete: (err, stmt, rows) => {
            if (err) {
              console.error('Snowflake query error:', err.message);
              reject(err);
              return;
            }
            
            // 处理查询结果
            const records = rows.map(row => {
              const record = {};
              stmt.getColumnNames().forEach((columnName, index) => {
                record[columnName] = row[index];
              });
              return record;
            });
            
            // 应用数据映射
            let mappedRecords = records;
            if (mapping && typeof mapping === 'object') {
              mappedRecords = records.map(record => {
                const mapped = {};
                
                // 应用每个字段的映射
                for (const [targetField, sourceField] of Object.entries(mapping)) {
                  mapped[targetField] = record[sourceField];
                }
                
                return mapped;
              });
            }
            
            // 导入记录到数据库
            const importResult = importRecords(mappedRecords, dataSource, db);
            
            connection.destroy();
            
            resolve({
              totalRecords: records.length,
              importedRecords: importResult.imported,
              failedRecords: importResult.failed
            });
          }
        });
      });
    });
  } catch (error) {
    console.error('Snowflake data sync failed:', error.message);
    throw error;
  }
};

// 导入记录到数据库
const importRecords = (records, dataSource, db) => {
  try {
    let imported = 0;
    let failed = 0;
    
    // 确保记录数组存在
    db.records = db.records || [];
    
    // 验证和导入每条记录
    records.forEach((record, index) => {
      try {
        // 基本验证
        if (!record.date || !record.source || !record.value) {
          failed++;
          return;
        }
        
        // 创建新记录
        const newRecord = {
          id: Date.now().toString() + index,
          userId: dataSource.userId,
          date: new Date(record.date),
          source: record.source,
          value: parseFloat(record.value),
          unit: record.unit || 'kg',
          scope: parseInt(record.scope) || 1,
          emissionFactor: parseFloat(record.emissionFactor) || 0,
          totalCo2e: parseFloat(record.value) * (parseFloat(record.emissionFactor) || 0),
          notes: record.notes || '',
          tags: record.tags ? (Array.isArray(record.tags) ? record.tags : record.tags.split(',').map(tag => tag.trim())) : [],
          createdAt: new Date(),
          updatedAt: new Date(),
          importedFrom: dataSource.type,
          importId: dataSource.id
        };
        
        // 保存记录
        db.records.push(newRecord);
        imported++;
      } catch (error) {
        failed++;
        console.error(`Failed to import record ${index + 1}:`, error.message);
      }
    });
    
    return { imported, failed };
  } catch (error) {
    console.error('Record import failed:', error.message);
    throw error;
  }
};

// 计算下次同步时间
const calculateNextSync = (schedule) => {
  const now = new Date();
  const nextSync = new Date(now);
  
  // 设置同步时间
  const [hours, minutes] = schedule.time.split(':').map(Number);
  nextSync.setHours(hours, minutes, 0, 0);
  
  // 如果今天的同步时间已过，则设置为明天
  if (nextSync < now) {
    nextSync.setDate(nextSync.getDate() + 1);
  }
  
  // 根据频率设置日期
  switch (schedule.frequency) {
    case 'daily':
      // 每天同一时间
      break;
      
    case 'weekly':
      // 每周同一天同一时间
      nextSync.setDate(nextSync.getDate() + (7 - nextSync.getDay()));
      break;
      
    case 'monthly':
      // 每月同一天同一时间
      nextSync.setMonth(nextSync.getMonth() + 1);
      break;
      
    default:
      // 默认每天
      break;
  }
  
  return nextSync;
};

module.exports = {
  createDataSource,
  getDataSources,
  getDataSource,
  updateDataSource,
  deleteDataSource,
  testDataSourceConnection,
  syncDataSource
};
