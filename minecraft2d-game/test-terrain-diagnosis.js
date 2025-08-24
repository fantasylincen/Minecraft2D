/**
 * 地形生成诊断测试
 * Author: MCv2 Development Team
 * 
 * 测试当前地形生成系统，诊断为什么地形变成了全石块平坦地形
 */

import { WorldGenerator } from './src/world/WorldGenerator.js';
import { blockConfig } from './src/config/BlockConfig.js';

// 模拟世界配置
const mockWorldConfig = {
  CHUNK_SIZE: 64,
  WORLD_HEIGHT: 400,
  BLOCK_SIZE: 32
};

/**
 * 诊断地形生成问题
 */
async function diagnoseTerrain() {
  console.log('🔍 开始地形生成诊断...');
  
  try {
    // 创建世界生成器
    const worldGen = new WorldGenerator(12345); // 固定种子用于测试
    worldGen.setWorldConfig(mockWorldConfig);
    
    console.log('\n📊 生成器配置状态:');
    console.log('生成管线:', worldGen.generationPipeline);
    
    // 生成测试区块
    console.log('\n🌱 生成测试区块...');
    const chunkData = worldGen.generateChunk(0);
    const chunk = chunkData.chunk;
    
    // 分析区块内容
    console.log('\n📈 区块分析结果:');
    analyzeChunk(chunk, 0);
    
    // 检查生物群系
    console.log('\n🌍 生物群系分析:');
    console.log('生物群系映射:', chunkData.biomeMap);
    
    // 检查生成管线执行情况
    console.log('\n⚙️ 生成管线执行情况:');
    console.log('管线统计:', chunkData.metadata.pipelineStats);
    console.log('生成器状态:', chunkData.metadata.generators);
    
    // 再生成几个相邻区块测试连续性
    console.log('\n🔗 连续性测试 (生成相邻区块):');
    for (let i = 1; i <= 3; i++) {
      const adjacentChunk = worldGen.generateChunk(i);
      console.log(`区块 ${i} 生成时间: ${adjacentChunk.metadata.generationTime.toFixed(2)}ms`);
      analyzeChunk(adjacentChunk.chunk, i, true); // 简化分析
    }
    
    // 检查方块配置
    console.log('\n🧱 方块配置验证:');
    checkBlockConfig();
    
    console.log('\n✅ 诊断完成!');
    
  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error);
    console.error('错误堆栈:', error.stack);
  }
}

/**
 * 分析区块内容
 * @param {number[][]} chunk - 区块数据
 * @param {number} chunkX - 区块X坐标
 * @param {boolean} simplified - 是否简化分析
 */
function analyzeChunk(chunk, chunkX, simplified = false) {
  const chunkSize = chunk[0].length;
  const worldHeight = chunk.length;
  
  // 统计方块类型
  const blockCounts = {};
  const blockNames = {};
  let surfaceHeights = [];
  
  for (let x = 0; x < chunkSize; x++) {
    let surfaceFound = false;
    
    for (let y = worldHeight - 1; y >= 0; y--) {
      const blockId = chunk[y][x];
      
      // 统计方块数量
      if (!blockCounts[blockId]) {
        blockCounts[blockId] = 0;
        // 获取方块名称
        const blockInfo = Object.values(blockConfig.blocks).find(b => b.id === blockId);
        blockNames[blockId] = blockInfo ? blockInfo.name : `未知方块(${blockId})`;
      }
      blockCounts[blockId]++;
      
      // 记录地表高度
      if (!surfaceFound && blockId !== blockConfig.getBlock('air').id) {
        surfaceHeights.push(y);
        surfaceFound = true;
      }
    }
    
    if (!surfaceFound) {
      surfaceHeights.push(0); // 如果没有固体方块，地表高度为0
    }
  }
  
  // 输出分析结果
  console.log(`区块 ${chunkX} (${chunkSize}x${worldHeight}):`)
  
  if (!simplified) {
    console.log('  方块分布:');
    Object.keys(blockCounts).forEach(blockId => {
      const count = blockCounts[blockId];
      const name = blockNames[blockId];
      const percentage = ((count / (chunkSize * worldHeight)) * 100).toFixed(1);
      console.log(`    ${name}: ${count} 个 (${percentage}%)`);
    });
  }
  
  // 地表高度分析
  const minHeight = Math.min(...surfaceHeights);
  const maxHeight = Math.max(...surfaceHeights);
  const avgHeight = (surfaceHeights.reduce((a, b) => a + b, 0) / surfaceHeights.length).toFixed(1);
  
  console.log(`  地表高度: 最低 ${minHeight}, 最高 ${maxHeight}, 平均 ${avgHeight}`);
  
  // 检查是否过于平坦
  const heightVariation = maxHeight - minHeight;
  if (heightVariation < 5) {
    console.log(`  ⚠️  地形过于平坦! 高度变化仅 ${heightVariation} 格`);
  }
  
  // 检查是否缺少植被
  const hasVegetation = Object.keys(blockNames).some(id => {
    const name = blockNames[id];
    return name.includes('grass') || name.includes('wood') || name.includes('leaves') || name.includes('flower');
  });
  
  if (!hasVegetation) {
    console.log('  ⚠️  缺少植被! 没有发现草、树木或花朵');
  }
  
  // 检查是否有洞穴
  let hasCaves = false;
  for (let y = 10; y < worldHeight - 50; y++) {
    for (let x = 0; x < chunkSize; x++) {
      const blockId = chunk[y][x];
      if (blockId === blockConfig.getBlock('air').id) {
        // 检查是否是地下空气（可能是洞穴）
        let surroundedBySolid = true;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const checkY = y + dy;
            const checkX = x + dx;
            if (checkY >= 0 && checkY < worldHeight && checkX >= 0 && checkX < chunkSize) {
              if (chunk[checkY][checkX] === blockConfig.getBlock('air').id && (dx !== 0 || dy !== 0)) {
                continue; // 有相邻的空气，继续检查
              }
            }
          }
        }
        if (y < avgHeight - 10) { // 地表以下的空气可能是洞穴
          hasCaves = true;
          break;
        }
      }
    }
    if (hasCaves) break;
  }
  
  if (!hasCaves) {
    console.log('  ⚠️  缺少洞穴! 没有发现地下空洞');
  }
}

/**
 * 检查方块配置
 */
function checkBlockConfig() {
  const requiredBlocks = ['air', 'stone', 'dirt', 'grass', 'wood', 'leaves'];
  
  console.log('检查必需的方块类型:');
  requiredBlocks.forEach(blockName => {
    try {
      const block = blockConfig.getBlock(blockName);
      if (block) {
        console.log(`  ✓ ${blockName}: ID=${block.id}, 颜色=${block.color}`);
      } else {
        console.log(`  ❌ ${blockName}: 未找到`);
      }
    } catch (error) {
      console.log(`  ❌ ${blockName}: 获取失败 - ${error.message}`);
    }
  });
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(60));
  console.log('🔧 MCv2 地形生成诊断工具');
  console.log('='.repeat(60));
  
  await diagnoseTerrain();
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 诊断结束');
  console.log('='.repeat(60));
}

// 运行诊断
main().catch(error => {
  console.error('💥 诊断工具运行失败:', error);
  process.exit(1);
});