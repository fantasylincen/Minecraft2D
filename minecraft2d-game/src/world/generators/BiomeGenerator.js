/**
 * 生物群系生成器
 * 基于温度、湿度、海拔等环境参数生成生物群系
 */

import { SimplexNoise } from '../noise/SimplexNoise.js';
import { determineBiome, BIOME_TYPES } from '../biomes/BiomeTypes.js';

export class BiomeGenerator {
  constructor(seed) {
    this.seed = seed;
    
    // 为不同环境参数创建独立的噪音生成器
    this.temperatureNoise = new SimplexNoise(seed);
    this.humidityNoise = new SimplexNoise(seed + 1000);
    this.elevationNoise = new SimplexNoise(seed + 2000);
    
    // 生物群系生成参数
    this.params = {
      temperature: {
        scale: 0.001,    // 温度变化尺度
        octaves: 3,
        persistence: 0.6,
        lacunarity: 2.0
      },
      humidity: {
        scale: 0.0008,   // 湿度变化尺度
        octaves: 3,
        persistence: 0.5,
        lacunarity: 2.0
      },
      elevation: {
        scale: 0.0005,   // 海拔变化尺度
        octaves: 4,
        persistence: 0.7,
        lacunarity: 2.0
      }
    };
    
    console.log('🌍 BiomeGenerator 初始化完成');
  }
  
  /**
   * 生成指定位置的生物群系
   * @param {number} x - 世界X坐标
   * @param {number} y - 世界Y坐标（可选，用于3D生物群系）
   * @returns {string} 生物群系类型
   */
  generateBiome(x, y = 0) {
    // 生成环境参数
    const temperature = this.generateTemperature(x, y);
    const humidity = this.generateHumidity(x, y);
    const elevation = this.generateElevation(x, y);
    
    // 基于环境参数确定生物群系
    return determineBiome(temperature, humidity, elevation);
  }
  
  /**
   * 生成温度值
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {number} 温度值 (-1 到 1)
   */
  generateTemperature(x, y) {
    const params = this.params.temperature;
    return this.temperatureNoise.fractal(
      x * params.scale,
      y * params.scale,
      params.octaves,
      params.persistence,
      params.lacunarity
    );
  }
  
  /**
   * 生成湿度值
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {number} 湿度值 (-1 到 1)
   */
  generateHumidity(x, y) {
    const params = this.params.humidity;
    return this.humidityNoise.fractal(
      x * params.scale,
      y * params.scale,
      params.octaves,
      params.persistence,
      params.lacunarity
    );
  }
  
  /**
   * 生成海拔值
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {number} 海拔值 (-1 到 1)
   */
  generateElevation(x, y) {
    const params = this.params.elevation;
    return this.elevationNoise.fractal(
      x * params.scale,
      y * params.scale,
      params.octaves,
      params.persistence,
      params.lacunarity
    );
  }
  
  /**
   * 生成区块的生物群系映射
   * @param {number} chunkX - 区块X坐标
   * @param {number} chunkSize - 区块大小
   * @returns {string[]} 生物群系映射数组
   */
  generateChunkBiomes(chunkX, chunkSize) {
    const biomeMap = [];
    
    for (let x = 0; x < chunkSize; x++) {
      const worldX = chunkX * chunkSize + x;
      biomeMap[x] = this.generateBiome(worldX, 0);
    }
    
    return biomeMap;
  }
  
  /**
   * 获取环境参数
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {Object} 环境参数对象
   */
  getEnvironmentParams(x, y = 0) {
    return {
      temperature: this.generateTemperature(x, y),
      humidity: this.generateHumidity(x, y),
      elevation: this.generateElevation(x, y)
    };
  }
  
  /**
   * 设置生物群系生成参数
   * @param {Object} newParams - 新的参数配置
   */
  setParams(newParams) {
    this.params = { ...this.params, ...newParams };
  }
  
  /**
   * 获取当前参数配置
   * @returns {Object} 参数配置
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
  
  /**
   * 生成生物群系统计信息
   * @param {number} startX - 起始X坐标
   * @param {number} endX - 结束X坐标
   * @param {number} sampleRate - 采样频率
   * @returns {Object} 生物群系统计
   */
  generateBiomeStats(startX, endX, sampleRate = 10) {
    const stats = {};
    const allBiomes = Object.values(BIOME_TYPES);
    
    // 初始化统计
    allBiomes.forEach(biome => {
      stats[biome] = 0;
    });
    
    let totalSamples = 0;
    
    // 采样统计
    for (let x = startX; x < endX; x += sampleRate) {
      const biome = this.generateBiome(x, 0);
      stats[biome]++;
      totalSamples++;
    }
    
    // 转换为百分比
    Object.keys(stats).forEach(biome => {
      stats[biome] = (stats[biome] / totalSamples * 100).toFixed(1) + '%';
    });
    
    return stats;
  }
}