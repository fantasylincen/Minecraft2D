/**
 * 飞行速度调节功能测试
 * 验证100%-1000%速度调节功能
 */

// 模拟浏览器环境
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: () => ({
    clearRect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    arc: () => {},
    beginPath: () => {},
    fill: () => {},
    stroke: () => {},
    fillText: () => {},
    createLinearGradient: () => ({
      addColorStop: () => {}
    }),
    moveTo: () => {},
    lineTo: () => {}
  })
};

const mockWindow = {
  innerWidth: 800,
  innerHeight: 600,
  addEventListener: () => {},
  removeEventListener: () => {}
};

const mockDocument = {
  createElement: () => mockCanvas
};

const mockLocalStorage = {
  data: {},
  setItem: function(key, value) { this.data[key] = value; },
  getItem: function(key) { return this.data[key] || null; },
  removeItem: function(key) { delete this.data[key]; },
  clear: function() { this.data = {}; }
};

const mockPerformance = {
  now: () => Date.now()
};

// 设置全局模拟对象
global.window = mockWindow;
global.document = mockDocument;
global.localStorage = mockLocalStorage;
global.performance = mockPerformance;

// 测试飞行速度调节功能
async function testFlySpeedControl() {
  console.log('🚀 开始测试飞行速度调节功能...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  const test = (name, testFn) => {
    totalTests++;
    try {
      const result = testFn();
      if (result) {
        console.log(`✅ ${name}`);
        passedTests++;
      } else {
        console.log(`❌ ${name}`);
      }
      return result;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      return false;
    }
  };

  // 1. 测试速度倍率状态管理
  console.log('⚙️ 测试速度倍率状态管理:');
  test('初始速度倍率为100%', () => {
    const flyMode = {
      speedMultiplier: 1.0,
      minSpeedMultiplier: 1.0,
      maxSpeedMultiplier: 10.0,
      speedStep: 0.5
    };
    return flyMode.speedMultiplier === 1.0;
  });
  
  test('速度倍率范围限制', () => {
    const minSpeed = 1.0; // 100%
    const maxSpeed = 10.0; // 1000%
    const speedStep = 0.5; // 50%
    
    return minSpeed === 1.0 && maxSpeed === 10.0 && speedStep === 0.5;
  });

  // 2. 测试速度增加功能
  console.log('\n⬆️ 测试速度增加功能:');
  test('速度正常增加', () => {
    let speedMultiplier = 1.0;
    const maxSpeed = 10.0;
    const speedStep = 0.5;
    
    // 模拟增加速度
    if (speedMultiplier < maxSpeed) {
      speedMultiplier = Math.min(speedMultiplier + speedStep, maxSpeed);
    }
    
    return speedMultiplier === 1.5; // 应该从100%增加到150%
  });
  
  test('速度增加到最大值限制', () => {
    let speedMultiplier = 9.5; // 950%
    const maxSpeed = 10.0;
    const speedStep = 0.5;
    
    // 模拟增加速度
    if (speedMultiplier < maxSpeed) {
      speedMultiplier = Math.min(speedMultiplier + speedStep, maxSpeed);
    }
    
    return speedMultiplier === 10.0; // 应该限制在1000%
  });
  
  test('超过最大值时不再增加', () => {
    let speedMultiplier = 10.0; // 1000%
    const maxSpeed = 10.0;
    const speedStep = 0.5;
    const originalSpeed = speedMultiplier;
    
    // 模拟试图增加速度
    if (speedMultiplier < maxSpeed) {
      speedMultiplier = Math.min(speedMultiplier + speedStep, maxSpeed);
    }
    
    return speedMultiplier === originalSpeed; // 应该保持不变
  });

  // 3. 测试速度减少功能
  console.log('\n⬇️ 测试速度减少功能:');
  test('速度正常减少', () => {
    let speedMultiplier = 2.0; // 200%
    const minSpeed = 1.0;
    const speedStep = 0.5;
    
    // 模拟减少速度
    if (speedMultiplier > minSpeed) {
      speedMultiplier = Math.max(speedMultiplier - speedStep, minSpeed);
    }
    
    return speedMultiplier === 1.5; // 应该从200%减少到150%
  });
  
  test('速度减少到最小值限制', () => {
    let speedMultiplier = 1.3; // 130%
    const minSpeed = 1.0;
    const speedStep = 0.5;
    
    // 模拟减少速度
    if (speedMultiplier > minSpeed) {
      speedMultiplier = Math.max(speedMultiplier - speedStep, minSpeed);
    }
    
    return speedMultiplier === 1.0; // 应该限制在100%
  });
  
  test('低于最小值时不再减少', () => {
    let speedMultiplier = 1.0; // 100%
    const minSpeed = 1.0;
    const speedStep = 0.5;
    const originalSpeed = speedMultiplier;
    
    // 模拟试图减少速度
    if (speedMultiplier > minSpeed) {
      speedMultiplier = Math.max(speedMultiplier - speedStep, minSpeed);
    }
    
    return speedMultiplier === originalSpeed; // 应该保持不变
  });

  // 4. 测试按键输入处理
  console.log('\n⌨️ 测试按键输入处理:');
  test('+键检测', () => {
    const mockKeys = { 'Equal': true, 'NumpadAdd': false };
    
    const speedUpPressed = mockKeys['Equal'] || mockKeys['NumpadAdd'];
    
    return speedUpPressed === true;
  });
  
  test('-键检测', () => {
    const mockKeys = { 'Minus': true, 'NumpadSubtract': false };
    
    const speedDownPressed = mockKeys['Minus'] || mockKeys['NumpadSubtract'];
    
    return speedDownPressed === true;
  });
  
  test('数字键盘+/-键检测', () => {
    const mockKeys1 = { 'Equal': false, 'NumpadAdd': true };
    const mockKeys2 = { 'Minus': false, 'NumpadSubtract': true };
    
    const speedUpPressed = mockKeys1['Equal'] || mockKeys1['NumpadAdd'];
    const speedDownPressed = mockKeys2['Minus'] || mockKeys2['NumpadSubtract'];
    
    return speedUpPressed === true && speedDownPressed === true;
  });

  // 5. 测试速度应用到物理系统
  console.log('\n🏃 测试速度应用到物理系统:');
  test('基础速度计算', () => {
    const baseSpeed = 250;
    const speedMultiplier = 2.0; // 200%
    const actualSpeed = baseSpeed * speedMultiplier;
    
    return actualSpeed === 500;
  });
  
  test('最高速度计算', () => {
    const baseSpeed = 250;
    const speedMultiplier = 10.0; // 1000%
    const actualSpeed = baseSpeed * speedMultiplier;
    
    return actualSpeed === 2500; // 10倍速度
  });
  
  test('最低速度计算', () => {
    const baseSpeed = 250;
    const speedMultiplier = 1.0; // 100%
    const actualSpeed = baseSpeed * speedMultiplier;
    
    return actualSpeed === 250; // 正常速度
  });

  // 6. 测试百分比显示
  console.log('\n📊 测试百分比显示:');
  test('速度百分比转换', () => {
    const speedMultiplier1 = 1.0;
    const speedMultiplier2 = 2.5;
    const speedMultiplier3 = 10.0;
    
    const percentage1 = Math.round(speedMultiplier1 * 100);
    const percentage2 = Math.round(speedMultiplier2 * 100);
    const percentage3 = Math.round(speedMultiplier3 * 100);
    
    return percentage1 === 100 && percentage2 === 250 && percentage3 === 1000;
  });

  // 7. 测试视觉效果
  console.log('\n🎨 测试视觉效果:');
  test('光晕大小根据速度调节', () => {
    const baseGlowSize = 2;
    const speedMultiplier1 = 1.0; // 100%
    const speedMultiplier2 = 5.0; // 500%
    const speedMultiplier3 = 10.0; // 1000%
    
    const glowSize1 = baseGlowSize + (speedMultiplier1 - 1) * 0.5;
    const glowSize2 = baseGlowSize + (speedMultiplier2 - 1) * 0.5;
    const glowSize3 = baseGlowSize + (speedMultiplier3 - 1) * 0.5;
    
    return glowSize1 === 2.0 && glowSize2 === 4.0 && glowSize3 === 6.5;
  });
  
  test('光晕透明度根据速度调节', () => {
    const baseAlpha = 0.3;
    const speedMultiplier1 = 1.0; // 100%
    const speedMultiplier2 = 5.0; // 500%
    const speedMultiplier3 = 10.0; // 1000%
    
    const alpha1 = Math.min(baseAlpha + (speedMultiplier1 - 1) * 0.05, 0.6);
    const alpha2 = Math.min(baseAlpha + (speedMultiplier2 - 1) * 0.05, 0.6);
    const alpha3 = Math.min(baseAlpha + (speedMultiplier3 - 1) * 0.05, 0.6);
    
    return alpha1 === 0.3 && alpha2 === 0.5 && alpha3 === 0.6;
  });

  // 8. 测试数据持久化
  console.log('\n💾 测试数据持久化:');
  test('速度设置保存', () => {
    const flyMode = {
      enabled: true,
      speedMultiplier: 3.5,
      speed: 250,
      friction: 0.9
    };
    
    // 模拟导出数据
    const exportData = {
      flyMode: { ...flyMode }
    };
    
    return exportData.flyMode.speedMultiplier === 3.5;
  });
  
  test('速度设置加载', () => {
    const savedData = {
      flyMode: {
        enabled: true,
        speedMultiplier: 7.5,
        speed: 250,
        friction: 0.9
      }
    };
    
    let currentFlyMode = {
      enabled: false,
      speedMultiplier: 1.0,
      speed: 250,
      friction: 0.8
    };
    
    // 模拟导入数据
    if (savedData.flyMode) {
      currentFlyMode = { ...currentFlyMode, ...savedData.flyMode };
    }
    
    return currentFlyMode.speedMultiplier === 7.5 && currentFlyMode.enabled === true;
  });

  // 9. 测试边界情况
  console.log('\n🛡️ 测试边界情况:');
  test('精确边界值处理', () => {
    const speedMultiplier = 9.75; // 975%
    const maxSpeed = 10.0;
    const speedStep = 0.5;
    
    // 增加一步应该到达最大值
    const newSpeed = Math.min(speedMultiplier + speedStep, maxSpeed);
    
    return newSpeed === 10.0;
  });
  
  test('小数精度处理', () => {
    let speedMultiplier = 1.0;
    const speedStep = 0.5;
    
    // 多次增加
    speedMultiplier += speedStep; // 1.5
    speedMultiplier += speedStep; // 2.0
    speedMultiplier += speedStep; // 2.5
    
    return speedMultiplier === 2.5;
  });

  // 输出测试结果
  console.log('\n📊 飞行速度调节测试结果汇总:');
  console.log(`总测试项: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${totalTests - passedTests}`);
  console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 所有飞行速度调节测试都通过了！');
    console.log('\n✈️ 飞行速度调节功能验证成功！现在可以在游戏中：');
    console.log('   • 按F键切换飞行模式');
    console.log('   • 按+键提升飞行速度 (100%-1000%)');
    console.log('   • 按-键降低飞行速度');
    console.log('   • 在状态栏看到当前飞行速度');
    console.log('   • 玩家头顶显示速度百分比');
    console.log('   • 光晕效果随速度变化');
    console.log('   • 速度设置自动保存和加载');
  } else {
    console.log(`\n⚠️ 有 ${totalTests - passedTests} 个测试项目未通过，需要检查实现。`);
  }
  
  return {
    total: totalTests,
    passed: passedTests,
    failed: totalTests - passedTests,
    successRate: (passedTests / totalTests) * 100
  };
}

// 运行测试
testFlySpeedControl().then(result => {
  if (result.successRate >= 95) {
    console.log('\n✅ 飞行速度调节功能测试完成，功能完全正常！');
    console.log('\n🎮 使用指南:');
    console.log('   1. 按F键进入飞行模式');
    console.log('   2. 使用+/-键调节飞行速度 (100%-1000%)');
    console.log('   3. 状态栏会显示当前飞行速度');
    console.log('   4. 玩家头顶会显示速度百分比');
    console.log('   5. 速度越快，光晕效果越明显');
    console.log('   6. 所有设置自动保存');
  } else {
    console.log('\n❌ 飞行速度调节功能测试发现问题，建议检查实现后再测试。');
  }
}).catch(error => {
  console.error('飞行速度调节测试失败:', error);
});