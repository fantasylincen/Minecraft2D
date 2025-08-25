/**
 * 玩家控制系统
 * 负责处理玩家移动、交互和状态管理
 */

import { blockConfig } from '../config/BlockConfig.js';
import { Inventory } from './Inventory.js';
import { itemConfig, ItemType } from '../config/ItemConfig.js';
import { ContainerManager } from '../blocks/ContainerManager.js';
import { PlayerAudioController } from '../audio/PlayerAudioController.js';

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
    
    // 玩家朝向 (新增)
    this.facing = {
      angle: 0, // 朝向角度 (弧度)
      directionX: 1, // 朝向向量X分量
      directionY: 0  // 朝向向量Y分量
    };
    
    // 鼠标位置
    this.mousePosition = { x: 0, y: 0 };
    
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
    
    // 水中状态
    this.inWater = {
      isSwimming: false,    // 是否在游泳
      swimSpeed: 75,        // 游泳速度 (像素/秒)
      buoyancy: 0.5,        // 浮力系数 (0-1)
      waterFriction: 0.95,  // 水中摩擦力
      swimUpForce: 200      // 向上游动力
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
    
    // 饥饿值系统 (TODO #25)
    this.hunger = {
      current: 20,         // 当前饥饿值 (0-20)
      max: 20,            // 最大饥饿值
      saturation: 5,       // 饱和度 (0-20)
      exhaustion: 0,       // 疲劳度 (0-4)
      lastFoodTime: 0,     // 上次进食时间
      foodRegenDelay: 10000, // 进食后多久开始饥饿 (毫秒)
      lastStarveTime: 0    // 上次因饥饿掉血时间
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
      prevSpeedDown: false, // 上一帧降低速度按键状态
      mine: false,          // 挖掘按键状态
      prevMine: false,       // 上一帧挖掘按键状态
      place: false,         // 放置方块按键状态 (新增)
      prevPlace: false      // 上一帧放置按键状态 (新增)
    };
    
    // 挖掘系统 (TODO #25)
    this.mining = {
      targetBlock: null,     // 当前挖掘的目标方块
      miningProgress: 0,     // 挖掘进度 (0-1)
      miningTime: 0,         // 已挖掘时间
      isMining: false,       // 是否正在挖掘
      lastMineTime: 0,       // 上次挖掘时间
      mineCooldown: 100      // 挖掘冷却时间(毫秒)
    };
    
    // 放置方块系统 (新增 - 放置方块功能 - 基础实现)
    this.placement = {
      lastPlaceTime: 0,      // 上次放置时间
      placeCooldown: 200     // 放置冷却时间(毫秒)
    };
    
    // 游戏引用
    this.terrainGenerator = null;
    this.gameEngine = null;  // 新增游戏引擎引用
    
    // 物品栏系统
    this.inventory = new Inventory();
    
    // 给玩家一些初始物品用于测试
    this.initializeStartingItems();
    
    // 初始化摔伤高度为3倍跳跃高度 (TODO #26)
    // 跳跃高度大约为 jumpForce^2 / (2 * gravity) 像素
    const jumpHeight = (this.physics.jumpForce * this.physics.jumpForce) / (2 * this.physics.gravity);
    this.fallDamage.minFallHeight = jumpHeight * 3;
    
    // 初始化动画控制器
    this.animationController = null;
    
    // 初始化音频控制器 (新增)
    this.audioController = null;
    
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
   * 设置游戏引擎引用
   * @param {GameEngine} gameEngine - 游戏引擎
   */
  setGameEngine(gameEngine) {
    this.gameEngine = gameEngine;
  }
  
  /**
   * 设置动画控制器
   * @param {PlayerAnimationController} animationController - 动画控制器
   */
  setAnimationController(animationController) {
    this.animationController = animationController;
  }
  
  /**
   * 设置音频控制器
   * @param {PlayerAudioController} audioController - 音频控制器
   */
  setAudioController(audioController) {
    this.audioController = audioController;
  }
  
  /**
   * 设置鼠标位置
   */
  setMousePosition(x, y) {
    this.mousePosition.x = x;
    this.mousePosition.y = y;
  }
  
   * @param {number} x 鼠标世界坐标X
   * @param {number} y 鼠标世界坐标Y
   */
  setMousePosition(x, y) {
    this.mousePosition.x = x;
    this.mousePosition.y = y;
    // 立即更新朝向
    this.updateFacing();
  }
  
  /**
   * 检查玩家是否在水中
   * @returns {boolean} 是否在水中
   */
  isInWater() {
    if (!this.terrainGenerator) return false;
    
    const blockSize = this.worldConfig.BLOCK_SIZE;
    const epsilon = 0.01;
    
    // 计算玩家中心位置
    const centerX = this.position.x;
    const centerY = this.position.y;
    
    // 转换为中心方块坐标
    const centerBlockX = Math.floor(centerX / blockSize);
    const centerBlockY = Math.floor(centerY / blockSize);
    
    // 检查中心位置是否在水中
    const centerBlockId = this.terrainGenerator.getBlock(centerBlockX, centerBlockY);
    if (blockConfig.isFluid(centerBlockId)) {
      return true;
    }
    
    // 检查玩家身体其他部分是否在水中
    const left = this.position.x - this.size.width / 2 + epsilon;
    const right = this.position.x + this.size.width / 2 - epsilon;
    const top = this.position.y + this.size.height / 2 - epsilon;
    const bottom = this.position.y - this.size.height / 2 + epsilon;
    
    const leftBlock = Math.floor(left / blockSize);
    const rightBlock = Math.floor(right / blockSize);
    const topBlock = Math.floor(top / blockSize);
    const bottomBlock = Math.floor(bottom / blockSize);
    
    // 检查玩家周围的方块是否为水
    for (let x = leftBlock; x <= rightBlock; x++) {
      for (let y = bottomBlock; y <= topBlock; y++) {
        const blockId = this.terrainGenerator.getBlock(x, y);
        if (blockConfig.isFluid(blockId)) {
          return true;
        }
      }
    }
    
    return false;
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
    
    // 更新玩家朝向 (新增)
    this.updateFacing();
    
    // 检查是否在水中
    this.inWater.isSwimming = this.isInWater();
    
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
    
    // 处理挖掘逻辑
    this.handleMining(deltaTime);
    
    // 处理放置方块逻辑 (新增 - 放置方块功能 - 基础实现)
    this.handleBlockPlacement();
    
    // 处理容器交互逻辑 (新增)
    this.handleContainerInteraction();
    
    // 更新动画控制器
    if (this.animationController) {
      this.animationController.update(deltaTime);
    }
    
    // 更新音频控制器 (新增)
    if (this.audioController) {
      this.audioController.update(deltaTime);
    }
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
    
    // 挖掘控制 - 使用空格键（长按）
    const minePressed = keys['Space'];
    this.controls.mine = minePressed;
    // 注意：这里不使用prevMine来检测按下事件，而是检测持续按住
    
    // 放置方块控制 - 使用鼠标右键（新增）
    // 注意：鼠标事件需要在GameEngine中处理并传递给Player
    // 这里我们添加一个place控制状态，由外部设置
    // this.controls.place 将由外部设置
    
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
      this.physics.velocity.x = this.inWater.isSwimming ? 
        -this.inWater.swimSpeed : -this.physics.speed;
    } else if (this.controls.right) {
      this.physics.velocity.x = this.inWater.isSwimming ? 
        this.inWater.swimSpeed : this.physics.speed;
    } else {
      // 应用摩擦力（水中摩擦力不同）
      const friction = this.inWater.isSwimming ? 
        this.inWater.waterFriction : this.physics.friction;
      this.physics.velocity.x *= friction;
      if (Math.abs(this.physics.velocity.x) < 1) {
        this.physics.velocity.x = 0;
      }
    }
    
    // 跳跃 - 简化条件
    if (this.controls.jump && (this.physics.onGround || this.inWater.isSwimming)) {
      if (this.inWater.isSwimming) {
        // 在水中向上游动
        this.physics.velocity.y = this.inWater.swimUpForce;
      } else {
        // 正常跳跃
        this.physics.velocity.y = this.physics.jumpForce;
        this.physics.onGround = false;
        this.physics.canJump = false;
      }
    }
    
    // 更新下落高度跟踪 (TODO #26)
    this.updateFallTracking();
    
    // 应用重力（水中重力不同）
    if (!this.physics.onGround) {
      const gravity = this.inWater.isSwimming ? 
        this.physics.gravity * (1 - this.inWater.buoyancy) : this.physics.gravity;
      this.physics.velocity.y -= gravity * deltaTime;
      
      // 限制最大下落速度
      const terminalVelocity = this.inWater.isSwimming ? 
        this.physics.terminalVelocity * 0.5 : this.physics.terminalVelocity;
      if (this.physics.velocity.y < -terminalVelocity) {
        this.physics.velocity.y = -terminalVelocity;
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
    const top = this.position.y + this.size.height / 2 + epsilon;
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
    
    // 应用动画偏移
    let animatedScreenPos = { ...screenPos };
    let animatedSize = { ...this.size };
    
    if (this.animationController) {
      // 获取动画偏移值
      const bodyOffsetX = this.animationController.getAnimationValue('bodyOffsetX') || 0;
      const bodyOffsetY = this.animationController.getAnimationValue('bodyOffsetY') || 0;
      const bodyScale = this.animationController.getAnimationValue('bodyScale') || 1;
      
      animatedScreenPos.x += bodyOffsetX;
      animatedScreenPos.y += bodyOffsetY;
      animatedSize.width *= bodyScale;
      animatedSize.height *= bodyScale;
      
      // 获取闪烁效果
      const flashAlpha = this.animationController.getAnimationValue('flashAlpha');
      if (flashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${flashAlpha})`;
        ctx.fillRect(
          animatedScreenPos.x - animatedSize.width / 2,
          animatedScreenPos.y - animatedSize.height / 2,
          animatedSize.width,
          animatedSize.height
        );
      }
    }
    
    // 玩家主体颜色根据飞行模式和水中状态改变
    let playerColor = this.appearance.color;
    if (this.flyMode.enabled) {
      playerColor = '#87CEEB'; // 飞行时变为天空蓝
    } else if (this.inWater.isSwimming) {
      playerColor = '#1E90FF'; // 在水中变为水蓝色
    }
    
    ctx.fillStyle = playerColor;
    ctx.fillRect(
      animatedScreenPos.x - animatedSize.width / 2,
      animatedScreenPos.y - animatedSize.height / 2,
      animatedSize.width,
      animatedSize.height
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
    // 水中特效
    else if (this.inWater.isSwimming) {
      // 绘制水泡效果
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      // 随机生成一些小水泡
      for (let i = 0; i < 3; i++) {
        const bubbleX = screenPos.x + (Math.random() - 0.5) * this.size.width;
        const bubbleY = screenPos.y + (Math.random() - 0.5) * this.size.height;
        const bubbleSize = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // 玩家眼睛
    ctx.fillStyle = this.appearance.eyeColor;
    const eyeSize = 2;
    const eyeOffsetY = 6;
    
    // 应用动画效果到眼睛位置
    let eyeScreenPos = { ...screenPos };
    if (this.animationController) {
      const bodyOffsetX = this.animationController.getAnimationValue('bodyOffsetX') || 0;
      const bodyOffsetY = this.animationController.getAnimationValue('bodyOffsetY') || 0;
      eyeScreenPos.x += bodyOffsetX;
      eyeScreenPos.y += bodyOffsetY;
    }
    
    // 左眼
    ctx.fillRect(
      eyeScreenPos.x - 3,
      eyeScreenPos.y + eyeOffsetY,
      eyeSize,
      eyeSize
    );
    
    // 右眼
    ctx.fillRect(
      eyeScreenPos.x + 1,
      eyeScreenPos.y + eyeOffsetY,
      eyeSize,
      eyeSize
    );
    
    // 渲染玩家手中持有的物品
    this.renderHeldItem(ctx, screenPos);
    
    // 调试模式下渲染朝向激光线条 (新增)
    if (this.showDebugInfo) {
      this.renderFacingLaser(ctx, screenPos);
    }
    
    // 调试信息（可选）
    if (this.showDebugInfo) {
      this.renderDebugInfo(ctx, screenPos);
    }
  }
  
  /**
   * 渲染玩家朝向激光线条 (新增)
   * 调试模式下: 用一个从玩家身体中心发射一根宽度为2的亮蓝色激光线条指向玩家的朝向, 射线的长度为2个玩家的身高
   */
  renderFacingLaser(ctx, screenPos) {
    // 保存原始的变换状态
    ctx.save();
    
    // 设置激光线条样式
    ctx.strokeStyle = '#00FFFF'; // 亮蓝色
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // 计算激光线条的终点
    const laserLength = this.size.height * 2; // 2个玩家的身高
    const endX = screenPos.x + this.facing.directionX * laserLength;
    const endY = screenPos.y + this.facing.directionY * laserLength;
    
    // 绘制激光线条
    ctx.beginPath();
    ctx.moveTo(screenPos.x, screenPos.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // 恢复原始的变换状态
    ctx.restore();
  }
  
  /**
   * 渲染玩家手中持有的物品
   */
  renderHeldItem(ctx, screenPos) {
    const heldItem = this.getHeldItem();
    if (!heldItem || heldItem.isEmpty()) {
      return; // 没有手持物品，不渲染
    }
    
    const itemDef = heldItem.getItemDefinition();
    if (!itemDef) {
      return; // 物品定义不存在
    }
    
    // 获取物品图标（使用与UI中相同的映射）
    const itemIcon = this.getItemIcon(itemDef);
    if (!itemIcon) {
      return; // 没有图标
    }
    
    // 保存原始的变换状态
    ctx.save();
    
    // 设置渲染样式
    ctx.font = '10px Arial'; // 恢复为10px（原来20px的一半）
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 根据物品稀有度设置颜色
    const rarityColor = this.getItemRarityColor(itemDef.rarity);
    ctx.fillStyle = rarityColor;
    
    // 应用手臂动画
    let handX = screenPos.x + 10; // 右手位置
    let handY = screenPos.y - 5;  // 手的高度
    
    if (this.animationController) {
      const handOffsetX = this.animationController.getAnimationValue('handOffsetX') || 0;
      const handOffsetY = this.animationController.getAnimationValue('handOffsetY') || 0;
      handX += handOffsetX;
      handY += handOffsetY;
    }
    
    ctx.fillText(itemIcon, handX, handY);
    
    // 如果是工具类物品且有耐久度，渲染耐久度条
    if (heldItem.durability !== null && heldItem.durability !== undefined) {
      const maxDurability = itemDef.durability || itemDef.material?.durability || 100;
      const durabilityRatio = heldItem.durability / maxDurability;
      
      // 绘制耐久度条背景（恢复为原来的一半大小）
      const barWidth = 10; // 恢复为10（原来20的一半）
      const barHeight = 1.5; // 恢复为1.5（原来3的一半）
      const barX = handX - barWidth / 2;
      const barY = handY + 8; // 恢复为8（原来15的一半位置）
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // 绘制耐久度条
      ctx.fillStyle = durabilityRatio > 0.3 ? '#55ff55' : '#ff5555'; // 绿色或红色
      ctx.fillRect(barX, barY, barWidth * durabilityRatio, barHeight);
    }
    
    // 恢复原始的变换状态
    ctx.restore();
  }
  
  /**
   * 获取物品图标（与UI中相同的映射）
   */
  getItemIcon(item) {
    if (!item) return '';
    
    // 简单的图标映射（与InventoryUI.jsx中一致）
    const iconMap = {
      'block_dirt': '🟫',
      'block_stone': '⬜',
      'block_grass': '🟩',
      'block_sand': '🟨',
      'block_water': '🟦',
      'block_wood': '🟤',
      'block_leaves': '🍃',
      'block_iron_ore': '⚪',
      'block_gold_ore': '🟡',
      'block_diamond_ore': '💎',
      'pickaxe_wood': '⛏️',
      'pickaxe_stone': '🔨',
      'pickaxe_iron': '⚒️',
      'pickaxe_diamond': '💎⛏️',
      'iron_ingot': '🔗',
      'gold_ingot': '🥇',
      'diamond': '💎',
      'stick': '🪵',
      'apple': '🍎',
      'bread': '🍞'
    };
    
    return iconMap[item.id] || '❓';
  }
  
  /**
   * 获取物品稀有度颜色（与UI中相同的映射）
   */
  getItemRarityColor(rarity) {
    const ItemRarity = {
      COMMON: 'common',
      UNCOMMON: 'uncommon',
      RARE: 'rare',
      EPIC: 'epic',
      LEGENDARY: 'legendary'
    };
    
    switch (rarity) {
      case ItemRarity.COMMON: return '#ffffff';
      case ItemRarity.UNCOMMON: return '#55ff55';
      case ItemRarity.RARE: return '#5555ff';
      case ItemRarity.EPIC: return '#aa00aa';
      case ItemRarity.LEGENDARY: return '#ffaa00';
      default: return '#ffffff';
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
      `In Water: ${this.inWater.isSwimming}`,
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
      maxHealth: this.health.max,
      hunger: this.hunger.current,
      maxHunger: this.hunger.max,
      saturation: this.hunger.saturation
    };
  }
  
  /**
   * 更新健康系统 (TODO #18)
   */
  updateHealth(deltaTime) {
    const currentTime = performance.now();
    
    // 更新饥饿值系统
    this.updateHunger(deltaTime);
    
    // 自然回血（在没有受伤一段时间后，且饥饿值足够）
    if (this.health.current < this.health.max && 
        currentTime - this.health.lastDamageTime > this.health.regenDelay &&
        this.hunger.current >= 18) { // 需要足够的饥饿值才能回血
      
      const regenAmount = this.health.regenRate * deltaTime;
      this.health.current = Math.min(this.health.max, this.health.current + regenAmount);
    }
    
    // 检查是否因饥饿而掉血
    this.checkStarvation();
    
    // 检查是否死亡
    if (this.health.current <= 0) {
      this.handleDeath();
    }
  }
  
  /**
   * 更新饥饿值系统
   * @param {number} deltaTime 时间增量
   */
  updateHunger(deltaTime) {
    const currentTime = performance.now();
    
    // 增加疲劳度（基于活动）
    this.increaseExhaustion(deltaTime);
    
    // 当疲劳度达到4时，减少饱和度或饥饿值
    if (this.hunger.exhaustion >= 4) {
      this.hunger.exhaustion -= 4;
      
      if (this.hunger.saturation > 0) {
        this.hunger.saturation = Math.max(0, this.hunger.saturation - 1);
      } else if (this.hunger.current > 0) {
        this.hunger.current = Math.max(0, this.hunger.current - 1);
      }
    }
  }
  
  /**
   * 增加疲劳度
   * @param {number} deltaTime 时间增量
   */
  increaseExhaustion(deltaTime) {
    let exhaustionIncrease = 0;
    
    // 基础消耗
    exhaustionIncrease += 0.01 * deltaTime;
    
    // 移动消耗
    if (Math.abs(this.physics.velocity.x) > 0.1) {
      exhaustionIncrease += 0.01 * deltaTime;
    }
    
    // 跳跃消耗
    if (this.controls.jump && !this.physics.onGround) {
      exhaustionIncrease += 0.05;
    }
    
    // 游泳消耗
    if (this.inWater.isSwimming) {
      exhaustionIncrease += 0.015 * deltaTime;
    }
    
    // 飞行消耗
    if (this.flyMode.enabled) {
      exhaustionIncrease += 0.01 * deltaTime * this.flyMode.speedMultiplier;
    }
    
    this.hunger.exhaustion += exhaustionIncrease;
  }
  
  /**
   * 检查是否因饥饿而掉血
   */
  checkStarvation() {
    // 当饥饿值为0时，每4秒掉1点血
    if (this.hunger.current === 0) {
      const currentTime = performance.now();
      if (!this.hunger.lastStarveTime || currentTime - this.hunger.lastStarveTime > 4000) {
        this.takeDamage(1, 'starvation');
        this.hunger.lastStarveTime = currentTime;
      }
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
    this.inventory.addItem('apple', 10);
    this.inventory.addItem('bread', 5);
    
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
  
  /**
   * 处理挖掘逻辑 (TODO #9)
   * Author: Minecraft2D Development Team
   */
  handleMining(deltaTime) {
    if (!this.terrainGenerator) return;
    
    const currentTime = performance.now();
    
    // 检查是否按住空格键进行挖掘
    if (this.controls.mine) {
      // 检查冷却时间
      if (currentTime - this.mining.lastMineTime >= this.mining.mineCooldown) {
        // 获取视线方向最近的方块
        const targetBlock = this.getTargetBlock();
        
        if (targetBlock && targetBlock.blockId !== blockConfig.getBlock('air').id) {
          // 检查方块是否可破坏
          const blockInfo = blockConfig.getBlock(targetBlock.blockId);
          if (blockInfo && blockInfo.breakable) {
            // 检查手持工具是否可以挖掘该方块
            if (this.canMineBlockWithHeldItem(targetBlock.blockId)) {
              // 开始或继续挖掘
              this.startOrContinueMining(targetBlock, deltaTime);
            } else {
              // 工具不匹配，重置挖掘进度
              this.resetMiningProgress();
            }
          } else {
            // 方块不可破坏，重置挖掘进度
            this.resetMiningProgress();
          }
        } else {
          // 没有目标方块，重置挖掘进度
          this.resetMiningProgress();
        }
        
        this.mining.lastMineTime = currentTime;
      }
    } else {
      // 没有按住挖掘键，重置挖掘进度
      this.resetMiningProgress();
    }
  }
  
  /**
   * 处理放置方块逻辑 (新增 - 放置方块功能 - 基础实现)
   * Author: Minecraft2D Development Team
   */
  handleBlockPlacement() {
    if (!this.terrainGenerator) return;
    
    // 检查是否按下了放置键（右键）
    if (this.controls.place) {
      // 检查冷却时间，防止过快放置
      const currentTime = performance.now();
      if (currentTime - this.placement.lastPlaceTime >= this.placement.placeCooldown) {
        // 获取当前手持物品
        const heldItem = this.getHeldItem();
        
        // 检查手中是否有方块类物品
        if (heldItem && !heldItem.isEmpty() && heldItem.getItemDefinition().type === ItemType.BLOCK) {
          // 获取放置位置（玩家前方一格）
          const placementPosition = this.getPlacementPosition();
          
          if (placementPosition) {
            // 检查放置位置是否合法
            if (this.isPlacementPositionValid(placementPosition)) {
              // 放置方块
              const blockId = heldItem.getItemDefinition().blockId;
              if (this.terrainGenerator.setBlock(placementPosition.x, placementPosition.y, blockId)) {
                // 消耗物品
                this.consumeHeldItem(1);
                
                // 添加放置音效 (新增 - 放置方块功能 - 交互优化)
                this.playPlaceSound();
                
                // 添加放置成功提示 (新增 - 放置方块功能 - 交互优化)
                console.log(`✅ 放置方块成功: ${heldItem.getItemDefinition().name} at (${placementPosition.x}, ${placementPosition.y})`);
                
                // 更新最后放置时间 (新增 - 多方块放置优化 - 基础实现)
                this.placement.lastPlaceTime = currentTime;
              }
            } else {
              // 添加放置失败提示 (新增 - 放置方块功能 - 交互优化)
              console.log('❌ 放置位置不合法');
              this.showPlaceFailureMessage();
            }
          }
        } else {
          // 添加放置失败提示 (新增 - 放置方块功能 - 交互优化)
          console.log('❌ 手中没有可放置的方块');
          this.showPlaceFailureMessage();
        }
        
        // 更新最后放置时间 (移到这里以支持连续放置)
        this.placement.lastPlaceTime = currentTime;
      }
    }
  }
  
  /**
   * 播放放置音效 (新增 - 放置方块功能 - 交互优化)
   * Author: Minecraft2D Development Team
   */
  playPlaceSound() {
    // 简单的音效实现（使用Web Audio API）
    try {
      // 创建音频上下文
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // 创建振荡器
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // 连接节点
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // 设置音调和音量
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3音符
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      
      // 播放并快速停止
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
      
      console.log('🎵 播放放置音效');
    } catch (error) {
      // 如果Web Audio API不可用，使用控制台输出代替
      console.log('🎵 [音效] 方块放置');
    }
  }
  
  /**
   * 显示放置失败消息 (新增 - 放置方块功能 - 交互优化)
   * Author: Minecraft2D Development Team
   */
  showPlaceFailureMessage() {
    // 在实际游戏中，这里会显示一个短暂的提示消息
    // 目前使用控制台输出
    console.log('⚠️ 方块放置失败');
  }
  
  /**
   * 获取放置预览位置 (新增 - 方块放置预览 - 基础实现)
   * @returns {Object|null} 预览位置坐标
   */
  getPlacementPreviewPosition() {
    if (!this.terrainGenerator) return null;
    
    // 使用玩家的朝向方向计算预览位置
    const directionX = this.facing.directionX;
    const directionY = this.facing.directionY;
    
    // 计算玩家中心位置
    const playerCenterX = this.position.x;
    const playerCenterY = this.position.y;
    
    // 计算预览位置（玩家前方一格）
    const previewX = Math.floor((playerCenterX + directionX * this.worldConfig.BLOCK_SIZE) / this.worldConfig.BLOCK_SIZE);
    const previewY = Math.floor((playerCenterY + directionY * this.worldConfig.BLOCK_SIZE) / this.worldConfig.BLOCK_SIZE);
    
    return { x: previewX, y: previewY };
  }
  
  /**
   * 检查预览位置是否合法 (新增 - 方块放置预览 - 基础实现)
   * @param {Object} position 预览位置
   * @returns {boolean} 是否合法
   */
  isPlacementPreviewValid(position) {
    if (!this.terrainGenerator) return false;
    
    // 检查位置是否在世界范围内
    if (position.y < 0 || position.y >= this.worldConfig.WORLD_HEIGHT) {
      return false;
    }
    
    // 检查目标位置是否为空气方块
    const targetBlockId = this.terrainGenerator.getBlock(position.x, position.y);
    if (targetBlockId !== blockConfig.getBlock('air').id) {
      return false; // 目标位置已经有方块
    }
    
    // 检查预览位置是否与玩家碰撞
    // 简化检查：确保预览位置不在玩家占据的空间内
    const playerBlockX = Math.floor(this.position.x / this.worldConfig.BLOCK_SIZE);
    const playerBlockY = Math.floor(this.position.y / this.worldConfig.BLOCK_SIZE);
    
    if (position.x === playerBlockX && position.y === playerBlockY) {
      return false; // 不能在自己所在位置放置方块
    }
    
    // 检查预览位置是否在玩家身体范围内
    const playerLeft = Math.floor((this.position.x - this.size.width/2) / this.worldConfig.BLOCK_SIZE);
    const playerRight = Math.floor((this.position.x + this.size.width/2) / this.worldConfig.BLOCK_SIZE);
    const playerBottom = Math.floor((this.position.y - this.size.height/2) / this.worldConfig.BLOCK_SIZE);
    const playerTop = Math.floor((this.position.y + this.size.height/2) / this.worldConfig.BLOCK_SIZE);
    
    if (position.x >= playerLeft && position.x <= playerRight && 
        position.y >= playerBottom && position.y <= playerTop) {
      return false; // 预览位置与玩家身体重叠
    }
    
    return true;
  }
  
  /**
   * 渲染放置预览 (新增 - 方块放置预览 - 基础实现)
   * @param {CanvasRenderingContext2D} ctx 渲染上下文
   * @param {Object} camera 摄像机对象
   */
  renderPlacementPreview(ctx, camera) {
    if (!ctx || !camera) return;
    
    // 获取当前手持物品
    const heldItem = this.getHeldItem();
    
    // 检查手中是否有方块类物品
    if (!heldItem || heldItem.isEmpty() || heldItem.getItemDefinition().type !== ItemType.BLOCK) {
      return;
    }
    
    // 获取预览位置
    const previewPosition = this.getPlacementPreviewPosition();
    if (!previewPosition) return;
    
    // 检查预览位置是否合法
    const isValid = this.isPlacementPreviewValid(previewPosition);
    
    // 计算屏幕坐标
    const blockSize = this.worldConfig.BLOCK_SIZE;
    const worldPosX = previewPosition.x * blockSize + blockSize / 2;
    const worldPosY = previewPosition.y * blockSize + blockSize / 2;
    
    // 检查是否在视野内
    if (!camera.isInView(worldPosX, worldPosY)) {
      return;
    }
    
    const screenPos = camera.worldToScreen(worldPosX, worldPosY);
    const screenSize = blockSize * camera.zoom;
    
    // 如果方块太小就不渲染
    if (screenSize < 1) return;
    
    // 获取方块信息
    const blockId = heldItem.getItemDefinition().blockId;
    const block = blockConfig.getBlock(blockId);
    if (!block) return;
    
    // 保存当前上下文状态
    ctx.save();
    
    // 设置预览颜色（绿色表示可放置，红色表示不可放置）
    const baseColor = isValid ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
    
    // 添加预览方块的旋转动画 (新增 - 方块放置预览 - 视觉优化)
    const time = performance.now() / 1000; // 转换为秒
    const rotation = Math.sin(time * 2) * 0.1; // 轻微的旋转动画
    
    // 移动到方块中心并应用旋转
    ctx.translate(screenPos.x, screenPos.y);
    ctx.rotate(rotation);
    
    // 渲染半透明预览方块
    ctx.fillStyle = baseColor;
    ctx.fillRect(
      -screenSize / 2,
      -screenSize / 2,
      screenSize,
      screenSize
    );
    
    // 添加预览方块的边框效果 (新增 - 方块放置预览 - 视觉优化)
    ctx.strokeStyle = isValid ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = Math.max(1, screenSize * 0.1);
    ctx.strokeRect(
      -screenSize / 2,
      -screenSize / 2,
      screenSize,
      screenSize
    );
    
    // 优化预览方块的透明度变化 (新增 - 方块放置预览 - 视觉优化)
    const pulse = Math.sin(time * 3) * 0.2 + 0.8; // 0.6-1.0的脉冲效果
    const pulseColor = isValid ? 
      `rgba(0, 255, 0, ${0.5 * pulse})` : 
      `rgba(255, 0, 0, ${0.5 * pulse})`;
    
    // 渲染脉冲效果层
    ctx.fillStyle = pulseColor;
    ctx.fillRect(
      -screenSize / 2 + screenSize * 0.1,
      -screenSize / 2 + screenSize * 0.1,
      screenSize * 0.8,
      screenSize * 0.8
    );
    
    // 恢复上下文状态
    ctx.restore();
  }
  
  /**
   * 获取放置位置 (新增)
   * @returns {Object|null} 放置位置坐标
   */
  getPlacementPosition() {
    if (!this.terrainGenerator) return null;
    
    // 使用玩家的朝向方向计算放置位置
    const directionX = this.facing.directionX;
    const directionY = this.facing.directionY;
    
    // 计算玩家中心位置
    const playerCenterX = this.position.x;
    const playerCenterY = this.position.y;
    
    // 计算放置位置（玩家前方一格）
    const placementX = Math.floor((playerCenterX + directionX * this.worldConfig.BLOCK_SIZE) / this.worldConfig.BLOCK_SIZE);
    const placementY = Math.floor((playerCenterY + directionY * this.worldConfig.BLOCK_SIZE) / this.worldConfig.BLOCK_SIZE);
    
    return { x: placementX, y: placementY };
  }
  
  /**
   * 检查放置位置是否合法 (新增)
   * @param {Object} position 放置位置
   * @returns {boolean} 是否合法
   */
  isPlacementPositionValid(position) {
    if (!this.terrainGenerator) return false;
    
    // 检查位置是否在世界范围内
    if (position.y < 0 || position.y >= this.worldConfig.WORLD_HEIGHT) {
      return false;
    }
    
    // 检查目标位置是否为空气方块
    const targetBlockId = this.terrainGenerator.getBlock(position.x, position.y);
    if (targetBlockId !== blockConfig.getBlock('air').id) {
      return false; // 目标位置已经有方块
    }
    
    // 检查放置位置是否与玩家碰撞
    // 简化检查：确保放置位置不在玩家占据的空间内
    const playerBlockX = Math.floor(this.position.x / this.worldConfig.BLOCK_SIZE);
    const playerBlockY = Math.floor(this.position.y / this.worldConfig.BLOCK_SIZE);
    
    if (position.x === playerBlockX && position.y === playerBlockY) {
      return false; // 不能在自己所在位置放置方块
    }
    
    // 检查放置位置是否在玩家身体范围内
    const playerLeft = Math.floor((this.position.x - this.size.width/2) / this.worldConfig.BLOCK_SIZE);
    const playerRight = Math.floor((this.position.x + this.size.width/2) / this.worldConfig.BLOCK_SIZE);
    const playerBottom = Math.floor((this.position.y - this.size.height/2) / this.worldConfig.BLOCK_SIZE);
    const playerTop = Math.floor((this.position.y + this.size.height/2) / this.worldConfig.BLOCK_SIZE);
    
    if (position.x >= playerLeft && position.x <= playerRight && 
        position.y >= playerBottom && position.y <= playerTop) {
      return false; // 放置位置与玩家身体重叠
    }
    
    return true;
  }
  
  /**
   * 消耗手持物品 (新增)
   * @param {number} count 消耗数量
   */
  consumeHeldItem(count = 1) {
    const heldItem = this.getHeldItem();
    if (heldItem && !heldItem.isEmpty()) {
      // 从物品栏移除物品
      const removed = heldItem.removeItem(count);
      if (heldItem.count <= 0) {
        // 如果物品用完了，清空槽位
        heldItem.clear();
      }
    }
  }
  
  /**
   * 测试放置方块功能 (新增 - 用于测试)
   * Author: Minecraft2D Development Team
   */
  testBlockPlacement() {
    console.log('🧪 测试放置方块功能');
    
    // 检查玩家是否持有方块物品
    const heldItem = this.getHeldItem();
    if (!heldItem || heldItem.isEmpty()) {
      console.log('⚠️ 玩家手中没有物品');
      return false;
    }
    
    const itemDef = heldItem.getItemDefinition();
    if (!itemDef || itemDef.type !== ItemType.BLOCK) {
      console.log('⚠️ 玩家手中物品不是方块类型');
      return false;
    }
    
    console.log(`✅ 玩家持有方块: ${itemDef.name} (ID: ${itemDef.blockId})`);
    
    // 获取放置位置
    const placementPos = this.getPlacementPosition();
    if (!placementPos) {
      console.log('⚠️ 无法确定放置位置');
      return false;
    }
    
    console.log(`📍 放置位置: (${placementPos.x}, ${placementPos.y})`);
    
    // 检查放置位置是否合法
    const isValid = this.isPlacementPositionValid(placementPos);
    console.log(`⚖️ 放置位置合法性: ${isValid ? '合法' : '非法'}`);
    
    if (isValid) {
      console.log('✅ 放置方块功能测试通过');
      return true;
    } else {
      console.log('❌ 放置方块功能测试失败');
      return false;
    }
  }
  
  /**
   * 获取视线方向最近的方块 (TODO #9)
   * Author: Minecraft2D Development Team
   */
  getTargetBlock() {
    if (!this.terrainGenerator) return null;
    
    // 玩家眼睛位置（屏幕中心）
    const eyeX = this.position.x;
    const eyeY = this.position.y + 2; // 眼睛稍微高一点
    
    // 使用玩家的朝向方向计算视线方向
    const directionX = this.facing.directionX;
    const directionY = this.facing.directionY;
    
    // 射线步进参数
    const stepSize = 0.5; // 步进大小
    const maxDistance = 5; // 最大挖掘距离（方块数）
    
    // 将玩家位置转换为方块坐标
    let currentX = eyeX;
    let currentY = eyeY;
    
    // 沿视线方向步进
    for (let i = 0; i < maxDistance / stepSize; i++) {
      currentX += directionX * stepSize;
      currentY += directionY * stepSize;
      
      // 转换为方块坐标
      const blockX = Math.floor(currentX / this.worldConfig.BLOCK_SIZE);
      const blockY = Math.floor(currentY / this.worldConfig.BLOCK_SIZE);
      
      // 获取方块
      const blockId = this.terrainGenerator.getBlock(blockX, blockY);
      
      // 如果不是空气方块，返回这个方块
      if (blockId !== blockConfig.getBlock('air').id) {
        return {
          x: blockX,
          y: blockY,
          blockId: blockId
        };
      }
    }
    
    return null; // 没有找到目标方块
  }
  
  /**
   * 开始或继续挖掘 (TODO #9)
   * Author: Minecraft2D Development Team
   */
  startOrContinueMining(targetBlock, deltaTime) {
    // 检查是否是同一个方块
    if (this.mining.targetBlock && 
        this.mining.targetBlock.x === targetBlock.x && 
        this.mining.targetBlock.y === targetBlock.y) {
      // 继续挖掘同一方块
      this.mining.isMining = true;
    } else {
      // 开始挖掘新方块
      this.mining.targetBlock = targetBlock;
      this.mining.miningProgress = 0;
      this.mining.miningTime = 0;
      this.mining.isMining = true;
    }
    
    // 计算挖掘速度（基于方块硬度和工具）
    const blockInfo = blockConfig.getBlock(targetBlock.blockId);
    const hardness = blockInfo ? blockInfo.hardness || 1.0 : 1.0;
    
    // 获取手持工具的挖掘速度加成
    let speedMultiplier = 1.0;
    const heldItem = this.getHeldItem();
    if (heldItem && !heldItem.isEmpty()) {
      const itemDef = heldItem.getItemDefinition();
      if (itemDef && itemDef.type.startsWith('tool_')) {
        // 工具提供挖掘速度加成
        speedMultiplier = 1.5; // 示例加成
      }
    }
    
    // 计算挖掘时间（硬度越高，需要的时间越长）
    const baseMiningTime = hardness * 1000; // 基础挖掘时间（毫秒）
    const actualMiningTime = baseMiningTime / speedMultiplier;
    
    // 更新挖掘进度
    this.mining.miningTime += deltaTime * 1000; // 转换为毫秒
    this.mining.miningProgress = Math.min(1.0, this.mining.miningTime / actualMiningTime);
    
    // 检查是否挖掘完成
    if (this.mining.miningProgress >= 1.0) {
      this.completeMining(targetBlock);
    }
  }
  
  /**
   * 完成挖掘 (TODO #9)
   * Author: Minecraft2D Development Team
   */
  completeMining(targetBlock) {
    if (!this.terrainGenerator) return;
    
    // 破坏方块
    this.terrainGenerator.setBlock(targetBlock.x, targetBlock.y, blockConfig.getBlock('air').id);
    
    // 获取方块掉落物
    const blockInfo = blockConfig.getBlock(targetBlock.blockId);
    if (blockInfo && blockInfo.drops) {
      // 添加掉落物到物品栏
      blockInfo.drops.forEach(dropId => {
        this.addItemToInventory(dropId, 1);
      });
    }
    
    // 消耗工具耐久度
    const toolDamaged = this.damageHeldItem(1);
    if (toolDamaged) {
      console.log('🔨 工具在挖掘过程中损坏!');
    }
    
    console.log(`⛏️ 挖掘完成: 破坏方块 (${targetBlock.x}, ${targetBlock.y})`);
    
    // 重置挖掘状态
    this.resetMiningProgress();
  }
  
  /**
   * 更新玩家朝向 (新增)
   * 玩家可以360度自由朝向，朝向跟随鼠标位置发生变化
   */
  updateFacing() {
    // 根据鼠标位置更新朝向
    const deltaX = this.mousePosition.x - this.position.x;
    const deltaY = this.mousePosition.y - this.position.y;
    
    // 只有当鼠标位置有明显变化时才更新朝向
    if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
      // 计算朝向角度
      this.facing.angle = Math.atan2(deltaY, deltaX);
      this.facing.directionX = Math.cos(this.facing.angle);
      this.facing.directionY = Math.sin(this.facing.angle);
    }
  }
  
  /**
   * 获取玩家朝向信息
   */
  getFacing() {
    return { ...this.facing };
  }
  
  /**
   * 重置挖掘进度 (TODO #9)
   * Author: Minecraft2D Development Team
   */
  resetMiningProgress() {
    this.mining.targetBlock = null;
    this.mining.miningProgress = 0;
    this.mining.miningTime = 0;
    this.mining.isMining = false;
  }
  
  /**
   * 吃食物
   * @param {string} foodItemId 食物物品ID
   * @returns {boolean} 是否成功吃下食物
   */
  eatFood(foodItemId) {
    const foodItem = itemConfig.getItem(foodItemId);
    if (!foodItem || foodItem.type !== ItemType.FOOD) {
      return false;
    }
    
    // 检查是否能吃下食物（饥饿值未满）
    if (this.hunger.current >= this.hunger.max) {
      return false;
    }
    
    // 增加饥饿值和饱和度
    this.hunger.current = Math.min(this.hunger.max, this.hunger.current + (foodItem.foodValue || 0));
    this.hunger.saturation = Math.min(this.hunger.current, this.hunger.saturation + (foodItem.saturation || 0));
    
    // 记录进食时间
    this.hunger.lastFoodTime = performance.now();
    
    console.log(`🍎 吃了 ${foodItem.name}，饥饿值: ${this.hunger.current}/${this.hunger.max}, 饱和度: ${this.hunger.saturation}`);
    
    return true;
  }
  
  /**
   * 从物品栏消耗食物
   * @param {string} foodItemId 食物物品ID
   * @returns {boolean} 是否成功消耗食物
   */
  consumeFoodFromInventory(foodItemId) {
    // 检查物品栏中是否有该食物
    if (!this.inventory.hasItem(foodItemId, 1)) {
      return false;
    }
    
    // 消耗食物
    this.inventory.removeItem(foodItemId, 1);
    
    // 吃下食物
    return this.eatFood(foodItemId);
  }
}
