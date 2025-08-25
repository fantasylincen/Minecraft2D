/**
 * 地形生成器
 * 基于多层Simplex噪音和生物群系生成自然地形
 */

import { SimplexNoise } from '../noise/SimplexNoise.js';
import { getBiomeConfig, BIOME_TYPES } from '../biomes/BiomeTypes.js';
import { BiomeGenerator } from './BiomeGenerator.js';

export class TerrainGenerator {
  constructor(seed) {
    this.seed = seed;
    
    // 创建生物群系生成器
    this.biomeGenerator = new BiomeGenerator(seed);
    
    // 为不同尺度的地形创建噪音生成器
    this.heightNoise = new SimplexNoise(seed);
    this.detailNoise = new SimplexNoise(seed + 3000);
    this.roughnessNoise = new SimplexNoise(seed + 4000);
    
    // 容器管理器引用
    this.containerManager = null;
    
    // 地形生成参数
    this.params = {
      baseHeight: 100,        // 基础海平面高度
      continental: {
        scale: 0.00005,       // 减小大陆尺度，增加大陆规模 (从0.0001改为0.00005)
        amplitude: 180,       // 增加大陆振幅 (从150改为180)
        octaves: 2,
        persistence: 0.6,
        lacunarity: 2.0
      },
      regional: {
        scale: 0.0005,        // 调整区域尺度 (从0.0008改为0.0005)
        amplitude: 70,        // 调整区域振幅 (从60改为70)
        octaves: 4,
        persistence: 0.5,
        lacunarity: 2.0
      },
      local: {
        scale: 0.01,          // 调整局部尺度 (从0.008改为0.01)
        amplitude: 25,        // 减小局部振幅 (从35改为25)
        octaves: 3,
        persistence: 0.4,
        lacunarity: 2.0
      },
      roughness: {
        scale: 0.03,          // 调整粗糙度尺度 (从0.05改为0.03)
        amplitude: 12,        // 增加粗糙度振幅 (从8改为12)
        octaves: 2,
        persistence: 0.3,
        lacunarity: 2.0
      }
    };
    
    console.log('🏔️ TerrainGenerator 初始化完成');
  }
  
  /**
   * 生成指定位置的地形高度
   * @param {number} x - 世界X坐标 (绝对坐标)
   * @param {string} biome - 生物群系类型
   * @returns {number} 地形高度
   */
  generateHeight(x, biome) {
    const biomeConfig = getBiomeConfig(biome);
    const heightModifiers = biomeConfig.heightModifiers;
    
    // 确保使用绝对世界坐标，保证连续性
    const absoluteX = Math.floor(x);
    
    let height = this.params.baseHeight;
    
    // 大陆尺度地形 - 使用绝对坐标确保连续性
    const continental = this.heightNoise.fractal(
      absoluteX * this.params.continental.scale,
      0,
      this.params.continental.octaves,
      this.params.continental.persistence,
      this.params.continental.lacunarity
    );
    
    // 区域尺度地形 - 使用绝对坐标确保连续性
    const regional = this.heightNoise.fractal(
      absoluteX * this.params.regional.scale,
      0,
      this.params.regional.octaves,
      this.params.regional.persistence,
      this.params.regional.lacunarity
    );
    
    // 局部尺度细节 - 使用绝对坐标确保连续性
    const local = this.detailNoise.fractal(
      absoluteX * this.params.local.scale,
      0,
      this.params.local.octaves,
      this.params.local.persistence,
      this.params.local.lacunarity
    );
    
    // 表面粗糙度 - 使用绝对坐标确保连续性
    const roughness = this.roughnessNoise.fractal(
      absoluteX * this.params.roughness.scale,
      0,
      this.params.roughness.octaves,
      this.params.roughness.persistence,
      this.params.roughness.lacunarity
    );
    
    // 应用生物群系特定的高度修饰符
    height += continental * this.params.continental.amplitude * heightModifiers.continental;
    height += regional * this.params.regional.amplitude * heightModifiers.regional;
    height += local * this.params.local.amplitude * heightModifiers.local;
    height += roughness * this.params.roughness.amplitude;
    
    // 应用生物群系特殊效果
    height = this.applyBiomeSpecificEffects(height, biome, absoluteX);
    
    // 限制高度范围
    return Math.floor(Math.max(10, Math.min(400, height)));
  }
  
  /**
   * 应用生物群系特定效果
   * @param {number} height - 基础高度
   * @param {string} biome - 生物群系
   * @param {number} x - X坐标 (绝对世界坐标)
   * @returns {number} 修正后的高度
   */
  applyBiomeSpecificEffects(height, biome, x) {
    // 确保使用绝对坐标保证连续性
    const absoluteX = Math.floor(x);
    
    switch (biome) {
      case BIOME_TYPES.OCEAN:
        // 海洋：平滑的海底
        return Math.min(height, this.params.baseHeight - 20);
        
      case BIOME_TYPES.MOUNTAINS:
        // 山地：增加尖峰效果
        const peakNoise = this.heightNoise.sample(absoluteX * 0.002, 0);
        if (peakNoise > 0.6) {
          height += (peakNoise - 0.6) * 100;
        }
        break;
        
      case BIOME_TYPES.DESERT:
        // 沙漠：添加沙丘效果
        const duneNoise = this.detailNoise.sample(absoluteX * 0.008, 0);
        height += duneNoise * 15;
        break;
        
      case BIOME_TYPES.SWAMP:
        // 沼泽：保持低平
        height = Math.min(height, this.params.baseHeight + 10);
        break;
        
      case BIOME_TYPES.PLAINS:
        // 平原：温和起伏，但不过度平均化
        height *= 0.95; // 从0.9改为0.95，减少平均化程度
        // 添加小丘陵效果
        const hillNoise = this.detailNoise.sample(absoluteX * 0.003, 50);
        if (hillNoise > 0.3) { // 从0.4改为0.3，增加丘陵生成概率
          height += (hillNoise - 0.3) * 30; // 从25改为30，增加丘陵高度
        }
        break;
    }
    
    return height;
  }
  
  /**
   * 生成地形列
   * @param {number} x - 世界X坐标
   * @param {string} biome - 生物群系
   * @param {number} worldHeight - 世界高度
   * @returns {Object} 地形列信息
   */
  generateTerrainColumn(x, biome, worldHeight) {
    const surfaceHeight = this.generateHeight(x, biome);
    const biomeConfig = getBiomeConfig(biome);
    
    const column = {
      surfaceHeight,
      biome,
      blocks: this.generateColumnBlocks(surfaceHeight, biome, worldHeight),
      features: this.generateColumnFeatures(x, surfaceHeight, biome)
    };
    
    return column;
  }
  
  /**
   * 生成地形列的方块分布
   * @param {number} surfaceHeight - 地表高度
   * @param {string} biome - 生物群系
   * @param {number} worldHeight - 世界总高度
   * @returns {string[]} 方块类型数组
   */
  generateColumnBlocks(surfaceHeight, biome, worldHeight) {
    const blocks = new Array(worldHeight).fill('air');
    const biomeConfig = getBiomeConfig(biome);
    const waterLevel = this.params.baseHeight;
    
    for (let y = 0; y < worldHeight; y++) {
      if (y < 5) {
        // 基岩层
        blocks[y] = 'stone';
      } else if (y < surfaceHeight - 5) {
        // 深层
        blocks[y] = biomeConfig.blocks.deep;
      } else if (y < surfaceHeight - 1) {
        // 次表层
        blocks[y] = biomeConfig.blocks.subsurface;
      } else if (y < surfaceHeight) {
        // 表层
        if (surfaceHeight < waterLevel && biome === BIOME_TYPES.OCEAN) {
          blocks[y] = 'sand';
        } else {
          blocks[y] = biomeConfig.blocks.surface;
        }
      } else if (y < waterLevel && biome === BIOME_TYPES.OCEAN) {
        // 水层
        blocks[y] = 'water';
      }
      // 其余为空气
    }
    
    return blocks;
  }
  
  /**
   * 生成地形列的特征
   * @param {number} x - X坐标 (绝对世界坐标)
   * @param {number} surfaceHeight - 地表高度
   * @param {string} biome - 生物群系
   * @returns {Object} 特征对象
   */
  generateColumnFeatures(x, surfaceHeight, biome) {
    const features = {
      hasTree: false,
      hasGrass: false,
      hasFlower: false,
      structureType: null
    };
    
    const biomeConfig = getBiomeConfig(biome);
    if (!biomeConfig.vegetation) return features;
    
    // 确保使用绝对坐标保证连续性
    const absoluteX = Math.floor(x);
    
    // 基于噪音决定植被（使用绝对坐标）
    const vegetationNoise = this.detailNoise.sample(absoluteX * 0.1, 0);
    const grassNoise = this.detailNoise.sample(absoluteX * 0.2, 50);
    const flowerNoise = this.detailNoise.sample(absoluteX * 0.15, 100);
    
    // 树木 - 调整阈值增加生成概率
    if (vegetationNoise > 0.5 && Math.random() < biomeConfig.vegetation.trees) { // 从0.6改为0.5
      features.hasTree = true;
    }
    
    // 草 - 调整阈值增加生成概率
    if (grassNoise > 0.1 && Math.random() < biomeConfig.vegetation.grass) { // 从0.2改为0.1
      features.hasGrass = true;
    }
    
    // 花朵 - 调整阈值增加生成概率
    if (flowerNoise > 0.3 && Math.random() < biomeConfig.vegetation.flowers) { // 从0.4改为0.3
      features.hasFlower = true;
    }
    
    return features;
  }
  
  /**
   * 获取地形生成统计信息
   * @param {number} startX - 起始X坐标
   * @param {number} endX - 结束X坐标
   * @param {number} sampleRate - 采样频率
   * @returns {Object} 统计信息
   */
  getTerrainStats(startX, endX, sampleRate = 10) {
    let minHeight = Infinity;
    let maxHeight = -Infinity;
    let totalHeight = 0;
    let samples = 0;
    
    const biomeHeights = {};
    
    for (let x = startX; x < endX; x += sampleRate) {
      const biome = this.biomeGenerator.generateBiome(x, 0);
      const height = this.generateHeight(x, biome);
      
      minHeight = Math.min(minHeight, height);
      maxHeight = Math.max(maxHeight, height);
      totalHeight += height;
      samples++;
      
      if (!biomeHeights[biome]) {
        biomeHeights[biome] = [];
      }
      biomeHeights[biome].push(height);
    }
    
    const avgHeight = totalHeight / samples;
    
    // 计算各生物群系的平均高度
    const biomeAvgHeights = {};
    Object.keys(biomeHeights).forEach(biome => {
      const heights = biomeHeights[biome];
      biomeAvgHeights[biome] = heights.reduce((a, b) => a + b, 0) / heights.length;
    });
    
    return {
      minHeight: Math.round(minHeight),
      maxHeight: Math.round(maxHeight),
      averageHeight: Math.round(avgHeight),
      heightRange: Math.round(maxHeight - minHeight),
      biomeAverageHeights: biomeAvgHeights,
      sampleCount: samples
    };
  }
  
  /**
   * 设置地形生成参数
   * @param {Object} newParams - 新参数
   */
  setParams(newParams) {
    this.params = { ...this.params, ...newParams };
  }
  
  /**
   * 获取当前参数
   * @returns {Object} 当前参数
   */
  getParams() {
    return { ...this.params };
  }
  
  /**
   * 获取种子值
   * @returns {number} 种子值
   */
  getSeed() {
    return this.seed;
  }
}