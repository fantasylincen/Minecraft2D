/**
 * 玩家控制系统
 * 负责处理玩家移动、交互和状态管理
 */

import { blockConfig } from '../config/BlockConfig.js';

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
    
    // 控制状态
    this.controls = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      prevJump: false
    };
    
    // 游戏引用
    this.terrainGenerator = null;
    
    console.log('👤 Player 初始化完成');
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
    
    // 应用物理模拟
    this.updatePhysics(deltaTime);
    
    // 处理碰撞检测
    this.handleCollisions();
    
    // 更新位置
    this.position.x += this.physics.velocity.x * deltaTime;
    this.position.y += this.physics.velocity.y * deltaTime;
    
    // 边界限制（防止掉出世界）
    this.constrainToWorld();
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
    
    // 跳跃控制（检测按键按下瞬间）
    const jumpPressed = keys['Space'] || keys['KeyW'] || keys['ArrowUp'];
    this.controls.jump = jumpPressed && !this.controls.prevJump;
    this.controls.prevJump = jumpPressed;
  }
  
  /**
   * 更新物理模拟
   */
  updatePhysics(deltaTime) {
    // 水平移动
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
    
    // 跳跃
    if (this.controls.jump && this.physics.canJump && this.physics.onGround) {
      this.physics.velocity.y = this.physics.jumpForce;
      this.physics.onGround = false;
      this.physics.canJump = false;
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
   * 处理碰撞检测
   */
  handleCollisions() {
    if (!this.terrainGenerator) return;
    
    const blockSize = this.worldConfig.BLOCK_SIZE;
    
    // 计算玩家边界
    const left = this.position.x - this.size.width / 2;
    const right = this.position.x + this.size.width / 2;
    const top = this.position.y + this.size.height / 2;
    const bottom = this.position.y - this.size.height / 2;
    
    // 转换为方块坐标
    const leftBlock = Math.floor(left / blockSize);
    const rightBlock = Math.floor(right / blockSize);
    const topBlock = Math.floor(top / blockSize);
    const bottomBlock = Math.floor(bottom / blockSize);
    
    // 重置地面状态
    this.physics.onGround = false;
    
    // 检查垂直碰撞（地面和天花板）
    if (this.physics.velocity.y <= 0) { // 下落或静止
      for (let x = leftBlock; x <= rightBlock; x++) {
        const blockId = this.terrainGenerator.getBlock(x, bottomBlock);
        if (blockConfig.isSolid(blockId)) {
          const blockTop = (bottomBlock + 1) * blockSize;
          this.position.y = blockTop + this.size.height / 2;
          this.physics.velocity.y = 0;
          this.physics.onGround = true;
          this.physics.canJump = true;
          break;
        }
      }
    } else if (this.physics.velocity.y > 0) { // 上升
      for (let x = leftBlock; x <= rightBlock; x++) {
        const blockId = this.terrainGenerator.getBlock(x, topBlock);
        if (blockConfig.isSolid(blockId)) {
          const blockBottom = topBlock * blockSize;
          this.position.y = blockBottom - this.size.height / 2;
          this.physics.velocity.y = 0;
          break;
        }
      }
    }
    
    // 检查水平碰撞（左右墙壁）
    if (this.physics.velocity.x < 0) { // 向左移动
      for (let y = bottomBlock; y <= topBlock; y++) {
        const blockId = this.terrainGenerator.getBlock(leftBlock, y);
        if (blockConfig.isSolid(blockId)) {
          const blockRight = (leftBlock + 1) * blockSize;
          this.position.x = blockRight + this.size.width / 2;
          this.physics.velocity.x = 0;
          break;
        }
      }
    } else if (this.physics.velocity.x > 0) { // 向右移动
      for (let y = bottomBlock; y <= topBlock; y++) {
        const blockId = this.terrainGenerator.getBlock(rightBlock, y);
        if (blockConfig.isSolid(blockId)) {
          const blockLeft = rightBlock * blockSize;
          this.position.x = blockLeft - this.size.width / 2;
          this.physics.velocity.x = 0;
          break;
        }
      }
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
    
    // 玩家主体
    ctx.fillStyle = this.appearance.color;
    ctx.fillRect(
      screenPos.x - this.size.width / 2,
      screenPos.y - this.size.height / 2,
      this.size.width,
      this.size.height
    );
    
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
      `Jump: ${this.physics.canJump}`
    ];
    
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
      canJump: this.physics.canJump
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
      appearance: { ...this.appearance }
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
  }
}