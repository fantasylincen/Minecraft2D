/**
 * 主世界生成器
 * 集成所有生成模块，提供统一的世界生成接口
 */

import { BiomeGenerator } from './generators/BiomeGenerator.js';
import { TerrainGenerator } from './generators/TerrainGenerator.js';
import { blockConfig } from '../config/BlockConfig.js';

export class WorldGenerator {
  constructor(seed = Math.random() * 1000000) {
    this.seed = seed;
    
    // 初始化生成器
    this.biomeGenerator = new BiomeGenerator(seed);
    this.terrainGenerator = new TerrainGenerator(seed);
    
    // 世界配置
    this.worldConfig = null;
    
    // 生成缓存
    this.cache = {
      chunks: new Map(),
      biomes: new Map(),
      terrain: new Map()
    };
    
    // 性能统计
    this.stats = {
      chunksGenerated: 0,
      totalGenerationTime: 0,
      averageGenerationTime: 0
    };
    
    console.log('🌎 WorldGenerator 初始化完成，种子:', this.seed);
  }
  
  /**
   * 设置世界配置
   * @param {Object} worldConfig - 世界配置
   */
  setWorldConfig(worldConfig) {
    this.worldConfig = worldConfig;
  }
  
  /**
   * 生成区块
   * @param {number} chunkX - 区块X坐标
   * @returns {Object} 生成的区块数据
   */
  generateChunk(chunkX) {
    const startTime = performance.now();
    
    // 检查缓存
    if (this.cache.chunks.has(chunkX)) {
      return this.cache.chunks.get(chunkX);
    }
    
    if (!this.worldConfig) {
      throw new Error('World config not set');
    }
    
    const chunkSize = this.worldConfig.CHUNK_SIZE;
    const worldHeight = this.worldConfig.WORLD_HEIGHT;
    
    // 创建空区块
    const chunk = this.createEmptyChunk(worldHeight, chunkSize);
    
    // 生成生物群系映射
    const biomeMap = this.generateChunkBiomes(chunkX, chunkSize);
    
    // 生成地形
    this.generateChunkTerrain(chunk, chunkX, biomeMap, chunkSize, worldHeight);
    
    // 后处理
    this.postProcessChunk(chunk, chunkX, biomeMap);
    
    // 创建区块数据
    const chunkData = {
      x: chunkX,
      chunk: chunk,
      biomeMap: biomeMap,
      metadata: {
        generated: true,
        generationTime: performance.now() - startTime,
        seed: this.seed
      }
    };
    
    // 缓存结果
    this.cache.chunks.set(chunkX, chunkData);
    
    // 更新统计
    this.updateStats(chunkData.metadata.generationTime);
    
    console.log(`🌱 生成区块 ${chunkX}，耗时 ${chunkData.metadata.generationTime.toFixed(2)}ms`);
    
    return chunkData;
  }
  
  /**
   * 创建空区块
   * @param {number} height - 世界高度
   * @param {number} width - 区块宽度
   * @returns {number[][]} 空区块数组
   */
  createEmptyChunk(height, width) {
    const chunk = [];
    for (let y = 0; y < height; y++) {
      chunk[y] = new Array(width).fill(blockConfig.getBlock('air').id);
    }
    return chunk;
  }
  
  /**
   * 生成区块的生物群系映射
   * @param {number} chunkX - 区块X坐标
   * @param {number} chunkSize - 区块大小
   * @returns {string[]} 生物群系映射
   */
  generateChunkBiomes(chunkX, chunkSize) {
    const cacheKey = `biome_${chunkX}`;
    
    if (this.cache.biomes.has(cacheKey)) {
      return this.cache.biomes.get(cacheKey);
    }
    
    const biomeMap = this.biomeGenerator.generateChunkBiomes(chunkX, chunkSize);
    this.cache.biomes.set(cacheKey, biomeMap);
    
    return biomeMap;
  }
  
  /**
   * 生成区块地形
   * @param {number[][]} chunk - 区块数组
   * @param {number} chunkX - 区块X坐标
   * @param {string[]} biomeMap - 生物群系映射
   * @param {number} chunkSize - 区块大小
   * @param {number} worldHeight - 世界高度
   */
  generateChunkTerrain(chunk, chunkX, biomeMap, chunkSize, worldHeight) {
    for (let x = 0; x < chunkSize; x++) {
      const worldX = chunkX * chunkSize + x;
      const biome = biomeMap[x];
      
      // 生成地形列
      const terrainColumn = this.terrainGenerator.generateTerrainColumn(worldX, biome, worldHeight);
      
      // 应用方块到区块
      this.applyTerrainColumn(chunk, x, terrainColumn);
    }
  }
  
  /**
   * 应用地形列到区块
   * @param {number[][]} chunk - 区块数组
   * @param {number} x - 区块内X坐标
   * @param {Object} terrainColumn - 地形列数据
   */
  applyTerrainColumn(chunk, x, terrainColumn) {
    const { blocks, features } = terrainColumn;
    
    // 应用基础方块
    for (let y = 0; y < blocks.length; y++) {
      if (blocks[y] && blocks[y] !== 'air') {
        const blockId = blockConfig.getBlock(blocks[y]).id;
        chunk[y][x] = blockId;
      }
    }
    
    // 应用地表特征
    this.applyTerrainFeatures(chunk, x, terrainColumn.surfaceHeight, features);
  }
  
  /**
   * 应用地形特征
   * @param {number[][]} chunk - 区块数组
   * @param {number} x - X坐标
   * @param {number} surfaceHeight - 地表高度
   * @param {Object} features - 特征对象
   */
  applyTerrainFeatures(chunk, x, surfaceHeight, features) {
    const worldHeight = chunk.length;
    
    // 树木
    if (features.hasTree) {
      this.generateTree(chunk, x, surfaceHeight + 1, worldHeight);
    }
    // 草
    else if (features.hasGrass) {
      if (surfaceHeight + 1 < worldHeight) {
        chunk[surfaceHeight + 1][x] = blockConfig.getBlock('grass').id;
      }
    }
    // 花朵
    else if (features.hasFlower) {
      if (surfaceHeight + 1 < worldHeight) {
        // 暂时使用草方块代替花朵
        chunk[surfaceHeight + 1][x] = blockConfig.getBlock('grass').id;
      }
    }
  }
  
  /**
   * 生成树木
   * @param {number[][]} chunk - 区块数组
   * @param {number} x - X坐标
   * @param {number} baseY - 基础Y坐标
   * @param {number} worldHeight - 世界高度
   */
  generateTree(chunk, x, baseY, worldHeight) {
    const treeHeight = 4 + Math.floor(Math.random() * 3);
    const chunkWidth = chunk[0].length;
    
    // 生成树干
    for (let y = baseY; y < Math.min(worldHeight, baseY + treeHeight); y++) {
      if (y >= 0 && y < worldHeight) {
        chunk[y][x] = blockConfig.getBlock('wood') ? blockConfig.getBlock('wood').id : blockConfig.getBlock('dirt').id;
      }
    }
    
    // 生成树叶
    const leafY = Math.min(worldHeight - 1, baseY + treeHeight - 1);
    for (let dy = -2; dy <= 1; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const leafX = x + dx;
        const currentY = leafY + dy;
        
        if (leafX >= 0 && leafX < chunkWidth && 
            currentY >= 0 && currentY < worldHeight &&
            chunk[currentY][leafX] === blockConfig.getBlock('air').id) {
          
          if (Math.abs(dx) + Math.abs(dy) <= 2) {
            chunk[currentY][leafX] = blockConfig.getBlock('leaves') ? 
              blockConfig.getBlock('leaves').id : blockConfig.getBlock('grass').id;
          }
        }
      }
    }
  }
  
  /**
   * 区块后处理
   * @param {number[][]} chunk - 区块数组
   * @param {number} chunkX - 区块X坐标
   * @param {string[]} biomeMap - 生物群系映射
   */
  postProcessChunk(chunk, chunkX, biomeMap) {
    // 平滑边界
    this.smoothChunkBoundaries(chunk);
    
    // 添加细节
    this.addChunkDetails(chunk, chunkX, biomeMap);
  }
  
  /**
   * 平滑区块边界
   * @param {number[][]} chunk - 区块数组
   */
  smoothChunkBoundaries(chunk) {
    // 简单的边界平滑处理
    // 这里可以添加更复杂的平滑算法
  }
  
  /**
   * 添加区块细节
   * @param {number[][]} chunk - 区块数组
   * @param {number} chunkX - 区块X坐标
   * @param {string[]} biomeMap - 生物群系映射
   */
  addChunkDetails(chunk, chunkX, biomeMap) {
    // 添加随机细节，如小石头、草丛等
    // 这里可以根据生物群系添加特定的细节元素
  }
  
  /**
   * 更新统计信息
   * @param {number} generationTime - 生成时间
   */
  updateStats(generationTime) {
    this.stats.chunksGenerated++;
    this.stats.totalGenerationTime += generationTime;
    this.stats.averageGenerationTime = this.stats.totalGenerationTime / this.stats.chunksGenerated;
  }
  
  /**
   * 获取世界生成统计
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: {
        chunks: this.cache.chunks.size,
        biomes: this.cache.biomes.size,
        terrain: this.cache.terrain.size
      },
      seed: this.seed
    };
  }
  
  /**
   * 清理缓存
   * @param {number} maxCacheSize - 最大缓存大小
   */
  cleanCache(maxCacheSize = 50) {
    if (this.cache.chunks.size > maxCacheSize) {
      const keys = Array.from(this.cache.chunks.keys());
      const deleteCount = this.cache.chunks.size - maxCacheSize;
      
      for (let i = 0; i < deleteCount; i++) {
        this.cache.chunks.delete(keys[i]);
      }
    }
  }
  
  /**
   * 获取种子值
   * @returns {number} 种子值
   */
  getSeed() {
    return this.seed;
  }
  
  /**
   * 重新生成世界（清除缓存）
   * @param {number} newSeed - 新种子（可选）
   */
  regenerate(newSeed) {
    if (newSeed !== undefined) {
      this.seed = newSeed;
      this.biomeGenerator = new BiomeGenerator(newSeed);
      this.terrainGenerator = new TerrainGenerator(newSeed);
    }
    
    // 清除所有缓存
    this.cache.chunks.clear();
    this.cache.biomes.clear();
    this.cache.terrain.clear();
    
    // 重置统计
    this.stats = {
      chunksGenerated: 0,
      totalGenerationTime: 0,
      averageGenerationTime: 0
    };
    
    console.log('🔄 世界已重新生成，新种子:', this.seed);
  }
}