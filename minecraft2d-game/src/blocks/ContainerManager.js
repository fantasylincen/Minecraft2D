/**
 * 容器管理器
 * 负责管理游戏世界中的所有容器方块
 */

import { ChestBlock } from './ChestBlock.js';
import { CraftingTableBlock } from './CraftingTableBlock.js';

export class ContainerManager {
  constructor() {
    // 存储所有容器方块，以坐标为键
    this.containers = new Map();
    
    console.log('📦 ContainerManager 初始化完成');
  }
  
  /**
   * 添加容器方块
   * @param {ContainerBlock} container - 容器方块实例
   * @returns {boolean} 是否成功添加
   */
  addContainer(container) {
    if (!container || typeof container.x !== 'number' || typeof container.y !== 'number') {
      console.warn('⚠️  无效的容器方块');
      return false;
    }
    
    const key = this.getContainerKey(container.x, container.y);
    this.containers.set(key, container);
    console.log(`📦 添加容器: ${container.displayName} (${container.x}, ${container.y})`);
    return true;
  }
  
  /**
   * 移除容器方块
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {boolean} 是否成功移除
   */
  removeContainer(x, y) {
    const key = this.getContainerKey(x, y);
    const container = this.containers.get(key);
    
    if (container) {
      // 如果是大箱子的一部分，断开连接
      if (container.isDoubleChest && container.isDoubleChest()) {
        const adjacent = container.getAdjacentChest();
        if (adjacent) {
          adjacent.setAdjacentChest(null);
        }
      }
      
      this.containers.delete(key);
      console.log(`🗑️  移除容器: (${x}, ${y})`);
      return true;
    }
    
    return false;
  }
  
  /**
   * 获取容器方块
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {ContainerBlock|null} 容器方块实例
   */
  getContainer(x, y) {
    const key = this.getContainerKey(x, y);
    return this.containers.get(key) || null;
  }
  
  /**
   * 检查指定位置是否有容器
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {boolean} 是否有容器
   */
  hasContainer(x, y) {
    const key = this.getContainerKey(x, y);
    return this.containers.has(key);
  }
  
  /**
   * 获取容器键值
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {string} 键值
   */
  getContainerKey(x, y) {
    return `${x},${y}`;
  }
  
  /**
   * 创建箱子方块
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {ChestBlock} 箱子方块实例
   */
  createChest(x, y) {
    const chest = new ChestBlock(x, y);
    this.addContainer(chest);
    return chest;
  }
  
  /**
   * 创建制作台方块
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {CraftingTableBlock} 制作台方块实例
   */
  createCraftingTable(x, y) {
    const craftingTable = new CraftingTableBlock(x, y);
    this.addContainer(craftingTable);
    return craftingTable;
  }
  
  /**
   * 尝试连接相邻的箱子创建大箱子
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {boolean} 是否成功连接
   */
  tryConnectChests(x, y) {
    const chest = this.getContainer(x, y);
    
    if (!chest || !(chest instanceof ChestBlock)) {
      return false;
    }
    
    // 检查四个方向是否有相邻的箱子
    const directions = [
      { dx: -1, dy: 0, name: 'west' },  // 左
      { dx: 1, dy: 0, name: 'east' },   // 右
      { dx: 0, dy: -1, name: 'south' }, // 下
      { dx: 0, dy: 1, name: 'north' }   // 上
    ];
    
    for (const dir of directions) {
      const adjacentX = x + dir.dx;
      const adjacentY = y + dir.dy;
      const adjacentChest = this.getContainer(adjacentX, adjacentY);
      
      // 检查相邻方块是否也是箱子且未连接
      if (adjacentChest && 
          adjacentChest instanceof ChestBlock && 
          !adjacentChest.isDoubleChest() && 
          !chest.isDoubleChest()) {
        
        // 连接两个箱子
        chest.setAdjacentChest(adjacentChest);
        adjacentChest.setAdjacentChest(chest);
        
        console.log(`🔗 连接箱子: (${x}, ${y}) <-> (${adjacentX}, ${adjacentY})`);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 获取所有容器
   * @returns {Array} 容器数组
   */
  getAllContainers() {
    return Array.from(this.containers.values());
  }
  
  /**
   * 获取指定类型的容器
   * @param {string} type - 容器类型
   * @returns {Array} 容器数组
   */
  getContainersByType(type) {
    return Array.from(this.containers.values()).filter(container => container.type === type);
  }
  
  /**
   * 获取打开的容器
   * @returns {Array} 打开的容器数组
   */
  getOpenContainers() {
    return Array.from(this.containers.values()).filter(container => 
      container.isOpened && container.isOpened()
    );
  }
  
  /**
   * 关闭所有打开的容器
   */
  closeAllContainers() {
    const openContainers = this.getOpenContainers();
    openContainers.forEach(container => {
      if (container.close) {
        container.close();
      }
    });
    
    console.log(`🔒 关闭了 ${openContainers.length} 个容器`);
  }
  
  /**
   * 获取容器统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const allContainers = this.getAllContainers();
    const chestCount = this.getContainersByType('chest').length;
    const craftingTableCount = this.getContainersByType('crafting_table').length;
    const doubleChestCount = this.getContainersByType('chest').filter(
      chest => chest.isDoubleChest && chest.isDoubleChest()
    ).length;
    const openCount = this.getOpenContainers().length;
    
    return {
      totalContainers: allContainers.length,
      chestCount: chestCount,
      craftingTableCount: craftingTableCount,
      doubleChestCount: doubleChestCount,
      openCount: openCount,
      utilization: allContainers.length > 0 ? openCount / allContainers.length : 0
    };
  }
  
  /**
   * 序列化所有容器数据用于保存
   * @returns {Array} 序列化数据数组
   */
  serialize() {
    const serialized = [];
    
    for (const [key, container] of this.containers) {
      if (container.serialize) {
        const data = container.serialize();
        // 清除相邻箱子引用以避免循环引用
        if (data.type === 'chest' && data.adjacentChest) {
          delete data.adjacentChest;
        }
        serialized.push(data);
      }
    }
    
    return serialized;
  }
  
  /**
   * 从序列化数据恢复容器
   * @param {Array} data - 序列化数据数组
   */
  deserialize(data) {
    this.containers.clear();
    
    if (!Array.isArray(data)) {
      console.warn('⚠️  无效的容器数据格式');
      return;
    }
    
    // 首先创建所有容器
    for (const containerData of data) {
      let container = null;
      
      switch (containerData.type) {
        case 'chest':
          container = ChestBlock.deserialize(containerData);
          break;
        case 'crafting_table':
          container = CraftingTableBlock.deserialize(containerData);
          break;
        default:
          console.warn(`⚠️  未知的容器类型: ${containerData.type}`);
          continue;
      }
      
      if (container) {
        this.addContainer(container);
      }
    }
    
    // 然后重建相邻箱子连接
    for (const containerData of data) {
      if (containerData.type === 'chest') {
        const chest = this.getContainer(containerData.x, containerData.y);
        if (chest && containerData.adjacentChest) {
          const adjacentChest = this.getContainer(
            containerData.adjacentChest.x,
            containerData.adjacentChest.y
          );
          if (adjacentChest) {
            chest.setAdjacentChest(adjacentChest);
            adjacentChest.setAdjacentChest(chest);
          }
        }
      }
    }
    
    console.log(`📥 恢复了 ${this.containers.size} 个容器`);
  }
}