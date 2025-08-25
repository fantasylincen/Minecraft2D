/**
 * 农作物系统
 * 负责管理农作物的种植、生长和收获
 */

import { blockConfig } from '../config/BlockConfig.js';

export class FarmingSystem {
  constructor() {
    // 农作物生长配置
    this.cropGrowthConfig = {
      // 小麦生长阶段
      wheat: {
        stages: [
          { name: 'wheat_seeds', growthTime: 10000 }, // 种子阶段
          { name: 'wheat_stage1', growthTime: 15000 }, // 发芽阶段
          { name: 'wheat_stage2', growthTime: 20000 }, // 成长阶段
          { name: 'wheat', growthTime: 25000 } // 成熟阶段
        ],
        baseGrowthRate: 1.0,
        drops: ['wheat_item', 'wheat_seeds'] // 收获时掉落物
      },
      // 胡萝卜生长阶段
      carrot: {
        stages: [
          { name: 'carrot_seeds', growthTime: 12000 }, // 种子阶段
          { name: 'carrot_stage1', growthTime: 18000 }, // 发芽阶段
          { name: 'carrot_stage2', growthTime: 24000 }, // 成长阶段
          { name: 'carrot', growthTime: 30000 } // 成熟阶段
        ],
        baseGrowthRate: 1.0,
        drops: ['carrot_item'] // 收获时掉落物
      },
      // 土豆生长阶段
      potato: {
        stages: [
          { name: 'potato_seeds', growthTime: 11000 }, // 种子阶段
          { name: 'potato_stage1', growthTime: 16000 }, // 发芽阶段
          { name: 'potato_stage2', growthTime: 22000 }, // 成长阶段
          { name: 'potato', growthTime: 28000 } // 成熟阶段
        ],
        baseGrowthRate: 1.0,
        drops: ['potato_item'] // 收获时掉落物
      },
      // 甜菜根生长阶段
      beetroot: {
        stages: [
          { name: 'beetroot_seeds', growthTime: 13000 }, // 种子阶段
          { name: 'beetroot_stage1', growthTime: 19000 }, // 发芽阶段
          { name: 'beetroot_stage2', growthTime: 25000 }, // 成长阶段
          { name: 'beetroot', growthTime: 31000 } // 成熟阶段
        ],
        baseGrowthRate: 1.0,
        drops: ['beetroot_item', 'beetroot_seeds'] // 收获时掉落物
      }
    };
    
    // 农作物生长状态
    this.cropStates = new Map();
    
    console.log('🌾 FarmingSystem 初始化完成');
  }
  
  /**
   * 设置季节系统引用
   * @param {Object} seasonSystem - 季节系统引用
   */
  setSeasonSystem(seasonSystem) {
    this.seasonSystem = seasonSystem;
  }
  
  /**
   * 获取当前季节
   * @returns {string} 当前季节
   */
  getCurrentSeason() {
    if (this.seasonSystem && this.seasonSystem.currentSeason) {
      return this.seasonSystem.currentSeason;
    }
    return 'spring'; // 默认春季
  }
  
  /**
   * 根据季节调整农作物生长速度
   * @param {string} cropType - 农作物类型
   * @param {number} baseRate - 基础生长速度
   * @returns {number} 调整后的生长速度
   */
  adjustGrowthRateForSeason(cropType, baseRate) {
    const season = this.getCurrentSeason();
    let adjustedRate = baseRate;
    
    switch (season) {
      case 'spring':
        // 春季：万物复苏，生长速度最快
        adjustedRate *= 1.5;
        break;
      case 'summer':
        // 夏季：阳光充足，生长速度较快
        adjustedRate *= 1.3;
        break;
      case 'autumn':
        // 秋季：收获季节，生长速度适中
        adjustedRate *= 1.1;
        break;
      case 'winter':
        // 冬季：寒冷季节，生长速度最慢
        adjustedRate *= 0.3;
        break;
    }
    
    return adjustedRate;
  }
  
  /**
   * 种植农作物
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} cropType - 农作物类型
   */
  plantCrop(x, y, cropType) {
    const key = `${x},${y}`;
    const config = this.cropGrowthConfig[cropType];
    
    if (!config) {
      console.warn(`🌱 未知的农作物类型: ${cropType}`);
      return false;
    }
    
    // 初始化农作物状态
    this.cropStates.set(key, {
      type: cropType,
      stage: 0, // 初始阶段
      plantedTime: Date.now(),
      lastGrowthCheck: Date.now(),
      growthRate: this.adjustGrowthRateForSeason(cropType, config.baseGrowthRate)
    });
    
    console.log(`🌱 在位置 (${x}, ${y}) 种植 ${cropType}`);
    return true;
  }
  
  /**
   * 更新农作物生长状态
   * @param {number} deltaTime - 时间增量（毫秒）
   */
  update(deltaTime) {
    // 更新所有农作物的生长状态
    for (const [key, state] of this.cropStates.entries()) {
      const config = this.cropGrowthConfig[state.type];
      if (!config) continue;
      
      // 检查是否需要更新生长阶段
      const now = Date.now();
      const timeSinceLastCheck = now - state.lastGrowthCheck;
      
      // 每5秒检查一次生长状态
      if (timeSinceLastCheck >= 5000) {
        this.checkGrowth(key, state, config);
        state.lastGrowthCheck = now;
      }
    }
  }
  
  /**
   * 检查农作物生长
   * @param {string} key - 位置键
   * @param {Object} state - 农作物状态
   * @param {Object} config - 农作物配置
   */
  checkGrowth(key, state, config) {
    const now = Date.now();
    const timeSincePlanted = now - state.plantedTime;
    
    // 根据季节调整生长速度
    const adjustedGrowthRate = this.adjustGrowthRateForSeason(state.type, config.baseGrowthRate);
    
    // 计算当前应该处于的生长阶段
    let currentStage = 0;
    let accumulatedTime = 0;
    
    for (let i = 0; i < config.stages.length; i++) {
      const stageTime = config.stages[i].growthTime / adjustedGrowthRate;
      accumulatedTime += stageTime;
      
      if (timeSincePlanted >= accumulatedTime) {
        currentStage = i + 1;
      } else {
        break;
      }
    }
    
    // 确保不超过最大阶段
    currentStage = Math.min(currentStage, config.stages.length - 1);
    
    // 如果生长阶段发生变化
    if (currentStage !== state.stage) {
      state.stage = currentStage;
      console.log(`🌱 农作物在位置 ${key} 生长到阶段 ${currentStage}`);
      
      // 如果达到成熟阶段，触发收获提示
      if (currentStage === config.stages.length - 1) {
        console.log(`✅ 农作物在位置 ${key} 已成熟，可以收获了！`);
      }
    }
  }
  
  /**
   * 收获农作物
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {Array} 掉落物列表
   */
  harvestCrop(x, y) {
    const key = `${x},${y}`;
    const state = this.cropStates.get(key);
    
    if (!state) {
      console.warn(`🌱 位置 (${x}, ${y}) 没有农作物`);
      return [];
    }
    
    const config = this.cropGrowthConfig[state.type];
    if (!config) {
      this.cropStates.delete(key);
      return [];
    }
    
    // 检查是否成熟
    if (state.stage < config.stages.length - 1) {
      console.log(`🌱 农作物在位置 (${x}, ${y}) 还未成熟，无法收获`);
      return [];
    }
    
    // 获取掉落物
    const drops = [...config.drops];
    
    // 有一定概率获得额外种子
    if (Math.random() < 0.3) {
      drops.push(`${state.type}_seeds`);
    }
    
    // 移除农作物状态
    this.cropStates.delete(key);
    
    console.log(`🌱 收获位置 (${x}, ${y}) 的 ${state.type}，获得:`, drops);
    return drops;
  }
  
  /**
   * 获取农作物当前阶段的方块名称
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {string|null} 方块名称
   */
  getCropBlockName(x, y) {
    const key = `${x},${y}`;
    const state = this.cropStates.get(key);
    
    if (!state) {
      return null;
    }
    
    const config = this.cropGrowthConfig[state.type];
    if (!config) {
      return null;
    }
    
    const stageInfo = config.stages[state.stage];
    return stageInfo ? stageInfo.name : null;
  }
  
  /**
   * 检查指定位置是否有农作物
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {boolean} 是否有农作物
   */
  hasCrop(x, y) {
    const key = `${x},${y}`;
    return this.cropStates.has(key);
  }
  
  /**
   * 获取农作物统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const stats = {
      totalCrops: this.cropStates.size,
      cropTypes: {},
      growthStages: {}
    };
    
    // 统计各类农作物数量
    for (const state of this.cropStates.values()) {
      if (!stats.cropTypes[state.type]) {
        stats.cropTypes[state.type] = 0;
      }
      stats.cropTypes[state.type]++;
      
      // 统计各生长阶段数量
      if (!stats.growthStages[state.stage]) {
        stats.growthStages[state.stage] = 0;
      }
      stats.growthStages[state.stage]++;
    }
    
    return stats;
  }
}