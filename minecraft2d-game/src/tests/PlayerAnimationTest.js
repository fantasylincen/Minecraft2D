/**
 * 玩家动画功能测试
 * 测试玩家动画功能的集成
 */

import { Player } from '../player/Player.js';
import { PlayerAnimationController } from '../animation/PlayerAnimationController.js';

export class PlayerAnimationTest {
  constructor() {
    console.log('🎮 玩家动画功能测试初始化完成');
  }
  
  /**
   * 运行所有测试
   */
  runAllTests() {
    console.log('🧪 开始运行玩家动画功能测试...');
    
    try {
      this.testPlayerAnimationIntegration();
      
      console.log('✅ 所有玩家动画功能测试通过!');
      return true;
    } catch (error) {
      console.error('❌ 玩家动画功能测试失败:', error);
      return false;
    }
  }
  
  /**
   * 测试玩家动画集成功能
   */
  testPlayerAnimationIntegration() {
    console.log('🧪 测试玩家动画集成...');
    
    // 创建一个模拟的世界配置
    const worldConfig = {
      BLOCK_SIZE: 16,
      WORLD_HEIGHT: 512
    };
    
    // 创建玩家实例
    const player = new Player(worldConfig);
    console.log('✅ 创建玩家实例成功');
    
    // 创建动画控制器
    const animationController = new PlayerAnimationController(player);
    console.log('✅ 创建动画控制器成功');
    
    // 设置动画控制器
    player.setAnimationController(animationController);
    console.log('✅ 设置动画控制器成功');
    
    // 更新玩家状态为行走
    player.physics.velocity.x = 2;
    
    // 更新动画控制器
    animationController.update(0.1);
    
    // 检查当前状态
    const currentState = animationController.currentState;
    if (currentState !== 'walk') {
      throw new Error(`当前状态不正确: 期望walk，实际${currentState}`);
    }
    console.log('✅ 行走状态正确');
    
    // 获取动画值
    const legAngle = animationController.getAnimationValue('legAngle');
    console.log(`腿部角度: ${legAngle}`);
    
    // 模拟挖掘动画
    player.mining.isMining = true;
    animationController.update(0.1);
    
    const mineState = animationController.currentState;
    if (mineState !== 'mine') {
      throw new Error(`挖掘状态不正确: 期望mine，实际${mineState}`);
    }
    console.log('✅ 挖掘状态正确');
    
    console.log('✅ 玩家动画集成功能测试通过');
  }
}

// 运行测试
if (typeof window === 'undefined') {
  // Node.js环境
  const test = new PlayerAnimationTest();
  test.runAllTests();
}