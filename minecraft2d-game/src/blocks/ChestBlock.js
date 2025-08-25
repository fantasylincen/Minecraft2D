/**
 * 箱子方块类
 * 继承自容器方块基类
 */

import { ContainerBlock } from './ContainerBlock.js';
import { blockConfig } from '../config/BlockConfig.js';

export class ChestBlock extends ContainerBlock {
  /**
   * 构造函数
   * @param {number} x - 方块X坐标
   * @param {number} y - 方块Y坐标
   */
  constructor(x, y) {
    // 调用父类构造函数，创建27个槽位的容器（3行9列）
    super(x, y, blockConfig.getBlock('chest').id, '箱子', 27);
    
    // 箱子特有属性
    this.type = 'chest';
    this.adjacentChest = null; // 相邻的箱子（用于创建大箱子）
  }
  
  /**
   * 设置相邻箱子
   * @param {ChestBlock|null} chest - 相邻的箱子
   */
  setAdjacentChest(chest) {
    this.adjacentChest = chest;
  }
  
  /**
   * 获取相邻箱子
   * @returns {ChestBlock|null} 相邻的箱子
   */
  getAdjacentChest() {
    return this.adjacentChest;
  }
  
  /**
   * 检查是否为大箱子的一部分
   * @returns {boolean} 是否为大箱子
   */
  isDoubleChest() {
    return this.adjacentChest !== null;
  }
  
  /**
   * 获取箱子名称（考虑大箱子情况）
   * @returns {string} 箱子名称
   */
  getDisplayName() {
    if (this.isDoubleChest()) {
      return '大箱子';
    }
    return this.displayName;
  }
  
  /**
   * 向箱子添加物品（重写父类方法以支持大箱子）
   * @param {string} itemId - 物品ID
   * @param {number} count - 数量
   * @param {number|null} durability - 耐久度
   * @returns {number} 剩余未添加的数量
   */
  addItem(itemId, count = 1, durability = null) {
    // 首先尝试添加到当前箱子
    let remaining = super.addItem(itemId, count, durability);
    
    // 如果当前箱子满了且有相邻箱子，尝试添加到相邻箱子
    if (remaining > 0 && this.adjacentChest) {
      remaining = this.adjacentChest.addItem(itemId, remaining, durability);
    }
    
    return remaining;
  }
  
  /**
   * 从箱子移除物品（重写父类方法以支持大箱子）
   * @param {string} itemId - 物品ID
   * @param {number} count - 数量
   * @returns {number} 实际移除的数量
   */
  removeItem(itemId, count = 1) {
    // 首先从当前箱子移除
    let removed = super.removeItem(itemId, count);
    let remaining = count - removed;
    
    // 如果还需要移除且有相邻箱子，从相邻箱子移除
    if (remaining > 0 && this.adjacentChest) {
      const fromAdjacent = this.adjacentChest.removeItem(itemId, remaining);
      removed += fromAdjacent;
    }
    
    return removed;
  }
  
  /**
   * 检查箱子中是否有指定物品（重写父类方法以支持大箱子）
   * @param {string} itemId - 物品ID
   * @param {number} count - 数量
   * @returns {boolean} 是否有足够物品
   */
  hasItem(itemId, count = 1) {
    const currentCount = super.getItemCount(itemId);
    
    if (currentCount >= count) {
      return true;
    }
    
    // 避免无限递归：只在相邻箱子不指向当前箱子时才计算
    if (this.adjacentChest && this.adjacentChest.getAdjacentChest() !== this) {
      const adjacentCount = this.adjacentChest.getItemCount(itemId);
      return (currentCount + adjacentCount) >= count;
    }
    
    return false;
  }
  
  /**
   * 获取箱子中指定物品的数量（重写父类方法以支持大箱子）
   * @param {string} itemId - 物品ID
   * @returns {number} 物品数量
   */
  getItemCount(itemId) {
    const currentCount = super.getItemCount(itemId);
    
    // 避免无限递归：只在相邻箱子不指向当前箱子时才计算
    if (this.adjacentChest && this.adjacentChest.getAdjacentChest() !== this) {
      const adjacentCount = this.adjacentChest.getItemCount(itemId);
      return currentCount + adjacentCount;
    }
    
    return currentCount;
  }
  
  /**
   * 获取所有物品（重写父类方法以支持大箱子）
   * @returns {Array} 物品数组
   */
  getAllItems() {
    let items = super.getAllItems();
    
    // 避免无限递归：只在相邻箱子不指向当前箱子时才计算
    if (this.adjacentChest && this.adjacentChest.getAdjacentChest() !== this) {
      const adjacentItems = this.adjacentChest.getAllItems();
      items = items.concat(adjacentItems);
    }
    
    return items;
  }
  
  /**
   * 获取箱子统计信息（重写父类方法以支持大箱子）
   * @returns {Object} 统计信息
   */
  getStats() {
    const stats = super.getStats();
    
    if (this.adjacentChest) {
      const adjacentStats = this.adjacentChest.getStats();
      
      // 合并统计信息
      stats.slotCount += adjacentStats.slotCount;
      stats.usedSlots += adjacentStats.usedSlots;
      stats.freeSlots += adjacentStats.freeSlots;
      stats.totalItems += adjacentStats.totalItems;
      stats.utilization = stats.usedSlots / stats.slotCount;
    }
    
    return stats;
  }
  
  /**
   * 序列化箱子数据用于保存（重写父类方法）
   * @returns {Object} 序列化数据
   */
  serialize() {
    const data = super.serialize();
    data.type = this.type;
    // 注意：相邻箱子的引用不会被序列化，需要在加载时重新建立连接
    return data;
  }
  
  /**
   * 从序列化数据恢复箱子（重写父类方法）
   * @param {Object} data - 序列化数据
   * @returns {ChestBlock} 箱子实例
   */
  static deserialize(data) {
    const chest = new ChestBlock(data.x, data.y);
    
    // 恢复父类属性
    chest.inventory = data.inventory.map(slot => ({ ...slot }));
    chest.facingDirection = data.facingDirection || 'north';
    chest.lastAccessTime = data.lastAccessTime || Date.now();
    
    return chest;
  }
}