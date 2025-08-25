/**
 * 制作台方块测试
 */

import { CraftingTableBlock } from '../blocks/CraftingTableBlock.js';
import { ContainerManager } from '../blocks/ContainerManager.js';

export class CraftingTableTest {
  constructor() {
    this.containerManager = new ContainerManager();
  }

  runAllTests() {
    console.log('🧪 开始制作台方块测试...');
    
    try {
      // 测试1: 创建制作台方块
      console.log('\n--- 测试1: 创建制作台方块 ---');
      const craftingTable = new CraftingTableBlock(5, 5);
      console.log('✅ 制作台方块创建成功');
      console.log(`📍 位置: (${craftingTable.x}, ${craftingTable.y})`);
      console.log(`🏷️  名称: ${craftingTable.getDisplayName()}`);
      console.log(`🔢 槽位数量: ${craftingTable.slotCount}`);
      
      // 测试2: 添加到容器管理器
      console.log('\n--- 测试2: 添加到容器管理器 ---');
      this.containerManager.addContainer(craftingTable);
      console.log('✅ 制作台方块添加到容器管理器成功');
      
      // 测试3: 从容器管理器获取
      console.log('\n--- 测试3: 从容器管理器获取 ---');
      const retrievedTable = this.containerManager.getContainer(5, 5);
      if (retrievedTable && retrievedTable.isCraftingTable()) {
        console.log('✅ 从容器管理器获取制作台方块成功');
      } else {
        console.error('❌ 从容器管理器获取制作台方块失败');
        return false;
      }
      
      // 测试4: 向制作台添加物品
      console.log('\n--- 测试4: 向制作台添加物品 ---');
      const remaining = craftingTable.addItem('wood_item', 10);
      console.log(`✅ 添加物品完成，剩余: ${remaining}`);
      
      // 检查物品是否正确添加
      const slot0 = craftingTable.getSlot(0);
      if (slot0 && slot0.itemId === 'wood_item' && slot0.count === 10) {
        console.log('✅ 物品正确添加到制作台');
      } else {
        console.error('❌ 物品添加失败');
        return false;
      }
      
      // 测试5: 序列化和反序列化
      console.log('\n--- 测试5: 序列化和反序列化 ---');
      const serializedData = craftingTable.serialize();
      console.log('✅ 制作台方块序列化成功');
      
      const deserializedTable = CraftingTableBlock.deserialize(serializedData);
      if (deserializedTable && 
          deserializedTable.x === craftingTable.x && 
          deserializedTable.y === craftingTable.y &&
          deserializedTable.slotCount === craftingTable.slotCount) {
        console.log('✅ 制作台方块反序列化成功');
      } else {
        console.error('❌ 制作台方块反序列化失败');
        return false;
      }
      
      // 测试6: 容器管理器序列化
      console.log('\n--- 测试6: 容器管理器序列化 ---');
      const managerData = this.containerManager.serialize();
      console.log(`✅ 容器管理器序列化成功，共 ${managerData.length} 个容器`);
      
      // 创建新的容器管理器并反序列化
      const newManager = new ContainerManager();
      newManager.deserialize(managerData);
      const newCraftingTable = newManager.getContainer(5, 5);
      if (newCraftingTable && newCraftingTable.isCraftingTable()) {
        console.log('✅ 容器管理器反序列化成功');
      } else {
        console.error('❌ 容器管理器反序列化失败');
        return false;
      }
      
      console.log('\n🎉 所有制作台方块测试通过!');
      return true;
      
    } catch (error) {
      console.error('❌ 制作台方块测试失败:', error);
      return false;
    }
  }
}

// 如果直接运行此文件，则执行测试
if (typeof window === 'undefined' && typeof module !== 'undefined') {
  const test = new CraftingTableTest();
  test.runAllTests();
}