/**
 * 玩家控制系统
 * 负责处理玩家移动、交互和状态管理
 */

import { blockConfig } from '../config/BlockConfig.js';
import { Inventory } from './Inventory.js';
import { itemConfig } from '../config/ItemConfig.js';

export class Player {
  constructor(worldConfig) {
    this.worldConfig = worldConfig;
    
    // 玩家位置和状态
    this.position = {
      x: 0,
      y: 300, // 开始时在地面上方
      prevX: 0,
      prevY: 300
    };
    
    // 玩家物理属性
    this.physics = {
      velocity: { x: 0, y: 0 },
      speed: 150,           // 移动速度 (像素/秒)
      jumpForce: 300,       // 跳跃力度
      gravity: 800,         // 重力加速度
      friction: 0.8,        // 摩擦力
      terminalVelocity: 500, // 最大下落速度
      onGround: false,      // 是否在地面上
      canJump: false        // 是否可以跳跃
    };
    
    // 飞行模式
    this.flyMode = {
      enabled: false,       // 是否启用飞行模式
      speed: 250,          // 基础飞行速度 (比正常移动更快)
      friction: 0.9,       // 飞行摩擦力
      speedMultiplier: 1.0, // 速度倍率 (1.0 = 100%, 最大10.0 = 1000%)
      minSpeedMultiplier: 1.0, // 最小速度倍率 (100%)
      maxSpeedMultiplier: 10.0, // 最大速度倍率 (1000%)
      speedStep: 0.5       // 每次调节的步长 (50%)
    };
    
    // 玩家尺寸
    this.size = {
      width: 12,
      height: 24
    };
    
    // 玩家外观
    this.appearance = {
      color: '#FF6B6B',
      eyeColor: '#FFFFFF'
    };
    
    // 生命值系统 (TODO #18)
    this.health = {
      current: 100,        // 当前生命值
      max: 100,           // 最大生命值
      lastDamageTime: 0,  // 上次受伤时间
      invulnerabilityTime: 1000, // 无敌时间(毫秒)
      regenRate: 1,       // 回血速率 (每秒)
      regenDelay: 5000    // 受伤后多久开始回血 (毫秒)
    };
    
    // 摔伤系统 (TODO #18)
    this.fallDamage = {
      enabled: true,      // 是否启用摔伤
      minFallSpeed: 300,  // 最小摔伤速度
      maxFallSpeed: 500,  // 最大摔伤速度 (即终极速度)
      minDamage: 5,       // 最小伤害
      maxDamage: 75,      // 最大伤害 (3/4生命值)
      lastFallSpeed: 0,   // 上次落地时的速度
      
      // 新增：下落高度跟踪 (TODO #26)
      minFallHeight: 0,   // 最小摔伤高度（将在初始化时设置为3倍跳跃高度）
      fallStartY: 0,      // 开始下落时的Y坐标
      isFalling: false,   // 是否正在下落
      hasLeftGround: false // 是否已经离开地面
    };
    
    // 控制状态
    this.controls = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      prevJump: false,
      fly: false,           // 飞行模式切换按键
      prevFly: false,       // 上一帧飞行按键状态
      speedUp: false,       // 提升飞行速度按键
      prevSpeedUp: false,   // 上一帧提升速度按键状态
      speedDown: false,     // 降低飞行速度按键
      prevSpeedDown: false  // 上一帧降低速度按键状态
    };
    
    // 游戏引用
    this.terrainGenerator = null;
    
    // 物品栏系统
    this.inventory = new Inventory();
    
    // 给玩家一些初始物品用于测试
    this.initializeStartingItems();
    
    // 初始化摔伤高度为3倍跳跃高度 (TODO #26)
    // 跳跃高度大约为 jumpForce^2 / (2 * gravity) 像素
    const jumpHeight = (this.physics.jumpForce * this.physics.jumpForce) / (2 * this.physics.gravity);
    this.fallDamage.minFallHeight = jumpHeight * 3;
    
    console.log('👤 Player 初始化完成');
    console.log(`🟢 跳跃高度: ${jumpHeight.toFixed(1)}像素, 最小摔伤高度: ${this.fallDamage.minFallHeight.toFixed(1)}像素`);
  }
  
  /**
   * 设置地形生成器引用
   */
  setTerrainGenerator(terrainGenerator) {
    this.terrainGenerator = terrainGenerator;
  }
  
  /**
   * 更新玩家状态
   */
  update(deltaTime, keys) {
    // 保存上一帧位置
    this.position.prevX = this.position.x;
    this.position.prevY = this.position.y;
    
    // 更新控制输入
    this.updateControls(keys);
    
    // 应用物理模拟（但不移动位置）
    this.updatePhysics(deltaTime);
    
    // 分别处理X和Y方向的移动和碰撞
    if (this.flyMode.enabled) {
      // 飞行模式下直接移动，不进行碰撞检测
      this.position.x += this.physics.velocity.x * deltaTime;
      this.position.y += this.physics.velocity.y * deltaTime;
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
    
    // 更新健康系统 (TODO #18)
    this.updateHealth(deltaTime);
  }
  
  /**
   * 更新控制输入
   */
  updateControls(keys) {
    // WASD 控制
    this.controls.left = keys['KeyA'] || keys['ArrowLeft'];
    this.controls.right = keys['KeyD'] || keys['ArrowRight'];
    this.controls.up = keys['KeyW'] || keys['ArrowUp'];
    this.controls.down = keys['KeyS'] || keys['ArrowDown'];
    
    // 跳跃控制 - 只使用空格键，避免冲突
    const jumpPressed = keys['Space'];
    this.controls.jump = jumpPressed && !this.controls.prevJump;
    this.controls.prevJump = jumpPressed;
    
    // 飞行模式切换 - 使用F键
    const flyPressed = keys['KeyF'];
    this.controls.fly = flyPressed && !this.controls.prevFly;
    this.controls.prevFly = flyPressed;
    
    // 飞行速度调节 - 使用+/-键或Shift+速度键
    const speedUpPressed = keys['Equal'] || keys['NumpadAdd']; // +键
    this.controls.speedUp = speedUpPressed && !this.controls.prevSpeedUp;
    this.controls.prevSpeedUp = speedUpPressed;
    
    const speedDownPressed = keys['Minus'] || keys['NumpadSubtract']; // -键
    this.controls.speedDown = speedDownPressed && !this.controls.prevSpeedDown;
    this.controls.prevSpeedDown = speedDownPressed;
    
    // 处理飞行模式切换
    if (this.controls.fly) {
      this.toggleFlyMode();
    }
    
    // 处理飞行速度调节
    if (this.controls.speedUp) {
      this.increaseFlySpeed();
    }
    if (this.controls.speedDown) {
      this.decreaseFlySpeed();
    }
  }
  
  /**
   * 更新物理模拟
   */
  updatePhysics(deltaTime) {
    if (this.flyMode.enabled) {
      // 飞行模式物理
      this.updateFlyingPhysics(deltaTime);
    } else {
      // 正常模式物理
      this.updateNormalPhysics(deltaTime);
    }
  }
  
  /**
   * 更新正常模式物理
   */
  updateNormalPhysics(deltaTime) {
    // 水平移动 - 简化逗辑
    if (this.controls.left) {
      this.physics.velocity.x = -this.physics.speed;
    } else if (this.controls.right) {
      this.physics.velocity.x = this.physics.speed;
    } else {
      // 应用摩擦力
      this.physics.velocity.x *= this.physics.friction;
      if (Math.abs(this.physics.velocity.x) < 1) {
        this.physics.velocity.x = 0;
      }
    }
    
    // 跳跃 - 简化条件
    if (this.controls.jump && this.physics.onGround) {
      this.physics.velocity.y = this.physics.jumpForce;
      this.physics.onGround = false;
      this.physics.canJump = false;
    }
    
    // 更新下落高度跟踪 (TODO #26)
    this.updateFallTracking();
    
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
   * 更新下落高度跟踪 (TODO #26)
   * Author: Minecraft2D Development Team
   */
  updateFallTracking() {
    const wasOnGround = this.physics.onGround;
    const isNowFalling = this.physics.velocity.y < 0; // 下落速度
    
    // 检测是否刚刚离开地面
    if (wasOnGround && !this.physics.onGround && !this.fallDamage.hasLeftGround) {
      this.fallDamage.hasLeftGround = true;
      this.fallDamage.fallStartY = this.position.y;
      this.fallDamage.isFalling = false; // 先不记为下落，可能是跳跃
    }
    
    // 检测是否开始真正的下落（不是跳跃）
    if (this.fallDamage.hasLeftGround && isNowFalling && !this.fallDamage.isFalling) {
      this.fallDamage.isFalling = true;
      // 如果在跳跃过程中开始下落，更新起始高度为最高点
      if (this.position.y > this.fallDamage.fallStartY) {
        this.fallDamage.fallStartY = this.position.y;
      }
    }
    
    // 重置下落状态（当在地面时）
    if (this.physics.onGround) {
      this.fallDamage.hasLeftGround = false;
      this.fallDamage.isFalling = false;
    }
  }
  
  /**
   * 主动更新地面状态
   * Author: Minecraft2D Development Team
   * 修复玩家从方块上横向移动到半空中不下落的bug
   */
  updateGroundState() {
    if (!this.terrainGenerator) return;
    
    const blockSize = this.worldConfig.BLOCK_SIZE;
    const epsilon = 0.01;
    
    // 计算玩家脚下的位置
    const left = this.position.x - this.size.width / 2 + epsilon;
    const right = this.position.x + this.size.width / 2 - epsilon;
    const bottom = this.position.y - this.size.height / 2;
    
    // 检查脚下的方块（向下扩展一小段距离检测）
    const checkDistance = 2; // 检测脚下2像素范围
    const groundCheckY = bottom - checkDistance;
    
    const leftBlock = Math.floor(left / blockSize);
    const rightBlock = Math.floor(right / blockSize);
    const groundBlock = Math.floor(groundCheckY / blockSize);
    
    // 检查脚下是否有固体方块
    let hasGroundSupport = false;
    for (let x = leftBlock; x <= rightBlock; x++) {
      const blockId = this.terrainGenerator.getBlock(x, groundBlock);
      if (blockConfig.isSolid(blockId)) {
        hasGroundSupport = true;
        break;
      }
    }
    
    // 更新地面状态
    const wasOnGround = this.physics.onGround;
    this.physics.onGround = hasGroundSupport;
    
    // 如果从地面变为悬空，立即开始应用重力
    if (wasOnGround && !this.physics.onGround) {
      // 检查是否为主动跳跃：如果有向上的速度，说明是跳跃，不要干扰
      // 只有在没有向上速度或速度很小时，才触发重力（真正的悬空掉落）
      if (this.physics.velocity.y < 50) { // 50是一个阈值，小于此值认为不是跳跃
        this.physics.velocity.y = -1; // 微小的下向速度，触发重力
      }
      this.physics.canJump = false;
    } else if (!wasOnGround && this.physics.onGround) {
      // 如果从悬空变为在地面，停止下落
      if (this.physics.velocity.y < 0) {
        this.physics.velocity.y = 0;
      }
      this.physics.canJump = true;
    }
  }
  updateFlyingPhysics(deltaTime) {
    // 飞行模式下的全方向移动
    const speed = this.flyMode.speed * this.flyMode.speedMultiplier;
    
    // 水平移动
    if (this.controls.left) {
      this.physics.velocity.x = -speed;
    } else if (this.controls.right) {
      this.physics.velocity.x = speed;
    } else {
      // 应用飞行摩擦力
      this.physics.velocity.x *= this.flyMode.friction;
      if (Math.abs(this.physics.velocity.x) < 1) {
        this.physics.velocity.x = 0;
      }
    }
    
    // 垂直移动 (在飞行模式下，W/S 或 上/下 箭头键控制垂直移动)
    if (this.controls.up) {
      this.physics.velocity.y = speed;
    } else if (this.controls.down) {
      this.physics.velocity.y = -speed;
    } else {
      // 应用飞行摩擦力
      this.physics.velocity.y *= this.flyMode.friction;
      if (Math.abs(this.physics.velocity.y) < 1) {
        this.physics.velocity.y = 0;
      }
    }
    
    // 飞行模式下不受重力影响，也不进行地面检测
    this.physics.onGround = false;
    this.physics.canJump = false;
  }
  
  /**
   * 水平移动和碰撞检测
   */
  moveHorizontal(deltaTime) {
    if (Math.abs(this.physics.velocity.x) < 0.1) return;
    
    const blockSize = this.worldConfig.BLOCK_SIZE;
    const moveDistance = this.physics.velocity.x * deltaTime;
    
    // 尝试移动
    this.position.x += moveDistance;
    
    // 计算玩家边界（添加小偶置避免精度问题）
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
    
    const blockSize = this.worldConfig.BLOCK_SIZE;
    const moveDistance = this.physics.velocity.y * deltaTime;
    
    // 尝试移动
    this.position.y += moveDistance;
    
    // 注意：地面状态由updateGroundState方法管理，此处不重置
    
    // 计算玩家边界（添加小偶置避免精度问题）
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
          
          // 摔伤检测 (TODO #18)
          this.checkFallDamage();
          
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
   * 确保玩家不嵌入任何方块（最终安全检查）
   */
  ensureNotEmbedded() {
    if (!this.terrainGenerator) return;
    
    const blockSize = this.worldConfig.BLOCK_SIZE;
    const epsilon = 0.1; // 略大一些的安全边距
    
    // 计算玩家边界
    const left = this.position.x - this.size.width / 2 + epsilon;
    const right = this.position.x + this.size.width / 2 - epsilon;
    const top = this.position.y + this.size.height / 2 - epsilon;
    const bottom = this.position.y - this.size.height / 2 + epsilon;
    
    const leftBlock = Math.floor(left / blockSize);
    const rightBlock = Math.floor(right / blockSize);
    const topBlock = Math.floor(top / blockSize);
    const bottomBlock = Math.floor(bottom / blockSize);
    
    // 检查是否嵌入任何固体方块
    for (let x = leftBlock; x <= rightBlock; x++) {
      for (let y = bottomBlock; y <= topBlock; y++) {
        const blockId = this.terrainGenerator.getBlock(x, y);
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
    
    const playerLeft = this.position.x - this.size.width / 2;
    const playerRight = this.position.x + this.size.width / 2;
    const playerBottom = this.position.y - this.size.height / 2;
    const playerTop = this.position.y + this.size.height / 2;
    
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
      this.position.x = blockLeft - this.size.width / 2 - epsilon;
      this.physics.velocity.x = Math.min(0, this.physics.velocity.x);
    } else if (Math.abs(pushRight) === minPush) {
      this.position.x = blockRight + this.size.width / 2 + epsilon;
      this.physics.velocity.x = Math.max(0, this.physics.velocity.x);
    } else if (Math.abs(pushDown) === minPush) {
      this.position.y = blockBottom - this.size.height / 2 - epsilon;
      this.physics.velocity.y = Math.min(0, this.physics.velocity.y);
    } else {
      this.position.y = blockTop + this.size.height / 2 + epsilon;
      this.physics.velocity.y = Math.max(0, this.physics.velocity.y);
      this.physics.onGround = true;
      this.physics.canJump = true;
    }
  }
  
  /**
   * 约束玩家在世界范围内
   */
  constrainToWorld() {
    // 防止掉出世界底部
    if (this.position.y < -50) {
      this.respawn();
    }
    
    // Y轴上限
    const maxY = this.worldConfig.WORLD_HEIGHT * this.worldConfig.BLOCK_SIZE;
    if (this.position.y > maxY) {
      this.position.y = maxY;
      this.physics.velocity.y = Math.min(this.physics.velocity.y, 0);
    }
  }
  
  /**
   * 提升飞行速度
   */
  increaseFlySpeed() {
    if (this.flyMode.speedMultiplier < this.flyMode.maxSpeedMultiplier) {
      this.flyMode.speedMultiplier = Math.min(
        this.flyMode.speedMultiplier + this.flyMode.speedStep,
        this.flyMode.maxSpeedMultiplier
      );
      console.log(`✈️ 飞行速度提升至: ${Math.round(this.flyMode.speedMultiplier * 100)}%`);
    }
  }
  
  /**
   * 降低飞行速度
   */
  decreaseFlySpeed() {
    if (this.flyMode.speedMultiplier > this.flyMode.minSpeedMultiplier) {
      this.flyMode.speedMultiplier = Math.max(
        this.flyMode.speedMultiplier - this.flyMode.speedStep,
        this.flyMode.minSpeedMultiplier
      );
      console.log(`✈️ 飞行速度降低至: ${Math.round(this.flyMode.speedMultiplier * 100)}%`);
    }
  }
  
  /**
   * 设置飞行速度倍率
   */
  setFlySpeedMultiplier(multiplier) {
    this.flyMode.speedMultiplier = Math.max(
      this.flyMode.minSpeedMultiplier,
      Math.min(multiplier, this.flyMode.maxSpeedMultiplier)
    );
    console.log(`✈️ 飞行速度设置为: ${Math.round(this.flyMode.speedMultiplier * 100)}%`);
  }
  
  /**
   * 获取飞行速度倍率
   */
  getFlySpeedMultiplier() {
    return this.flyMode.speedMultiplier;
  }
  
  /**
   * 获取飞行速度百分比
   */
  getFlySpeedPercentage() {
    return Math.round(this.flyMode.speedMultiplier * 100);
  }
  
  /**
   * 重置飞行速度为默认值
   */
  resetFlySpeed() {
    this.flyMode.speedMultiplier = 1.0;
    console.log(`✈️ 飞行速度重置为: 100%`);
  }
  
  /**
   * 切换飞行模式
   */
  toggleFlyMode() {
    this.flyMode.enabled = !this.flyMode.enabled;
    
    if (this.flyMode.enabled) {
      console.log('✈️ 飞行模式开启');
      // 在开启飞行模式时，清除下落速度
      this.physics.velocity.y = 0;
      this.physics.onGround = false;
    } else {
      console.log('🚶 飞行模式关闭');
      // 关闭飞行模式时，清除垂直速度，让重力重新生效
      this.physics.velocity.y = 0;
    }
  }
  
  /**
   * 检查是否在飞行模式
   */
  isFlying() {
    return this.flyMode.enabled;
  }
  
  /**
   * 禁用飞行模式
   */
  disableFlyMode() {
    if (this.flyMode.enabled) {
      this.flyMode.enabled = false;
      this.physics.velocity.y = 0;
      console.log('🚶 飞行模式已禁用');
    }
  }
  
  /**
   * 启用飞行模式
   */
  enableFlyMode() {
    if (!this.flyMode.enabled) {
      this.flyMode.enabled = true;
      this.physics.velocity.y = 0;
      this.physics.onGround = false;
      console.log('✈️ 飞行模式已启用');
    }
  }
  
  /**
   * 重生玩家
   */
  respawn() {
    console.log('💀 玩家重生');
    
    // 寻找合适的重生点
    const spawnX = Math.floor(this.position.x / this.worldConfig.BLOCK_SIZE);
    let spawnY = this.worldConfig.WORLD_HEIGHT - 1;
    
    // 从上往下寻找第一个固体方块
    for (let y = this.worldConfig.WORLD_HEIGHT - 1; y >= 0; y--) {
      const blockId = this.terrainGenerator.getBlock(spawnX, y);
      if (blockConfig.isSolid(blockId)) {
        spawnY = y + 2; // 在固体方块上方2格
        break;
      }
    }
    
    this.position.x = spawnX * this.worldConfig.BLOCK_SIZE;
    this.position.y = spawnY * this.worldConfig.BLOCK_SIZE;
    this.physics.velocity.x = 0;
    this.physics.velocity.y = 0;
    this.physics.onGround = false;
  }
  
  /**
   * 渲染玩家
   */
  render(ctx, camera) {
    const screenPos = camera.worldToScreen(this.position.x, this.position.y);
    
    // 玩家主体颜色根据飞行模式改变
    ctx.fillStyle = this.flyMode.enabled ? '#87CEEB' : this.appearance.color; // 飞行时变为天空蓝
    ctx.fillRect(
      screenPos.x - this.size.width / 2,
      screenPos.y - this.size.height / 2,
      this.size.width,
      this.size.height
    );
    
    // 飞行模式特效
    if (this.flyMode.enabled) {
      // 绘制飞行光晕，大小根据速度调节
      const glowSize = 2 + (this.flyMode.speedMultiplier - 1) * 0.5; // 速度越快光晕越大
      const alpha = Math.min(0.3 + (this.flyMode.speedMultiplier - 1) * 0.05, 0.6); // 速度越快光晕越亮
      
      ctx.fillStyle = `rgba(135, 206, 235, ${alpha})`;
      ctx.fillRect(
        screenPos.x - this.size.width / 2 - glowSize,
        screenPos.y - this.size.height / 2 - glowSize,
        this.size.width + glowSize * 2,
        this.size.height + glowSize * 2
      );
      
      // 显示速度百分比
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      const speedText = `${this.getFlySpeedPercentage()}%`;
      ctx.fillText(speedText, screenPos.x, screenPos.y - this.size.height / 2 - 15);
    }
    
    // 玩家眼睛
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
    
    // 调试信息（可选）
    if (this.showDebugInfo) {
      this.renderDebugInfo(ctx, screenPos);
    }
  }
  
  /**
   * 渲染调试信息
   */
  renderDebugInfo(ctx, screenPos) {
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    
    const debugText = [
      `Pos: (${Math.round(this.position.x)}, ${Math.round(this.position.y)})`,
      `Vel: (${Math.round(this.physics.velocity.x)}, ${Math.round(this.physics.velocity.y)})`,
      `Ground: ${this.physics.onGround}`,
      `Jump: ${this.physics.canJump}`,
      `Flying: ${this.flyMode.enabled}`,
      this.flyMode.enabled ? `Speed: ${this.getFlySpeedPercentage()}%` : ''
    ].filter(text => text !== ''); // 过滤空字符串
    
    debugText.forEach((text, index) => {
      ctx.fillText(text, screenPos.x + 20, screenPos.y - 30 + index * 14);
    });
  }
  
  /**
   * 获取玩家位置
   */
  getPosition() {
    return { ...this.position };
  }
  
  /**
   * 设置玩家位置
   */
  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
    this.physics.velocity.x = 0;
    this.physics.velocity.y = 0;
  }
  
  /**
   * 获取玩家状态信息
   */
  getStatus() {
    return {
      position: { ...this.position },
      velocity: { ...this.physics.velocity },
      onGround: this.physics.onGround,
      canJump: this.physics.canJump,
      isFlying: this.flyMode.enabled,
      flySpeed: this.getFlySpeedPercentage(),
      health: this.health.current,
      maxHealth: this.health.max
    };
  }
  
  /**
   * 更新健康系统 (TODO #18)
   */
  updateHealth(deltaTime) {
    const currentTime = performance.now();
    
    // 自然回血（在没有受伤一段时间后）
    if (this.health.current < this.health.max && 
        currentTime - this.health.lastDamageTime > this.health.regenDelay) {
      
      const regenAmount = this.health.regenRate * deltaTime;
      this.health.current = Math.min(this.health.max, this.health.current + regenAmount);
    }
    
    // 检查是否死亡
    if (this.health.current <= 0) {
      this.handleDeath();
    }
  }
  
  /**
   * 摔伤检测 (TODO #18 & #26)
   * Author: Minecraft2D Development Team
   */
  checkFallDamage() {
    if (!this.fallDamage.enabled || this.flyMode.enabled) {
      return; // 飞行模式下不受摔伤
    }
    
    // 计算下落高度 (TODO #26)
    const fallHeight = this.fallDamage.fallStartY - this.position.y;
    
    // 检查是否达到最小摔伤高度（3倍跳跃高度）
    if (fallHeight < this.fallDamage.minFallHeight) {
      console.log(`🟢 下落高度不足: ${fallHeight.toFixed(1)}像素 < ${this.fallDamage.minFallHeight.toFixed(1)}像素，无摔伤`);
      return;
    }
    
    // 获取落地时的下落速度 (取绝对值)
    const fallSpeed = Math.abs(this.physics.velocity.y);
    this.fallDamage.lastFallSpeed = fallSpeed;
    
    // 只有超过最小摔伤速度才会受伤
    if (fallSpeed < this.fallDamage.minFallSpeed) {
      console.log(`🟢 落地速度不足: ${fallSpeed.toFixed(1)} < ${this.fallDamage.minFallSpeed}，无摔伤`);
      return;
    }
    
    // 计算伤害值（线性插值）
    const speedRange = this.fallDamage.maxFallSpeed - this.fallDamage.minFallSpeed;
    const damageRange = this.fallDamage.maxDamage - this.fallDamage.minDamage;
    const speedRatio = Math.min(1, (fallSpeed - this.fallDamage.minFallSpeed) / speedRange);
    const damage = this.fallDamage.minDamage + (damageRange * speedRatio);
    
    // 应用伤害
    this.takeDamage(Math.round(damage), 'fall');
    
    console.log(`😵 摔伤! 下落高度: ${fallHeight.toFixed(1)}像素, 落地速度: ${fallSpeed.toFixed(1)}, 伤害: ${Math.round(damage)}, 剩余生命: ${this.health.current}`);
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
    
    console.log(`💔 玩家受伤: ${actualDamage} (类型: ${type}), 剩余生命: ${this.health.current}/${this.health.max}`);
    
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
      console.log(`❤️ 玩家治疗: +${actualHeal}, 当前生命: ${this.health.current}/${this.health.max}`);
    }
    
    return actualHeal;
  }
  
  /**
   * 死亡处理
   */
  handleDeath() {
    console.log('💀 玩家死亡!');
    
    // 重置生命值
    this.health.current = this.health.max;
    this.health.lastDamageTime = 0;
    
    // 重生
    this.respawn();
  }
  
  /**
   * 切换调试信息显示
   */
  toggleDebugInfo() {
    this.showDebugInfo = !this.showDebugInfo;
  }
  
  /**
   * 导出玩家数据（用于保存）
   */
  exportData() {
    return {
      position: { ...this.position },
      physics: {
        velocity: { ...this.physics.velocity },
        onGround: this.physics.onGround
      },
      appearance: { ...this.appearance },
      flyMode: { ...this.flyMode },
      inventory: this.inventory.toSaveData()
    };
  }
  
  /**
   * 导入玩家数据（用于加载）
   */
  importData(data) {
    if (data.position) {
      this.position = { ...this.position, ...data.position };
    }
    if (data.physics) {
      if (data.physics.velocity) {
        this.physics.velocity = { ...data.physics.velocity };
      }
      if (typeof data.physics.onGround === 'boolean') {
        this.physics.onGround = data.physics.onGround;
      }
    }
    if (data.appearance) {
      this.appearance = { ...this.appearance, ...data.appearance };
    }
    if (data.flyMode) {
      this.flyMode = { ...this.flyMode, ...data.flyMode };
    }
    if (data.inventory) {
      this.inventory.fromSaveData(data.inventory);
    }
  }
  
  /**
   * 初始化起始物品
   */
  initializeStartingItems() {
    // 给玩家一些起始物品用于测试
    this.inventory.addItem('pickaxe_wood', 1);
    this.inventory.addItem('block_dirt', 64);
    this.inventory.addItem('block_stone', 32);
    this.inventory.addItem('block_grass', 16);
    this.inventory.addItem('apple', 5);
    
    console.log('🎒 玩家物品栏初始化完成');
    this.inventory.debugPrint();
  }
  
  /**
   * 获取当前手持物品
   */
  getHeldItem() {
    return this.inventory.getHeldItem();
  }
  
  /**
   * 设置选中的快捷栏槽位
   */
  setSelectedHotbarSlot(index) {
    this.inventory.setSelectedHotbarSlot(index);
  }
  
  /**
   * 获取物品栏系统
   */
  getInventory() {
    return this.inventory;
  }
  
  /**
   * 向物品栏添加物品
   */
  addItemToInventory(itemId, count = 1, durability = null) {
    const remaining = this.inventory.addItem(itemId, count, durability);
    if (remaining > 0) {
      console.log(`⚠️ 物品栏已满，无法添加 ${remaining} 个 ${itemId}`);
    }
    return remaining;
  }
  
  /**
   * 从物品栏移除物品
   */
  removeItemFromInventory(itemId, count = 1) {
    return this.inventory.removeItem(itemId, count);
  }
  
  /**
   * 检查物品栏中是否有指定物品
   */
  hasItemInInventory(itemId, count = 1) {
    return this.inventory.hasItem(itemId, count);
  }
  
  /**
   * 消耗手持物品的耐久度
   */
  damageHeldItem(damage = 1) {
    const heldItem = this.getHeldItem();
    if (heldItem && !heldItem.isEmpty() && heldItem.durability !== null) {
      heldItem.durability -= damage;
      
      // 如果耐久度用完，移除物品
      if (heldItem.durability <= 0) {
        heldItem.clear();
        console.log('🔨 工具损坏!');
        return true; // 工具损坏
      }
    }
    return false; // 工具没有损坏
  }
  
  /**
   * 检查手持物品是否可以挖掘指定方块
   */
  canMineBlockWithHeldItem(blockId) {
    const heldItem = this.getHeldItem();
    if (!heldItem || heldItem.isEmpty()) {
      return false; // 空手不能挖掘
    }
    
    const itemDef = heldItem.getItemDefinition();
    if (!itemDef || !itemDef.type.startsWith('tool_')) {
      return false; // 不是工具
    }
    
    // 获取方块类型
    const blockInfo = blockConfig.getBlockInfo(blockId);
    if (!blockInfo) {
      return false;
    }
    
    // 检查工具是否可以挖掘这种方块类型
    return itemConfig.canToolMineBlock(heldItem.itemId, blockInfo.type);
  }
}