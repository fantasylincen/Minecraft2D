/**
 * 怪物基类
 * 所有怪物的基类，继承自Entity
 */

import { Entity } from './Entity.js';

export class Mob extends Entity {
  constructor(worldConfig) {
    super(worldConfig);
    
    // 怪物特有属性
    this.mob = {
      aiState: 'idle',      // AI状态 (idle, wandering, chasing, attacking)
      target: null,         // 目标实体
      lastAITick: 0,        // 上次AI更新时间
      aiTickRate: 1000,     // AI更新频率 (毫秒)
      aggroRange: 100,      // 激活范围 (像素)
      attackRange: 20,      // 攻击范围 (像素)
      attackDamage: 2,      // 攻击伤害
      attackCooldown: 1000, // 攻击冷却时间 (毫秒)
      lastAttackTime: 0,    // 上次攻击时间
      wanderSpeed: 50,      // 徘徊速度
      chaseSpeed: 80,       // 追击速度
      canSwim: false        // 是否能在水中移动
    };
    
    // 怪物类型
    this.type = 'mob';
    
    console.log('👹 Mob 初始化完成');
  }
  
  /**
   * 更新怪物状态
   */
  update(deltaTime, player) {
    // 调用父类更新
    super.update(deltaTime);
    
    // 更新AI
    this.updateAI(deltaTime, player);
  }
  
  /**
   * 更新AI
   */
  updateAI(deltaTime, player) {
    const currentTime = performance.now();
    
    // 检查AI更新频率
    if (currentTime - this.mob.lastAITick < this.mob.aiTickRate) {
      return;
    }
    
    this.mob.lastAITick = currentTime;
    
    // 如果有目标，更新AI状态
    if (player) {
      const distanceToPlayer = this.getDistanceTo(player);
      
      // 检查是否在激活范围内
      if (distanceToPlayer <= this.mob.aggroRange) {
        // 检查是否在攻击范围内
        if (distanceToPlayer <= this.mob.attackRange) {
          this.mob.aiState = 'attacking';
          this.attack(player);
        } else {
          this.mob.aiState = 'chasing';
          this.chase(player);
        }
      } else {
        this.mob.aiState = 'wandering';
        this.wander();
      }
    } else {
      this.mob.aiState = 'wandering';
      this.wander();
    }
  }
  
  /**
   * 徘徊行为
   */
  wander() {
    // 简单的徘徊逻辑：随机改变方向
    if (Math.random() < 0.02) {
      this.physics.velocity.x = (Math.random() - 0.5) * this.mob.wanderSpeed * 2;
    }
    
    // 应用徘徊速度
    const currentSpeed = this.mob.wanderSpeed;
    if (this.physics.velocity.x > currentSpeed) {
      this.physics.velocity.x = currentSpeed;
    } else if (this.physics.velocity.x < -currentSpeed) {
      this.physics.velocity.x = -currentSpeed;
    }
  }
  
  /**
   * 追击行为
   */
  chase(target) {
    if (!target) return;
    
    const targetPos = target.getPosition();
    const direction = targetPos.x > this.position.x ? 1 : -1;
    
    // 设置追击速度
    this.physics.velocity.x = direction * this.mob.chaseSpeed;
  }
  
  /**
   * 攻击行为
   */
  attack(target) {
    const currentTime = performance.now();
    
    // 检查攻击冷却时间
    if (currentTime - this.mob.lastAttackTime < this.mob.attackCooldown) {
      return;
    }
    
    this.mob.lastAttackTime = currentTime;
    
    // 对目标造成伤害
    if (target && typeof target.takeDamage === 'function') {
      target.takeDamage(this.mob.attackDamage, this.type);
      console.log(`⚔️ ${this.type} 攻击了玩家，造成 ${this.mob.attackDamage} 点伤害`);
    }
  }
  
  /**
   * 计算到目标的距离
   */
  getDistanceTo(target) {
    if (!target) return Infinity;
    
    const targetPos = target.getPosition();
    const dx = targetPos.x - this.position.x;
    const dy = targetPos.y - this.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * 渲染怪物
   */
  render(ctx, camera) {
    // 调用父类渲染
    super.render(ctx, camera);
    
    // 可以添加怪物特有的渲染效果
    // 例如：血条、状态效果等
  }
}