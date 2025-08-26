/**
 * 玩家物理系统
 * 负责处理玩家的物理模拟，包括重力、速度、碰撞等
 */

import { blockConfig } from '../config/BlockConfig.js';

export class PlayerPhysics {
  constructor(player) {
    this.player = player;
    this.worldConfig = player.worldConfig;
  }

  /**
   * 更新物理模拟
   */
  updatePhysics(deltaTime) {
    if (this.player.flyMode.enabled) {
      // 飞行模式物理
      this.updateFlyingPhysics(deltaTime);
    } else {
      // 正常模式物理
      this.updateNormalPhysics(deltaTime);
    }
    
    // 处理玩家移动
    this.handlePlayerMovement(deltaTime);
  }
  
  /**
   * 处理玩家移动
   */
  handlePlayerMovement(deltaTime) {
    // 保存上一帧位置
    this.player.position.prevX = this.player.position.x;
    this.player.position.prevY = this.player.position.y;
    
    // 检查是否在水中
    this.player.inWater.isSwimming = this.player.isInWater();
    
    // 分别处理X和Y方向的移动和碰撞
    if (this.player.flyMode.enabled) {
      // 飞行模式下直接移动，不进行碰撞检测
      this.player.position.x += this.player.physics.velocity.x * deltaTime;
      this.player.position.y += this.player.physics.velocity.y * deltaTime;
    } else {
      // 正常模式下进行碰撞检测
      this.moveHorizontal(deltaTime);
      
      // 主动检测地面状态 - 修复悬空不下落的bug
      // Author: Minecraft2D Development Team
      this.updateGroundState();
      
      this.moveVertical(deltaTime);
      
      // 最终安全检查，确保玩家不嵌入方块
      this.ensureNotEmbedded();
    }
    
    // 边界限制（防止掉出世界）
    this.constrainToWorld();
  }
  
  /**
   * 更新正常模式物理
   */
  updateNormalPhysics(deltaTime) {
    // 检查是否启用潜行模式
    const isSneaking = this.player.controls.sneakLeft || this.player.controls.sneakRight;
    this.player.sneakMode.enabled = isSneaking;
    
    // 根据潜行模式调整移动速度
    const moveSpeed = this.player.sneakMode.enabled ? 
      this.player.physics.speed * this.player.sneakMode.speedMultiplier : 
      this.player.physics.speed;
    
    // 水平移动 - 简化逗辑
    if (this.player.controls.left || this.player.controls.sneakLeft) {
      this.player.physics.velocity.x = this.player.inWater.isSwimming ? 
        -this.player.inWater.swimSpeed : -moveSpeed;
    } else if (this.player.controls.right || this.player.controls.sneakRight) {
      this.player.physics.velocity.x = this.player.inWater.isSwimming ? 
        this.player.inWater.swimSpeed : moveSpeed;
    } else {
      // 应用摩擦力（水中摩擦力不同）
      const friction = this.player.inWater.isSwimming ? 
        this.player.inWater.waterFriction : this.player.physics.friction;
      this.player.physics.velocity.x *= friction;
      if (Math.abs(this.player.physics.velocity.x) < 1) {
        this.player.physics.velocity.x = 0;
      }
    }
    
    // 跳跃 - 简化条件
    if (this.player.controls.jump && (this.player.physics.onGround || this.player.inWater.isSwimming)) {
      if (this.player.inWater.isSwimming) {
        // 在水中向上游动
        this.player.physics.velocity.y = this.player.inWater.swimUpForce;
      } else {
        // 正常跳跃
        this.player.physics.velocity.y = this.player.physics.jumpForce;
        this.player.physics.onGround = false;
        this.player.physics.canJump = false;
      }
    }
    
    // 更新下落高度跟踪 (TODO #26)
    this.updateFallTracking();
    
    // 应用重力（水中重力不同）
    if (!this.player.physics.onGround) {
      const gravity = this.player.inWater.isSwimming ? 
        this.player.physics.gravity * (1 - this.player.inWater.buoyancy) : this.player.physics.gravity;
      this.player.physics.velocity.y -= gravity * deltaTime;
      
      // 限制最大下落速度
      const terminalVelocity = this.player.inWater.isSwimming ? 
        this.player.physics.terminalVelocity * 0.5 : this.player.physics.terminalVelocity;
      if (this.player.physics.velocity.y < -terminalVelocity) {
        this.player.physics.velocity.y = -terminalVelocity;
      }
    }
  }

  /**
   * 更新下落高度跟踪 (TODO #26)
   * Author: Minecraft2D Development Team
   */
  updateFallTracking() {
    const wasOnGround = this.player.physics.onGround;
    const isNowFalling = this.player.physics.velocity.y < 0; // 下落速度
    
    // 检测是否刚刚离开地面
    if (wasOnGround && !this.player.physics.onGround && !this.player.fallDamage.hasLeftGround) {
      this.player.fallDamage.hasLeftGround = true;
      this.player.fallDamage.fallStartY = this.player.position.y;
      this.player.fallDamage.isFalling = false; // 先不记为下落，可能是跳跃
    }
    
    // 检测是否开始真正的下落（不是跳跃）
    if (this.player.fallDamage.hasLeftGround && isNowFalling && !this.player.fallDamage.isFalling) {
      this.player.fallDamage.isFalling = true;
      // 如果在跳跃过程中开始下落，更新起始高度为最高点
      if (this.player.position.y > this.player.fallDamage.fallStartY) {
        this.player.fallDamage.fallStartY = this.player.position.y;
      }
    }
    
    // 重置下落状态（当在地面时）
    if (this.player.physics.onGround) {
      this.player.fallDamage.hasLeftGround = false;
      this.player.fallDamage.isFalling = false;
    }
  }

  /**
   * 主动更新地面状态
   * Author: Minecraft2D Development Team
   * 修复玩家从方块上横向移动到半空中不下落的bug
   */
  updateGroundState() {
    if (!this.player.terrainGenerator) return;
    
    const blockSize = this.worldConfig.BLOCK_SIZE;
    const epsilon = 0.01;
    
    // 计算玩家脚下的位置
    const left = this.player.position.x - this.player.size.width / 2 + epsilon;
    const right = this.player.position.x + this.player.size.width / 2 - epsilon;
    const bottom = this.player.position.y - this.player.size.height / 2;
    
    // 检查脚下的方块（向下扩展一小段距离检测）
    const checkDistance = 2; // 检测脚下2像素范围
    const groundCheckY = bottom - checkDistance;
    
    const leftBlock = Math.floor(left / blockSize);
    const rightBlock = Math.floor(right / blockSize);
    const groundBlock = Math.floor(groundCheckY / blockSize);
    
    // 检查脚下是否有固体方块
    let hasGroundSupport = false;
    for (let x = leftBlock; x <= rightBlock; x++) {
      const blockId = this.player.terrainGenerator.getBlock(x, groundBlock);
      if (blockConfig.isSolid(blockId)) {
        hasGroundSupport = true;
        break;
      }
    }
    
    // 更新地面状态
    const wasOnGround = this.player.physics.onGround;
    this.player.physics.onGround = hasGroundSupport;
    
    // 如果从地面变为悬空，立即开始应用重力
    if (wasOnGround && !this.player.physics.onGround) {
      // 检查是否为主动跳跃：如果有向上的速度，说明是跳跃，不要干扰
      // 只有在没有向上速度或速度很小时，才触发重力（真正的悬空掉落）
      if (this.player.physics.velocity.y < 50) { // 50是一个阈值，小于此值认为不是跳跃
        this.player.physics.velocity.y = -1; // 微小的下向速度，触发重力
      }
      this.player.physics.canJump = false;
    } else if (!wasOnGround && this.player.physics.onGround) {
      // 如果从悬空变为在地面，停止下落
      if (this.player.physics.velocity.y < 0) {
        this.player.physics.velocity.y = 0;
      }
      this.player.physics.canJump = true;
    }
  }

  /**
   * 更新飞行模式物理
   */
  updateFlyingPhysics(deltaTime) {
    // 飞行模式下的全方向移动
    const speed = this.player.flyMode.speed * this.player.flyMode.speedMultiplier;
    
    // 水平移动
    if (this.player.controls.left) {
      this.player.physics.velocity.x = -speed;
    } else if (this.player.controls.right) {
      this.player.physics.velocity.x = speed;
    } else {
      // 应用飞行摩擦力
      this.player.physics.velocity.x *= this.player.flyMode.friction;
      if (Math.abs(this.player.physics.velocity.x) < 1) {
        this.player.physics.velocity.x = 0;
      }
    }
    
    // 垂直移动 (在飞行模式下，W/S 或 上/下 箭头键控制垂直移动)
    if (this.player.controls.up) {
      this.player.physics.velocity.y = speed;
    } else if (this.player.controls.down) {
      this.player.physics.velocity.y = -speed;
    } else {
      // 应用飞行摩擦力
      this.player.physics.velocity.y *= this.player.flyMode.friction;
      if (Math.abs(this.player.physics.velocity.y) < 1) {
        this.player.physics.velocity.y = 0;
      }
    }
    
    // 飞行模式下不受重力影响，也不进行地面检测
    this.player.physics.onGround = false;
    this.player.physics.canJump = false;
  }

  /**
   * 水平移动和碰撞检测
   */
  moveHorizontal(deltaTime) {
    if (Math.abs(this.player.physics.velocity.x) < 0.1) return;
    
    const blockSize = this.worldConfig.BLOCK_SIZE;
    const moveDistance = this.player.physics.velocity.x * deltaTime;
    
    // 尝试移动
    this.player.position.x += moveDistance;
    
    // 计算玩家边界（添加小偶置避免精度问题）
    const epsilon = 0.01;
    const left = this.player.position.x - this.player.size.width / 2 + epsilon;
    const right = this.player.position.x + this.player.size.width / 2 - epsilon;
    const top = this.player.position.y + this.player.size.height / 2 - epsilon;
    const bottom = this.player.position.y - this.player.size.height / 2 + epsilon;
    
    // 转换为方块坐标
    const leftBlock = Math.floor(left / blockSize);
    const rightBlock = Math.floor(right / blockSize);
    const topBlock = Math.floor(top / blockSize);
    const bottomBlock = Math.floor(bottom / blockSize);
    
    // 检查左右碰撞
    if (this.player.physics.velocity.x < 0) { // 向左移动
      for (let y = bottomBlock; y <= topBlock; y++) {
        const blockId = this.player.terrainGenerator.getBlock(leftBlock, y);
        if (blockConfig.isSolid(blockId)) {
          // 撤销移动并贴墙（精确位置）
          const blockRight = (leftBlock + 1) * blockSize;
          this.player.position.x = blockRight + this.player.size.width / 2 + epsilon;
          this.player.physics.velocity.x = 0;
          return;
        }
      }
    } else { // 向右移动
      for (let y = bottomBlock; y <= topBlock; y++) {
        const blockId = this.player.terrainGenerator.getBlock(rightBlock, y);
        if (blockConfig.isSolid(blockId)) {
          // 撤销移动并贴墙（精确位置）
          const blockLeft = rightBlock * blockSize;
          this.player.position.x = blockLeft - this.player.size.width / 2 - epsilon;
          this.player.physics.velocity.x = 0;
          return;
        }
      }
    }
  }

  /**
   * 垂直移动和碰撞检测
   */
  moveVertical(deltaTime) {
    if (Math.abs(this.player.physics.velocity.y) < 0.1) return;
    
    const blockSize = this.worldConfig.BLOCK_SIZE;
    const moveDistance = this.player.physics.velocity.y * deltaTime;
    
    // 尝试移动
    this.player.position.y += moveDistance;
    
    // 注意：地面状态由updateGroundState方法管理，此处不重置
    
    // 计算玩家边界（添加小偶置避免精度问题）
    const epsilon = 0.01;
    const left = this.player.position.x - this.player.size.width / 2 + epsilon;
    const right = this.player.position.x + this.player.size.width / 2 - epsilon;
    const top = this.player.position.y + this.player.size.height / 2 - epsilon;
    const bottom = this.player.position.y - this.player.size.height / 2 + epsilon;
    
    // 转换为方块坐标
    const leftBlock = Math.floor(left / blockSize);
    const rightBlock = Math.floor(right / blockSize);
    const topBlock = Math.floor(top / blockSize);
    const bottomBlock = Math.floor(bottom / blockSize);
    
    if (this.player.physics.velocity.y <= 0) { // 下落或静止
      // 检查地面碰撞
      for (let x = leftBlock; x <= rightBlock; x++) {
        const blockId = this.player.terrainGenerator.getBlock(x, bottomBlock);
        if (blockConfig.isSolid(blockId)) {
          // 着陆（精确位置）
          const blockTop = (bottomBlock + 1) * blockSize;
          this.player.position.y = blockTop + this.player.size.height / 2 + epsilon;
          
          // 摔伤检测 (TODO #18)
          this.checkFallDamage();
          
          this.player.physics.velocity.y = 0;
          this.player.physics.onGround = true;
          this.player.physics.canJump = true;
          return;
        }
      }
    } else { // 上升
      // 检查天花板碰撞
      for (let x = leftBlock; x <= rightBlock; x++) {
        const blockId = this.player.terrainGenerator.getBlock(x, topBlock);
        if (blockConfig.isSolid(blockId)) {
          // 撞头（精确位置）
          const blockBottom = topBlock * blockSize;
          this.player.position.y = blockBottom - this.player.size.height / 2 - epsilon;
          this.player.physics.velocity.y = 0;
          return;
        }
      }
    }
  }

  /**
   * 摔伤检测 (TODO #18 & #26)
   * Author: Minecraft2D Development Team
   */
  checkFallDamage() {
    if (!this.player.fallDamage.enabled || this.player.flyMode.enabled) {
      return; // 飞行模式下不受摔伤
    }
    
    // 计算下落高度 (TODO #26)
    const fallHeight = this.player.fallDamage.fallStartY - this.player.position.y;
    
    // 检查是否达到最小摔伤高度（3倍跳跃高度）
    if (fallHeight < this.player.fallDamage.minFallHeight) {
      console.log(`🟢 下落高度不足: ${fallHeight.toFixed(1)}像素 < ${this.player.fallDamage.minFallHeight.toFixed(1)}像素，无摔伤`);
      return;
    }
    
    // 获取落地时的下落速度 (取绝对值)
    const fallSpeed = Math.abs(this.player.physics.velocity.y);
    this.player.fallDamage.lastFallSpeed = fallSpeed;
    
    // 只有超过最小摔伤速度才会受伤
    if (fallSpeed < this.player.fallDamage.minFallSpeed) {
      console.log(`🟢 落地速度不足: ${fallSpeed.toFixed(1)} < ${this.player.fallDamage.minFallSpeed}，无摔伤`);
      return;
    }
    
    // 计算伤害值（线性插值）
    const speedRange = this.player.fallDamage.maxFallSpeed - this.player.fallDamage.minFallSpeed;
    const damageRange = this.player.fallDamage.maxDamage - this.player.fallDamage.minDamage;
    const speedRatio = Math.min(1, (fallSpeed - this.player.fallDamage.minFallSpeed) / speedRange);
    const damage = this.player.fallDamage.minDamage + (damageRange * speedRatio);
    
    // 应用伤害
    this.player.takeDamage(Math.round(damage), 'fall');
    
    console.log(`😵 摔伤! 下落高度: ${fallHeight.toFixed(1)}像素, 落地速度: ${fallSpeed.toFixed(1)}, 伤害: ${Math.round(damage)}, 剩余生命: ${this.player.health.current}`);
  }

  /**
   * 确保玩家不嵌入任何方块（最终安全检查）
   */
  ensureNotEmbedded() {
    if (!this.player.terrainGenerator) return;
    
    const blockSize = this.worldConfig.BLOCK_SIZE;
    const epsilon = 0.1; // 略大一些的安全边距
    
    // 计算玩家边界
    const left = this.player.position.x - this.player.size.width / 2 + epsilon;
    const right = this.player.position.x + this.player.size.width / 2 - epsilon;
    const top = this.player.position.y + this.player.size.height / 2 + epsilon;
    const bottom = this.player.position.y - this.player.size.height / 2 + epsilon;
    
    const leftBlock = Math.floor(left / blockSize);
    const rightBlock = Math.floor(right / blockSize);
    const topBlock = Math.floor(top / blockSize);
    const bottomBlock = Math.floor(bottom / blockSize);
    
    // 检查是否嵌入任何固体方块
    for (let x = leftBlock; x <= rightBlock; x++) {
      for (let y = bottomBlock; y <= topBlock; y++) {
        const blockId = this.player.terrainGenerator.getBlock(x, y);
        if (blockConfig.isSolid(blockId)) {
          // 发现嵌入，将玩家推出最近的安全位置
          this.pushOutOfBlock(x, y, blockSize);
          return; // 找到一个就立即处理
        }
      }
    }
  }

  /**
   * 将玩家推出指定方块
   */
  pushOutOfBlock(blockX, blockY, blockSize) {
    const blockLeft = blockX * blockSize;
    const blockRight = (blockX + 1) * blockSize;
    const blockBottom = blockY * blockSize;
    const blockTop = (blockY + 1) * blockSize;
    
    const playerLeft = this.player.position.x - this.player.size.width / 2;
    const playerRight = this.player.position.x + this.player.size.width / 2;
    const playerBottom = this.player.position.y - this.player.size.height / 2;
    const playerTop = this.player.position.y + this.player.size.height / 2;
    
    // 计算各个方向的推出距离
    const pushLeft = blockLeft - playerRight; // 向左推
    const pushRight = blockRight - playerLeft; // 向右推
    const pushDown = blockBottom - playerTop; // 向下推
    const pushUp = blockTop - playerBottom; // 向上推
    
    // 找到最小的推出距离
    const minPush = Math.min(
      Math.abs(pushLeft),
      Math.abs(pushRight),
      Math.abs(pushDown),
      Math.abs(pushUp)
    );
    
    const epsilon = 0.1;
    
    // 按照最小距离推出
    if (Math.abs(pushLeft) === minPush) {
      this.player.position.x = blockLeft - this.player.size.width / 2 - epsilon;
      this.player.physics.velocity.x = Math.min(0, this.player.physics.velocity.x);
    } else if (Math.abs(pushRight) === minPush) {
      this.player.position.x = blockRight + this.player.size.width / 2 + epsilon;
      this.player.physics.velocity.x = Math.max(0, this.player.physics.velocity.x);
    } else if (Math.abs(pushDown) === minPush) {
      this.player.position.y = blockBottom - this.player.size.height / 2 - epsilon;
      this.player.physics.velocity.y = Math.min(0, this.player.physics.velocity.y);
    } else {
      this.player.position.y = blockTop + this.player.size.height / 2 + epsilon;
      this.player.physics.velocity.y = Math.max(0, this.player.physics.velocity.y);
      this.player.physics.onGround = true;
      this.player.physics.canJump = true;
    }
  }

  /**
   * 约束玩家在世界范围内
   */
  constrainToWorld() {
    // 防止掉出世界底部
    if (this.player.position.y < -50) {
      this.player.respawn();
    }
    
    // Y轴上限
    const maxY = this.worldConfig.WORLD_HEIGHT * this.worldConfig.BLOCK_SIZE;
    if (this.player.position.y > maxY) {
      this.player.position.y = maxY;
      this.player.physics.velocity.y = Math.min(this.player.physics.velocity.y, 0);
    }
  }
}