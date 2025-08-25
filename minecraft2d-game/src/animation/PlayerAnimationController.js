/**
 * 玩家动画控制器
 * 负责管理玩家的各种动画状态和转换
 */

import { AnimationSystem } from './AnimationSystem.js';

export class PlayerAnimationController {
  /**
   * 构造函数
   * @param {Player} player - 玩家实例
   */
  constructor(player) {
    this.player = player;
    this.animationSystem = new AnimationSystem();
    
    // 动画状态
    this.currentState = 'idle'; // 当前动画状态
    this.previousState = null; // 上一个动画状态
    this.stateTransitions = new Map(); // 状态转换规则
    
    // 激活动画实例
    this.activeAnimations = new Map();
    
    // 动画优先级（数字越大优先级越高）
    this.animationPriorities = {
      'death': 100,
      'hurt': 90,
      'mine': 80,
      'place': 80,
      'jump': 70,
      'fall': 70,
      'swim': 60,
      'fly': 50,
      'walk': 40,
      'idle': 30
    };
    
    // 初始化动画定义
    this.initializeAnimations();
    
    console.log('🎮 PlayerAnimationController 初始化完成');
  }
  
  /**
   * 初始化动画定义
   */
  initializeAnimations() {
    // 空闲动画
    this.animationSystem.registerAnimation('idle', {
      duration: 2.0,
      loop: true,
      properties: {
        bodyOffsetY: [
          { time: 0, value: 0 },
          { time: 1, value: 1 },
          { time: 2, value: 0 }
        ],
        armAngle: (time) => Math.sin(time * 2) * 0.1
      }
    });
    
    // 行走动画
    this.animationSystem.registerAnimation('walk', {
      duration: 1.0,
      loop: true,
      properties: {
        legAngle: (time) => Math.sin(time * 4 * Math.PI) * 0.3,
        armAngle: (time) => Math.sin(time * 4 * Math.PI + Math.PI) * 0.3,
        bodyOffsetY: (time) => Math.sin(time * 8 * Math.PI) * 0.5
      }
    });
    
    // 跳跃动画
    this.animationSystem.registerAnimation('jump', {
      duration: 0.5,
      loop: false,
      properties: {
        bodyScaleY: [
          { time: 0, value: 1 },
          { time: 0.25, value: 0.8 },
          { time: 0.5, value: 1 }
        ],
        legAngle: [
          { time: 0, value: 0 },
          { time: 0.25, value: -0.5 },
          { time: 0.5, value: 0 }
        ]
      }
    });
    
    // 下落动画
    this.animationSystem.registerAnimation('fall', {
      duration: 0.3,
      loop: true,
      properties: {
        bodyScaleY: 0.9,
        legAngle: -0.3
      }
    });
    
    // 飞行动画
    this.animationSystem.registerAnimation('fly', {
      duration: 0.8,
      loop: true,
      properties: {
        wingFlap: (time) => Math.sin(time * 4 * Math.PI) * 0.5,
        bodyAngle: (time) => Math.sin(time * 2 * Math.PI) * 0.1
      }
    });
    
    // 游泳动画
    this.animationSystem.registerAnimation('swim', {
      duration: 1.2,
      loop: true,
      properties: {
        armAngle: (time) => Math.sin(time * 2 * Math.PI) * 0.8,
        bodyOffsetY: (time) => Math.sin(time * 4 * Math.PI) * 1.0,
        bodyAngle: (time) => Math.sin(time * 2 * Math.PI) * 0.1
      }
    });
    
    // 挖掘动画
    this.animationSystem.registerAnimation('mine', {
      duration: 0.4,
      loop: false,
      properties: {
        armAngle: [
          { time: 0, value: 0 },
          { time: 0.2, value: -1.0 },
          { time: 0.4, value: 0 }
        ],
        toolOffsetX: [
          { time: 0, value: 0 },
          { time: 0.2, value: 5 },
          { time: 0.4, value: 0 }
        ]
      }
    });
    
    // 放置方块动画
    this.animationSystem.registerAnimation('place', {
      duration: 0.3,
      loop: false,
      properties: {
        armAngle: [
          { time: 0, value: 0 },
          { time: 0.15, value: -0.8 },
          { time: 0.3, value: 0 }
        ],
        handOffsetX: [
          { time: 0, value: 0 },
          { time: 0.15, value: 8 },
          { time: 0.3, value: 0 }
        ]
      }
    });
    
    // 受伤动画
    this.animationSystem.registerAnimation('hurt', {
      duration: 0.5,
      loop: false,
      properties: {
        flashAlpha: [
          { time: 0, value: 0.8 },
          { time: 0.25, value: 0 },
          { time: 0.5, value: 0.8 }
        ],
        bodyOffsetX: (time) => Math.sin(time * 8 * Math.PI) * 2
      }
    });
    
    // 死亡动画
    this.animationSystem.registerAnimation('death', {
      duration: 1.0,
      loop: false,
      properties: {
        bodyAngle: [
          { time: 0, value: 0 },
          { time: 1, value: Math.PI }
        ],
        bodyScale: [
          { time: 0, value: 1 },
          { time: 1, value: 0 }
        ]
      }
    });
  }
  
  /**
   * 更新动画控制器
   * @param {number} deltaTime - 时间增量（秒）
   */
  update(deltaTime) {
    // 更新动画系统
    this.animationSystem.update(deltaTime);
    
    // 根据玩家状态更新动画
    this.updateAnimationState();
  }
  
  /**
   * 根据玩家状态更新动画
   */
  updateAnimationState() {
    const newState = this.determineAnimationState();
    
    if (newState !== this.currentState) {
      this.transitionToState(newState);
    }
  }
  
  /**
   * 确定当前应该播放的动画状态
   * @returns {string} 动画状态
   */
  determineAnimationState() {
    // 检查高优先级动画（受伤、死亡等）
    if (this.player.health.current <= 0) {
      return 'death';
    }
    
    if (performance.now() - this.player.health.lastDamageTime < 500) {
      return 'hurt';
    }
    
    // 检查交互动画
    if (this.player.mining.isMining) {
      return 'mine';
    }
    
    if (this.player.controls.place) {
      return 'place';
    }
    
    // 检查移动状态
    if (this.player.flyMode.enabled) {
      return 'fly';
    }
    
    if (this.player.inWater.isSwimming) {
      return 'swim';
    }
    
    if (!this.player.physics.onGround) {
      // 检查是跳跃还是下落
      if (this.player.physics.velocity.y > 0) {
        return 'jump';
      } else {
        return 'fall';
      }
    }
    
    if (Math.abs(this.player.physics.velocity.x) > 0.1) {
      return 'walk';
    }
    
    return 'idle';
  }
  
  /**
   * 转换到新状态
   * @param {string} newState - 新状态
   */
  transitionToState(newState) {
    const oldPriority = this.animationPriorities[this.currentState] || 0;
    const newPriority = this.animationPriorities[newState] || 0;
    
    // 只有在新状态优先级更高或当前状态已完成时才转换
    const shouldTransition = newPriority > oldPriority || 
      !this.activeAnimations.has(this.currentState) ||
      this.animationSystem.getAnimationInstance(this.activeAnimations.get(this.currentState))?.isFinished();
    
    if (shouldTransition) {
      this.previousState = this.currentState;
      this.currentState = newState;
      
      // 停止当前动画（如果优先级较低）
      if (this.activeAnimations.has(this.previousState)) {
        const oldInstanceId = this.activeAnimations.get(this.previousState);
        const oldInstance = this.animationSystem.getAnimationInstance(oldInstanceId);
        if (oldInstance && newPriority > oldPriority) {
          this.animationSystem.stopAnimation(oldInstanceId);
          this.activeAnimations.delete(this.previousState);
        }
      }
      
      // 启动新动画
      if (!this.activeAnimations.has(newState)) {
        const instanceId = this.animationSystem.createAnimation(newState);
        if (instanceId) {
          this.activeAnimations.set(newState, instanceId);
        }
      }
    }
  }
  
  /**
   * 获取动画值
   * @param {string} property - 属性名称
   * @returns {any} 动画值
   */
  getAnimationValue(property) {
    // 按优先级检查所有激活动画
    const sortedAnimations = Array.from(this.activeAnimations.entries())
      .map(([state, instanceId]) => ({
        state,
        instanceId,
        priority: this.animationPriorities[state] || 0
      }))
      .sort((a, b) => b.priority - a.priority);
    
    // 从高优先级到低优先级检查动画值
    for (const { instanceId } of sortedAnimations) {
      const instance = this.animationSystem.getAnimationInstance(instanceId);
      if (instance) {
        const value = instance.getValue(property);
        if (value !== null && value !== undefined) {
          return value;
        }
      }
    }
    
    return 0; // 默认值
  }
  
  /**
   * 触发一次性动画
   * @param {string} animationName - 动画名称
   * @param {Object} options - 动画选项
   */
  triggerAnimation(animationName, options = {}) {
    // 停止同名的现有动画
    if (this.activeAnimations.has(animationName)) {
      const existingInstanceId = this.activeAnimations.get(animationName);
      this.animationSystem.stopAnimation(existingInstanceId);
    }
    
    // 创建新动画
    const instanceId = this.animationSystem.createAnimation(animationName, options);
    if (instanceId) {
      this.activeAnimations.set(animationName, instanceId);
    }
  }
  
  /**
   * 停止特定动画
   * @param {string} animationName - 动画名称
   */
  stopAnimation(animationName) {
    if (this.activeAnimations.has(animationName)) {
      const instanceId = this.activeAnimations.get(animationName);
      this.animationSystem.stopAnimation(instanceId);
      this.activeAnimations.delete(animationName);
    }
  }
  
  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      currentState: this.currentState,
      activeAnimations: this.activeAnimations.size,
      animationSystem: this.animationSystem.getStats()
    };
  }
}