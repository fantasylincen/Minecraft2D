/**
 * 运行响应式设计测试的脚本
 */

const { ResponsiveDesignTest } = require('./ResponsiveDesignTest.js');

// 创建测试实例并运行所有测试
const test = new ResponsiveDesignTest();
const result = test.runAllTests();

console.log('测试完成，结果:', result ? '通过' : '失败');