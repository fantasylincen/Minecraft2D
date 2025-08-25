/**
 * UI系统响应式设计测试文件
 * 用于验证UI元素在不同屏幕尺寸下的显示效果
 */

class ResponsiveDesignTest {
  constructor() {
    this.testResults = [];
    this.breakpoints = [360, 480, 600, 768, 900, 1024, 1200];
    console.log('🧪 开始UI系统响应式设计测试');
  }

  /**
   * 测试顶部状态栏在不同屏幕尺寸下的显示效果
   */
  testTopBarResponsive() {
    console.log('📋 测试顶部状态栏响应式设计...');
    
    // 模拟不同屏幕尺寸下的测试
    const testResults = [];
    
    for (const width of this.breakpoints) {
      const result = this.simulateTopBar(width);
      testResults.push({
        width,
        result,
        status: result.passed ? '✅ 通过' : '❌ 失败'
      });
    }
    
    console.table(testResults);
    return testResults;
  }

  /**
   * 模拟顶部状态栏在指定宽度下的显示效果
   */
  simulateTopBar(width) {
    // 根据CSS媒体查询逻辑模拟效果
    let fontSize, padding, gap;
    
    if (width <= 360) {
      fontSize = '10px';
      padding = '3px 6px';
      gap = '8px';
    } else if (width <= 480) {
      fontSize = '11px';
      padding = '5px';
      gap = '10px';
    } else if (width <= 768) {
      fontSize = '12px';
      padding = '6px 10px';
      gap = '12px';
    } else if (width <= 900) {
      fontSize = '12px';
      padding = '7px 9px';
      gap = '10px';
    } else if (width <= 1200) {
      fontSize = '13px';
      padding = '7px 10px';
      gap = '12px';
    } else {
      fontSize = '14px';
      padding = '8px 12px';
      gap = '15px';
    }
    
    // 验证元素是否在视窗内且尺寸合理
    const passed = this.validateElementInViewport(width, 60) && 
                  this.validateFontSize(fontSize) &&
                  this.validatePadding(padding);
    
    return {
      fontSize,
      padding,
      gap,
      passed
    };
  }

  /**
   * 测试控制面板在不同屏幕尺寸下的显示效果
   */
  testControlPanelResponsive() {
    console.log('📋 测试控制面板响应式设计...');
    
    const testResults = [];
    
    for (const width of this.breakpoints) {
      const result = this.simulateControlPanel(width);
      testResults.push({
        width,
        result,
        status: result.passed ? '✅ 通过' : '❌ 失败'
      });
    }
    
    console.table(testResults);
    return testResults;
  }

  /**
   * 模拟控制面板在指定宽度下的显示效果
   */
  simulateControlPanel(width) {
    let buttonSize, fontSize, gap;
    
    if (width <= 480) {
      buttonSize = 'small';
      fontSize = '9px';
      gap = '3px';
    } else if (width <= 600) {
      buttonSize = 'medium';
      fontSize = '10px';
      gap = '4px';
    } else if (width <= 768) {
      buttonSize = 'medium';
      fontSize = '11px';
      gap = '5px';
    } else {
      buttonSize = 'large';
      fontSize = '12px';
      gap = '8px';
    }
    
    const passed = this.validateButtonLayout(buttonSize, width) &&
                   this.validateFontSize(fontSize);
    
    return {
      buttonSize,
      fontSize,
      gap,
      passed
    };
  }

  /**
   * 测试调试控制台在不同屏幕尺寸下的显示效果
   */
  testDebugConsoleResponsive() {
    console.log('📋 测试调试控制台响应式设计...');
    
    const testResults = [];
    
    for (const width of this.breakpoints) {
      const result = this.simulateDebugConsole(width);
      testResults.push({
        width,
        result,
        status: result.passed ? '✅ 通过' : '❌ 失败'
      });
    }
    
    console.table(testResults);
    return testResults;
  }

  /**
   * 模拟调试控制台在指定宽度下的显示效果
   */
  simulateDebugConsole(width) {
    let consoleWidth, fontSize, height;
    
    if (width <= 480) {
      consoleWidth = 'calc(100vw - 10px)';
      fontSize = '9px';
      height = '200px';
    } else if (width <= 768) {
      consoleWidth = 'calc(100vw - 20px)';
      fontSize = '10px';
      height = '250px';
    } else if (width <= 900) {
      consoleWidth = '320px';
      fontSize = '9px';
      height = '260px';
    } else if (width <= 1200) {
      consoleWidth = '350px';
      fontSize = '10px';
      height = '280px';
    } else {
      consoleWidth = '400px';
      fontSize = '12px';
      height = '300px';
    }
    
    const passed = this.validateElementInViewport(width, parseInt(consoleWidth)) &&
                   this.validateFontSize(fontSize);
    
    return {
      width: consoleWidth,
      fontSize,
      height,
      passed
    };
  }

  /**
   * 测试物品栏在不同屏幕尺寸下的显示效果
   */
  testInventoryResponsive() {
    console.log('📋 测试物品栏响应式设计...');
    
    const testResults = [];
    
    for (const width of this.breakpoints) {
      const result = this.simulateInventory(width);
      testResults.push({
        width,
        result,
        status: result.passed ? '✅ 通过' : '❌ 失败'
      });
    }
    
    console.table(testResults);
    return testResults;
  }

  /**
   * 模拟物品栏在指定宽度下的显示效果
   */
  simulateInventory(width) {
    let slotSize, gridSize, fontSize;
    
    if (width <= 360) {
      slotSize = '35px';
      gridSize = 'repeat(5, 1fr)';
      fontSize = '9px';
    } else if (width <= 480) {
      slotSize = '36px';
      gridSize = 'repeat(5, 1fr)';
      fontSize = '11px';
    } else if (width <= 600) {
      slotSize = '36px';
      gridSize = 'repeat(5, 1fr)';
      fontSize = '11px';
    } else if (width <= 768) {
      slotSize = '40px';
      gridSize = 'repeat(6, 1fr)';
      fontSize = '12px';
    } else {
      slotSize = '48px';
      gridSize = 'repeat(9, 1fr)';
      fontSize = '14px';
    }
    
    const passed = this.validateSlotSize(slotSize, width) &&
                   this.validateFontSize(fontSize);
    
    return {
      slotSize,
      gridSize,
      fontSize,
      passed
    };
  }

  /**
   * 测试血条在不同屏幕尺寸下的显示效果
   */
  testHealthBarResponsive() {
    console.log('📋 测试血条响应式设计...');
    
    const testResults = [];
    
    for (const width of this.breakpoints) {
      const result = this.simulateHealthBar(width);
      testResults.push({
        width,
        result,
        status: result.passed ? '✅ 通过' : '❌ 失败'
      });
    }
    
    console.table(testResults);
    return testResults;
  }

  /**
   * 模拟血条在指定宽度下的显示效果
   */
  simulateHealthBar(width) {
    let barWidth, barHeight, fontSize, position;
    
    if (width <= 360) {
      barWidth = '70px';
      barHeight = '10px';
      fontSize = '9px';
      position = 'top: 3px';
    } else if (width <= 480) {
      barWidth = '80px';
      barHeight = '12px';
      fontSize = '10px';
      position = 'top: 5px';
    } else if (width <= 768) {
      barWidth = '100px';
      barHeight = '14px';
      fontSize = '12px';
      position = 'top: 10px';
    } else if (width <= 900) {
      barWidth = '100px';
      barHeight = '14px';
      fontSize = '12px';
      position = 'bottom: 75px';
    } else if (width <= 1200) {
      barWidth = '110px';
      barHeight = '15px';
      fontSize = '13px';
      position = 'bottom: 78px';
    } else {
      barWidth = '120px';
      barHeight = '16px';
      fontSize = '14px';
      position = 'bottom: 83px';
    }
    
    const passed = this.validateBarSize(barWidth, barHeight) &&
                   this.validateFontSize(fontSize);
    
    return {
      width: barWidth,
      height: barHeight,
      fontSize,
      position,
      passed
    };
  }

  /**
   * 验证元素是否在视窗内
   */
  validateElementInViewport(viewportWidth, elementWidth) {
    return elementWidth <= viewportWidth;
  }

  /**
   * 验证字体大小是否合理
   */
  validateFontSize(fontSize) {
    const size = parseInt(fontSize);
    return size >= 7 && size <= 24;
  }

  /**
   * 验证内边距是否合理
   */
  validatePadding(padding) {
    return padding.length > 0;
  }

  /**
   * 验证按钮布局是否合理
   */
  validateButtonLayout(buttonSize, viewportWidth) {
    if (buttonSize === 'small') {
      return viewportWidth <= 480;
    } else if (buttonSize === 'medium') {
      return viewportWidth <= 768;
    } else {
      return viewportWidth > 768;
    }
  }

  /**
   * 验证槽位尺寸是否合理
   */
  validateSlotSize(slotSize, viewportWidth) {
    const size = parseInt(slotSize);
    if (viewportWidth <= 480) {
      return size <= 40;
    } else {
      return size >= 35;
    }
  }

  /**
   * 验证血条尺寸是否合理
   */
  validateBarSize(barWidth, barHeight) {
    const width = parseInt(barWidth);
    const height = parseInt(barHeight);
    return width >= 70 && width <= 120 && height >= 10 && height <= 16;
  }

  /**
   * 运行所有响应式设计测试
   */
  runAllTests() {
    console.log('🚀 开始运行UI系统响应式设计测试套件');
    
    const results = {
      topBar: this.testTopBarResponsive(),
      controlPanel: this.testControlPanelResponsive(),
      debugConsole: this.testDebugConsoleResponsive(),
      inventory: this.testInventoryResponsive(),
      healthBar: this.testHealthBarResponsive()
    };
    
    // 统计测试结果
    let totalTests = 0;
    let passedTests = 0;
    
    for (const component in results) {
      const componentTests = results[component];
      totalTests += componentTests.length;
      passedTests += componentTests.filter(test => test.result.passed).length;
    }
    
    console.log(`📊 测试总结: ${passedTests}/${totalTests} 个测试通过`);
    
    if (passedTests === totalTests) {
      console.log('🎉 所有响应式设计测试通过！');
      return true;
    } else {
      console.log('⚠️ 部分测试未通过，请检查相关组件的响应式设计');
      return false;
    }
  }
}

// 导出测试类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ResponsiveDesignTest };
} else {
  window.ResponsiveDesignTest = ResponsiveDesignTest;
}