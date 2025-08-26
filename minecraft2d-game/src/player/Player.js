/**
 * 玩家控制系统
 * 负责处理玩家移动、交互和状态管理
 */

import { blockConfig } from '../config/BlockConfig.js';
import { Inventory } from './Inventory.js';
import { itemConfig, ItemType } from '../config/ItemConfig.js';
import { ContainerManager } from '../blocks/ContainerManager.js';
import { inputManager } from '../input/InputManager.js'; // 新增导入
import { gameConfig } from '../config/GameConfig.js'; // 新增导入

// 导入拆分的子模块
import { PlayerPhysics } from './PlayerPhysics.js';
import { PlayerMovement } from './PlayerMovement.js';
import { PlayerHealth } from './PlayerHealth.js';
import { PlayerMining } from './PlayerMining.js';
import { PlayerPlacement } from './PlayerPlacement.js';
import { PlayerRendering } from './PlayerRendering.js';
import { PlayerInventory } from './PlayerInventory.js';
import { PlayerInteraction } from './PlayerInteraction.js';
import { PlayerSneak } from './PlayerSneak.js';

export class Player {
  constructor(worldConfig) {
    this.worldConfig = worldConfig;
    
    // 添加gameConfig引用
    this.gameConfig = gameConfig;
    
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
      speed: 70,           // 移动速度 (像素/秒)
      jumpForce: 300,       // 跳跃力度
      gravity: 700,         // 重力加速度
      friction: 0.9,        // 摩擦力
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
    
    // 潜行模式 (新增)
    this.sneakMode = {
      enabled: false,       // 是否启用潜行模式
      speedMultiplier: 0.3  // 潜行时的速度倍率 (30%)
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
      prevPlace: false,     // 上一帧放置按键状态 (新增)
      sneakLeft: false,     // 向左潜行按键 (新增)
      sneakRight: false     // 向右潜行按键 (新增)
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
    
    // 初始化子模块
    this.physicsModule = new PlayerPhysics(this);
    this.movementModule = new PlayerMovement(this);
    this.healthModule = new PlayerHealth(this);
    this.miningModule = new PlayerMining(this);
    this.placementModule = new PlayerPlacement(this);
    this.renderingModule = new PlayerRendering(this);
    this.inventoryModule = new PlayerInventory(this);
    this.interactionModule = new PlayerInteraction(this);
    this.sneakModule = new PlayerSneak(this);
    
    // 给玩家一些初始物品用于测试
    this.initializeStartingItems();
    
    // 初始化摔伤高度为3倍跳跃高度 (TODO #26)
    // 跳跃高度大约为 jumpForce^2 / (2 * gravity) 像素
    const jumpHeight = (this.physics.jumpForce * this.physics.jumpForce) / (2 * this.physics.gravity);
    this.fallDamage.minFallHeight = jumpHeight * 3;
    
    // 初始化动画控制器
    this.animationController = null;
    
    // 初始化音频控制器 (新增)
    // this.audioController = null;
    
    // 注册玩家控制按键处理函数
    this.registerControlKeyHandlers();
    
    console.log('👤 Player 初始化完成');
    console.log(`🟢 跳跃高度: ${jumpHeight.toFixed(1)}像素, 最小摔伤高度: ${this.fallDamage.minFallHeight.toFixed(1)}像素`);
  }
  
  /**
   * 注册玩家控制按键处理函数
   */
  registerControlKeyHandlers() {
    this.movementModule.registerControlKeyHandlers();
  }
  
  /**
   * 注册按键释放处理函数
   */
  registerKeyReleaseHandlers() {
    this.movementModule.registerKeyReleaseHandlers();
  }
  
  /**
   * 更新玩家状态
   * @param {number} deltaTime - 时间增量
   * @param {Object} keys - 按键状态对象（为了向后兼容保留）
   */
  update(deltaTime, keys) {
    // 更新朝向
    this.movementModule.updateFacing();
    
    // 更新控制状态（使用新的输入管理器）
    this.movementModule.updateControls();
    
    // 更新物理状态
    this.physicsModule.updatePhysics(deltaTime);
    
    // 更新健康系统
    this.healthModule.updateHealth(deltaTime);
    
    // 更新挖掘逻辑
    this.miningModule.handleMining(deltaTime);
    
    // 更新放置逻辑
    this.placementModule.handleBlockPlacement(deltaTime);
    
    // 更新动画控制器
    if (this.animationController) {
      this.animationController.update(deltaTime);
    }
    
    // 更新音频控制器
    /*
    if (this.audioController) {
      this.audioController.update(deltaTime);
    }
    */
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
  
  /*
   * 设置音频控制器
   * @param {PlayerAudioController} audioController - 音频控制器
   */
  /*
  setAudioController(audioController) {
    this.audioController = audioController;
  }
  */
  
  /**
   * 设置鼠标位置
   * @param {number} x 鼠标世界坐标X
   * @param {number} y 鼠标世界坐标Y
   */
  setMousePosition(x, y) {
    this.mousePosition.x = x;
    this.mousePosition.y = y;
    // 立即更新朝向
    this.movementModule.updateFacing();
  }
  
  /**
   * 检查玩家是否在水中
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
      flySpeed: this.movementModule.getFlySpeedPercentage(),
      health: this.health.current,
      maxHealth: this.health.max,
      hunger: this.hunger.current,
      maxHunger: this.hunger.max,
      saturation: this.hunger.saturation
    };
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
   * 渲染玩家
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   * @param {Object} camera - 摄像机对象
   */
  render(ctx, camera) {
    this.renderingModule.render(ctx, camera);
  }
  
  /**
   * 渲染放置预览
   * @param {CanvasRenderingContext2D} ctx 渲染上下文
   * @param {Object} camera 摄像机对象
   */
  renderPlacementPreview(ctx, camera) {
    this.renderingModule.renderPlacementPreview(ctx, camera);
  }
  
  /**
   * 获取视线方向最近的方块
   */
  getTargetBlock() {
    return this.miningModule.getTargetBlock();
  }
  
  /**
   * 检查手持物品是否可以挖掘指定方块
   */
  canMineBlockWithHeldItem(blockId) {
    return this.miningModule.canMineBlockWithHeldItem(blockId);
  }
  
  /**
   * 获取放置预览位置
   */
  getPlacementPreviewPosition() {
    return this.placementModule.getPlacementPreviewPosition();
  }
  
  /**
   * 检查预览位置是否合法
   */
  isPlacementPreviewValid(position) {
    return this.placementModule.isPlacementPreviewValid(position);
  }
  
  /**
   * 初始化起始物品
   */
  initializeStartingItems() {
    this.inventoryModule.initializeStartingItems();
  }
  
  /**
   * 获取当前手持物品
   */
  getHeldItem() {
    return this.inventoryModule.getHeldItem();
  }
  
  /**
   * 设置选中的快捷栏槽位
   */
  setSelectedHotbarSlot(index) {
    this.inventoryModule.setSelectedHotbarSlot(index);
  }
  
  /**
   * 获取物品栏系统
   */
  getInventory() {
    return this.inventoryModule.getInventory();
  }
  
  /**
   * 向物品栏添加物品
   */
  addItemToInventory(itemId, count = 1, durability = null) {
    return this.inventoryModule.addItemToInventory(itemId, count, durability);
  }
  
  /**
   * 从物品栏移除物品
   */
  removeItemFromInventory(itemId, count = 1) {
    return this.inventoryModule.removeItemFromInventory(itemId, count);
  }
  
  /**
   * 检查物品栏中是否有指定物品
   */
  hasItemInInventory(itemId, count = 1) {
    return this.inventoryModule.hasItemInInventory(itemId, count);
  }
  
  /**
   * 消耗手持物品的耐久度
   */
  damageHeldItem(damage = 1) {
    return this.inventoryModule.damageHeldItem(damage);
  }
  
  /**
   * 受伤处理
   */
  takeDamage(amount, type = 'unknown') {
    return this.healthModule.takeDamage(amount, type);
  }
  
  /**
   * 治疗处理
   */
  heal(amount) {
    return this.healthModule.heal(amount);
  }
  
  /**
   * 重生玩家
   */
  respawn() {
    this.movementModule.respawn();
  }
  
  /**
   * 切换飞行模式
   */
  toggleFlyMode() {
    this.movementModule.toggleFlyMode();
  }
  
  /**
   * 检查是否在飞行模式
   */
  isFlying() {
    return this.movementModule.isFlying();
  }
  
  /**
   * 禁用飞行模式
   */
  disableFlyMode() {
    this.movementModule.disableFlyMode();
  }
  
  /**
   * 启用飞行模式
   */
  enableFlyMode() {
    this.movementModule.enableFlyMode();
  }
  
  /**
   * 提升飞行速度
   */
  increaseFlySpeed() {
    this.movementModule.increaseFlySpeed();
  }
  
  /**
   * 降低飞行速度
   */
  decreaseFlySpeed() {
    this.movementModule.decreaseFlySpeed();
  }
  
  /**
   * 获取飞行速度百分比
   */
  getFlySpeedPercentage() {
    return this.movementModule.getFlySpeedPercentage();
  }
  
  /**
   * 重置飞行速度为默认值
   */
  resetFlySpeed() {
    this.movementModule.resetFlySpeed();
  }
  
  /**
   * 消耗手持物品
   */
  consumeHeldItem(count = 1) {
    this.placementModule.consumeHeldItem(count);
  }
  
  /**
   * 处理容器交互逻辑
   */
  handleContainerInteraction() {
    this.interactionModule.handleContainerInteraction();
  }
  
  /**
   * 获取玩家朝向信息
   */
  getFacing() {
    return this.movementModule.getFacing();
  }
}

export default Player;
