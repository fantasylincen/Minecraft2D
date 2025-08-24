/**
 * 物品栏和背包系统
 * 实现物品的存储、管理和操作
 */

import { itemConfig, ItemType } from '../config/ItemConfig.js';

/**
 * 物品槽位类
 * 表示背包或物品栏中的一个槽位
 */
export class ItemSlot {
  constructor(itemId = null, count = 0, durability = null) {
    this.itemId = itemId;           // 物品ID
    this.count = count;             // 物品数量
    this.durability = durability;   // 耐久度（工具类物品）
    this.nbt = {};                  // 额外的NBT数据
  }
  
  /**
   * 检查槽位是否为空
   */
  isEmpty() {
    return this.itemId === null || this.count <= 0;
  }
  
  /**
   * 清空槽位
   */
  clear() {
    this.itemId = null;
    this.count = 0;
    this.durability = null;
    this.nbt = {};
  }
  
  /**
   * 获取物品定义
   */
  getItemDefinition() {
    return this.itemId ? itemConfig.getItem(this.itemId) : null;
  }
  
  /**
   * 获取最大堆叠数量
   */
  getMaxStack() {
    return this.itemId ? itemConfig.getMaxStack(this.itemId) : 1;
  }
  
  /**
   * 检查是否可以与另一个槽位堆叠
   */
  canStackWith(otherSlot) {
    if (this.isEmpty() || otherSlot.isEmpty()) {
      return true;
    }
    
    // 必须是相同的物品
    if (this.itemId !== otherSlot.itemId) {
      return false;
    }
    
    // 检查是否可堆叠
    const itemDef = this.getItemDefinition();
    if (!itemDef || itemDef.maxStack <= 1) {
      return false;
    }
    
    // 工具类物品需要考虑耐久度
    if (itemDef.type.startsWith('tool_') || itemDef.type.startsWith('weapon_')) {
      return this.durability === otherSlot.durability;
    }
    
    return true;
  }
  
  /**
   * 尝试向槽位添加物品
   * @param {string} itemId 物品ID
   * @param {number} count 数量
   * @param {number} durability 耐久度
   * @returns {number} 剩余未添加的数量
   */
  addItem(itemId, count, durability = null) {
    const itemDef = itemConfig.getItem(itemId);
    if (!itemDef) {
      return count; // 无效物品，返回全部数量
    }
    
    // 如果槽位为空，直接设置
    if (this.isEmpty()) {
      const maxStack = itemDef.maxStack;
      const addCount = Math.min(count, maxStack);
      
      this.itemId = itemId;
      this.count = addCount;
      this.durability = durability;
      
      // 如果是工具类物品且没有指定耐久度，使用最大耐久度
      if ((itemDef.type.startsWith('tool_') || itemDef.type.startsWith('weapon_')) && durability === null) {
        this.durability = itemDef.durability || itemDef.material?.durability;
      }
      
      return count - addCount;
    }
    
    // 检查是否可以堆叠
    if (this.itemId !== itemId) {
      return count; // 不同物品，无法堆叠
    }
    
    const maxStack = itemDef.maxStack;
    const canAdd = maxStack - this.count;
    const willAdd = Math.min(count, canAdd);
    
    this.count += willAdd;
    return count - willAdd;
  }
  
  /**
   * 从槽位移除物品
   * @param {number} count 要移除的数量
   * @returns {ItemSlot} 移除的物品槽位
   */
  removeItem(count = null) {
    if (this.isEmpty()) {
      return new ItemSlot();
    }
    
    const removeCount = count === null ? this.count : Math.min(count, this.count);
    const removedSlot = new ItemSlot(this.itemId, removeCount, this.durability);
    
    this.count -= removeCount;
    if (this.count <= 0) {
      this.clear();
    }
    
    return removedSlot;
  }
  
  /**
   * 克隆槽位
   */
  clone() {
    const cloned = new ItemSlot(this.itemId, this.count, this.durability);
    cloned.nbt = { ...this.nbt };
    return cloned;
  }
  
  /**
   * 转换为保存格式
   */
  toSaveData() {
    if (this.isEmpty()) {
      return null;
    }
    
    return {
      itemId: this.itemId,
      count: this.count,
      durability: this.durability,
      nbt: this.nbt
    };
  }
  
  /**
   * 从保存数据恢复
   */
  static fromSaveData(data) {
    if (!data) {
      return new ItemSlot();
    }
    
    const slot = new ItemSlot(data.itemId, data.count, data.durability);
    slot.nbt = data.nbt || {};
    return slot;
  }
}

/**
 * 物品栏系统类
 * 管理玩家的快捷栏和背包
 */
export class Inventory {
  constructor() {
    // 快捷栏（9个槽位）
    this.hotbar = [];
    for (let i = 0; i < 9; i++) {
      this.hotbar.push(new ItemSlot());
    }
    
    // 背包主要区域（3行9列，共27个槽位）
    this.mainInventory = [];
    for (let i = 0; i < 27; i++) {
      this.mainInventory.push(new ItemSlot());
    }
    
    // 当前选中的快捷栏槽位
    this.selectedHotbarSlot = 0;
    
    // 装备槽（预留，暂时不实现）
    this.armorSlots = [];
    this.offhandSlot = new ItemSlot();
  }
  
  /**
   * 获取所有槽位
   */
  getAllSlots() {
    return [...this.hotbar, ...this.mainInventory];
  }
  
  /**
   * 获取快捷栏槽位
   */
  getHotbarSlot(index) {
    if (index >= 0 && index < this.hotbar.length) {
      return this.hotbar[index];
    }
    return null;
  }
  
  /**
   * 获取背包槽位
   */
  getMainInventorySlot(index) {
    if (index >= 0 && index < this.mainInventory.length) {
      return this.mainInventory[index];
    }
    return null;
  }
  
  /**
   * 获取当前手持物品
   */
  getHeldItem() {
    return this.hotbar[this.selectedHotbarSlot];
  }
  
  /**
   * 设置选中的快捷栏槽位
   */
  setSelectedHotbarSlot(index) {
    if (index >= 0 && index < this.hotbar.length) {
      this.selectedHotbarSlot = index;
    }
  }
  
  /**
   * 向物品栏添加物品
   * @param {string} itemId 物品ID
   * @param {number} count 数量
   * @param {number} durability 耐久度
   * @returns {number} 剩余未添加的数量
   */
  addItem(itemId, count, durability = null) {
    let remaining = count;
    
    // 首先尝试堆叠到现有相同物品的槽位
    const allSlots = this.getAllSlots();
    for (const slot of allSlots) {
      if (!slot.isEmpty() && slot.canStackWith(new ItemSlot(itemId, 1, durability))) {
        remaining = slot.addItem(itemId, remaining, durability);
        if (remaining <= 0) {
          break;
        }
      }
    }
    
    // 然后尝试放入空槽位
    if (remaining > 0) {
      for (const slot of allSlots) {
        if (slot.isEmpty()) {
          remaining = slot.addItem(itemId, remaining, durability);
          if (remaining <= 0) {
            break;
          }
        }
      }
    }
    
    return remaining;
  }
  
  /**
   * 从物品栏移除物品
   * @param {string} itemId 物品ID
   * @param {number} count 数量
   * @returns {number} 实际移除的数量
   */
  removeItem(itemId, count) {
    let remaining = count;
    const allSlots = this.getAllSlots();
    
    for (const slot of allSlots) {
      if (!slot.isEmpty() && slot.itemId === itemId) {
        const removeCount = Math.min(remaining, slot.count);
        slot.removeItem(removeCount);
        remaining -= removeCount;
        
        if (remaining <= 0) {
          break;
        }
      }
    }
    
    return count - remaining;
  }
  
  /**
   * 检查物品栏中是否有指定物品
   * @param {string} itemId 物品ID
   * @param {number} count 需要的数量
   * @returns {boolean}
   */
  hasItem(itemId, count = 1) {
    let totalCount = 0;
    const allSlots = this.getAllSlots();
    
    for (const slot of allSlots) {
      if (!slot.isEmpty() && slot.itemId === itemId) {
        totalCount += slot.count;
        if (totalCount >= count) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * 获取指定物品的总数量
   * @param {string} itemId 物品ID
   * @returns {number}
   */
  getItemCount(itemId) {
    let totalCount = 0;
    const allSlots = this.getAllSlots();
    
    for (const slot of allSlots) {
      if (!slot.isEmpty() && slot.itemId === itemId) {
        totalCount += slot.count;
      }
    }
    
    return totalCount;
  }
  
  /**
   * 交换两个槽位的物品
   * @param {number} slot1Index 槽位1索引
   * @param {number} slot2Index 槽位2索引
   * @param {string} slot1Type 槽位1类型 ('hotbar' 或 'main')
   * @param {string} slot2Type 槽位2类型 ('hotbar' 或 'main')
   */
  swapSlots(slot1Index, slot2Index, slot1Type = 'hotbar', slot2Type = 'hotbar') {
    const slot1 = this.getSlot(slot1Index, slot1Type);
    const slot2 = this.getSlot(slot2Index, slot2Type);
    
    if (!slot1 || !slot2) {
      return false;
    }
    
    // 临时保存slot1的数据
    const tempSlot = slot1.clone();
    
    // 复制slot2到slot1
    slot1.itemId = slot2.itemId;
    slot1.count = slot2.count;
    slot1.durability = slot2.durability;
    slot1.nbt = { ...slot2.nbt };
    
    // 复制tempSlot到slot2
    slot2.itemId = tempSlot.itemId;
    slot2.count = tempSlot.count;
    slot2.durability = tempSlot.durability;
    slot2.nbt = { ...tempSlot.nbt };
    
    return true;
  }
  
  /**
   * 获取指定槽位
   * @param {number} index 槽位索引
   * @param {string} type 槽位类型
   * @returns {ItemSlot|null}
   */
  getSlot(index, type = 'hotbar') {
    if (type === 'hotbar') {
      return this.getHotbarSlot(index);
    } else if (type === 'main') {
      return this.getMainInventorySlot(index);
    }
    return null;
  }
  
  /**
   * 检查物品栏是否已满
   * @returns {boolean}
   */
  isFull() {
    const allSlots = this.getAllSlots();
    return allSlots.every(slot => !slot.isEmpty());
  }
  
  /**
   * 获取空槽位数量
   * @returns {number}
   */
  getEmptySlotCount() {
    const allSlots = this.getAllSlots();
    return allSlots.filter(slot => slot.isEmpty()).length;
  }
  
  /**
   * 清空物品栏
   */
  clear() {
    this.hotbar.forEach(slot => slot.clear());
    this.mainInventory.forEach(slot => slot.clear());
    this.selectedHotbarSlot = 0;
  }
  
  /**
   * 转换为保存格式
   */
  toSaveData() {
    return {
      hotbar: this.hotbar.map(slot => slot.toSaveData()),
      mainInventory: this.mainInventory.map(slot => slot.toSaveData()),
      selectedHotbarSlot: this.selectedHotbarSlot
    };
  }
  
  /**
   * 从保存数据恢复
   */
  fromSaveData(data) {
    if (!data) return;
    
    // 恢复快捷栏
    if (data.hotbar) {
      for (let i = 0; i < Math.min(data.hotbar.length, this.hotbar.length); i++) {
        this.hotbar[i] = ItemSlot.fromSaveData(data.hotbar[i]);
      }
    }
    
    // 恢复主背包
    if (data.mainInventory) {
      for (let i = 0; i < Math.min(data.mainInventory.length, this.mainInventory.length); i++) {
        this.mainInventory[i] = ItemSlot.fromSaveData(data.mainInventory[i]);
      }
    }
    
    // 恢复选中槽位
    if (typeof data.selectedHotbarSlot === 'number') {
      this.selectedHotbarSlot = Math.max(0, Math.min(data.selectedHotbarSlot, this.hotbar.length - 1));
    }
  }
  
  /**
   * 调试：打印物品栏状态
   */
  debugPrint() {
    console.log('=== 物品栏状态 ===');
    console.log('快捷栏:');
    this.hotbar.forEach((slot, index) => {
      if (!slot.isEmpty()) {
        const item = slot.getItemDefinition();
        console.log(`  [${index}] ${item?.name || slot.itemId} x${slot.count}`);
      }
    });
    
    console.log('背包:');
    this.mainInventory.forEach((slot, index) => {
      if (!slot.isEmpty()) {
        const item = slot.getItemDefinition();
        console.log(`  [${index}] ${item?.name || slot.itemId} x${slot.count}`);
      }
    });
    
    console.log(`当前选中: ${this.selectedHotbarSlot}`);
    console.log('==================');
  }
}