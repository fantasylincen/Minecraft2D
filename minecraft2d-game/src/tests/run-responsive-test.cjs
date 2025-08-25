/**
 * 运行响应式设计测试的脚本 (CommonJS版本)
 */

// 使用动态导入来加载ES模块
import('./ResponsiveDesignTest.cjs').then(({ ResponsiveDesignTest }) => {
  // 创建测试实例并运行所有测试
  const test = new ResponsiveDesignTest();
  const result = test.runAllTests();
  
  console.log('测试完成，结果:', result ? '通过' : '失败');
}).catch(error => {
  console.error('测试运行失败:', error);
});