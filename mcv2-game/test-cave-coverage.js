/**
 * 洞穴覆盖率详细测试脚本
 * 用于分析洞穴生成算法的覆盖率控制问题
 */

import { WorldGenerator } from './src/world/WorldGenerator.js';
import { gameConfig } from './src/config/GameConfig.js';

// 设置固定的种子以便于比较
const SEED = 12345;

// 创建世界生成器
const worldGenerator = new WorldGenerator(SEED);

// 设置世界配置
const worldConfig = {
  WORLD_HEIGHT: 512,
  CHUNK_SIZE: 16,
  BLOCK_SIZE: 16
};

worldGenerator.setWorldConfig(worldConfig);

console.log('🔍 洞穴覆盖率测试');
console.log('==================');

// 显示当前洞穴配置
const caveConfig = gameConfig.configs.get('cave');
console.log('当前洞穴配置:');
Object.keys(caveConfig.settings).forEach(key => {
  const setting = caveConfig.settings[key];
  console.log(`  ${setting.displayName} (${key}): ${setting.value} ${setting.unit || ''}`);
});

console.log('\n生成测试区块...');

// 生成单个区块进行详细分析
const chunkData = worldGenerator.generateChunk(0);
const chunk = chunkData.chunk;
const metadata = chunkData.metadata;

console.log('\n生成结果:');
console.log(`  总生成时间: ${metadata.generationTime.toFixed(2)}ms`);
console.log(`  洞穴生成时间: ${metadata.pipelineStats.caves.toFixed(2)}ms`);

// 分析洞穴覆盖率
const chunkHeight = chunk.length;
const chunkWidth = chunk[0].length;
const minDepth = 30; // 从配置中获取
const maxDepth = Math.floor(chunkHeight * 0.7); // 从配置中获取

let caveBlocks = 0;
let totalBlocks = 0;

for (let y = minDepth; y < maxDepth; y++) {
  for (let x = 0; x < chunkWidth; x++) {
    totalBlocks++;
    // 这里需要检查是否是空气方块来判断是否为洞穴
    // 但我们需要查看原始的caveMap来准确计算覆盖率
  }
}

console.log(`\n深度范围分析:`);
console.log(`  最小深度: ${minDepth}`);
console.log(`  最大深度: ${maxDepth}`);
console.log(`  深度范围内的方块总数: ${totalBlocks}`);

console.log('\n覆盖率详情:');
console.log(`  目标覆盖率: 12%`);
console.log(`  实际覆盖率: ${metadata.pipelineStats.caves > 0 ? '需要进一步分析' : '0%'}`);

console.log('\n🔧 建议:');
console.log('  1. 检查CaveGenerator中的覆盖率计算逻辑');
console.log('  2. 验证adjustCaveCoverage方法的实现');
console.log('  3. 确认reduceCaveCoverage和increaseCaveCoverage方法正确工作');