/**
 * 被动生物基类
 * 所有被动生物的基类，继承自Entity
 */

import { Entity } from './Entity.js';

export class PassiveMob extends Entity {
  constructor(worldConfig) {
    super(worldConfig);
    
    // 被动生物特有属性
    this.passive = {
      aiState: 'idle',      // AI状态 (idle, wandering, grazing, fleeing, breeding)
      lastAITick: 0,        // 上次AI更新时间
      aiTickRate: 1500,     // AI更新频率 (毫秒)
      wanderSpeed: 40,      // 徘徊速度
      fleeSpeed: 80,        // 逃跑速度
      fleeDistance: 150,    // 逃跑触发距离
      grazingTime: 0,       // 觅食时间
      maxGrazingTime: 5000, // 最大觅食时间 (毫秒)
      canFlee: true,        // 是否会逃跑
      canGraze: true,       // 是否会觅食
      breedCooldown: 30000, // 繁殖冷却时间 (毫秒)
      lastBreedTime: 0,     // 上次繁殖时间
      isBaby: false,        // 是否为幼体
      growthTime: 0,        // 成长时间
      maxGrowthTime: 20000, // 最大成长时间 (毫秒)
      loveMode: false,      // 恋爱模式
      loveTime: 0,          // 恋爱时间
      maxLoveTime: 5000,    // 最大恋爱时间 (毫秒)
      breedItem: null       // 繁殖所需物品
    };
    
    // 季节行为调整
    this.seasonBehaviors = {
      spring: { activity: 1.3, growth: 1.2 },  // 春季：活动增加，成长加快
      summer: { activity: 1.5, growth: 1.1 },  // 夏季：活动最活跃
      autumn: { activity: 1.1, growth: 1.0 },  // 秋季：活动适中
      winter: { activity: 0.7, growth: 0.5 }   // 冬季：活动减少，成长缓慢
    };
    
    // 游戏引擎引用（用于获取季节信息）
    this.gameEngine = null;
    
    // 被动生物类型
    this.type = 'passive_mob';
    
    console.log('🐮 PassiveMob 初始化完成');
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
      return { activity: 1.0, growth: 1.0 };
    }
    
    const currentSeason = this.gameEngine.getCurrentSeason();
    return this.seasonBehaviors[currentSeason] || { activity: 1.0, growth: 1.0 };
  }
  
  /**
   * 更新被动生物状态
   */
  update(deltaTime, player) {
    // 调用父类更新
    super.update(deltaTime);
    
    // 更新成长
    this.updateGrowth(deltaTime);
    
    // 更新恋爱模式
    this.updateLoveMode(deltaTime);
    
    // 更新AI
    this.updateAI(deltaTime, player);
  }
  
  /**
   * 更新成长状态
   */
  updateGrowth(deltaTime) {
    if (this.passive.isBaby) {
      this.passive.growthTime += deltaTime * 1000; // 转换为毫秒
      
      // 获取季节行为因子
      const seasonFactor = this.getSeasonBehaviorFactor();
      
      // 根据季节调整成长速度
      const adjustedGrowthTime = this.passive.growthTime * seasonFactor.growth;
      
      if (adjustedGrowthTime >= this.passive.maxGrowthTime) {
        this.passive.isBaby = false;
        this.passive.growthTime = 0;
        console.log(`🐮 ${this.type} 已成长为成体`);
      }
    }
  }
  
  /**
   * 更新恋爱模式
   */
  updateLoveMode(deltaTime) {
    if (this.passive.loveMode) {
      this.passive.loveTime += deltaTime * 1000; // 转换为毫秒
      
      if (this.passive.loveTime >= this.passive.maxLoveTime) {
        this.passive.loveMode = false;
        this.passive.loveTime = 0;
      }
    }
  }
  
  /**
   * 更新AI - 考虑季节影响
   */
  updateAI(deltaTime, player) {
    const currentTime = performance.now();
    
    // 获取季节行为因子
    const seasonFactor = this.getSeasonBehaviorFactor();
    
    // 检查AI更新频率（受季节活动因子影响）
    const adjustedAITickRate = this.passive.aiTickRate / seasonFactor.activity;
    if (currentTime - this.passive.lastAITick < adjustedAITickRate) {
      return;
    }
    
    this.passive.lastAITick = currentTime;
    
    // 如果在恋爱模式，寻找附近的同类
    if (this.passive.loveMode && !this.passive.isBaby) {
      this.passive.aiState = 'breeding';
      this.lookForMate();
      return;
    }
    
    // 如果有玩家，检查是否需要逃跑
    if (player && this.passive.canFlee) {
      const distanceToPlayer = this.getDistanceTo(player);
      
      // 检查是否在逃跑范围内
      if (distanceToPlayer <= this.passive.fleeDistance) {
        this.passive.aiState = 'fleeing';
        this.flee(player, seasonFactor);
        return;
      }
    }
    
    // 如果在觅食状态，继续觅食
    if (this.passive.aiState === 'grazing') {
      this.passive.grazingTime += adjustedAITickRate;
      if (this.passive.grazingTime >= this.passive.maxGrazingTime) {
        this.passive.aiState = 'idle';
        this.passive.grazingTime = 0;
      }
      return;
    }
    
    // 随机决定行为
    const rand = Math.random();
    
    // 20%概率开始觅食（如果可以觅食）
    if (this.passive.canGraze && rand < 0.2 * seasonFactor.activity) {
      this.passive.aiState = 'grazing';
      this.passive.grazingTime = 0;
    }
    // 10%概率开始徘徊
    else if (rand < 0.3 * seasonFactor.activity) {
      this.passive.aiState = 'wandering';
      this.wander(seasonFactor);
    }
    // 其他情况保持空闲
    else {
      this.passive.aiState = 'idle';
      this.physics.velocity.x = 0;
    }
  }
  
  /**
   * 徘徊行为 - 考虑季节影响
   */
  wander(seasonFactor) {
    // 简单的徘徊逻辑：随机改变方向（受季节活动因子影响）
    const wanderChance = 0.03 * seasonFactor.activity;
    if (Math.random() < wanderChance) {
      this.physics.velocity.x = (Math.random() - 0.5) * this.passive.wanderSpeed * 2 * seasonFactor.activity;
    }
    
    // 应用徘徊速度（受季节活动因子影响）
    const currentSpeed = this.passive.wanderSpeed * seasonFactor.activity;
    if (this.physics.velocity.x > currentSpeed) {
      this.physics.velocity.x = currentSpeed;
    } else if (this.physics.velocity.x < -currentSpeed) {
      this.physics.velocity.x = -currentSpeed;
    }
  }
  
  /**
   * 逃跑行为 - 考虑季节影响
   */
  flee(target, seasonFactor) {
    if (!target) return;
    
    const targetPos = target.getPosition();
    const direction = targetPos.x > this.position.x ? -1 : 1; // 与玩家相反方向
    
    // 设置逃跑速度（受季节活动因子影响）
    const fleeSpeed = this.passive.fleeSpeed * seasonFactor.activity;
    this.physics.velocity.x = direction * fleeSpeed;
  }
  
  /**
   * 寻找配偶
   */
  lookForMate() {
    // 这个方法将在子类中实现，因为需要特定的同类查找逻辑
  }
  
  /**
   * 繁殖检查
   */
  canBreed() {
    const currentTime = performance.now();
    
    // 检查是否为成体
    if (this.passive.isBaby) {
      return false;
    }
    
    // 检查是否在恋爱模式
    if (!this.passive.loveMode) {
      return false;
    }
    
    // 检查繁殖冷却时间
    if (currentTime - this.passive.lastBreedTime < this.passive.breedCooldown) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 执行繁殖
   */
  breed(mate) {
    if (!this.canBreed() || !mate || !mate.canBreed()) {
      return null;
    }
    
    const currentTime = performance.now();
    this.passive.lastBreedTime = currentTime;
    mate.passive.lastBreedTime = currentTime;
    
    // 退出恋爱模式
    this.passive.loveMode = false;
    mate.passive.loveMode = false;
    
    // 创建幼体
    const baby = this.createBaby();
    return baby;
  }
  
  /**
   * 进入恋爱模式
   */
  enterLoveMode() {
    if (this.passive.isBaby) {
      return false;
    }
    
    this.passive.loveMode = true;
    this.passive.loveTime = 0;
    return true;
  }
  
  /**
   * 检查是否可以进入恋爱模式
   */
  canEnterLoveMode() {
    // 检查是否为成体
    if (this.passive.isBaby) {
      return false;
    }
    
    // 检查是否已经在恋爱模式
    if (this.passive.loveMode) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 创建幼体（子类需要重写）
   */
  createBaby() {
    // 子类需要实现具体的幼体创建逻辑
    return null;
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
   * 渲染被动生物
   */
  render(ctx, camera) {
    // 调用父类渲染
    super.render(ctx, camera);
    
    // 如果是幼体，渲染更小的尺寸
    if (this.passive.isBaby) {
      const screenPos = camera.worldToScreen(this.position.x, this.position.y);
      
      // 绘制幼体标识
      ctx.fillStyle = '#FFD700'; // 金色
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y - this.size.height / 2 - 5, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 如果在恋爱模式，渲染爱心
    if (this.passive.loveMode) {
      const screenPos = camera.worldToScreen(this.position.x, this.position.y);
      
      // 绘制爱心
      ctx.fillStyle = '#FF69B4'; // 热粉色
      ctx.beginPath();
      ctx.arc(screenPos.x - 5, screenPos.y - this.size.height / 2 - 10, 3, 0, Math.PI * 2);
      ctx.arc(screenPos.x + 5, screenPos.y - this.size.height / 2 - 10, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}