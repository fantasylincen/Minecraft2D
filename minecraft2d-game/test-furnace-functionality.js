/**
 * 熔炉功能测试脚本
 * 用于测试熔炉系统的完整功能
 */

// 测试熔炉方块和物品的创建
async function testFurnaceCreation() {
  console.log('🧪 开始测试熔炉创建功能...');
  
  try {
    // 测试导入
    const { FurnaceBlock } = await import('./src/blocks/FurnaceBlock.js');
    const { blockConfig } = await import('./src/config/BlockConfig.js');
    const { itemConfig } = await import('./src/config/ItemConfig.js');
    
    // 测试熔炉方块创建
    const furnace = new FurnaceBlock.default(0, 0);
    console.log('✅ 熔炉方块创建成功');
    
    // 测试熔炉方块属性
    if (furnace.type === 'furnace') {
      console.log('✅ 熔炉类型正确');
    } else {
      console.error('❌ 熔炉类型错误');
      return false;
    }
    
    // 测试方块配置中的熔炉定义
    const furnaceBlock = blockConfig.blockConfig.getBlock('furnace');
    if (furnaceBlock && furnaceBlock.id === 73) {
      console.log('✅ 方块配置中的熔炉定义正确');
    } else {
      console.error('❌ 方块配置中的熔炉定义错误');
      return false;
    }
    
    // 测试物品配置中的熔炉物品定义
    const furnaceItem = itemConfig.itemConfig.getItem('furnace_item');
    if (furnaceItem && furnaceItem.blockId === 73) {
      console.log('✅ 物品配置中的熔炉物品定义正确');
    } else {
      console.error('❌ 物品配置中的熔炉物品定义错误');
      return false;
    }
    
    console.log('✅ 熔炉创建功能测试通过');
    return true;
  } catch (error) {
    console.error('❌ 熔炉创建功能测试失败:', error);
    return false;
  }
}

// 测试熔炉燃烧功能
async function testFurnaceBurning() {
  console.log('🔥 开始测试熔炉燃烧功能...');
  
  try {
    const { FurnaceBlock } = await import('./src/blocks/FurnaceBlock.js');
    
    // 创建熔炉实例
    const furnace = new FurnaceBlock.default(0, 0);
    
    // 测试开始燃烧
    furnace.startBurning(1000);
    if (furnace.isBurning && furnace.burnTime === 1000) {
      console.log('✅ 熔炉开始燃烧功能正常');
    } else {
      console.error('❌ 熔炉开始燃烧功能异常');
      return false;
    }
    
    // 测试燃烧更新
    furnace.update(500);
    if (furnace.burnTime === 500) {
      console.log('✅ 熔炉燃烧更新功能正常');
    } else {
      console.error('❌ 熔炉燃烧更新功能异常');
      return false;
    }
    
    // 测试停止燃烧
    furnace.stopBurning();
    if (!furnace.isBurning && furnace.burnTime === 0) {
      console.log('✅ 熔炉停止燃烧功能正常');
    } else {
      console.error('❌ 熔炉停止燃烧功能异常');
      return false;
    }
    
    console.log('✅ 熔炉燃烧功能测试通过');
    return true;
  } catch (error) {
    console.error('❌ 熔炉燃烧功能测试失败:', error);
    return false;
  }
}

// 测试熔炉烹饪功能
async function testFurnaceCooking() {
  console.log('🍳 开始测试熔炉烹饪功能...');
  
  try {
    const { FurnaceBlock } = await import('./src/blocks/FurnaceBlock.js');
    
    // 创建熔炉实例
    const furnace = new FurnaceBlock.default(0, 0);
    
    // 设置输入物品（铁矿石）
    const inputSlot = furnace.getSlot(0);
    inputSlot.itemId = 'iron_ore_item';
    inputSlot.count = 1;
    
    // 设置燃料（煤炭）
    const fuelSlot = furnace.getSlot(1);
    fuelSlot.itemId = 'coal_item';
    fuelSlot.count = 1;
    
    // 设置输出槽位为空
    const outputSlot = furnace.getSlot(2);
    outputSlot.itemId = null;
    outputSlot.count = 0;
    
    // 开始燃烧
    furnace.startBurning(1000);
    
    // 模拟烹饪过程
    for (let i = 0; i < 200; i++) {
      furnace.update(1);
    }
    
    // 检查烹饪结果
    if (outputSlot.itemId === 'iron_item' && outputSlot.count === 1) {
      console.log('✅ 熔炉烹饪功能正常');
    } else {
      console.error('❌ 熔炉烹饪功能异常');
      return false;
    }
    
    // 检查输入物品是否消耗
    if (inputSlot.count === 0) {
      console.log('✅ 输入物品消耗正常');
    } else {
      console.error('❌ 输入物品消耗异常');
      return false;
    }
    
    // 检查燃料是否消耗
    if (fuelSlot.count === 0) {
      console.log('✅ 燃料消耗正常');
    } else {
      console.error('❌ 燃料消耗异常');
      return false;
    }
    
    console.log('✅ 熔炉烹饪功能测试通过');
    return true;
  } catch (error) {
    console.error('❌ 熔炉烹饪功能测试失败:', error);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始运行熔炉系统完整测试...\n');
  
  const tests = [
    { name: '熔炉创建功能', func: testFurnaceCreation },
    { name: '熔炉燃烧功能', func: testFurnaceBurning },
    { name: '熔炉烹饪功能', func: testFurnaceCooking }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.func();
      if (result) {
        passed++;
        console.log(`✅ ${test.name} 测试通过\n`);
      } else {
        failed++;
        console.log(`❌ ${test.name} 测试失败\n`);
      }
    } catch (error) {
      failed++;
      console.log(`❌ ${test.name} 测试失败: ${error.message}\n`);
    }
  }
  
  console.log('📋 测试结果统计:');
  console.log(`   总计: ${tests.length}`);
  console.log(`   通过: ${passed}`);
  console.log(`   失败: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 所有测试通过！熔炉系统功能正常！');
    return true;
  } else {
    console.log('\n⚠️  部分测试失败，请检查熔炉系统实现。');
    return false;
  }
}

// 如果直接运行此脚本，则执行测试
if (typeof window === 'undefined' && typeof module !== 'undefined' && require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testFurnaceCreation, testFurnaceBurning, testFurnaceCooking, runAllTests };