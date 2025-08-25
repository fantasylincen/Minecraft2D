/**
 * 制作台方块类
 * 继承自容器方块基类
 */

import { ContainerBlock } from './ContainerBlock.js';
import { blockConfig } from '../config/BlockConfig.js';

export class CraftingTableBlock extends ContainerBlock {
  /**
   * 构造函数
   * @param {number} x - 方块X坐标
   * @param {number} y - 方块Y坐标
   */
  constructor(x, y) {
    // 调用父类构造函数，创建9个槽位的容器（3行3列）
    super(x, y, blockConfig.getBlock('crafting_table').id, '制作台', 9);
    
    // 制作台特有属性
    this.type = 'crafting_table';
  }
  
  /**
   * 获取制作台名称
   * @returns {string} 制作台名称
   */
  getDisplayName() {
    return this.displayName;
  }
  
  /**
   * 检查是否为制作台方块
   * @returns {boolean} 是否为制作台
   */
  isCraftingTable() {
    return true;
  }
  
  /**
   * 序列化制作台数据用于保存
   * @returns {Object} 序列化数据
   */
  serialize() {
    const data = super.serialize();
    data.type = this.type;
    return data;
  }
  
  /**
   * 从序列化数据恢复制作台
   * @param {Object} data - 序列化数据
   * @returns {CraftingTableBlock} 制作台实例
   */
  static deserialize(data) {
    const craftingTable = new CraftingTableBlock(data.x, data.y);
    
    // 恢复父类属性
    craftingTable.inventory = data.inventory.map(slot => ({ ...slot }));
    craftingTable.facingDirection = data.facingDirection || 'north';
    craftingTable.lastAccessTime = data.lastAccessTime || Date.now();
    
    return craftingTable;
  }
}