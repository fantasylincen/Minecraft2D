/**
 * 农作物系统
 * 管理游戏中的农作物种植、生长和收获
 */

export class FarmingSystem {
  constructor() {
    // 农作物数据
    this.crops = new Map(); // 存储所有农作物 {x,y} -> {type, growthStage, plantedTime}
    
    // 农作物类型配置
    this.cropTypes = {
      wheat: {
        name: '小麦',
        growthStages: 8, // 生长阶段数
        growthTime: 120000, // 生长总时间（毫秒）
        dropItem: 'wheat_item',
        dropCount: { min: 1, max: 3 }, // 收获数量范围
        seedItem: 'wheat_seeds_item'
      },
      carrot: {
        name: '胡萝卜',
        growthStages: 4,
        growthTime: 180000,
        dropItem: 'carrot_item',
        dropCount: { min: 1, max: 2 },
        seedItem: 'carrot_seeds_item'
      },
      potato: {
        name: '土豆',
        growthStages: 4,
        growthTime: 180000,
        dropItem: 'potato_item',
        dropCount: { min: 1, max: 2 },
        seedItem: 'potato_seeds_item'
      }
    };
    
    // 季节系统引用
    this.seasonSystem = null;
    
    console.log('🌱 FarmingSystem 农作物系统初始化完成');
  }
  
  /**
   * 设置季节系统
   * @param {Object} seasonSystem - 季节系统引用
   */
  setSeasonSystem(seasonSystem) {
    this.seasonSystem = seasonSystem;
  }
  
  /**
   * 种植农作物
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} cropType - 农作物类型
   * @returns {boolean} 是否种植成功
   */
  plantCrop(x, y, cropType) {
    // 检查农作物类型是否存在
    if (!this.cropTypes[cropType]) {
      console.warn(`未知的农作物类型: ${cropType}`);
      return false;
    }
    
    const key = `${x},${y}`;
    
    // 检查该位置是否已经有农作物
    if (this.crops.has(key)) {
      console.warn(`位置 ${x},${y} 已有农作物`);
      return false;
    }
    
    // 创建农作物数据
    const cropData = {
      type: cropType,
      growthStage: 0, // 初始阶段
      plantedTime: Date.now(),
      lastGrowthCheck: Date.now()
    };
    
    this.crops.set(key, cropData);
    console.log(`🌱 在位置 ${x},${y} 种植了 ${this.cropTypes[cropType].name}`);
    return true;
  }
  
  /**
   * 更新农作物生长
   * @param {number} deltaTime - 时间增量（毫秒）
   */
  update(deltaTime) {
    const currentTime = Date.now();
    
    // 遍历所有农作物
    for (const [key, cropData] of this.crops) {
      const cropType = this.cropTypes[cropData.type];
      if (!cropType) continue;
      
      // 检查是否需要更新生长阶段
      const timeSincePlanted = currentTime - cropData.plantedTime;
      const expectedStage = Math.min(
        Math.floor((timeSincePlanted / cropType.growthTime) * cropType.growthStages),
        cropType.growthStages - 1
      );
      
      // 更新生长阶段
      if (expectedStage > cropData.growthStage) {
        cropData.growthStage = expectedStage;
        cropData.lastGrowthCheck = currentTime;
        console.log(`🌱 农作物 ${cropType.name} 生长到阶段 ${expectedStage}`);
      }
    }
  }
  
  /**
   * 收获农作物
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {Object|null} 收获的物品 {itemId, count} 或 null
   */
  harvestCrop(x, y) {
    const key = `${x},${y}`;
    const cropData = this.crops.get(key);
    
    if (!cropData) {
      console.warn(`位置 ${x},${y} 没有农作物`);
      return null;
    }
    
    const cropType = this.cropTypes[cropData.type];
    if (!cropType) {
      this.crops.delete(key);
      return null;
    }
    
    // 检查是否完全成熟
    if (cropData.growthStage < cropType.growthStages - 1) {
      console.log(`🌱 农作物 ${cropType.name} 还未成熟，无法收获`);
      return null;
    }
    
    // 计算收获数量
    const minCount = cropType.dropCount.min;
    const maxCount = cropType.dropCount.max;
    const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
    
    // 删除农作物数据
    this.crops.delete(key);
    
    console.log(`🌱 收获了 ${count} 个 ${cropType.name}`);
    return {
      itemId: cropType.dropItem,
      count: count
    };
  }
  
  /**
   * 获取农作物信息
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {Object|null} 农作物信息或null
   */
  getCropInfo(x, y) {
    const key = `${x},${y}`;
    const cropData = this.crops.get(key);
    
    if (!cropData) {
      return null;
    }
    
    const cropType = this.cropTypes[cropData.type];
    if (!cropType) {
      return null;
    }
    
    return {
      type: cropData.type,
      typeName: cropType.name,
      growthStage: cropData.growthStage,
      maxGrowthStage: cropType.growthStages - 1,
      plantedTime: cropData.plantedTime,
      growthProgress: cropData.growthStage / (cropType.growthStages - 1)
    };
  }
  
  /**
   * 检查位置是否有农作物
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {boolean} 是否有农作物
   */
  hasCrop(x, y) {
    const key = `${x},${y}`;
    return this.crops.has(key);
  }
  
  /**
   * 获取所有农作物数据（用于保存）
   * @returns {Map} 农作物数据
   */
  getAllCrops() {
    return new Map(this.crops);
  }
  
  /**
   * 从数据恢复农作物（用于加载）
   * @param {Map} cropData - 农作物数据
   */
  loadCrops(cropData) {
    this.crops = new Map(cropData);
  }
  
  /**
   * 获取农作物类型配置
   * @param {string} cropType - 农作物类型
   * @returns {Object|undefined} 配置信息
   */
  getCropTypeConfig(cropType) {
    return this.cropTypes[cropType];
  }
  
  /**
   * 获取所有农作物类型
   * @returns {Array} 农作物类型列表
   */
  getAllCropTypes() {
    return Object.keys(this.cropTypes);
  }
}