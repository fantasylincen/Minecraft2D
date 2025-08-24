/**
 * 玩家悬空不下落问题诊断工具
 * Author: Minecraft2D Development Team
 * 
 * 测试玩家在各种情况下的地面检测和重力应用
 */

import { Player } from './src/player/Player.js';
import { blockConfig } from './src/config/BlockConfig.js';

// 模拟世界配置
const mockWorldConfig = {
  CHUNK_SIZE: 64,
  WORLD_HEIGHT: 400,
  BLOCK_SIZE: 32
};

// 模拟地形生成器
class MockTerrainGenerator {
  constructor() {
    // 创建简单的测试地形：y=100以下为固体，y=100以上为空气
    this.terrain = new Map();
    
    // 生成平台地形用于测试
    for (let x = -10; x <= 10; x++) {
      for (let y = 0; y <= 105; y++) {
        if (y <= 100) {
          this.terrain.set(`${x},${y}`, blockConfig.getBlock('stone').id);
        } else {
          this.terrain.set(`${x},${y}`, blockConfig.getBlock('air').id);
        }
      }
    }
    
    // 创建一个平台：x=5-10, y=102 (悬空平台)
    for (let x = 5; x <= 10; x++) {
      this.terrain.set(`${x},102`, blockConfig.getBlock('stone').id);
    }
    
    console.log('🌍 模拟地形生成器初始化完成');
    console.log('  - 基础地面: y=100');
    console.log('  - 悬空平台: x=5-10, y=102');
  }
  
  getBlock(x, y) {
    const key = `${x},${y}`;
    return this.terrain.get(key) || blockConfig.getBlock('air').id;
  }
}

/**
 * 测试玩家悬空问题
 */
async function testPlayerSuspensionBug() {
  console.log('🔍 开始玩家悬空问题诊断...');
  
  try {
    // 创建玩家和模拟地形
    const player = new Player(mockWorldConfig);
    const terrain = new MockTerrainGenerator();
    player.setTerrainGenerator(terrain);
    
    // 测试场景1：玩家站在平台上
    console.log('\n📊 测试场景1: 玩家站在平台上');
    player.position.x = 7 * mockWorldConfig.BLOCK_SIZE; // x=7的位置
    player.position.y = 103 * mockWorldConfig.BLOCK_SIZE; // 在平台上方
    player.physics.velocity.x = 0;
    player.physics.velocity.y = 0;
    player.physics.onGround = true;
    
    // 模拟几帧更新
    const deltaTime = 1/60; // 60FPS
    const keys = {}; // 没有按键
    
    console.log(`  初始状态: 位置(${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}), onGround=${player.physics.onGround}, velocity.y=${player.physics.velocity.y.toFixed(2)}`);
    
    // 更新几帧，玩家应该保持在平台上
    for (let i = 0; i < 5; i++) {
      player.update(deltaTime, keys);
      console.log(`  第${i+1}帧: 位置(${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}), onGround=${player.physics.onGround}, velocity.y=${player.physics.velocity.y.toFixed(2)}`);
    }
    
    // 测试场景2：玩家横向移动到平台边缘
    console.log('\n📊 测试场景2: 玩家横向移动到平台边缘');
    player.position.x = 10.5 * mockWorldConfig.BLOCK_SIZE; // 平台边缘
    player.position.y = 103 * mockWorldConfig.BLOCK_SIZE; // 在平台高度
    player.physics.velocity.x = 50; // 向右移动
    player.physics.velocity.y = 0;
    player.physics.onGround = true; // 初始在地面上
    
    console.log(`  初始状态: 位置(${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}), onGround=${player.physics.onGround}, velocity.y=${player.physics.velocity.y.toFixed(2)}`);
    
    // 模拟向右移动键
    keys['KeyD'] = true;
    
    // 更新多帧，观察玩家是否会掉落
    for (let i = 0; i < 10; i++) {
      const prevOnGround = player.physics.onGround;
      const prevY = player.position.y;
      
      player.update(deltaTime, keys);
      
      const worldX = Math.floor(player.position.x / mockWorldConfig.BLOCK_SIZE);
      const worldY = Math.floor((player.position.y - player.size.height/2) / mockWorldConfig.BLOCK_SIZE);
      const blockBelow = terrain.getBlock(worldX, worldY);
      const isBlockSolid = blockConfig.isSolid(blockBelow);
      
      console.log(`  第${i+1}帧: 位置(${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}), onGround=${player.physics.onGround}, velocity.y=${player.physics.velocity.y.toFixed(2)}, 下方方块=${isBlockSolid ? '固体' : '空气'}, 方块Y=${worldY}`);
      
      // 检查是否发生状态变化
      if (prevOnGround !== player.physics.onGround) {
        console.log(`    状态变化: onGround ${prevOnGround} -> ${player.physics.onGround}`);
      }
      
      if (Math.abs(player.position.y - prevY) > 0.1) {
        console.log(`    Y位置变化: ${prevY.toFixed(2)} -> ${player.position.y.toFixed(2)}`);
      }
    }
    
    // 测试场景3：玩家完全离开平台
    console.log('\n📊 测试场景3: 玩家完全离开平台');
    player.position.x = 12 * mockWorldConfig.BLOCK_SIZE; // 完全离开平台
    player.position.y = 103 * mockWorldConfig.BLOCK_SIZE; // 悬空高度
    player.physics.velocity.x = 0;
    player.physics.velocity.y = 0;
    player.physics.onGround = false; // 明确设置为悬空状态
    
    keys['KeyD'] = false; // 停止移动键
    
    console.log(`  初始状态: 位置(${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}), onGround=${player.physics.onGround}, velocity.y=${player.physics.velocity.y.toFixed(2)}`);
    
    // 更新多帧，观察玩家是否开始下落
    for (let i = 0; i < 10; i++) {
      const prevY = player.position.y;
      const prevVelY = player.physics.velocity.y;
      
      player.update(deltaTime, keys);
      
      console.log(`  第${i+1}帧: 位置(${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}), onGround=${player.physics.onGround}, velocity.y=${player.physics.velocity.y.toFixed(2)}`);
      
      if (Math.abs(player.physics.velocity.y - prevVelY) > 0.1) {
        console.log(`    Y速度变化: ${prevVelY.toFixed(2)} -> ${player.physics.velocity.y.toFixed(2)}`);
      }
      
      if (Math.abs(player.position.y - prevY) > 0.1) {
        console.log(`    Y位置变化: ${prevY.toFixed(2)} -> ${player.position.y.toFixed(2)}`);
      }
    }
    
    // 分析问题
    console.log('\n🔍 问题分析:');
    analyzeResults();
    
    console.log('\n✅ 诊断完成!');
    
  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error);
    console.error('错误堆栈:', error.stack);
  }
}

/**
 * 分析测试结果
 */
function analyzeResults() {
  console.log('基于测试结果，可能的问题原因:');
  console.log('1. 地面检测逻辑：moveVertical()中地面检测可能只在velocity.y <= 0时进行');
  console.log('2. 重力应用条件：updateNormalPhysics()中重力可能只在!onGround时应用');
  console.log('3. 状态更新时序：onGround状态的更新可能滞后于实际位置变化');
  console.log('4. 边界计算精度：epsilon值设置可能导致边界检测不准确');
  
  console.log('\n建议修复方案:');
  console.log('1. 改进地面检测：每帧都检查玩家脚下是否有固体方块');
  console.log('2. 优化重力应用：确保悬空时立即应用重力');
  console.log('3. 增强状态同步：确保onGround状态与实际位置同步');
  console.log('4. 添加主动检测：在moveHorizontal()后添加地面状态检查');
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(60));
  console.log('🔧 Minecraft2D 玩家悬空问题诊断工具');
  console.log('='.repeat(60));
  
  await testPlayerSuspensionBug();
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 诊断结束');
  console.log('='.repeat(60));
}

// 运行诊断
main().catch(error => {
  console.error('💥 诊断工具运行失败:', error);
  process.exit(1);
});