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
    
    // 季节行为调整
    this.seasonBehaviors = {
      spring: { activity: 1.2, aggression: 1.1 },  // 春季：活动增加，略显激进
      summer: { activity: 1.5, aggression: 1.3 },  // 夏季：活动最活跃，更激进
      autumn: { activity: 1.1, aggression: 1.0 },  // 秋季：活动适中，正常
      winter: { activity: 0.6, aggression: 0.8 }   // 冬季：活动减少，较温和
    };
    
    // 游戏引擎引用（用于获取季节信息）
    this.gameEngine = null;
    
    // 怪物类型
    this.type = 'mob';
    
    console.log('👹 Mob 初始化完成');
  }
  
  /**
   * 设置游戏引擎引用
   */
  setGameEngine(gameEngine) {
    this.gameEngine = gameEngine;
  }
  
  /**
   * 获取当前季节行为调整因子
   */
  getSeasonBehaviorFactor() {
    if (!this.gameEngine) {
      return { activity: 1.0, aggression: 1.0 };
    }
    
    const currentSeason = this.gameEngine.getCurrentSeason();
    return this.seasonBehaviors[currentSeason] || { activity: 1.0, aggression: 1.0 };
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
   * 更新AI - 考虑季节影响
   */
  updateAI(deltaTime, player) {
    const currentTime = performance.now();
    
    // 获取季节行为因子
    const seasonFactor = this.getSeasonBehaviorFactor();
    
    // 检查AI更新频率（受季节活动因子影响）
    const adjustedAITickRate = this.mob.aiTickRate / seasonFactor.activity;
    if (currentTime - this.mob.lastAITick < adjustedAITickRate) {
      return;
    }
    
    this.mob.lastAITick = currentTime;
    
    // 如果有目标，更新AI状态
    if (player) {
      const distanceToPlayer = this.getDistanceTo(player);
      
      // 检查是否在激活范围内（受季节活动因子影响）
      const adjustedAggroRange = this.mob.aggroRange * seasonFactor.activity;
      if (distanceToPlayer <= adjustedAggroRange) {
        // 检查是否在攻击范围内（受季节攻击因子影响）
        const adjustedAttackRange = this.mob.attackRange * seasonFactor.aggression;
        if (distanceToPlayer <= adjustedAttackRange) {
          this.mob.aiState = 'attacking';
          this.attack(player);
        } else {
          this.mob.aiState = 'chasing';
          this.chase(player, seasonFactor);
        }
      } else {
        this.mob.aiState = 'wandering';
        this.wander(seasonFactor);
      }
    } else {
      this.mob.aiState = 'wandering';
      this.wander(seasonFactor);
    }
  }
  
  /**
   * 徘徊行为 - 考虑季节影响
   */
  wander(seasonFactor) {
    // 简单的徘徊逻辑：随机改变方向（受季节活动因子影响）
    const wanderChance = 0.02 * seasonFactor.activity;
    if (Math.random() < wanderChance) {
      this.physics.velocity.x = (Math.random() - 0.5) * this.mob.wanderSpeed * 2 * seasonFactor.activity;
    }
    
    // 应用徘徊速度（受季节活动因子影响）
    const currentSpeed = this.mob.wanderSpeed * seasonFactor.activity;
    if (this.physics.velocity.x > currentSpeed) {
      this.physics.velocity.x = currentSpeed;
    } else if (this.physics.velocity.x < -currentSpeed) {
      this.physics.velocity.x = -currentSpeed;
    }
  }
  
  /**
   * 追击行为 - 考虑季节影响
   */
  chase(target, seasonFactor) {
    if (!target) return;
    
    const targetPos = target.getPosition();
    const direction = targetPos.x > this.position.x ? 1 : -1;
    
    // 设置追击速度（受季节活动和攻击因子影响）
    const chaseSpeed = this.mob.chaseSpeed * seasonFactor.activity * seasonFactor.aggression;
    this.physics.velocity.x = direction * chaseSpeed;
  }
  
  /**
   * 攻击行为 - 考虑季节影响
   */
  attack(target) {
    const currentTime = performance.now();
    
    // 获取季节行为因子
    const seasonFactor = this.getSeasonBehaviorFactor();
    
    // 检查攻击冷却时间（受季节攻击因子影响）
    const adjustedCooldown = this.mob.attackCooldown / seasonFactor.aggression;
    if (currentTime - this.mob.lastAttackTime < adjustedCooldown) {
      return;
    }
    
    this.mob.lastAttackTime = currentTime;
    
    // 对目标造成伤害（受季节攻击因子影响）
    const adjustedDamage = this.mob.attackDamage * seasonFactor.aggression;
    if (target && typeof target.takeDamage === 'function') {
      target.takeDamage(adjustedDamage, this.type);
      console.log(`⚔️ ${this.type} 攻击了玩家，造成 ${adjustedDamage} 点伤害（季节调整）`);
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