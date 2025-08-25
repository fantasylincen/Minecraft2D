/**
 * 运行制作台测试
 */

// 动态导入测试模块并运行
import('./CraftingTableTest.js')
  .then((module) => {
    const { CraftingTableTest } = module;
    const test = new CraftingTableTest();
    
    console.log('🚀 启动制作台方块测试...');
    const success = test.runAllTests();
    
    if (success) {
      console.log('✅ 制作台方块测试完成');
      process.exit(0);
    } else {
      console.log('❌ 制作台方块测试失败');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ 测试运行失败:', error);
    process.exit(1);
  });