/**
 * 完整地形生成验证测试
 * Author: MCv2 Development Team
 * 
 * 验证修复后的地形生成系统，包括地形变化、植被生成和洞穴系统
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
 * 全面验证地形生成
 */
async function verifyTerrainGeneration() {
  console.log('🔍 开始全面地形生成验证...');
  
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
    verifyVegetationGeneration(testChunks);
    
    // 4. 验证洞穴系统
    console.log('\n🕳️ 洞穴系统验证:');
    verifyCaveGeneration(testChunks);
    
    // 5. 验证生物群系多样性
    console.log('\n🌍 生物群系验证:');
    verifyBiomeDiversity(testChunks);
    
    // 6. 验证地形连续性
    console.log('\n🔗 地形连续性验证:');
    verifyTerrainContinuity(testChunks);
    
    console.log('\n✅ 验证完成!');
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error);
    console.error('错误堆栈:', error.stack);
  }
}

/**
 * 验证地形高度变化
 */
function verifyTerrainHeight(chunks) {
  let totalMinHeight = Infinity;
  let totalMaxHeight = -Infinity;
  let allVariations = [];
  
  chunks.forEach((chunkData, index) => {
    const chunk = chunkData.chunk;
    const heights = findSurfaceHeights(chunk);
    
    const minHeight = Math.min(...heights);
    const maxHeight = Math.max(...heights);
    const variation = maxHeight - minHeight;
    const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
    
    totalMinHeight = Math.min(totalMinHeight, minHeight);
    totalMaxHeight = Math.max(totalMaxHeight, maxHeight);
    allVariations.push(variation);
    
    console.log(`  区块 ${index}: 高度范围 ${minHeight}-${maxHeight} (变化${variation}格), 平均高度 ${avgHeight.toFixed(1)}`);
  });
  
  const totalVariation = totalMaxHeight - totalMinHeight;
  const avgVariation = allVariations.reduce((a, b) => a + b, 0) / allVariations.length;
  
  console.log(`  总体: 高度范围 ${totalMinHeight}-${totalMaxHeight} (总变化${totalVariation}格)`);
  console.log(`  平均单区块变化: ${avgVariation.toFixed(1)}格`);
  
  // 验证结果
  if (totalVariation < 20) {
    console.log('  ❌ 地形过于平坦！总变化应该至少20格');
  } else if (avgVariation < 5) {
    console.log('  ⚠️ 单区块地形变化较小，建议增加局部起伏');
  } else {
    console.log('  ✅ 地形高度变化正常');
  }
}

/**
 * 验证方块多样性
 */
function verifyBlockDiversity(chunks) {
  const allBlockCounts = {};
  let totalBlocks = 0;
  
  chunks.forEach((chunkData, index) => {
    const chunk = chunkData.chunk;
    const blockCounts = countBlocks(chunk);
    
    Object.keys(blockCounts).forEach(blockId => {
      if (!allBlockCounts[blockId]) allBlockCounts[blockId] = 0;
      allBlockCounts[blockId] += blockCounts[blockId];
      totalBlocks += blockCounts[blockId];
    });
  });
  
  console.log('  方块类型分布:');
  Object.keys(allBlockCounts).forEach(blockId => {
    const count = allBlockCounts[blockId];
    const percentage = ((count / totalBlocks) * 100).toFixed(1);
    const blockName = getBlockName(parseInt(blockId));
    console.log(`    ${blockName}: ${count} 个 (${percentage}%)`);
  });
  
  const uniqueBlocks = Object.keys(allBlockCounts).length;
  if (uniqueBlocks < 4) {
    console.log(`  ❌ 方块类型过少！只有${uniqueBlocks}种，应该至少有4种`);
  } else {
    console.log(`  ✅ 方块多样性正常 (${uniqueBlocks}种类型)`);
  }
}

/**
 * 验证植被生成
 */
function verifyVegetationGeneration(chunks) {
  let totalVegetation = 0;
  let totalSurface = 0;
  const vegetationTypes = {};
  
  chunks.forEach((chunkData, index) => {
    const chunk = chunkData.chunk;
    const vegetation = findVegetation(chunk);
    
    totalVegetation += vegetation.total;
    totalSurface += vegetation.surfaceBlocks;
    
    Object.keys(vegetation.types).forEach(type => {
      if (!vegetationTypes[type]) vegetationTypes[type] = 0;
      vegetationTypes[type] += vegetation.types[type];
    });
    
    const coverage = vegetation.surfaceBlocks > 0 ? 
      ((vegetation.total / vegetation.surfaceBlocks) * 100).toFixed(1) : '0.0';
    console.log(`  区块 ${index}: ${vegetation.total}个植被 (覆盖率${coverage}%)`);
  });
  
  const totalCoverage = totalSurface > 0 ? 
    ((totalVegetation / totalSurface) * 100).toFixed(1) : '0.0';
  
  console.log('  植被类型分布:');
  Object.keys(vegetationTypes).forEach(type => {
    console.log(`    ${type}: ${vegetationTypes[type]}个`);
  });
  
  console.log(`  总植被覆盖率: ${totalCoverage}%`);
  
  if (totalVegetation === 0) {
    console.log('  ❌ 完全没有植被生成！');
  } else if (parseFloat(totalCoverage) < 5) {
    console.log('  ⚠️ 植被覆盖率较低，建议增加');
  } else {
    console.log('  ✅ 植被生成正常');
  }
}

/**
 * 验证洞穴生成
 */
function verifyCaveGeneration(chunks) {
  let totalCaves = 0;
  let totalUnderground = 0;
  
  chunks.forEach((chunkData, index) => {
    const chunk = chunkData.chunk;
    const caveStats = analyzeCaves(chunk);
    
    totalCaves += caveStats.caveBlocks;
    totalUnderground += caveStats.undergroundBlocks;
    
    const coverage = caveStats.undergroundBlocks > 0 ? 
      ((caveStats.caveBlocks / caveStats.undergroundBlocks) * 100).toFixed(1) : '0.0';
    console.log(`  区块 ${index}: ${caveStats.caveBlocks}个洞穴方块 (覆盖率${coverage}%), 洞穴数量: ${caveStats.caveCount}`);
  });
  
  const totalCoverage = totalUnderground > 0 ? 
    ((totalCaves / totalUnderground) * 100).toFixed(1) : '0.0';
  
  console.log(`  总洞穴覆盖率: ${totalCoverage}%`);
  
  const targetCoverage = 15; // 目标覆盖率
  const actualCoverage = parseFloat(totalCoverage);
  
  if (actualCoverage < 5) {
    console.log('  ❌ 洞穴覆盖率过低！');
  } else if (actualCoverage > 40) {
    console.log('  ❌ 洞穴覆盖率过高！');
  } else if (Math.abs(actualCoverage - targetCoverage) > 10) {
    console.log(`  ⚠️ 洞穴覆盖率偏离目标较多 (目标${targetCoverage}%, 实际${actualCoverage}%)`);
  } else {
    console.log('  ✅ 洞穴生成正常');
  }
}

/**
 * 验证生物群系多样性
 */
function verifyBiomeDiversity(chunks) {
  const biomeCount = {};
  let totalBiomes = 0;
  
  chunks.forEach((chunkData, index) => {
    const biomeMap = chunkData.biomeMap;
    biomeMap.forEach(biome => {
      if (!biomeCount[biome]) biomeCount[biome] = 0;
      biomeCount[biome]++;
      totalBiomes++;
    });
  });
  
  console.log('  生物群系分布:');
  Object.keys(biomeCount).forEach(biome => {
    const count = biomeCount[biome];
    const percentage = ((count / totalBiomes) * 100).toFixed(1);
    console.log(`    ${biome}: ${count}格 (${percentage}%)`);
  });
  
  const uniqueBiomes = Object.keys(biomeCount).length;
  if (uniqueBiomes < 2) {
    console.log('  ⚠️ 生物群系多样性较低，建议增加变化');
  } else {
    console.log(`  ✅ 生物群系多样性正常 (${uniqueBiomes}种类型)`);
  }
}

/**
 * 验证地形连续性
 */
function verifyTerrainContinuity(chunks) {
  let discontinuities = 0;
  const threshold = 10; // 高度差阈值
  
  for (let i = 0; i < chunks.length - 1; i++) {
    const currentChunk = chunks[i].chunk;
    const nextChunk = chunks[i + 1].chunk;
    
    const currentHeights = findSurfaceHeights(currentChunk);
    const nextHeights = findSurfaceHeights(nextChunk);
    
    const currentLastHeight = currentHeights[currentHeights.length - 1];
    const nextFirstHeight = nextHeights[0];
    
    const heightDiff = Math.abs(currentLastHeight - nextFirstHeight);
    
    console.log(`  区块 ${i}-${i+1} 边界: 高度差 ${heightDiff}格`);
    
    if (heightDiff > threshold) {
      discontinuities++;
      console.log(`    ⚠️ 高度差过大 (${heightDiff} > ${threshold})`);
    }
  }
  
  if (discontinuities === 0) {
    console.log('  ✅ 地形连续性良好');
  } else {
    console.log(`  ⚠️ 发现${discontinuities}处不连续，建议优化边界平滑算法`);
  }
}

// 工具函数
function findSurfaceHeights(chunk) {
  const airId = blockConfig.getBlock('air').id;
  const heights = [];
  
  for (let x = 0; x < chunk[0].length; x++) {
    for (let y = chunk.length - 1; y >= 0; y--) {
      if (chunk[y][x] !== airId) {
        heights.push(y);
        break;
      }
    }
  }
  
  return heights;
}

function countBlocks(chunk) {
  const counts = {};
  
  for (let y = 0; y < chunk.length; y++) {
    for (let x = 0; x < chunk[0].length; x++) {
      const blockId = chunk[y][x];
      counts[blockId] = (counts[blockId] || 0) + 1;
    }
  }
  
  return counts;
}

function getBlockName(blockId) {
  const block = Object.values(blockConfig.blocks).find(b => b.id === blockId);
  return block ? block.name : `未知方块(${blockId})`;
}

function findVegetation(chunk) {
  const airId = blockConfig.getBlock('air').id;
  const grassId = blockConfig.getBlock('grass')?.id;
  const woodId = blockConfig.getBlock('wood')?.id;
  const leavesId = blockConfig.getBlock('leaves')?.id;
  
  const vegetation = { total: 0, surfaceBlocks: 0, types: {} };
  
  // 找到地表
  const surfaceHeights = findSurfaceHeights(chunk);
  vegetation.surfaceBlocks = surfaceHeights.length;
  
  // 检查地表上方的植被
  for (let x = 0; x < chunk[0].length; x++) {
    for (let y = chunk.length - 1; y >= 0; y--) {
      const blockId = chunk[y][x];
      
      if (blockId === grassId) {
        vegetation.total++;
        vegetation.types['grass'] = (vegetation.types['grass'] || 0) + 1;
      } else if (blockId === woodId) {
        vegetation.total++;
        vegetation.types['wood'] = (vegetation.types['wood'] || 0) + 1;
      } else if (blockId === leavesId) {
        vegetation.total++;
        vegetation.types['leaves'] = (vegetation.types['leaves'] || 0) + 1;
      }
    }
  }
  
  return vegetation;
}

function analyzeCaves(chunk) {
  const airId = blockConfig.getBlock('air').id;
  const minDepth = 30; // 地表以下30格才算地下
  
  let caveBlocks = 0;
  let undergroundBlocks = 0;
  let caveCount = 0;
  
  // 找到地表高度
  const surfaceHeights = findSurfaceHeights(chunk);
  const avgSurface = surfaceHeights.reduce((a, b) => a + b, 0) / surfaceHeights.length;
  
  // 分析地下区域
  for (let y = 0; y < avgSurface - minDepth; y++) {
    for (let x = 0; x < chunk[0].length; x++) {
      undergroundBlocks++;
      
      if (chunk[y][x] === airId) {
        caveBlocks++;
        // 检查是否是新洞穴的开始
        if (x === 0 || chunk[y][x-1] !== airId) {
          caveCount++;
        }
      }
    }
  }
  
  return { caveBlocks, undergroundBlocks, caveCount };
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(70));
  console.log('🔧 MCv2 地形生成完整验证工具');
  console.log('='.repeat(70));
  
  await verifyTerrainGeneration();
  
  console.log('\n' + '='.repeat(70));
  console.log('🏁 验证结束');
  console.log('='.repeat(70));
}

// 运行验证
main().catch(error => {
  console.error('💥 验证工具运行失败:', error);
  process.exit(1);
});