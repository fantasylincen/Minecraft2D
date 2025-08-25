/**
 * 玩家动画系统完整集成测试
 * 测试玩家动画系统在游戏中的完整集成
 */

import { Player } from '../player/Player.js';
import { PlayerAnimationController } from '../animation/PlayerAnimationController.js';

export class FullPlayerAnimationTest {
  constructor() {
    console.log('🎮 玩家动画系统完整集成测试初始化完成');
  }
  
  /**
   * 运行所有测试
   */
  runAllTests() {
    console.log('🧪 开始运行玩家动画系统完整集成测试...');
    
    try {
      this.testAllAnimationStates();
      this.testAnimationTransitions();
      this.testAnimationPriorities();
      
      console.log('✅ 所有玩家动画系统完整集成测试通过!');
      return true;
    } catch (error) {
      console.error('❌ 玩家动画系统完整集成测试失败:', error);
      return false;
    }
  }
  
  /**
   * 测试所有动画状态
   */
  testAllAnimationStates() {
    console.log('🧪 测试所有动画状态...');
    
    // 创建玩家实例
    const worldConfig = { BLOCK_SIZE: 16, WORLD_HEIGHT: 512 };
    const player = new Player(worldConfig);
    const animationController = new PlayerAnimationController(player);
    player.setAnimationController(animationController);
    
    // 测试空闲状态
    player.physics.onGround = true;
    player.physics.velocity.x = 0;
    animationController.update(0.1);
    if (animationController.currentState !== 'idle') {
      throw new Error(`空闲状态不正确: 期望idle，实际${animationController.currentState}`);
    }
    console.log('✅ 空闲状态正确');
    
    // 测试行走状态
    player.physics.velocity.x = 2;
    animationController.update(0.1);
    if (animationController.currentState !== 'walk') {
      throw new Error(`行走状态不正确: 期望walk，实际${animationController.currentState}`);
    }
    console.log('✅ 行走状态正确');
    
    // 测试挖掘状态
    player.mining.isMining = true;
    animationController.update(0.1);
    if (animationController.currentState !== 'mine') {
      throw new Error(`挖掘状态不正确: 期望mine，实际${animationController.currentState}`);
    }
    console.log('✅ 挖掘状态正确');
    
    console.log('✅ 动画状态测试通过');
  }
  
  /**
   * 测试动画状态转换
   */
  testAnimationTransitions() {
    console.log('🧪 测试动画状态转换...');
    
    // 创建玩家实例
    const worldConfig = { BLOCK_SIZE: 16, WORLD_HEIGHT: 512 };
    const player = new Player(worldConfig);
    const animationController = new PlayerAnimationController(player);
    player.setAnimationController(animationController);
    
    // 设置玩家在地面上
    player.physics.onGround = true;
    
    // 从空闲到行走
    player.physics.velocity.x = 2;
    animationController.update(0.1);
    if (animationController.currentState !== 'walk') {
      throw new Error(`状态转换失败: 期望walk，实际${animationController.currentState}`);
    }
    console.log('✅ 空闲到行走转换正确');
    
    // 从行走到空闲
    player.physics.velocity.x = 0;
    animationController.update(0.1);
    if (animationController.currentState !== 'idle') {
      throw new Error(`状态转换失败: 期望idle，实际${animationController.currentState}`);
    }
    console.log('✅ 行走到空闲转换正确');
    
    console.log('✅ 动画状态转换测试通过');
  }
  
  /**
   * 测试动画优先级
   */
  testAnimationPriorities() {
    console.log('🧪 测试动画优先级...');
    
    // 创建玩家实例
    const worldConfig = { BLOCK_SIZE: 16, WORLD_HEIGHT: 512 };
    const player = new Player(worldConfig);
    const animationController = new PlayerAnimationController(player);
    player.setAnimationController(animationController);
    
    // 设置玩家在地面上并行走
    player.physics.onGround = true;
    player.physics.velocity.x = 2;
    animationController.update(0.1);
    
    // 检查行走动画是否激活
    const walkInstanceId = animationController.activeAnimations.get('walk');
    if (!walkInstanceId) {
      throw new Error('行走动画未激活');
    }
    console.log('✅ 行走动画激活');
    
    // 触发高优先级的受伤动画
    player.health.current = 50;
    player.health.lastDamageTime = performance.now();
    animationController.update(0.1);
    
    // 检查受伤动画是否激活
    const hurtInstanceId = animationController.activeAnimations.get('hurt');
    if (!hurtInstanceId) {
      throw new Error('受伤动画未激活');
    }
    console.log('✅ 受伤动画激活');
    
    // 检查行走动画是否仍然存在（应该被停止）
    const walkInstanceAfter = animationController.activeAnimations.get('walk');
    if (walkInstanceAfter) {
      throw new Error('行走动画应该被停止');
    }
    console.log('✅ 低优先级动画被正确停止');
    
    console.log('✅ 动画优先级测试通过');
  }
}

// 运行测试
if (typeof window === 'undefined') {
  // Node.js环境
  const test = new FullPlayerAnimationTest();
  test.runAllTests();
}