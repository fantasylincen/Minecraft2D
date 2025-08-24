/**
 * 放置方块功能测试脚本
 * 用于验证放置方块功能的正确性
 */

import { Player } from '../player/Player.js';
import { blockConfig } from '../config/BlockConfig.js';
import { itemConfig } from '../config/ItemConfig.js';

// 模拟世界配置
const mockWorldConfig = {
  WORLD_HEIGHT: 512,
  CHUNK_SIZE: 16,
  BLOCK_SIZE: 16
};

// 模拟地形生成器
class MockTerrainGenerator {
  constructor() {
    // 创建一个简单的测试世界
    this.world = [];
    for (let y = 0; y < mockWorldConfig.WORLD_HEIGHT; y++) {
      this.world[y] = [];
      for (let x = 0; x < 100; x++) {
        // 默认为空气
        this.world[y][x] = blockConfig.getBlock('air').id;
      }
    }
    
    // 在玩家位置下方放置一些地面方块
    const groundLevel = 300;
    for (let x = 0; x < 100; x++) {
      this.world[groundLevel][x] = blockConfig.getBlock('grass').id;
      this.world[groundLevel - 1][x] = blockConfig.getBlock('dirt').id;
      this.world[groundLevel - 2][x] = blockConfig.getBlock('dirt').id;
      this.world[groundLevel - 3][x] = blockConfig.getBlock('stone').id;
    }
  }
  
  getBlock(x, y) {
    if (y < 0 || y >= mockWorldConfig.WORLD_HEIGHT || x < 0 || x >= 100) {
      return blockConfig.getBlock('air').id;
    }
    return this.world[y][x] || blockConfig.getBlock('air').id;
  }
  
  setBlock(x, y, blockId) {
    if (y < 0 || y >= mockWorldConfig.WORLD_HEIGHT || x < 0 || x >= 100) {
      return false;
    }
    this.world[y][x] = blockId;
    return true;
  }
}

// 测试放置方块功能
async function testBlockPlacement() {
  console.log('🧪 开始测试放置方块功能...');
  
  try {
    // 创建玩家实例
    const player = new Player(mockWorldConfig);
    
    // 设置地形生成器
    const terrainGenerator = new MockTerrainGenerator();
    player.setTerrainGenerator(terrainGenerator);
    
    // 给玩家一些方块用于测试
    player.addItemToInventory('block_stone', 10);
    
    // 设置玩家位置
    player.position.x = 50 * mockWorldConfig.BLOCK_SIZE;
    player.position.y = 320 * mockWorldConfig.BLOCK_SIZE;
    
    // 设置玩家朝向
    player.facing.angle = 0; // 向右
    player.facing.directionX = 1;
    player.facing.directionY = 0;
    
    console.log('🎮 玩家初始状态:');
    console.log(`  位置: (${player.position.x}, ${player.position.y})`);
    console.log(`  朝向: 角度=${player.facing.angle}, 方向=(${player.facing.directionX}, ${player.facing.directionY})`);
    
    // 测试放置方块功能
    const result = player.testBlockPlacement();
    
    if (result) {
      console.log('✅ 放置方块功能测试通过!');
    } else {
      console.log('❌ 放置方块功能测试失败!');
    }
    
    return result;
  } catch (error) {
    console.error('💥 测试过程中发生错误:', error);
    return false;
  }
}

// 运行测试
testBlockPlacement().then(success => {
  console.log('\n🏁 测试完成');
  if (success) {
    console.log('🎉 所有测试都通过了!');
  } else {
    console.log('💥 部分测试失败了!');
  }
});

export { testBlockPlacement };