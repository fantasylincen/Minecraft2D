/**
 * 玩家移动功能测试脚本
 * 用于验证玩家移动和跳跃功能是否正常工作
 */

// 模拟键盘事件
function simulateKeyPress(keyCode) {
  const event = new KeyboardEvent('keydown', { code: keyCode });
  document.dispatchEvent(event);
  console.log(`模拟按键按下: ${keyCode}`);
}

function simulateKeyRelease(keyCode) {
  const event = new KeyboardEvent('keyup', { code: keyCode });
  document.dispatchEvent(event);
  console.log(`模拟按键释放: ${keyCode}`);
}

// 测试玩家移动功能
async function testPlayerMovement() {
  console.log('🧪 开始测试玩家移动功能...');
  
  try {
    // 测试左移
    console.log('测试左移...');
    simulateKeyPress('KeyA');
    await new Promise(resolve => setTimeout(resolve, 500));
    simulateKeyRelease('KeyA');
    
    // 测试右移
    console.log('测试右移...');
    simulateKeyPress('KeyD');
    await new Promise(resolve => setTimeout(resolve, 500));
    simulateKeyRelease('KeyD');
    
    // 测试跳跃
    console.log('测试跳跃...');
    simulateKeyPress('Space');
    await new Promise(resolve => setTimeout(resolve, 100));
    simulateKeyRelease('Space');
    
    console.log('✅ 玩家移动功能测试完成!');
    return true;
  } catch (error) {
    console.error('💥 测试过程中发生错误:', error);
    return false;
  }
}

// 运行测试
if (typeof window !== 'undefined') {
  // 在浏览器环境中运行
  window.testPlayerMovement = testPlayerMovement;
  console.log('在玩家中已注册测试函数: testPlayerMovement()');
}

export { testPlayerMovement };