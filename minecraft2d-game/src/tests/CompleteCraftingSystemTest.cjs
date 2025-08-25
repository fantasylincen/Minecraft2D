/**
 * 制作台系统完整测试
 */

// 使用动态导入导入依赖
let CraftingTableBlock, ContainerManager, blockConfig, itemConfig;

// 动态导入模块
Promise.all([
  import('../blocks/CraftingTableBlock.js'),
  import('../blocks/ContainerManager.js'),
  import('../config/BlockConfig.js'),
  import('../config/ItemConfig.js')
])
.then(([craftingModule, containerModule, blockModule, itemModule]) => {
  CraftingTableBlock = craftingModule.CraftingTableBlock;
  ContainerManager = containerModule.ContainerManager;
  blockConfig = blockModule.blockConfig;
  itemConfig = itemModule.itemConfig;
})
.then(() => {
  // 导出测试类
  exports.CompleteCraftingSystemTest = class CompleteCraftingSystemTest {
    constructor() {
      this.containerManager = new ContainerManager();
    }

    runAllTests() {
      console.log('🧪 开始制作台系统完整测试...');
      
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
        if (retrievedTable && retrievedTable.isCraftingTable && retrievedTable.isCraftingTable()) {
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
        if (newCraftingTable && newCraftingTable.isCraftingTable && newCraftingTable.isCraftingTable()) {
          console.log('✅ 容器管理器反序列化成功');
        } else {
          console.error('❌ 容器管理器反序列化失败');
          return false;
        }
        
        // 测试7: 检查方块配置
        console.log('\n--- 测试7: 检查方块配置 ---');
        const craftingTableBlock = blockConfig.getBlock('crafting_table');
        if (craftingTableBlock && craftingTableBlock.id === 18) {
          console.log('✅ 制作台方块配置正确');
          console.log(`🆔 ID: ${craftingTableBlock.id}`);
          console.log(`🏷️  名称: ${craftingTableBlock.name}`);
          console.log(`🔤 显示名称: ${craftingTableBlock.displayName}`);
          console.log(`🎨 颜色: ${craftingTableBlock.color}`);
        } else {
          console.error('❌ 制作台方块配置错误');
          return false;
        }
        
        // 测试8: 检查物品配置
        console.log('\n--- 测试8: 检查物品配置 ---');
        const craftingTableItem = itemConfig.getItem('crafting_table_item');
        if (craftingTableItem && craftingTableItem.blockId === craftingTableBlock.id) {
          console.log('✅ 制作台物品配置正确');
          console.log(`🆔 ID: ${craftingTableItem.id}`);
          console.log(`🏷️  名称: ${craftingTableItem.name}`);
          console.log(`🔤 显示名称: ${craftingTableItem.displayName}`);
          console.log(`📦 类型: ${craftingTableItem.type}`);
          console.log(`🧱 方块ID: ${craftingTableItem.blockId}`);
        } else {
          console.error('❌ 制作台物品配置错误');
          return false;
        }
        
        console.log('\n🎉 所有制作台系统测试通过!');
        return true;
        
      } catch (error) {
        console.error('❌ 制作台系统测试失败:', error);
        return false;
      }
    }
  };

  // 如果直接运行此文件，则执行测试
  if (typeof window === 'undefined' && typeof module !== 'undefined') {
    const test = new exports.CompleteCraftingSystemTest();
    const success = test.runAllTests();
    if (success) {
      console.log('✅ 制作台系统测试完成');
      process.exit(0);
    } else {
      console.log('❌ 制作台系统测试失败');
      process.exit(1);
    }
  }
})
.catch((error) => {
  console.error('❌ 模块导入失败:', error);
  process.exit(1);
});