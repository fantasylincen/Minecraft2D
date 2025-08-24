/**
 * 地图生成测试脚本
 * 用于测试和调试地形生成算法的效果
 */

import { WorldGenerator } from './src/world/WorldGenerator.js';
import { blockConfig } from './src/config/BlockConfig.js';

// 创建世界生成器
const worldGenerator = new WorldGenerator(12345); // 使用固定种子便于比较

// 设置世界配置
const worldConfig = {
  WORLD_HEIGHT: 512,
  CHUNK_SIZE: 16,
  BLOCK_SIZE: 16
};

worldGenerator.setWorldConfig(worldConfig);

// 生成几个区块进行测试
console.log('🌱 开始测试地图生成...');
const testChunks = [];
const chunkCount = 5;

for (let i = 0; i < chunkCount; i++) {
  console.log(`生成区块 ${i}...`);
  const chunkData = worldGenerator.generateChunk(i);
  testChunks.push(chunkData);
}

// 分析生成结果
console.log('\n📊 生成结果分析:');
testChunks.forEach((chunkData, index) => {
  console.log(`\n区块 ${index}:`);
  console.log(`  生成时间: ${chunkData.metadata.generationTime.toFixed(2)}ms`);
  console.log(`  管线统计:`, chunkData.metadata.pipelineStats);
  
  // 统计方块类型
  const blockCounts = {};
  const chunk = chunkData.chunk;
  const totalBlocks = chunk.length * chunk[0].length;
  
  for (let y = 0; y < chunk.length; y++) {
    for (let x = 0; x < chunk[y].length; x++) {
      const blockId = chunk[y][x];
      const blockName = Object.keys(blockConfig.blocks).find(name => blockConfig.blocks[name].id === blockId) || 'unknown';
      blockCounts[blockName] = (blockCounts[blockName] || 0) + 1;
    }
  }
  
  console.log(`  方块统计 (总计 ${totalBlocks} 个方块):`);
  Object.keys(blockCounts)
    .sort((a, b) => blockCounts[b] - blockCounts[a])
    .forEach(blockName => {
      const count = blockCounts[blockName];
      const percentage = ((count / totalBlocks) * 100).toFixed(2);
      console.log(`    ${blockName}: ${count} (${percentage}%)`);
    });
});

// 输出生物群系分布
console.log('\n🌍 生物群系分布:');
const biomeStats = {};
for (let i = 0; i < chunkCount; i++) {
  const chunkData = testChunks[i];
  const biomeMap = chunkData.biomeMap;
  
  biomeMap.forEach(biome => {
    biomeStats[biome] = (biomeStats[biome] || 0) + 1;
  });
}

const totalBiomeCells = Object.values(biomeStats).reduce((a, b) => a + b, 0);
Object.keys(biomeStats)
  .sort((a, b) => biomeStats[b] - biomeStats[a])
  .forEach(biome => {
    const count = biomeStats[biome];
    const percentage = ((count / totalBiomeCells) * 100).toFixed(2);
    console.log(`  ${biome}: ${count} (${percentage}%)`);
  });

console.log('\n✅ 地图生成测试完成');