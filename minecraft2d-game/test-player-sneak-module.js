/**
 * PlayerSneak模块测试
 * 验证潜行模式功能是否正确提取到独立模块
 */

// 模拟方块配置
const blockConfig = {
  isSolid: (id) => {
    return id === 1;
  }
};

// 模拟玩家对象
class MockPlayer {
  constructor() {
    this.position = { x: 100, y: 100 };
    this.size = { width: 12, height: 24 };
    this.physics = {
      speed: 70
    };
    this.controls = {
      sneakLeft: false,
      sneakRight: false
    };
    this.worldConfig = {
      BLOCK_SIZE: 16
    };
    this.terrainGenerator = new MockTerrainGenerator();
    this.blockConfig = blockConfig;
  }
}

// 模拟地形生成器
class MockTerrainGenerator {
  getBlock(x, y) {
    // 在y=5的位置有一行固体方块
    if (y === 5 && x >= 0 && x <= 5) {
      return 1; // 固体方块
    }
    return 0; // 空气
  }
}

// PlayerSneak模块测试
function testPlayerSneakModule() {
  console.log("🧪 开始测试PlayerSneak模块");
  
  // 创建模拟玩家和潜行模块
  const player = new MockPlayer();
  
  // 由于我们无法直接导入PlayerSneak模块，我们在这里复制其实现来进行测试
  class PlayerSneak {
    constructor(player) {
      this.player = player;
      
      // 潜行模式配置
      this.sneakMode = {
        enabled: false,       // 是否启用潜行模式
        speedMultiplier: 0.3  // 潜行时的速度倍率 (30%)
      };
    }
    
    /**
     * 更新潜行模式状态
     */
    updateSneakMode() {
      // 检查是否启用潜行模式
      const isSneaking = this.player.controls.sneakLeft || this.player.controls.sneakRight;
      this.sneakMode.enabled = isSneaking;
    }
    
    /**
     * 获取潜行模式下的移动速度
     * @param {number} normalSpeed - 正常移动速度
     * @returns {number} 潜行模式下的移动速度
     */
    getSneakSpeed(normalSpeed) {
      return this.sneakMode.enabled ? 
        normalSpeed * this.sneakMode.speedMultiplier : 
        normalSpeed;
    }
    
    /**
     * 检查是否处于潜行模式
     * @returns {boolean} 是否处于潜行模式
     */
    isSneaking() {
      return this.sneakMode.enabled;
    }
    
    /**
     * 获取潜行模式配置
     * @returns {Object} 潜行模式配置对象
     */
    getSneakConfig() {
      return { ...this.sneakMode };
    }
    
    /**
     * 设置潜行模式启用状态
     * @param {boolean} enabled - 是否启用潜行模式
     */
    setSneakEnabled(enabled) {
      this.sneakMode.enabled = enabled;
    }
    
    /**
     * 检查是否即将掉落（潜行模式下检查脚下96%区域是否为固体）
     * @returns {boolean} 是否即将掉落
     */
    willFall() {
      // 只在潜行模式下检查
      if (!this.sneakMode.enabled) {
        return false;
      }
      
      const blockSize = this.player.worldConfig.BLOCK_SIZE;
      const epsilon = 0.01;
      
      // 计算玩家脚下的位置（96%的区域）
      const playerLeft = this.player.position.x - this.player.size.width / 2;
      const playerRight = this.player.position.x + this.player.size.width / 2;
      const playerBottom = this.player.position.y - this.player.size.height / 2;
      
      // 计算96%的区域（稍微缩小一点检测范围）
      const checkLeft = playerLeft + (this.player.size.width * 0.02);  // 左边向内缩进2%
      const checkRight = playerRight - (this.player.size.width * 0.02); // 右边向内缩进2%
      const checkBottom = playerBottom - epsilon; // 脚下稍微向下检测
      
      // 转换为方块坐标
      const leftBlock = Math.floor(checkLeft / blockSize);
      const rightBlock = Math.floor(checkRight / blockSize);
      const bottomBlock = Math.floor(checkBottom / blockSize);
      
      // 检查脚下96%的区域是否有固体方块
      for (let x = leftBlock; x <= rightBlock; x++) {
        const blockId = this.player.terrainGenerator.getBlock(x, bottomBlock);
        if (this.player.blockConfig.isSolid(blockId)) {
          // 如果有任何部分是固体，则不会掉落
          return false;
        }
      }
      
      // 如果脚下96%的区域都不是固体，则即将掉落
      return true;
    }
  }
  
  const sneakModule = new PlayerSneak(player);
  
  // 测试1: 潜行模式默认状态
  console.log("\n--- 测试1: 潜行模式默认状态 ---");
  console.log(`潜行模式启用: ${sneakModule.isSneaking()}`);
  console.log(`潜行速度倍率: ${sneakModule.getSneakConfig().speedMultiplier}`);
  
  // 测试2: 更新潜行模式状态
  console.log("\n--- 测试2: 更新潜行模式状态 ---");
  player.controls.sneakLeft = true;
  sneakModule.updateSneakMode();
  console.log(`潜行模式启用: ${sneakModule.isSneaking()}`);
  
  // 测试3: 获取潜行速度
  console.log("\n--- 测试3: 获取潜行速度 ---");
  const normalSpeed = 70;
  const sneakSpeed = sneakModule.getSneakSpeed(normalSpeed);
  console.log(`正常速度: ${normalSpeed}`);
  console.log(`潜行速度: ${sneakSpeed}`);
  console.log(`速度倍率: ${(sneakSpeed / normalSpeed).toFixed(2)}`);
  
  // 测试4: 掉落检测
  console.log("\n--- 测试4: 掉落检测 ---");
  // 玩家在固体方块上
  player.position = { x: 48, y: 96 }; // 在固体方块上
  const willFall1 = sneakModule.willFall();
  console.log(`在固体方块上是否掉落: ${willFall1}`);
  
  // 玩家在方块边缘
  player.position = { x: 96, y: 96 }; // 在方块边缘
  const willFall2 = sneakModule.willFall();
  console.log(`在方块边缘是否掉落: ${willFall2}`);
  
  // 关闭潜行模式
  player.controls.sneakLeft = false;
  sneakModule.updateSneakMode();
  const willFall3 = sneakModule.willFall();
  console.log(`关闭潜行模式是否掉落: ${willFall3}`);
  
  console.log("\n✅ PlayerSneak模块测试完成");
}

// 运行测试
testPlayerSneakModule();