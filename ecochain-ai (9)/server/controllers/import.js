const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');

// 模拟文件上传目录
const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// 创建导入任务
const createImportJob = (req, res) => {
  try {
    const { type } = req.body;
    const validTypes = ['csv', 'excel', 'json'];

    // 验证导入类型
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid import type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // 创建导入任务
    const importJob = {
      id: Date.now().toString(),
      userId: req.user.id,
      type,
      filename: '',
      status: 'pending',
      progress: 0,
      totalRecords: 0,
      importedRecords: 0,
      failedRecords: 0,
      errorLog: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 保存导入任务
    req.app.locals.db.importJobs.push(importJob);

    res.status(201).json({
      status: 'success',
      message: 'Import job created',
      data: {
        importJob: {
          id: importJob.id,
          type: importJob.type,
          status: importJob.status,
          createdAt: importJob.createdAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// 上传文件
const uploadFile = (req, res) => {
  try {
    const { jobId } = req.params;
    const file = req.file;

    // 验证文件
    if (!file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    // 查找导入任务
    const jobIndex = req.app.locals.db.importJobs.findIndex(
      job => job.id === jobId && job.userId === req.user.id
    );

    if (jobIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'Import job not found' });
    }

    // 验证文件类型
    const job = req.app.locals.db.importJobs[jobIndex];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    let isValidType = false;
    switch (job.type) {
      case 'csv':
        isValidType = fileExtension === '.csv';
        break;
      case 'excel':
        isValidType = ['.xlsx', '.xls'].includes(fileExtension);
        break;
      case 'json':
        isValidType = fileExtension === '.json';
        break;
      default:
        isValidType = false;
    }

    if (!isValidType) {
      // 删除上传的文件
      fs.unlinkSync(file.path);
      return res.status(400).json({
        status: 'error',
        message: `Invalid file type. Expected ${job.type.toUpperCase()} file`
      });
    }

    // 更新导入任务
    job.filename = file.originalname;
    job.status = 'processing';
    job.updatedAt = new Date();
    req.app.locals.db.importJobs[jobIndex] = job;

    // 处理文件
    processFile(file.path, job, req.app.locals.db)
      .then(updatedJob => {
        // 更新任务状态
        req.app.locals.db.importJobs[jobIndex] = updatedJob;
        
        // 删除临时文件
        fs.unlinkSync(file.path);
        
        res.status(200).json({
          status: 'success',
          message: 'File uploaded and processed',
          data: {
            importJob: {
              id: updatedJob.id,
              type: updatedJob.type,
              filename: updatedJob.filename,
              status: updatedJob.status,
              progress: updatedJob.progress,
              totalRecords: updatedJob.totalRecords,
              importedRecords: updatedJob.importedRecords,
              failedRecords: updatedJob.failedRecords
            }
          }
        });
      })
      .catch(error => {
        // 更新任务状态为失败
        job.status = 'failed';
        job.errorLog = error.message;
        job.updatedAt = new Date();
        req.app.locals.db.importJobs[jobIndex] = job;
        
        // 删除临时文件
        fs.unlinkSync(file.path);
        
        res.status(500).json({
          status: 'error',
          message: 'Error processing file',
          error: error.message
        });
      });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// 获取导入任务状态
const getImportStatus = (req, res) => {
  try {
    const { jobId } = req.params;

    // 查找导入任务
    const job = req.app.locals.db.importJobs.find(
      job => job.id === jobId && job.userId === req.user.id
    );

    if (!job) {
      return res.status(404).json({ status: 'error', message: 'Import job not found' });
    }

    res.status(200).json({
      status: 'success',
      data: {
        importJob: {
          id: job.id,
          type: job.type,
          filename: job.filename,
          status: job.status,
          progress: job.progress,
          totalRecords: job.totalRecords,
          importedRecords: job.importedRecords,
          failedRecords: job.failedRecords,
          errorLog: job.errorLog,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// 获取所有导入任务
const getImportJobs = (req, res) => {
  try {
    // 查找用户的所有导入任务
    const jobs = req.app.locals.db.importJobs
      .filter(job => job.userId === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      status: 'success',
      data: {
        importJobs: jobs.map(job => ({
          id: job.id,
          type: job.type,
          filename: job.filename,
          status: job.status,
          progress: job.progress,
          totalRecords: job.totalRecords,
          importedRecords: job.importedRecords,
          failedRecords: job.failedRecords,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt
        })),
        total: jobs.length
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// 获取导入模板
const getImportTemplates = (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['csv', 'excel', 'json'];

    // 验证模板类型
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid template type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // 模拟模板数据
    const templates = {
      csv: {
        name: 'Carbon Records Import Template (CSV)',
        fields: ['date', 'source', 'value', 'unit', 'scope', 'emissionFactor', 'notes', 'tags'],
        example: `date,source,value,unit,scope,emissionFactor,notes,tags
2023-01-15,Fossil Fuels,1000,kg,1,0.5,Monthly data,energy
2023-02-15,Transportation,500,kg,2,0.3,Company vehicles,transport`
      },
      excel: {
        name: 'Carbon Records Import Template (Excel)',
        fields: ['date', 'source', 'value', 'unit', 'scope', 'emissionFactor', 'notes', 'tags'],
        example: 'Download Excel template'
      },
      json: {
        name: 'Carbon Records Import Template (JSON)',
        fields: ['date', 'source', 'value', 'unit', 'scope', 'emissionFactor', 'notes', 'tags'],
        example: `[
  {
    "date": "2023-01-15",
    "source": "Fossil Fuels",
    "value": 1000,
    "unit": "kg",
    "scope": 1,
    "emissionFactor": 0.5,
    "notes": "Monthly data",
    "tags": ["energy"]
  },
  {
    "date": "2023-02-15",
    "source": "Transportation",
    "value": 500,
    "unit": "kg",
    "scope": 2,
    "emissionFactor": 0.3,
    "notes": "Company vehicles",
    "tags": ["transport"]
  }
]`
      }
    };

    res.status(200).json({
      status: 'success',
      data: {
        template: templates[type]
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// 处理上传的文件
const processFile = async (filePath, job, db) => {
  return new Promise((resolve, reject) => {
    try {
      let records = [];
      job.progress = 10;
      job.updatedAt = new Date();

      switch (job.type) {
        case 'csv':
          // 处理CSV文件
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => records.push(data))
            .on('end', () => {
              job.progress = 50;
              job.totalRecords = records.length;
              job.updatedAt = new Date();
              
              // 导入数据
              importRecords(records, job, db);
              resolve(job);
            })
            .on('error', (error) => {
              reject(error);
            });
          break;
          
        case 'excel':
          // 处理Excel文件
          const workbook = XLSX.readFile(filePath);
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          records = XLSX.utils.sheet_to_json(worksheet);
          
          job.progress = 50;
          job.totalRecords = records.length;
          job.updatedAt = new Date();
          
          // 导入数据
          importRecords(records, job, db);
          resolve(job);
          break;
          
        case 'json':
          // 处理JSON文件
          const jsonData = fs.readFileSync(filePath, 'utf8');
          records = JSON.parse(jsonData);
          
          job.progress = 50;
          job.totalRecords = records.length;
          job.updatedAt = new Date();
          
          // 导入数据
          importRecords(records, job, db);
          resolve(job);
          break;
          
        default:
          reject(new Error(`Unsupported file type: ${job.type}`));
      }
    } catch (error) {
      reject(error);
    }
  });
};

// 导入记录到数据库
const importRecords = (records, job, db) => {
  try {
    job.progress = 70;
    job.updatedAt = new Date();

    // 验证和导入每条记录
    records.forEach((record, index) => {
      try {
        // 基本验证
        if (!record.date || !record.source || !record.value) {
          job.failedRecords++;
          return;
        }

        // 创建新记录
        const newRecord = {
          id: Date.now().toString() + index,
          userId: job.userId,
          date: new Date(record.date),
          source: record.source,
          value: parseFloat(record.value),
          unit: record.unit || 'kg',
          scope: parseInt(record.scope) || 1,
          emissionFactor: parseFloat(record.emissionFactor) || 0,
          totalCo2e: parseFloat(record.value) * (parseFloat(record.emissionFactor) || 0),
          notes: record.notes || '',
          tags: record.tags ? record.tags.split(',').map(tag => tag.trim()) : [],
          createdAt: new Date(),
          updatedAt: new Date(),
          importedFrom: job.type,
          importId: job.id
        };

        // 保存记录
        db.records.push(newRecord);
        job.importedRecords++;
      } catch (error) {
        job.failedRecords++;
        job.errorLog += `Record ${index + 1}: ${error.message}\n`;
      }
    });

    job.progress = 100;
    job.status = 'completed';
    job.updatedAt = new Date();
  } catch (error) {
    job.status = 'failed';
    job.errorLog = error.message;
    job.updatedAt = new Date();
  }
};

module.exports = {
  createImportJob,
  uploadFile,
  getImportStatus,
  getImportJobs,
  getImportTemplates
};
