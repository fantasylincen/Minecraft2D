/**
 * 地形生成测试脚本
 * 用于测试和验证地形生成效果
 */

const { WorldGenerator } = require('./minecraft2d-game/src/world/WorldGenerator.js');
const { blockConfig } = require('./minecraft2d-game/src/config/BlockConfig.js');

// 模拟世界配置
const mockWorldConfig = {
  CHUNK_SIZE: 64,
  WORLD_HEIGHT: 400,
  BLOCK_SIZE: 16
};

/**
 * 生成并分析地形
 */
async function testTerrainGeneration() {
  console.log('🔍 开始地形生成测试...');
  
  try {
    // 创建世界生成器
    const worldGen = new WorldGenerator(12345); // 固定种子用于测试
    worldGen.setWorldConfig(mockWorldConfig);
    
    console.log('\n📊 生成器状态检查:');
    console.log('生成管线:', worldGen.generationPipeline);
    
    // 生成多个区块测试
    const testChunks = [];
    console.log('\n🌱 生成测试区块 (0-4)...');
    
    for (let i = 0; i < 5; i++) {
      const chunkData = worldGen.generateChunk(i);
      testChunks.push(chunkData);
      console.log(`区块 ${i} 生成完成，耗时: ${chunkData.metadata.generationTime.toFixed(2)}ms`);
    }
    
    // 1. 验证地形高度变化
    console.log('\n🏔️ 地形高度验证:');
    verifyTerrainHeight(testChunks);
    
    // 2. 验证方块多样性
    console.log('\n🧱 方块多样性验证:');
    verifyBlockDiversity(testChunks);
    
    // 3. 验证植被生成
    console.log('\n🌿 植被生成验证:');
    verifyVegetation(testChunks);
    
    // 4. 验证生物群系分布
    console.log('\n🌍 生物群系分布验证:');
    verifyBiomes(testChunks);
    
    console.log('\n✅ 地形生成测试完成!');
    
  } catch (error) {
    console.error('❌ 地形生成测试失败:', error);
    console.error('错误堆栈:', error.stack);
  }
}

/**
 * 验证地形高度变化
 */
function verifyTerrainHeight(chunks) {
  let minHeight = Infinity;
  let maxHeight = -Infinity;
  let totalHeight = 0;
  let sampleCount = 0;
  
  chunks.forEach(chunkData => {
    const chunk = chunkData.chunk;
    const surfaceMap = [];
    
    // 计算地表高度
    for (let x = 0; x < chunk[0].length; x++) {
      for (let y = chunk.length - 1; y >= 0; y--) {
        if (chunk[y][x] !== blockConfig.getBlock('air').id) {
          surfaceMap[x] = y;
          break;
        }
      }
    }
    
    // 统计高度信息
    surfaceMap.forEach(height => {
      if (height !== undefined) {
        minHeight = Math.min(minHeight, height);
        maxHeight = Math.max(maxHeight, height);
        totalHeight += height;
        sampleCount++;
      }
    });
  });
  
  const avgHeight = totalHeight / sampleCount;
  const heightRange = maxHeight - minHeight;
  
  console.log(`  最小高度: ${minHeight}`);
  console.log(`  最大高度: ${maxHeight}`);
  console.log(`  平均高度: ${avgHeight.toFixed(1)}`);
  console.log(`  高度范围: ${heightRange}`);
  
  // 评估地形变化
  if (heightRange > 100) {
    console.log('  ✅ 地形变化丰富');
  } else if (heightRange > 50) {
    console.log('  ⚠️ 地形变化一般');
  } else {
    console.log('  ❌ 地形过于平坦');
  }
}

/**
 * 验证方块多样性
 */
function verifyBlockDiversity(chunks) {
  const blockCounts = {};
  let totalBlocks = 0;
  
  chunks.forEach(chunkData => {
    const chunk = chunkData.chunk;
    
    for (let y = 0; y < chunk.length; y++) {
      for (let x = 0; x < chunk[0].length; x++) {
        const blockId = chunk[y][x];
        if (!blockCounts[blockId]) {
          blockCounts[blockId] = 0;
        }
        blockCounts[blockId]++;
        totalBlocks++;
      }
    }
  });
  
  console.log(`  总方块数: ${totalBlocks}`);
  console.log(`  不同方块类型数: ${Object.keys(blockCounts).length}`);
  
  // 显示前5种最常见的方块
  const sortedBlocks = Object.entries(blockCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
    
  console.log('  最常见的方块:');
  sortedBlocks.forEach(([blockId, count]) => {
    const block = blockConfig.getBlock(parseInt(blockId));
    const percentage = ((count / totalBlocks) * 100).toFixed(1);
    console.log(`    ${block?.name || blockId}: ${count} (${percentage}%)`);
  });
  
  // 评估多样性
  const diversity = Object.keys(blockCounts).length;
  if (diversity > 10) {
    console.log('  ✅ 方块多样性良好');
  } else if (diversity > 5) {
    console.log('  ⚠️ 方块多样性一般');
  } else {
    console.log('  ❌ 方块过于单一');
  }
}

/**
 * 验证植被生成
 */
function verifyVegetation(chunks) {
  let vegetationCount = 0;
  let treeCount = 0;
  let grassCount = 0;
  let flowerCount = 0;
  let totalBlocks = 0;
  
  const grassId = blockConfig.getBlock('grass').id;
  const leavesId = blockConfig.getBlock('leaves').id;
  const flowerId = blockConfig.getBlock('flower').id;
  const tallGrassId = blockConfig.getBlock('tallgrass').id;
  
  chunks.forEach(chunkData => {
    const chunk = chunkData.chunk;
    
    for (let y = 0; y < chunk.length; y++) {
      for (let x = 0; x < chunk[0].length; x++) {
        const blockId = chunk[y][x];
        totalBlocks++;
        
        if (blockId === leavesId) {
          treeCount++;
          vegetationCount++;
        } else if (blockId === grassId || blockId === tallGrassId) {
          grassCount++;
          vegetationCount++;
        } else if (blockId === flowerId) {
          flowerCount++;
          vegetationCount++;
        }
      }
    }
  });
  
  console.log(`  植被总数: ${vegetationCount}`);
  console.log(`  树木: ${treeCount}`);
  console.log(`  草: ${grassCount}`);
  console.log(`  花朵: ${flowerCount}`);
  
  const vegetationPercentage = ((vegetationCount / totalBlocks) * 100).toFixed(2);
  console.log(`  植被覆盖率: ${vegetationPercentage}%`);
  
  // 评估植被生成
  if (vegetationPercentage > 2) {
    console.log('  ✅ 植被生成良好');
  } else if (vegetationPercentage > 0.5) {
    console.log('  ⚠️ 植被生成一般');
  } else {
    console.log('  ❌ 植被生成不足');
  }
}

/**
 * 验证生物群系分布
 */
function verifyBiomes(chunks) {
  const biomeCounts = {};
  let totalColumns = 0;
  
  chunks.forEach(chunkData => {
    const biomeMap = chunkData.biomeMap;
    
    biomeMap.forEach(biome => {
      if (!biomeCounts[biome]) {
        biomeCounts[biome] = 0;
      }
      biomeCounts[biome]++;
      totalColumns++;
    });
  });
  
  console.log(`  总列数: ${totalColumns}`);
  console.log(`  不同生物群系数: ${Object.keys(biomeCounts).length}`);
  
  // 显示生物群系分布
  console.log('  生物群系分布:');
  Object.entries(biomeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([biome, count]) => {
      const percentage = ((count / totalColumns) * 100).toFixed(1);
      console.log(`    ${biome}: ${count} (${percentage}%)`);
    });
    
  // 评估生物群系多样性
  const diversity = Object.keys(biomeCounts).length;
  if (diversity > 4) {
    console.log('  ✅ 生物群系多样性良好');
  } else if (diversity > 2) {
    console.log('  ⚠️ 生物群系多样性一般');
  } else {
    console.log('  ❌ 生物群系过于单一');
  }
}

// 运行测试
testTerrainGeneration().catch(error => {
  console.error('💥 测试运行失败:', error);
});