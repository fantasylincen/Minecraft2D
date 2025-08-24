/**
 * 实体基类
 * 所有游戏实体的基类，包括玩家、怪物、NPC等
 */

import { blockConfig } from '../config/BlockConfig.js';

export class Entity {
  constructor(worldConfig) {
    this.worldConfig = worldConfig;
    
    // 实体位置和状态
    this.position = {
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0
    };
    
    // 实体物理属性
    this.physics = {
      velocity: { x: 0, y: 0 },
      speed: 100,           // 移动速度 (像素/秒)
      jumpForce: 200,       // 跳跃力度
      gravity: 800,         // 重力加速度
      friction: 0.8,        // 摩擦力
      terminalVelocity: 500, // 最大下落速度
      onGround: false,      // 是否在地面上
      canJump: false        // 是否可以跳跃
    };
    
    // 实体尺寸
    this.size = {
      width: 12,
      height: 24
    };
    
    // 实体外观
    this.appearance = {
      color: '#FF0000',
      eyeColor: '#FFFFFF'
    };
    
    // 生命值系统
    this.health = {
      current: 20,         // 当前生命值
      max: 20,            // 最大生命值
      lastDamageTime: 0,  // 上次受伤时间
      invulnerabilityTime: 1000 // 无敌时间(毫秒)
    };
    
    // 实体类型
    this.type = 'entity';
    
    // 游戏引用
    this.terrainGenerator = null;
    
    console.log('🧱 Entity 初始化完成');
  }
  
  /**
   * 设置地形生成器引用
   */
  setTerrainGenerator(terrainGenerator) {
    this.terrainGenerator = terrainGenerator;
  }
  
  /**
   * 更新实体状态
   */
  update(deltaTime) {
    // 保存上一帧位置
    this.position.prevX = this.position.x;
    this.position.prevY = this.position.y;
    
    // 应用物理模拟
    this.updatePhysics(deltaTime);
    
    // 处理移动和碰撞
    this.moveHorizontal(deltaTime);
    this.moveVertical(deltaTime);
    
    // 边界限制
    this.constrainToWorld();
  }
  
  /**
   * 更新物理模拟
   */
  updatePhysics(deltaTime) {
    // 水平移动 - 简化逻辑
    // 子类需要实现具体的移动逻辑
    
    // 应用摩擦力
    this.physics.velocity.x *= this.physics.friction;
    if (Math.abs(this.physics.velocity.x) < 1) {
      this.physics.velocity.x = 0;
    }
    
    // 应用重力
    if (!this.physics.onGround) {
      this.physics.velocity.y -= this.physics.gravity * deltaTime;
      
      // 限制最大下落速度
      if (this.physics.velocity.y < -this.physics.terminalVelocity) {
        this.physics.velocity.y = -this.physics.terminalVelocity;
      }
    }
  }
  
  /**
   * 水平移动和碰撞检测
   */
  moveHorizontal(deltaTime) {
    if (Math.abs(this.physics.velocity.x) < 0.1) return;
    
    if (!this.terrainGenerator) return;
    
    const blockSize = this.worldConfig.BLOCK_SIZE;
    const moveDistance = this.physics.velocity.x * deltaTime;
    
    // 尝试移动
    this.position.x += moveDistance;
    
    // 计算实体边界（添加小偶置避免精度问题）
    const epsilon = 0.01;
    const left = this.position.x - this.size.width / 2 + epsilon;
    const right = this.position.x + this.size.width / 2 - epsilon;
    const top = this.position.y + this.size.height / 2 - epsilon;
    const bottom = this.position.y - this.size.height / 2 + epsilon;
    
    // 转换为方块坐标
    const leftBlock = Math.floor(left / blockSize);
    const rightBlock = Math.floor(right / blockSize);
    const topBlock = Math.floor(top / blockSize);
    const bottomBlock = Math.floor(bottom / blockSize);
    
    // 检查左右碰撞
    if (this.physics.velocity.x < 0) { // 向左移动
      for (let y = bottomBlock; y <= topBlock; y++) {
        const blockId = this.terrainGenerator.getBlock(leftBlock, y);
        if (blockConfig.isSolid(blockId)) {
          // 撤销移动并贴墙（精确位置）
          const blockRight = (leftBlock + 1) * blockSize;
          this.position.x = blockRight + this.size.width / 2 + epsilon;
          this.physics.velocity.x = 0;
          return;
        }
      }
    } else { // 向右移动
      for (let y = bottomBlock; y <= topBlock; y++) {
        const blockId = this.terrainGenerator.getBlock(rightBlock, y);
        if (blockConfig.isSolid(blockId)) {
          // 撤销移动并贴墙（精确位置）
          const blockLeft = rightBlock * blockSize;
          this.position.x = blockLeft - this.size.width / 2 - epsilon;
          this.physics.velocity.x = 0;
          return;
        }
      }
    }
  }
  
  /**
   * 垂直移动和碰撞检测
   */
  moveVertical(deltaTime) {
    if (Math.abs(this.physics.velocity.y) < 0.1) return;
    
    if (!this.terrainGenerator) return;
    
    const blockSize = this.worldConfig.BLOCK_SIZE;
    const moveDistance = this.physics.velocity.y * deltaTime;
    
    // 尝试移动
    this.position.y += moveDistance;
    
    // 计算实体边界（添加小偶置避免精度问题）
    const epsilon = 0.01;
    const left = this.position.x - this.size.width / 2 + epsilon;
    const right = this.position.x + this.size.width / 2 - epsilon;
    const top = this.position.y + this.size.height / 2 - epsilon;
    const bottom = this.position.y - this.size.height / 2 + epsilon;
    
    // 转换为方块坐标
    const leftBlock = Math.floor(left / blockSize);
    const rightBlock = Math.floor(right / blockSize);
    const topBlock = Math.floor(top / blockSize);
    const bottomBlock = Math.floor(bottom / blockSize);
    
    if (this.physics.velocity.y <= 0) { // 下落或静止
      // 检查地面碰撞
      for (let x = leftBlock; x <= rightBlock; x++) {
        const blockId = this.terrainGenerator.getBlock(x, bottomBlock);
        if (blockConfig.isSolid(blockId)) {
          // 着陆（精确位置）
          const blockTop = (bottomBlock + 1) * blockSize;
          this.position.y = blockTop + this.size.height / 2 + epsilon;
          this.physics.velocity.y = 0;
          this.physics.onGround = true;
          this.physics.canJump = true;
          return;
        }
      }
    } else { // 上升
      // 检查天花板碰撞
      for (let x = leftBlock; x <= rightBlock; x++) {
        const blockId = this.terrainGenerator.getBlock(x, topBlock);
        if (blockConfig.isSolid(blockId)) {
          // 撞头（精确位置）
          const blockBottom = topBlock * blockSize;
          this.position.y = blockBottom - this.size.height / 2 - epsilon;
          this.physics.velocity.y = 0;
          return;
        }
      }
    }
  }
  
  /**
   * 约束实体在世界范围内
   */
  constrainToWorld() {
    // 防止掉出世界底部
    if (this.position.y < -50) {
      this.destroy();
    }
    
    // Y轴上限
    const maxY = this.worldConfig.WORLD_HEIGHT * this.worldConfig.BLOCK_SIZE;
    if (this.position.y > maxY) {
      this.position.y = maxY;
      this.physics.velocity.y = Math.min(this.physics.velocity.y, 0);
    }
  }
  
  /**
   * 渲染实体
   */
  render(ctx, camera) {
    const screenPos = camera.worldToScreen(this.position.x, this.position.y);
    
    // 实体主体
    ctx.fillStyle = this.appearance.color;
    ctx.fillRect(
      screenPos.x - this.size.width / 2,
      screenPos.y - this.size.height / 2,
      this.size.width,
      this.size.height
    );
    
    // 实体眼睛
    ctx.fillStyle = this.appearance.eyeColor;
    const eyeSize = 2;
    const eyeOffsetY = 6;
    
    // 左眼
    ctx.fillRect(
      screenPos.x - 3,
      screenPos.y + eyeOffsetY,
      eyeSize,
      eyeSize
    );
    
    // 右眼
    ctx.fillRect(
      screenPos.x + 1,
      screenPos.y + eyeOffsetY,
      eyeSize,
      eyeSize
    );
  }
  
  /**
   * 受伤处理
   */
  takeDamage(amount, type = 'unknown') {
    const currentTime = performance.now();
    
    // 检查无敌时间
    if (currentTime - this.health.lastDamageTime < this.health.invulnerabilityTime) {
      return false; // 在无敌时间内，不受伤害
    }
    
    // 应用伤害
    const actualDamage = Math.min(amount, this.health.current);
    this.health.current -= actualDamage;
    this.health.lastDamageTime = currentTime;
    
    console.log(`💔 ${this.type} 受伤: ${actualDamage} (类型: ${type}), 剩余生命: ${this.health.current}/${this.health.max}`);
    
    // 检查是否死亡
    if (this.health.current <= 0) {
      this.destroy();
    }
    
    return true;
  }
  
  /**
   * 治疗处理
   */
  heal(amount) {
    const oldHealth = this.health.current;
    this.health.current = Math.min(this.health.max, this.health.current + amount);
    const actualHeal = this.health.current - oldHealth;
    
    if (actualHeal > 0) {
      console.log(`❤️ ${this.type} 治疗: +${actualHeal}, 当前生命: ${this.health.current}/${this.health.max}`);
    }
    
    return actualHeal;
  }
  
  /**
   * 销毁实体
   */
  destroy() {
    console.log(`💥 ${this.type} 被销毁`);
    // 子类可以重写此方法以添加特定的销毁逻辑
  }
  
  /**
   * 获取实体位置
   */
  getPosition() {
    return { ...this.position };
  }
  
  /**
   * 设置实体位置
   */
  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
    this.physics.velocity.x = 0;
    this.physics.velocity.y = 0;
  }
  
  /**
   * 获取实体状态信息
   */
  getStatus() {
    return {
      position: { ...this.position },
      velocity: { ...this.physics.velocity },
      onGround: this.physics.onGround,
      canJump: this.physics.canJump,
      health: this.health.current,
      maxHealth: this.health.max,
      type: this.type
    };
  }
}