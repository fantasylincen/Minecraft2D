/**
 * 容器方块基类
 * 所有容器类型方块的基类（如箱子、制作台等）
 */

import { blockConfig } from '../config/BlockConfig.js';

export class ContainerBlock {
  /**
   * 构造函数
   * @param {number} x - 方块X坐标
   * @param {number} y - 方块Y坐标
   * @param {number} blockId - 方块ID
   * @param {string} displayName - 显示名称
   * @param {number} slotCount - 槽位数量
   */
  constructor(x, y, blockId, displayName, slotCount) {
    this.x = x;
    this.y = y;
    this.blockId = blockId;
    this.displayName = displayName;
    this.slotCount = slotCount;
    
    // 初始化库存槽位
    this.inventory = new Array(slotCount).fill(null).map(() => ({
      itemId: null,
      count: 0,
      durability: null
    }));
    
    // 容器属性
    this.facingDirection = 'north'; // 面向方向
    this.lastAccessTime = Date.now(); // 最后访问时间
  }
  
  /**
   * 向容器添加物品
   * @param {string} itemId - 物品ID
   * @param {number} count - 数量
   * @param {number|null} durability - 耐久度
   * @returns {number} 剩余未添加的数量
   */
  addItem(itemId, count = 1, durability = null) {
    if (count <= 0) return 0;
    
    // 查找相同物品的槽位
    for (let i = 0; i < this.inventory.length; i++) {
      const slot = this.inventory[i];
      
      // 如果槽位为空，直接放入
      if (slot.itemId === null) {
        slot.itemId = itemId;
        slot.count = Math.min(count, 64); // 假设最大堆叠为64
        slot.durability = durability;
        return Math.max(0, count - 64);
      }
      
      // 如果槽位有相同物品且未满，合并堆叠
      if (slot.itemId === itemId && 
          (durability === null || slot.durability === durability) &&
          slot.count < 64) {
        const spaceLeft = 64 - slot.count;
        const toAdd = Math.min(count, spaceLeft);
        slot.count += toAdd;
        return Math.max(0, count - toAdd);
      }
    }
    
    // 没有找到合适的槽位
    return count;
  }
  
  /**
   * 从容器移除物品
   * @param {string} itemId - 物品ID
   * @param {number} count - 数量
   * @returns {number} 实际移除的数量
   */
  removeItem(itemId, count = 1) {
    if (count <= 0) return 0;
    
    let removed = 0;
    
    // 遍历所有槽位
    for (let i = 0; i < this.inventory.length; i++) {
      const slot = this.inventory[i];
      
      if (slot.itemId === itemId) {
        const toRemove = Math.min(slot.count, count - removed);
        slot.count -= toRemove;
        removed += toRemove;
        
        // 如果槽位为空，重置
        if (slot.count <= 0) {
          slot.itemId = null;
          slot.count = 0;
          slot.durability = null;
        }
        
        // 如果已移除足够数量，退出循环
        if (removed >= count) {
          break;
        }
      }
    }
    
    return removed;
  }
  
  /**
   * 检查容器中是否有指定物品
   * @param {string} itemId - 物品ID
   * @param {number} count - 数量
   * @returns {boolean} 是否有足够物品
   */
  hasItem(itemId, count = 1) {
    return this.getItemCount(itemId) >= count;
  }
  
  /**
   * 获取容器中指定物品的数量
   * @param {string} itemId - 物品ID
   * @returns {number} 物品数量
   */
  getItemCount(itemId) {
    return this.inventory.reduce((total, slot) => {
      return slot.itemId === itemId ? total + slot.count : total;
    }, 0);
  }
  
  /**
   * 获取所有物品
   * @returns {Array} 物品数组
   */
  getAllItems() {
    return this.inventory.filter(slot => slot.itemId !== null);
  }
  
  /**
   * 获取容器统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const usedSlots = this.inventory.filter(slot => slot.itemId !== null).length;
    const freeSlots = this.slotCount - usedSlots;
    const totalItems = this.inventory.reduce((total, slot) => total + slot.count, 0);
    
    return {
      slotCount: this.slotCount,
      usedSlots: usedSlots,
      freeSlots: freeSlots,
      totalItems: totalItems,
      utilization: usedSlots / this.slotCount
    };
  }
  
  /**
   * 设置面向方向
   * @param {string} direction - 方向（north, south, east, west）
   */
  setFacingDirection(direction) {
    this.facingDirection = direction;
  }
  
  /**
   * 获取面向方向
   * @returns {string} 方向
   */
  getFacingDirection() {
    return this.facingDirection;
  }
  
  /**
   * 更新最后访问时间
   */
  updateLastAccessTime() {
    this.lastAccessTime = Date.now();
  }
  
  /**
   * 获取最后访问时间
   * @returns {number} 时间戳
   */
  getLastAccessTime() {
    return this.lastAccessTime;
  }
  
  /**
   * 序列化容器数据用于保存
   * @returns {Object} 序列化数据
   */
  serialize() {
    return {
      x: this.x,
      y: this.y,
      blockId: this.blockId,
      displayName: this.displayName,
      slotCount: this.slotCount,
      inventory: this.inventory.map(slot => ({ ...slot })),
      facingDirection: this.facingDirection,
      lastAccessTime: this.lastAccessTime
    };
  }
  
  /**
   * 从序列化数据恢复容器
   * @param {Object} data - 序列化数据
   * @returns {ContainerBlock} 容器实例
   */
  static deserialize(data) {
    const container = new ContainerBlock(
      data.x, 
      data.y, 
      data.blockId, 
      data.displayName, 
      data.slotCount
    );
    
    container.inventory = data.inventory.map(slot => ({ ...slot }));
    container.facingDirection = data.facingDirection || 'north';
    container.lastAccessTime = data.lastAccessTime || Date.now();
    
    return container;
  }
}