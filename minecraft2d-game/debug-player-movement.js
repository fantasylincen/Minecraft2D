/**
 * 调试脚本：检查玩家移动问题
 */

// 模拟PlayerSneak模块的核心功能
class DebugPlayerSneak {
  constructor(player) {
    this.player = player;
    this.sneakMode = {
      enabled: false,
      speedMultiplier: 0.3
    };
  }
  
  updateSneakMode() {
    const isSneaking = this.player.controls.sneakLeft || this.player.controls.sneakRight;
    this.sneakMode.enabled = isSneaking;
    console.log(`[PlayerSneak] 潜行模式更新: ${this.sneakMode.enabled}`);
  }
  
  getSneakSpeed(normalSpeed) {
    const speed = this.sneakMode.enabled ? 
      normalSpeed * this.sneakMode.speedMultiplier : 
      normalSpeed;
    console.log(`[PlayerSneak] 获取速度: 正常=${normalSpeed}, 潜行=${speed}`);
    return speed;
  }
  
  isSneaking() {
    console.log(`[PlayerSneak] 检查潜行状态: ${this.sneakMode.enabled}`);
    return this.sneakMode.enabled;
  }
}

// 模拟PlayerPhysics模块的核心功能
class DebugPlayerPhysics {
  constructor(player) {
    this.player = player;
  }
  
  updateNormalPhysics(deltaTime) {
    console.log("[PlayerPhysics] 更新正常模式物理");
    
    // 更新潜行模式状态
    this.player.sneakModule.updateSneakMode();
    
    // 根据潜行模式调整移动速度
    const moveSpeed = this.player.sneakModule.getSneakSpeed(this.player.physics.speed);
    
    console.log(`[PlayerPhysics] 移动速度: ${moveSpeed}`);
    
    // 水平移动 - 简化逻辑
    // 修复：确保正常的左右移动优先级高于潜行移动
    if (this.player.controls.left) {
      this.player.physics.velocity.x = this.player.inWater.isSwimming ? 
        -this.player.inWater.swimSpeed : -moveSpeed;
      console.log(`[PlayerPhysics] 向左移动（正常），速度: ${this.player.physics.velocity.x}`);
    } else if (this.player.controls.right) {
      this.player.physics.velocity.x = this.player.inWater.isSwimming ? 
        this.player.inWater.swimSpeed : moveSpeed;
      console.log(`[PlayerPhysics] 向右移动（正常），速度: ${this.player.physics.velocity.x}`);
    } else if (this.player.controls.sneakLeft) {
      // 潜行向左移动
      this.player.physics.velocity.x = this.player.inWater.isSwimming ? 
        -this.player.inWater.swimSpeed : -moveSpeed;
      console.log(`[PlayerPhysics] 向左移动（潜行），速度: ${this.player.physics.velocity.x}`);
    } else if (this.player.controls.sneakRight) {
      // 潜行向右移动
      this.player.physics.velocity.x = this.player.inWater.isSwimming ? 
        this.player.inWater.swimSpeed : moveSpeed;
      console.log(`[PlayerPhysics] 向右移动（潜行），速度: ${this.player.physics.velocity.x}`);
    } else {
      console.log("[PlayerPhysics] 无水平移动输入");
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
      console.log("[PlayerPhysics] 跳跃");
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
    
    console.log(`[PlayerPhysics] 最终速度: x=${this.player.physics.velocity.x}, y=${this.player.physics.velocity.y}`);
  }
}

// 模拟玩家对象
class DebugPlayer {
  constructor() {
    this.controls = {
      left: false,
      right: false,
      jump: false,
      sneakLeft: false,
      sneakRight: false
    };
    
    this.physics = {
      velocity: { x: 0, y: 0 },
      speed: 70,
      jumpForce: 300,
      gravity: 700,
      friction: 0.9,
      terminalVelocity: 500,
      onGround: true,
      canJump: true
    };
    
    this.inWater = {
      isSwimming: false,
      swimSpeed: 75,
      buoyancy: 0.5,
      waterFriction: 0.95,
      swimUpForce: 200
    };
    
    this.sneakModule = new DebugPlayerSneak(this);
    this.physicsModule = new DebugPlayerPhysics(this);
  }
  
  resetControls() {
    this.controls = {
      left: false,
      right: false,
      jump: false,
      sneakLeft: false,
      sneakRight: false
    };
  }
}

// 测试函数
function testPlayerMovement() {
  console.log("=== 开始调试玩家移动 ===");
  
  const player = new DebugPlayer();
  
  // 测试1: 正常向右移动
  console.log("\n--- 测试1: 正常向右移动 ---");
  player.controls.right = true;
  player.physicsModule.updateNormalPhysics(0.016); // 60FPS的一帧
  
  // 测试2: 潜行向右移动
  console.log("\n--- 测试2: 潜行向右移动 ---");
  player.resetControls();
  player.controls.sneakRight = true;
  player.physicsModule.updateNormalPhysics(0.016);
  
  // 测试3: 同时按住右键和潜行键（正常移动优先）
  console.log("\n--- 测试3: 同时按住右键和潜行键（正常移动优先） ---");
  player.resetControls();
  player.controls.right = true;
  player.controls.sneakRight = true;
  player.physicsModule.updateNormalPhysics(0.016);
  
  // 测试4: 只有左键
  console.log("\n--- 测试4: 只有左键 ---");
  player.resetControls();
  player.controls.left = true;
  player.physicsModule.updateNormalPhysics(0.016);
  
  // 测试5: 只有潜行左键
  console.log("\n--- 测试5: 只有潜行左键 ---");
  player.resetControls();
  player.controls.sneakLeft = true;
  player.physicsModule.updateNormalPhysics(0.016);
  
  console.log("\n=== 调试完成 ===");
}

// 运行测试
testPlayerMovement();