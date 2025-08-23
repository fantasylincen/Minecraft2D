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
    
    // 地形生成参数
    this.params = {
      baseHeight: 100,        // 基础海平面高度
      continental: {
        scale: 0.0001,        // 大陆尺度
        amplitude: 150,       // 大陆振幅
        octaves: 2,
        persistence: 0.6,
        lacunarity: 2.0
      },
      regional: {
        scale: 0.001,         // 区域尺度
        amplitude: 80,        // 区域振幅
        octaves: 4,
        persistence: 0.5,
        lacunarity: 2.0
      },
      local: {
        scale: 0.01,          // 局部尺度
        amplitude: 20,        // 局部振幅
        octaves: 3,
        persistence: 0.4,
        lacunarity: 2.0
      },
      roughness: {
        scale: 0.05,          // 粗糙度尺度
        amplitude: 5,         // 粗糙度振幅
        octaves: 2,
        persistence: 0.3,
        lacunarity: 2.0
      }
    };
    
    console.log('🏔️ TerrainGenerator 初始化完成');
  }
  
  /**
   * 生成指定位置的地形高度
   * @param {number} x - 世界X坐标
   * @param {string} biome - 生物群系类型
   * @returns {number} 地形高度
   */
  generateHeight(x, biome) {
    const biomeConfig = getBiomeConfig(biome);
    const heightModifiers = biomeConfig.heightModifiers;
    
    let height = this.params.baseHeight;
    
    // 大陆尺度地形
    const continental = this.heightNoise.fractal(
      x * this.params.continental.scale,
      0,
      this.params.continental.octaves,
      this.params.continental.persistence,
      this.params.continental.lacunarity
    );
    
    // 区域尺度地形
    const regional = this.heightNoise.fractal(
      x * this.params.regional.scale,
      0,
      this.params.regional.octaves,
      this.params.regional.persistence,
      this.params.regional.lacunarity
    );
    
    // 局部尺度细节
    const local = this.detailNoise.fractal(
      x * this.params.local.scale,
      0,
      this.params.local.octaves,
      this.params.local.persistence,
      this.params.local.lacunarity
    );
    
    // 表面粗糙度
    const roughness = this.roughnessNoise.fractal(
      x * this.params.roughness.scale,
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
    height = this.applyBiomeSpecificEffects(height, biome, x);
    
    // 限制高度范围
    return Math.floor(Math.max(10, Math.min(400, height)));
  }
  
  /**
   * 应用生物群系特定效果
   * @param {number} height - 基础高度
   * @param {string} biome - 生物群系
   * @param {number} x - X坐标
   * @returns {number} 修正后的高度
   */
  applyBiomeSpecificEffects(height, biome, x) {
    switch (biome) {
      case BIOME_TYPES.OCEAN:
        // 海洋：平滑的海底
        return Math.min(height, this.params.baseHeight - 20);
        
      case BIOME_TYPES.MOUNTAINS:
        // 山地：增加尖峰效果
        const peakNoise = this.heightNoise.sample(x * 0.002, 0);
        if (peakNoise > 0.6) {
          height += (peakNoise - 0.6) * 100;
        }
        break;
        
      case BIOME_TYPES.DESERT:
        // 沙漠：添加沙丘效果
        const duneNoise = this.detailNoise.sample(x * 0.008, 0);
        height += duneNoise * 15;
        break;
        
      case BIOME_TYPES.SWAMP:
        // 沼泽：保持低平
        height = Math.min(height, this.params.baseHeight + 10);
        break;
        
      case BIOME_TYPES.PLAINS:
        // 平原：温和起伏
        height *= 0.8;
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
   * @param {number} x - X坐标
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
    
    // 基于噪音决定植被
    const vegetationNoise = this.detailNoise.sample(x * 0.1, 0);
    const grassNoise = this.detailNoise.sample(x * 0.2, 50);
    const flowerNoise = this.detailNoise.sample(x * 0.15, 100);
    
    // 树木
    if (vegetationNoise > 0.7 && Math.random() < biomeConfig.vegetation.trees) {
      features.hasTree = true;
    }
    
    // 草
    if (grassNoise > 0.3 && Math.random() < biomeConfig.vegetation.grass) {
      features.hasGrass = true;
    }
    
    // 花朵
    if (flowerNoise > 0.6 && Math.random() < biomeConfig.vegetation.flowers) {
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