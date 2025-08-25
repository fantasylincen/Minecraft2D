/**
 * 运行制作台系统完整测试
 */

// 使用动态导入运行测试
import('./CompleteCraftingSystemTest.cjs')
  .then((module) => {
    const { CompleteCraftingSystemTest } = module;
    const test = new CompleteCraftingSystemTest();
    
    console.log('🚀 启动制作台系统完整测试...');
    const success = test.runAllTests();
    
    if (success) {
      console.log('✅ 制作台系统完整测试完成');
      process.exit(0);
    } else {
      console.log('❌ 制作台系统完整测试失败');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ 测试运行失败:', error);
    process.exit(1);
  });