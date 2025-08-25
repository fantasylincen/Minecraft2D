/**
 * 合成配方类
 * 定义物品合成的配方数据结构
 */

export class Recipe {
  /**
   * 构造函数
   * @param {string} id - 配方ID
   * @param {string} name - 配方名称
   * @param {Array} ingredients - 原材料数组，每个元素包含itemId和count
   * @param {Object} result - 结果物品，包含itemId和count
   * @param {string} type - 配方类型 ('crafting_table', 'furnace', etc.)
   * @param {number} time - 合成时间（毫秒）
   */
  constructor(id, name, ingredients, result, type = 'crafting_table', time = 1000) {
    this.id = id;
    this.name = name;
    this.ingredients = ingredients;
    this.result = result;
    this.type = type;
    this.time = time;
    this.timestamp = Date.now();
  }
  
  /**
   * 检查是否匹配指定的材料
   * @param {Array} materials - 材料数组
   * @returns {boolean} 是否匹配
   */
  matches(materials) {
    // 创建材料需求映射
    const requiredMap = new Map();
    this.ingredients.forEach(ingredient => {
      const key = ingredient.itemId;
      const count = requiredMap.get(key) || 0;
      requiredMap.set(key, count + ingredient.count);
    });
    
    // 创建可用材料映射
    const availableMap = new Map();
    materials.forEach(material => {
      if (material && material.itemId) {
        const key = material.itemId;
        const count = availableMap.get(key) || 0;
        availableMap.set(key, count + (material.count || 1));
      }
    });
    
    // 检查是否满足所有需求
    for (const [itemId, requiredCount] of requiredMap) {
      const availableCount = availableMap.get(itemId) || 0;
      if (availableCount < requiredCount) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 消耗材料
   * @param {Array} materials - 材料数组
   * @returns {boolean} 是否成功消耗
   */
  consumeMaterials(materials) {
    // 创建材料需求映射
    const requiredMap = new Map();
    this.ingredients.forEach(ingredient => {
      const key = ingredient.itemId;
      const count = requiredMap.get(key) || 0;
      requiredMap.set(key, count + ingredient.count);
    });
    
    // 消耗材料
    for (const [itemId, requiredCount] of requiredMap) {
      let remaining = requiredCount;
      
      // 遍历材料数组寻找匹配的物品
      for (const material of materials) {
        if (material && material.itemId === itemId && remaining > 0) {
          const consume = Math.min(material.count, remaining);
          material.count -= consume;
          remaining -= consume;
          
          // 如果物品用完了，清空槽位
          if (material.count <= 0) {
            material.itemId = null;
            material.count = 0;
            material.durability = null;
          }
        }
        
        if (remaining <= 0) break;
      }
      
      if (remaining > 0) {
        return false; // 材料不足
      }
    }
    
    return true;
  }
  
  /**
   * 获取结果物品
   * @returns {Object} 结果物品
   */
  getResult() {
    return { ...this.result };
  }
  
  /**
   * 获取配方类型
   * @returns {string} 配方类型
   */
  getType() {
    return this.type;
  }
  
  /**
   * 获取合成时间
   * @returns {number} 合成时间（毫秒）
   */
  getTime() {
    return this.time;
  }
  
  /**
   * 序列化配方数据
   * @returns {Object} 序列化数据
   */
  serialize() {
    return {
      id: this.id,
      name: this.name,
      ingredients: this.ingredients.map(ing => ({ ...ing })),
      result: { ...this.result },
      type: this.type,
      time: this.time,
      timestamp: this.timestamp
    };
  }
  
  /**
   * 从序列化数据创建配方
   * @param {Object} data - 序列化数据
   * @returns {Recipe} 配方实例
   */
  static deserialize(data) {
    return new Recipe(
      data.id,
      data.name,
      data.ingredients.map(ing => ({ ...ing })),
      { ...data.result },
      data.type,
      data.time
    );
  }
}