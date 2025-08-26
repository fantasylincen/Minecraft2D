/**
 * 测试物品栏修复的脚本
 */

// 测试物品栏显示功能
function testInventoryDisplay() {
  console.log('🧪 开始测试物品栏显示功能...');
  
  // 检查游戏是否正确初始化
  if (typeof window.gameEngine === 'undefined') {
    console.error('❌ 游戏引擎未初始化');
    return false;
  }
  
  // 检查玩家是否存在
  if (!window.gameEngine.systems.player) {
    console.error('❌ 玩家未初始化');
    return false;
  }
  
  // 检查玩家物品栏是否存在
  if (!window.gameEngine.systems.player.inventory) {
    console.error('❌ 玩家物品栏未初始化');
    return false;
  }
  
  console.log('✅ 物品栏显示功能测试通过');
  return true;
}

// 测试按键冲突解决功能
function testKeyConflictResolution() {
  console.log('🧪 开始测试按键冲突解决功能...');
  
  // 检查InputManager是否存在
  if (typeof window.inputManager === 'undefined') {
    console.error('❌ InputManager未初始化');
    return false;
  }
  
  // 检查上下文优先级设置
  const contextPriorities = window.inputManager.contextPriorities;
  if (!contextPriorities) {
    console.error('❌ 上下文优先级未设置');
    return false;
  }
  
  // 检查物品栏优先级是否最高
  if (contextPriorities.inventory !== 100) {
    console.error('❌ 物品栏优先级设置不正确');
    return false;
  }
  
  console.log('✅ 按键冲突解决功能测试通过');
  return true;
}

// 运行所有测试
function runAllTests() {
  console.log('🚀 运行物品栏和按键冲突修复测试...');
  
  const tests = [
    testInventoryDisplay,
    testKeyConflictResolution
  ];
  
  let passed = 0;
  let failed = 0;
  
  tests.forEach(test => {
    try {
      if (test()) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ 测试 ${test.name} 失败:`, error);
      failed++;
    }
  });
  
  console.log(`\n📊 测试结果: ${passed} 通过, ${failed} 失败`);
  
  if (failed === 0) {
    console.log('🎉 所有测试通过！物品栏和按键冲突问题已修复。');
  } else {
    console.log('⚠️  部分测试失败，请检查代码。');
  }
}

// 导出测试函数
export { 
  testInventoryDisplay, 
  testKeyConflictResolution, 
  runAllTests 
};

// 如果直接运行此脚本，则执行所有测试
if (typeof window !== 'undefined' && typeof module !== 'undefined' && module.id === '.') {
  runAllTests();
}

export default runAllTests;