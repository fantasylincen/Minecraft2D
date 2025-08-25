/**
 * 熔炉方块类
 * 继承自容器方块基类
 */

import { ContainerBlock } from './ContainerBlock.js';
import { blockConfig } from '../config/BlockConfig.js';

export class FurnaceBlock extends ContainerBlock {
  /**
   * 构造函数
   * @param {number} x - 方块X坐标
   * @param {number} y - 方块Y坐标
   */
  constructor(x, y) {
    // 调用父类构造函数，创建3个槽位的容器（输入、燃料、输出）
    super(x, y, blockConfig.getBlock('furnace').id, '熔炉', 3);
    
    // 熔炉特有属性
    this.type = 'furnace';
    
    // 熔炉状态
    this.isBurning = false;
    this.burnTime = 0;
    this.totalBurnTime = 0;
    this.cookTime = 0;
    this.totalCookTime = 200; // 默认烹饪时间
    
    // 熔炉方向
    this.facingDirection = 'north';
  }
  
  /**
   * 设置熔炉方向
   * @param {string} direction - 方向 (north, south, east, west)
   */
  setFacingDirection(direction) {
    if (['north', 'south', 'east', 'west'].includes(direction)) {
      this.facingDirection = direction;
    }
  }
  
  /**
   * 获取熔炉方向
   * @returns {string} 方向
   */
  getFacingDirection() {
    return this.facingDirection;
  }
  
  /**
   * 开始燃烧
   * @param {number} burnTime - 燃烧时间
   */
  startBurning(burnTime) {
    this.isBurning = true;
    this.burnTime = burnTime;
    this.totalBurnTime = burnTime;
    console.log(`🔥 熔炉开始燃烧: ${burnTime} ticks`);
  }
  
  /**
   * 停止燃烧
   */
  stopBurning() {
    this.isBurning = false;
    this.burnTime = 0;
    this.totalBurnTime = 0;
    console.log('熄灭熔炉');
  }
  
  /**
   * 更新熔炉状态
   * @param {number} deltaTime - 时间增量
   */
  update(deltaTime) {
    // 如果正在燃烧，减少燃烧时间
    if (this.isBurning) {
      this.burnTime -= deltaTime;
      if (this.burnTime <= 0) {
        this.stopBurning();
      }
    }
    
    // 如果有燃料且未在燃烧，开始燃烧
    const fuelSlot = this.getSlot(1); // 燃料槽位
    if (!this.isBurning && fuelSlot && fuelSlot.itemId) {
      // 这里应该根据燃料类型确定燃烧时间
      const burnTime = this.getBurnTime(fuelSlot.itemId);
      if (burnTime > 0) {
        this.startBurning(burnTime);
        // 消耗燃料
        fuelSlot.count--;
        if (fuelSlot.count <= 0) {
          fuelSlot.itemId = null;
          fuelSlot.count = 0;
        }
      }
    }
    
    // 如果正在燃烧，进行烹饪
    if (this.isBurning) {
      const inputSlot = this.getSlot(0); // 输入槽位
      const outputSlot = this.getSlot(2); // 输出槽位
      
      if (inputSlot && inputSlot.itemId) {
        // 获取烹饪结果
        const result = this.getCookingResult(inputSlot.itemId);
        if (result) {
          // 检查输出槽位是否可以接受结果
          if (!outputSlot.itemId || 
              (outputSlot.itemId === result.itemId && outputSlot.count < 64)) {
            
            // 增加烹饪时间
            this.cookTime += deltaTime;
            
            // 如果烹饪完成
            if (this.cookTime >= this.totalCookTime) {
              // 添加到输出槽位
              if (!outputSlot.itemId) {
                outputSlot.itemId = result.itemId;
                outputSlot.count = result.count;
              } else {
                outputSlot.count += result.count;
              }
              
              // 消耗输入物品
              inputSlot.count--;
              if (inputSlot.count <= 0) {
                inputSlot.itemId = null;
                inputSlot.count = 0;
              }
              
              // 重置烹饪时间
              this.cookTime = 0;
              
              console.log(`🍳 烹饪完成: ${result.itemId}`);
            }
          }
        }
      }
    }
  }
  
  /**
   * 获取燃料燃烧时间
   * @param {string} fuelId - 燃料ID
   * @returns {number} 燃烧时间
   */
  getBurnTime(fuelId) {
    // 简单的燃料时间映射
    const burnTimes = {
      'coal_item': 1600,
      'wood_item': 300,
      'planks_item': 300,
      'sticks_item': 100
    };
    
    return burnTimes[fuelId] || 0;
  }
  
  /**
   * 获取烹饪结果
   * @param {string} inputId - 输入物品ID
   * @returns {Object|null} 烹饪结果
   */
  getCookingResult(inputId) {
    // 简单的烹饪结果映射
    const recipes = {
      'iron_ore_item': { itemId: 'iron_item', count: 1 },
      'gold_ore_item': { itemId: 'gold_item', count: 1 },
      'sand_item': { itemId: 'glass_item', count: 1 },
      'clay_ball_item': { itemId: 'brick_item', count: 1 }
    };
    
    return recipes[inputId] || null;
  }
  
  /**
   * 获取熔炉名称
   * @returns {string} 熔炉名称
   */
  getDisplayName() {
    return this.displayName;
  }
  
  /**
   * 检查是否为熔炉方块
   * @returns {boolean} 是否为熔炉
   */
  isFurnace() {
    return true;
  }
  
  /**
   * 获取熔炉状态
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      isBurning: this.isBurning,
      burnTime: this.burnTime,
      totalBurnTime: this.totalBurnTime,
      cookTime: this.cookTime,
      totalCookTime: this.totalCookTime
    };
  }
  
  /**
   * 序列化熔炉数据用于保存
   * @returns {Object} 序列化数据
   */
  serialize() {
    const data = super.serialize();
    data.type = this.type;
    data.isBurning = this.isBurning;
    data.burnTime = this.burnTime;
    data.totalBurnTime = this.totalBurnTime;
    data.cookTime = this.cookTime;
    data.totalCookTime = this.totalCookTime;
    data.facingDirection = this.facingDirection;
    return data;
  }
  
  /**
   * 从序列化数据恢复熔炉
   * @param {Object} data - 序列化数据
   * @returns {FurnaceBlock} 熔炉实例
   */
  static deserialize(data) {
    const furnace = new FurnaceBlock(data.x, data.y);
    
    // 恢复父类属性
    furnace.inventory = data.inventory.map(slot => ({ ...slot }));
    furnace.facingDirection = data.facingDirection || 'north';
    furnace.lastAccessTime = data.lastAccessTime || Date.now();
    
    // 恢复熔炉特有属性
    furnace.isBurning = data.isBurning || false;
    furnace.burnTime = data.burnTime || 0;
    furnace.totalBurnTime = data.totalBurnTime || 0;
    furnace.cookTime = data.cookTime || 0;
    furnace.totalCookTime = data.totalCookTime || 200;
    
    return furnace;
  }
}