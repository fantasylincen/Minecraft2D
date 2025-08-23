/**
 * 游戏数值配置管理系统
 * 统一管理所有游戏相关的数值参数，支持热更新和持久化
 */

export class GameConfig {
  constructor() {
    this.configVersion = '1.0.0';
    this.configs = new Map();
    this.listeners = new Map();
    
    // 初始化默认配置
    this.initializeDefaultConfigs();
    
    // 尝试加载保存的配置
    this.loadFromStorage();
    
    console.log('⚙️ GameConfig 数值配置系统初始化完成');
  }
  
  /**
   * 初始化默认配置
   */
  initializeDefaultConfigs() {
    // 洞穴生成配置
    this.configs.set('cave', {
      category: '洞穴系统',
      displayName: '洞穴生成配置',
      settings: {
        // 核心控制参数
        coveragePercentage: {
          value: 12, // 从15降低到12
          min: 5,
          max: 50,
          step: 1,
          unit: '%',
          description: '洞穴掏空比例',
          displayName: '掏空比例'
        },
        initialCaveChance: {
          value: 0.05, // 进一步降低到0.05
          min: 0.05,
          max: 0.6,
          step: 0.01,
          unit: '',
          description: '初始洞穴生成概率',
          displayName: '初始概率'
        },
        iterations: {
          value: 3, // 从5降低到3
          min: 1,
          max: 8,
          step: 1,
          unit: '次',
          description: 'CA算法迭代次数',
          displayName: '迭代次数'
        },
        birthLimit: {
          value: 4,
          min: 3,
          max: 6,
          step: 1,
          unit: '',
          description: '洞穴生成邻居阈值',
          displayName: '生成阈值'
        },
        deathLimit: {
          value: 3,
          min: 2,
          max: 5,
          step: 1,
          unit: '',
          description: '洞穴移除邻居阈值',
          displayName: '移除阈值'
        },
        minDepth: {
          value: 30,
          min: 10,
          max: 100,
          step: 5,
          unit: '格',
          description: '最小生成深度',
          displayName: '最小深度'
        },
        maxDepthRatio: {
          value: 0.7, // 从0.8降低到0.7
          min: 0.4,
          max: 0.9,
          step: 0.05,
          unit: '',
          description: '最大深度比例',
          displayName: '最大深度比例'
        },
        tunnelThreshold: {
          value: 0.4, // 从0.3提高到0.4
          min: 0.2,
          max: 0.7,
          step: 0.05,
          unit: '',
          description: '隧道生成阈值',
          displayName: '隧道阈值'
        },
        chamberThreshold: {
          value: 0.7, // 从0.6提高到0.7
          min: 0.5,
          max: 0.9,
          step: 0.05,
          unit: '',
          description: '洞室生成阈值',
          displayName: '洞室阈值'
        }
      }
    });
    
    // 地形生成配置
    this.configs.set('terrain', {
      category: '地形系统',
      displayName: '地形生成配置',
      settings: {
        baseHeight: {
          value: 100,
          min: 50,
          max: 200,
          step: 5,
          unit: '格',
          description: '基础海平面高度',
          displayName: '海平面高度'
        },
        continentalScale: {
          value: 0.0001,
          min: 0.00005,
          max: 0.0005,
          step: 0.00001,
          unit: '',
          description: '大陆尺度噪音频率',
          displayName: '大陆尺度'
        },
        continentalAmplitude: {
          value: 150,
          min: 50,
          max: 300,
          step: 10,
          unit: '格',
          description: '大陆高度振幅',
          displayName: '大陆振幅'
        },
        regionalScale: {
          value: 0.001,
          min: 0.0005,
          max: 0.003,
          step: 0.0001,
          unit: '',
          description: '区域尺度噪音频率',
          displayName: '区域尺度'
        },
        regionalAmplitude: {
          value: 80,
          min: 30,
          max: 150,
          step: 5,
          unit: '格',
          description: '区域高度振幅',
          displayName: '区域振幅'
        }
      }
    });
    
    // 矿物生成配置
    this.configs.set('ore', {
      category: '矿物系统',
      displayName: '矿物生成配置',
      settings: {
        coalAbundance: {
          value: 0.15,
          min: 0.05,
          max: 0.3,
          step: 0.01,
          unit: '',
          description: '煤矿丰度',
          displayName: '煤矿丰度'
        },
        ironAbundance: {
          value: 0.12,
          min: 0.05,
          max: 0.25,
          step: 0.01,
          unit: '',
          description: '铁矿丰度',
          displayName: '铁矿丰度'
        },
        goldAbundance: {
          value: 0.05,
          min: 0.01,
          max: 0.15,
          step: 0.01,
          unit: '',
          description: '金矿丰度',
          displayName: '金矿丰度'
        },
        diamondAbundance: {
          value: 0.02,
          min: 0.005,
          max: 0.08,
          step: 0.005,
          unit: '',
          description: '钻石丰度',
          displayName: '钻石丰度'
        }
      }
    });
    
    // 植被生成配置
    this.configs.set('vegetation', {
      category: '植被系统',
      displayName: '植被生成配置',
      settings: {
        treeBaseChance: {
          value: 0.15,
          min: 0.05,
          max: 0.4,
          step: 0.01,
          unit: '',
          description: '树木基础生成概率',
          displayName: '树木概率'
        },
        grassBaseChance: {
          value: 0.4,
          min: 0.1,
          max: 0.8,
          step: 0.05,
          unit: '',
          description: '草地基础生成概率',
          displayName: '草地概率'
        },
        flowerBaseChance: {
          value: 0.08,
          min: 0.01,
          max: 0.2,
          step: 0.01,
          unit: '',
          description: '花朵基础生成概率',
          displayName: '花朵概率'
        },
        treeMinSpacing: {
          value: 3,
          min: 2,
          max: 8,
          step: 1,
          unit: '格',
          description: '树木最小间距',
          displayName: '树木间距'
        }
      }
    });
    
    // 性能配置
    this.configs.set('performance', {
      category: '性能系统',
      displayName: '性能优化配置',
      settings: {
        chunkSize: {
          value: 16,
          min: 8,
          max: 32,
          step: 4,
          unit: '格',
          description: '区块大小',
          displayName: '区块大小'
        },
        renderDistance: {
          value: 5,
          min: 3,
          max: 10,
          step: 1,
          unit: '区块',
          description: '渲染距离',
          displayName: '渲染距离'
        },
        maxCacheSize: {
          value: 50,
          min: 20,
          max: 200,
          step: 10,
          unit: '区块',
          description: '最大缓存区块数',
          displayName: '缓存大小'
        },
        targetFPS: {
          value: 60,
          min: 10,     // TODO #30: 帧率可调范围 10-120
          max: 120,
          step: 5,     // TODO #30: 步長5
          unit: 'FPS',
          description: '目标帧率 (10-120 FPS，步長5)',
          displayName: '目标帧率'
        }
      }
    });
  }
  
  /**
   * 获取配置值
   * @param {string} category - 配置类别
   * @param {string} key - 配置键
   * @returns {*} 配置值
   */
  get(category, key) {
    const config = this.configs.get(category);
    if (!config || !config.settings[key]) {
      console.warn(`⚠️ 配置不存在: ${category}.${key}`);
      return null;
    }
    return config.settings[key].value;
  }
  
  /**
   * 设置配置值
   * @param {string} category - 配置类别
   * @param {string} key - 配置键
   * @param {*} value - 新值
   * @returns {boolean} 是否设置成功
   */
  set(category, key, value) {
    const config = this.configs.get(category);
    if (!config || !config.settings[key]) {
      console.warn(`⚠️ 配置不存在: ${category}.${key}`);
      return false;
    }
    
    const setting = config.settings[key];
    
    // 验证数值范围
    if (typeof value === 'number' && setting.min !== undefined && setting.max !== undefined) {
      value = Math.max(setting.min, Math.min(setting.max, value));
    }
    
    const oldValue = setting.value;
    setting.value = value;
    
    // 触发监听器
    this.notifyListeners(category, key, value, oldValue);
    
    // 自动保存
    this.saveToStorage();
    
    console.log(`⚙️ 配置更新: ${category}.${key} = ${value}`);
    return true;
  }
  
  /**
   * 获取完整配置对象
   * @param {string} category - 配置类别
   * @returns {Object} 配置对象
   */
  getConfig(category) {
    return this.configs.get(category);
  }
  
  /**
   * 获取所有配置类别
   * @returns {string[]} 类别列表
   */
  getCategories() {
    return Array.from(this.configs.keys());
  }
  
  /**
   * 添加配置变更监听器
   * @param {string} category - 配置类别
   * @param {string} key - 配置键
   * @param {Function} callback - 回调函数
   */
  addListener(category, key, callback) {
    const listenerKey = `${category}.${key}`;
    if (!this.listeners.has(listenerKey)) {
      this.listeners.set(listenerKey, []);
    }
    this.listeners.get(listenerKey).push(callback);
  }
  
  /**
   * 移除配置变更监听器
   * @param {string} category - 配置类别
   * @param {string} key - 配置键
   * @param {Function} callback - 回调函数
   */
  removeListener(category, key, callback) {
    const listenerKey = `${category}.${key}`;
    const listeners = this.listeners.get(listenerKey);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * 通知监听器
   * @param {string} category - 配置类别
   * @param {string} key - 配置键
   * @param {*} newValue - 新值
   * @param {*} oldValue - 旧值
   */
  notifyListeners(category, key, newValue, oldValue) {
    const listenerKey = `${category}.${key}`;
    const listeners = this.listeners.get(listenerKey);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(newValue, oldValue, category, key);
        } catch (error) {
          console.error(`❌ 配置监听器错误: ${listenerKey}`, error);
        }
      });
    }
  }
  
  /**
   * 重置配置到默认值
   * @param {string} category - 配置类别（可选，不传则重置所有）
   */
  resetToDefault(category = null) {
    if (category) {
      // 重置单个类别
      this.initializeDefaultConfigs();
      const defaultConfig = this.configs.get(category);
      if (defaultConfig) {
        console.log(`🔄 重置配置类别: ${category}`);
      }
    } else {
      // 重置所有配置
      this.configs.clear();
      this.initializeDefaultConfigs();
      console.log('🔄 重置所有配置到默认值');
    }
    
    this.saveToStorage();
  }
  
  /**
   * 导出配置
   * @returns {string} JSON格式的配置
   */
  exportConfig() {
    const exportData = {
      version: this.configVersion,
      timestamp: new Date().toISOString(),
      configs: {}
    };
    
    for (const [category, config] of this.configs) {
      exportData.configs[category] = {
        category: config.category,
        displayName: config.displayName,
        settings: {}
      };
      
      for (const [key, setting] of Object.entries(config.settings)) {
        exportData.configs[category].settings[key] = {
          value: setting.value,
          description: setting.description
        };
      }
    }
    
    return JSON.stringify(exportData, null, 2);
  }
  
  /**
   * 导入配置
   * @param {string} jsonData - JSON格式的配置
   * @returns {boolean} 是否导入成功
   */
  importConfig(jsonData) {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.configs) {
        throw new Error('无效的配置格式');
      }
      
      // 导入配置值
      for (const [category, categoryData] of Object.entries(importData.configs)) {
        const config = this.configs.get(category);
        if (config && categoryData.settings) {
          for (const [key, settingData] of Object.entries(categoryData.settings)) {
            if (config.settings[key] && settingData.value !== undefined) {
              this.set(category, key, settingData.value);
            }
          }
        }
      }
      
      console.log('📥 配置导入成功');
      return true;
    } catch (error) {
      console.error('❌ 配置导入失败:', error);
      return false;
    }
  }
  
  /**
   * 保存配置到localStorage
   */
  saveToStorage() {
    try {
      const configData = {};
      for (const [category, config] of this.configs) {
        configData[category] = {};
        for (const [key, setting] of Object.entries(config.settings)) {
          configData[category][key] = setting.value;
        }
      }
      
      localStorage.setItem('mcv2_game_config', JSON.stringify({
        version: this.configVersion,
        data: configData,
        savedAt: Date.now()
      }));
    } catch (error) {
      console.error('❌ 配置保存失败:', error);
    }
  }
  
  /**
   * 从localStorage加载配置
   */
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('mcv2_game_config');
      if (!saved) return;
      
      const savedData = JSON.parse(saved);
      if (!savedData.data) return;
      
      // 加载保存的配置值
      for (const [category, categoryData] of Object.entries(savedData.data)) {
        const config = this.configs.get(category);
        if (config) {
          for (const [key, value] of Object.entries(categoryData)) {
            if (config.settings[key]) {
              config.settings[key].value = value;
            }
          }
        }
      }
      
      console.log('📂 配置加载成功');
    } catch (error) {
      console.error('❌ 配置加载失败:', error);
    }
  }
  
  /**
   * 获取配置统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    let totalSettings = 0;
    const categoryStats = {};
    
    for (const [category, config] of this.configs) {
      const settingCount = Object.keys(config.settings).length;
      totalSettings += settingCount;
      categoryStats[category] = {
        displayName: config.category,
        settingCount: settingCount
      };
    }
    
    return {
      totalCategories: this.configs.size,
      totalSettings: totalSettings,
      categories: categoryStats,
      version: this.configVersion
    };
  }
}

// 导出全局实例
export const gameConfig = new GameConfig();