/**
 * Simplex噪音生成器
 * 基于simplex-noise库的封装，提供分形噪音功能
 */

import { createNoise2D } from 'simplex-noise';

export class SimplexNoise {
  constructor(seed) {
    // 创建2D噪音生成器
    this.noise = createNoise2D(() => seed);
    this.seed = seed;
  }
  
  /**
   * 2D噪音采样
   * @param {number} x - X坐标
   * @param {number} y - Y坐标 
   * @returns {number} 噪音值 (-1 到 1)
   */
  sample(x, y) {
    return this.noise(x, y);
  }
  
  /**
   * 分形噪音 (多层叠加)
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} octaves - 噪音层数 (默认4)
   * @param {number} persistence - 噪音持续性 (默认0.5)
   * @param {number} lacunarity - 噪音间隙 (默认2.0)
   * @returns {number} 分形噪音值 (-1 到 1)
   */
  fractal(x, y, octaves = 4, persistence = 0.5, lacunarity = 2.0) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      value += this.sample(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    
    return value / maxValue;
  }
  
  /**
   * 1D噪音 (用于地形高度生成)
   * @param {number} x - X坐标
   * @param {number} octaves - 噪音层数
   * @param {number} persistence - 持续性
   * @param {number} lacunarity - 间隙
   * @returns {number} 1D噪音值
   */
  noise1D(x, octaves = 4, persistence = 0.5, lacunarity = 2.0) {
    return this.fractal(x, 0, octaves, persistence, lacunarity);
  }
  
  /**
   * 获取范围内的噪音值
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number} 范围内的噪音值
   */
  range(x, y, min, max) {
    const noise = this.sample(x, y);
    return min + (noise + 1) * 0.5 * (max - min);
  }
  
  /**
   * 获取种子值
   * @returns {number} 种子值
   */
  getSeed() {
    return this.seed;
  }
}