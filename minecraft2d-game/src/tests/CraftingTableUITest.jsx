/**
 * 制作台界面测试
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import CraftingTableUI from '../ui/CraftingTableUI.jsx';

// 模拟制作台类
class MockCraftingTable {
  constructor() {
    this.inventory = Array(9).fill(null).map(() => ({
      itemId: null,
      count: 0,
      durability: null
    }));
  }
  
  getSlot(index) {
    return this.inventory[index];
  }
  
  setSlot(index, itemId, count = 1, durability = null) {
    this.inventory[index] = { itemId, count, durability };
  }
}

// 模拟玩家背包类
class MockPlayerInventory {
  constructor() {
    this.slots = [
      { itemId: 'wood_item', count: 10, durability: null, slotIndex: 0 },
      { itemId: 'stone_item', count: 5, durability: null, slotIndex: 1 },
      { itemId: 'iron_item', count: 3, durability: null, slotIndex: 2 }
    ];
  }
  
  getSlot(index) {
    return this.slots[index] || null;
  }
  
  size() {
    return this.slots.length;
  }
}

// 创建测试容器
const container = document.createElement('div');
container.id = 'test-container';
document.body.appendChild(container);

// 创建测试数据
const mockCraftingTable = new MockCraftingTable();
const mockPlayerInventory = new MockPlayerInventory();

// 渲染制作台界面
const root = createRoot(container);
root.render(
  <CraftingTableUI
    craftingTable={mockCraftingTable}
    playerInventory={mockPlayerInventory}
    onClose={() => console.log('界面关闭')}
    onCraft={(grid) => console.log('执行合成:', grid)}
  />
);

console.log('✅ 制作台界面渲染测试完成');

// 导出用于其他测试
export { MockCraftingTable, MockPlayerInventory };