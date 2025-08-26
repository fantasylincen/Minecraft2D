/**
 * 玩家移动控制系统
 * 负责处理玩家的移动控制和输入处理
 */

import { inputManager } from '../input/InputManager.js';

export class PlayerMovement {
  constructor(player) {
    this.player = player;
  }

  /**
   * 注册玩家控制按键处理函数
   */
  registerControlKeyHandlers() {
    // WASD移动控制
    inputManager.registerKeyHandler('KeyW', (event) => {
      if (this.player.flyMode.enabled) {
        this.player.controls.up = true;
      } else {
        this.player.controls.jump = true;
      }
    }, 'game', 0);
    
    inputManager.registerKeyHandler('KeyA', (event) => {
      this.player.controls.left = true;
    }, 'game', 0);
    
    inputManager.registerKeyHandler('KeyS', (event) => {
      this.player.controls.down = true;
    }, 'game', 0);
    
    inputManager.registerKeyHandler('KeyD', (event) => {
      this.player.controls.right = true;
    }, 'game', 0);
    
    // 方向键移动控制
    inputManager.registerKeyHandler('ArrowUp', (event) => {
      if (this.player.flyMode.enabled) {
        this.player.controls.up = true;
      } else {
        this.player.controls.jump = true;
      }
    }, 'game', 0);
    
    inputManager.registerKeyHandler('ArrowLeft', (event) => {
      this.player.controls.left = true;
    }, 'game', 0);
    
    inputManager.registerKeyHandler('ArrowDown', (event) => {
      this.player.controls.down = true;
    }, 'game', 0);
    
    inputManager.registerKeyHandler('ArrowRight', (event) => {
      this.player.controls.right = true;
    }, 'game', 0);
    
    // 空格键跳跃
    inputManager.registerKeyHandler('Space', (event) => {
      if (!this.player.flyMode.enabled) {
        this.player.controls.jump = true;
      }
    }, 'game', 0);
    
    // 注册按键释放处理
    this.registerKeyReleaseHandlers();
  }

  /**
   * 注册按键释放处理函数
   */
  registerKeyReleaseHandlers() {
    // WASD释放控制
    inputManager.registerKeyHandler('KeyW', (event) => {
      if (this.player.flyMode.enabled) {
        this.player.controls.up = false;
      } else {
        this.player.controls.jump = false;
      }
    }, 'game', 0, true); // true表示是释放处理
    
    inputManager.registerKeyHandler('KeyA', (event) => {
      this.player.controls.left = false;
    }, 'game', 0, true);
    
    inputManager.registerKeyHandler('KeyS', (event) => {
      this.player.controls.down = false;
    }, 'game', 0, true);
    
    inputManager.registerKeyHandler('KeyD', (event) => {
      this.player.controls.right = false;
    }, 'game', 0, true);
    
    // 方向键释放控制
    inputManager.registerKeyHandler('ArrowUp', (event) => {
      if (this.player.flyMode.enabled) {
        this.player.controls.up = false;
      } else {
        this.player.controls.jump = false;
      }
    }, 'game', 0, true);
    
    inputManager.registerKeyHandler('ArrowLeft', (event) => {
      this.player.controls.left = false;
    }, 'game', 0, true);
    
    inputManager.registerKeyHandler('ArrowDown', (event) => {
      this.player.controls.down = false;
    }, 'game', 0, true);
    
    inputManager.registerKeyHandler('ArrowRight', (event) => {
      this.player.controls.right = false;
    }, 'game', 0, true);
    
    // 空格键释放
    inputManager.registerKeyHandler('Space', (event) => {
      this.player.controls.jump = false;
    }, 'game', 0, true);
  }

  /**
   * 更新控制状态（使用新的输入管理器）
   */
  updateControls() {
    // 控制状态已经在按键处理函数中更新，这里只需要处理一些特殊逻辑
    
    // 检查飞行模式切换
    if (this.player.controls.fly && !this.player.prevFly) {
      this.player.toggleFlyMode();
    }
    this.player.prevFly = this.player.controls.fly;
    
    // 检查飞行速度调节
    if (this.player.controls.speedUp && !this.player.prevSpeedUp) {
      this.player.increaseFlySpeed();
    }
    this.player.prevSpeedUp = this.player.controls.speedUp;
    
    if (this.player.controls.speedDown && !this.player.prevSpeedDown) {
      this.player.decreaseFlySpeed();
    }
    this.player.prevSpeedDown = this.player.controls.speedDown;
    
    // 检查挖掘
    if (this.player.controls.mine && !this.player.prevMine) {
      // 挖掘逻辑在handleMining中处理
    }
    this.player.prevMine = this.player.controls.mine;
  }

  /**
   * 提升飞行速度
   */
  increaseFlySpeed() {
    if (this.player.flyMode.speedMultiplier < this.player.flyMode.maxSpeedMultiplier) {
      this.player.flyMode.speedMultiplier = Math.min(
        this.player.flyMode.speedMultiplier + this.player.flyMode.speedStep,
        this.player.flyMode.maxSpeedMultiplier
      );
      console.log(`✈️ 飞行速度提升至: ${Math.round(this.player.flyMode.speedMultiplier * 100)}%`);
    }
  }

  /**
   * 降低飞行速度
   */
  decreaseFlySpeed() {
    if (this.player.flyMode.speedMultiplier > this.player.flyMode.minSpeedMultiplier) {
      this.player.flyMode.speedMultiplier = Math.max(
        this.player.flyMode.speedMultiplier - this.player.flyMode.speedStep,
        this.player.flyMode.minSpeedMultiplier
      );
      console.log(`✈️ 飞行速度降低至: ${Math.round(this.player.flyMode.speedMultiplier * 100)}%`);
    }
  }

  /**
   * 设置飞行速度倍率
   */
  setFlySpeedMultiplier(multiplier) {
    this.player.flyMode.speedMultiplier = Math.max(
      this.player.flyMode.minSpeedMultiplier,
      Math.min(multiplier, this.player.flyMode.maxSpeedMultiplier)
    );
    console.log(`✈️ 飞行速度设置为: ${Math.round(this.player.flyMode.speedMultiplier * 100)}%`);
  }

  /**
   * 获取飞行速度倍率
   */
  getFlySpeedMultiplier() {
    return this.player.flyMode.speedMultiplier;
  }

  /**
   * 获取飞行速度百分比
   */
  getFlySpeedPercentage() {
    return Math.round(this.player.flyMode.speedMultiplier * 100);
  }

  /**
   * 重置飞行速度为默认值
   */
  resetFlySpeed() {
    this.player.flyMode.speedMultiplier = 1.0;
    console.log(`✈️ 飞行速度重置为: 100%`);
  }

  /**
   * 切换飞行模式
   */
  toggleFlyMode() {
    this.player.flyMode.enabled = !this.player.flyMode.enabled;
    
    if (this.player.flyMode.enabled) {
      console.log('✈️ 飞行模式开启');
      // 在开启飞行模式时，清除下落速度
      this.player.physics.velocity.y = 0;
      this.player.physics.onGround = false;
    } else {
      console.log('🚶 飞行模式关闭');
      // 关闭飞行模式时，清除垂直速度，让重力重新生效
      this.player.physics.velocity.y = 0;
    }
  }

  /**
   * 检查是否在飞行模式
   */
  isFlying() {
    return this.player.flyMode.enabled;
  }

  /**
   * 禁用飞行模式
   */
  disableFlyMode() {
    if (this.player.flyMode.enabled) {
      this.player.flyMode.enabled = false;
      this.player.physics.velocity.y = 0;
      console.log('🚶 飞行模式已禁用');
    }
  }

  /**
   * 启用飞行模式
   */
  enableFlyMode() {
    if (!this.player.flyMode.enabled) {
      this.player.flyMode.enabled = true;
      this.player.physics.velocity.y = 0;
      this.player.physics.onGround = false;
      console.log('✈️ 飞行模式已启用');
    }
  }

  /**
   * 重生玩家
   */
  respawn() {
    console.log('💀 玩家重生');
    
    // 寻找合适的重生点
    const spawnX = Math.floor(this.player.position.x / this.player.worldConfig.BLOCK_SIZE);
    let spawnY = this.player.worldConfig.WORLD_HEIGHT - 1;
    
    // 从上往下寻找第一个固体方块
    for (let y = this.player.worldConfig.WORLD_HEIGHT - 1; y >= 0; y--) {
      const blockId = this.player.terrainGenerator.getBlock(spawnX, y);
      if (this.player.blockConfig.isSolid(blockId)) {
        spawnY = y + 2; // 在固体方块上方2格
        break;
      }
    }
    
    this.player.position.x = spawnX * this.player.worldConfig.BLOCK_SIZE;
    this.player.position.y = spawnY * this.player.worldConfig.BLOCK_SIZE;
    this.player.physics.velocity.x = 0;
    this.player.physics.velocity.y = 0;
    this.player.physics.onGround = false;
  }

  /**
   * 更新玩家朝向 (新增)
   * 玩家可以360度自由朝向，朝向跟随鼠标位置发生变化
   */
  updateFacing() {
    // 根据鼠标位置更新朝向
    const deltaX = this.player.mousePosition.x - this.player.position.x;
    const deltaY = this.player.mousePosition.y - this.player.position.y;
    
    // 只有当鼠标位置有明显变化时才更新朝向
    if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
      // 计算朝向角度
      this.player.facing.angle = Math.atan2(deltaY, deltaX);
      this.player.facing.directionX = Math.cos(this.player.facing.angle);
      this.player.facing.directionY = Math.sin(this.player.facing.angle);
    }
  }

  /**
   * 获取玩家朝向信息
   */
  getFacing() {
    return { ...this.player.facing };
  }
}