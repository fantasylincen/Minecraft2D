/**
 * 主世界生成器
 * 集成所有生成模块，提供统一的世界生成接口
 */

import { BiomeGenerator } from './generators/BiomeGenerator.js';
import { TerrainGenerator } from './generators/TerrainGenerator.js';
import { CaveGenerator } from './generators/CaveGenerator.js';
import { OreGenerator } from './generators/OreGenerator.js';
import { VegetationGenerator } from './generators/VegetationGenerator.js';
import { blockConfig } from '../config/BlockConfig.js';

export class WorldGenerator {
  constructor(seed = Math.random() * 1000000) {
    this.seed = seed;
    
    // 初始化所有生成器
    this.biomeGenerator = new BiomeGenerator(seed);
    this.terrainGenerator = new TerrainGenerator(seed);
    this.caveGenerator = new CaveGenerator(seed);
    this.oreGenerator = new OreGenerator(seed);
    this.vegetationGenerator = new VegetationGenerator(seed);
    
    // 季节系统引用
    this.seasonSystem = null;
    
    // 容器管理器引用
    this.containerManager = null;
    
    // 世界配置
    this.worldConfig = null;
    
    // 生成管线配置
    this.generationPipeline = {
      terrain: true,       // 地形生成
      caves: true,         // 洞穴生成
      ores: true,          // 矿物生成
      vegetation: true     // 植被生成
    };
    
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
      averageGenerationTime: 0,
      pipelineStats: {
        terrain: { count: 0, totalTime: 0 },
        caves: { count: 0, totalTime: 0 },
        ores: { count: 0, totalTime: 0 },
        vegetation: { count: 0, totalTime: 0 }
      }
    };
    
    console.log('🌎 WorldGenerator 初始化完成，种子:', this.seed);
    console.log('🔧 生成管线:', Object.keys(this.generationPipeline).filter(k => this.generationPipeline[k]));
  }
  
  /**
   * 设置世界配置
   * @param {Object} worldConfig - 世界配置
   */
  setWorldConfig(worldConfig) {
    this.worldConfig = worldConfig;
  }
  
  /**
   * 设置季节系统
   * @param {Object} seasonSystem - 季节系统引用
   */
  setSeasonSystem(seasonSystem) {
    this.seasonSystem = seasonSystem;
    // 将季节系统传递给植被生成器
    if (this.vegetationGenerator) {
      this.vegetationGenerator.setSeasonSystem(seasonSystem);
    }
  }
  
  /**
   * 设置容器管理器
   * @param {Object} containerManager - 容器管理器引用
   */
  setContainerManager(containerManager) {
    this.containerManager = containerManager;
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
    
    // 按顺序执行生成管线
    const pipelineSteps = [
      { name: 'terrain', enabled: this.generationPipeline.terrain, fn: () => this.generateChunkTerrain(chunk, chunkX, biomeMap, chunkSize, worldHeight) },
      { name: 'caves', enabled: this.generationPipeline.caves, fn: () => this.caveGenerator.generateCaves(chunk, chunkX, biomeMap, this.worldConfig) },
      { name: 'ores', enabled: this.generationPipeline.ores, fn: () => this.oreGenerator.generateOres(chunk, chunkX, biomeMap, this.worldConfig) },
      { name: 'vegetation', enabled: this.generationPipeline.vegetation, fn: () => this.vegetationGenerator.generateVegetation(chunk, chunkX, biomeMap, this.worldConfig) }
    ];
    
    // 执行生成管线
    const pipelineStats = {};
    for (const step of pipelineSteps) {
      if (step.enabled) {
        const stepStartTime = performance.now();
        try {
          step.fn();
          const stepTime = performance.now() - stepStartTime;
          pipelineStats[step.name] = stepTime;
          
          // 更新管线统计
          this.stats.pipelineStats[step.name].count++;
          this.stats.pipelineStats[step.name].totalTime += stepTime;
          
        } catch (error) {
          console.error(`生成管线 ${step.name} 失败:`, error);
          pipelineStats[step.name] = -1; // 标记为失败
        }
      }
    }
    
    // 后处理
    this.postProcessChunk(chunk, chunkX, biomeMap);
    
    // 创建区块数据
    const totalTime = performance.now() - startTime;
    const chunkData = {
      x: chunkX,
      chunk: chunk,
      biomeMap: biomeMap,
      metadata: {
        generated: true,
        generationTime: totalTime,
        pipelineStats: pipelineStats,
        seed: this.seed,
        generators: {
          terrain: this.generationPipeline.terrain,
          caves: this.generationPipeline.caves,
          ores: this.generationPipeline.ores,
          vegetation: this.generationPipeline.vegetation
        }
      }
    };
    
    // 缓存结果
    this.cache.chunks.set(chunkX, chunkData);
    
    // 更新统计
    this.updateStats(totalTime);
    
    // 输出详细的生成统计
    const enabledSteps = Object.keys(pipelineStats).filter(k => pipelineStats[k] > 0);
    console.log(`🌱 生成区块 ${chunkX}，总耗时 ${totalTime.toFixed(2)}ms`);
    console.log(`  管线: ${enabledSteps.map(k => `${k}(${pipelineStats[k].toFixed(1)}ms)`).join(', ')}`);
    
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
    this.smoothChunkBoundaries(chunk, chunkX);
    
    // 添加细节
    this.addChunkDetails(chunk, chunkX, biomeMap);
  }
  
  /**
   * 平滑区块边界
   * @param {number[][]} chunk - 区块数组
   */
  smoothChunkBoundaries(chunk, chunkX) {
    const SMOOTH_RADIUS = 2; // 平滑半径
    const chunkWidth = chunk[0].length;
    
    // 处理左边界
    if (chunkX > 0 && this.cache.chunks.has(chunkX - 1)) {
      this.smoothBoundaryWithNeighbor(chunk, chunkX - 1, 'left', SMOOTH_RADIUS);
    }
    
    // 处理右边界
    if (this.cache.chunks.has(chunkX + 1)) {
      this.smoothBoundaryWithNeighbor(chunk, chunkX + 1, 'right', SMOOTH_RADIUS);
    }
  }
  
  /**
   * 与邻居区块平滑边界
   * @param {number[][]} chunk - 当前区块
   * @param {number} neighborChunkX - 邻居区块X坐标
   * @param {string} side - 边界方向 ('left' 或 'right')
   * @param {number} radius - 平滑半径
   */
  smoothBoundaryWithNeighbor(chunk, neighborChunkX, side, radius) {
    const neighborData = this.cache.chunks.get(neighborChunkX);
    if (!neighborData) return;
    
    const neighborChunk = neighborData.chunk;
    const chunkWidth = chunk[0].length;
    
    // 获取地表高度信息
    const currentHeights = this.extractSurfaceHeights(chunk);
    const neighborHeights = this.extractSurfaceHeights(neighborChunk);
    
    if (side === 'left') {
      // 平滑左边界 (当前区块的第0列)
      this.smoothBoundaryRegion(chunk, neighborChunk, 0, chunkWidth - 1, 
                               currentHeights[0], neighborHeights[chunkWidth - 1], radius);
    } else {
      // 平滑右边界 (当前区块的最后一列)
      this.smoothBoundaryRegion(chunk, neighborChunk, chunkWidth - 1, 0,
                               currentHeights[chunkWidth - 1], neighborHeights[0], radius);
    }
  }
  
  /**
   * 提取地表高度信息
   * @param {number[][]} chunk - 区块数组
   * @returns {number[]} 地表高度数组
   */
  extractSurfaceHeights(chunk) {
    const chunkWidth = chunk[0].length;
    const heights = [];
    
    for (let x = 0; x < chunkWidth; x++) {
      // 从上往下找第一个非空气方块
      for (let y = chunk.length - 1; y >= 0; y--) {
        if (chunk[y][x] !== blockConfig.getBlock('air').id) {
          heights[x] = y;
          break;
        }
      }
      if (heights[x] === undefined) {
        heights[x] = 0; // 如果没找到固体方块，默认为0
      }
    }
    
    return heights;
  }
  
  /**
   * 平滑边界区域
   * @param {number[][]} currentChunk - 当前区块
   * @param {number[][]} neighborChunk - 邻居区块
   * @param {number} currentX - 当前X坐标
   * @param {number} neighborX - 邻居X坐标
   * @param {number} currentHeight - 当前高度
   * @param {number} neighborHeight - 邻居高度
   * @param {number} radius - 平滑半径
   */
  smoothBoundaryRegion(currentChunk, neighborChunk, currentX, neighborX, 
                       currentHeight, neighborHeight, radius) {
    const heightDiff = Math.abs(currentHeight - neighborHeight);
    
    // 只在高度差异较大时才进行平滑
    if (heightDiff <= 2) return;
    
    const targetHeight = Math.floor((currentHeight + neighborHeight) / 2);
    const smoothingStrength = Math.min(0.7, heightDiff / 10); // 平滑强度
    
    // 应用渐进式高度调整
    for (let r = 0; r < radius; r++) {
      const factor = (radius - r) / radius * smoothingStrength;
      const adjustedHeight = Math.floor(currentHeight + (targetHeight - currentHeight) * factor);
      
      this.adjustTerrainHeight(currentChunk, currentX, currentHeight, adjustedHeight);
    }
  }
  
  /**
   * 调整地形高度
   * @param {number[][]} chunk - 区块数组
   * @param {number} x - X坐标
   * @param {number} oldHeight - 旧高度
   * @param {number} newHeight - 新高度
   */
  adjustTerrainHeight(chunk, x, oldHeight, newHeight) {
    if (oldHeight === newHeight) return;
    
    const airId = blockConfig.getBlock('air').id;
    const dirtId = blockConfig.getBlock('dirt').id;
    
    if (newHeight > oldHeight) {
      // 增加高度 - 填充方块
      for (let y = oldHeight + 1; y <= newHeight && y < chunk.length; y++) {
        if (chunk[y][x] === airId) {
          chunk[y][x] = dirtId;
        }
      }
    } else {
      // 降低高度 - 移除方块
      for (let y = oldHeight; y > newHeight && y >= 0; y--) {
        if (chunk[y][x] !== airId) {
          chunk[y][x] = airId;
        }
      }
    }
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
      this.caveGenerator = new CaveGenerator(newSeed);
      this.oreGenerator = new OreGenerator(newSeed);
      this.vegetationGenerator = new VegetationGenerator(newSeed);
    }
    
    // 清除所有缓存
    this.cache.chunks.clear();
    this.cache.biomes.clear();
    this.cache.terrain.clear();
    
    // 重置统计
    this.stats = {
      chunksGenerated: 0,
      totalGenerationTime: 0,
      averageGenerationTime: 0,
      pipelineStats: {
        terrain: { count: 0, totalTime: 0 },
        caves: { count: 0, totalTime: 0 },
        ores: { count: 0, totalTime: 0 },
        vegetation: { count: 0, totalTime: 0 }
      }
    };
    
    console.log('🔄 世界已重新生成，新种子:', this.seed);
  }
  
  /**
   * 设置生成管线配置
   * @param {Object} pipelineConfig - 管线配置
   */
  setPipelineConfig(pipelineConfig) {
    this.generationPipeline = { ...this.generationPipeline, ...pipelineConfig };
    console.log('🔧 更新生成管线:', this.generationPipeline);
  }
  
  /**
   * 获取生成器统计
   * @returns {Object} 详细统计信息
   */
  getDetailedStats() {
    const pipelineAverages = {};
    for (const [name, stats] of Object.entries(this.stats.pipelineStats)) {
      pipelineAverages[name] = {
        count: stats.count,
        totalTime: stats.totalTime,
        averageTime: stats.count > 0 ? stats.totalTime / stats.count : 0
      };
    }
    
    return {
      ...this.stats,
      pipelineAverages,
      cacheSize: {
        chunks: this.cache.chunks.size,
        biomes: this.cache.biomes.size,
        terrain: this.cache.terrain.size
      },
      seed: this.seed,
      generationPipeline: this.generationPipeline,
      generatorStats: {
        cave: this.caveGenerator.getStats(),
        ore: this.oreGenerator.getStats(),
        vegetation: this.vegetationGenerator.getStats()
      }
    };
  }
}