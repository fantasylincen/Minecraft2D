/**
 * 矿物生成器
 * 实现智能矿物脉络分布系统
 */

import { SimplexNoise } from '../noise/SimplexNoise.js';
import { blockConfig } from '../../config/BlockConfig.js';

export class OreGenerator {
  constructor(seed) {
    this.seed = seed;
    
    // 为不同矿物创建独立的噪音生成器
    this.coalNoise = new SimplexNoise(seed + 6000);
    this.ironNoise = new SimplexNoise(seed + 7000);
    this.goldNoise = new SimplexNoise(seed + 8000);
    this.diamondNoise = new SimplexNoise(seed + 9000);
    this.veinNoise = new SimplexNoise(seed + 10000);
    this.clusterNoise = new SimplexNoise(seed + 11000);
    
    // 矿物生成配置
    this.oreConfigs = {
      coal: {
        blockType: 'coal',
        minDepth: 30,
        maxDepth: 300,
        abundance: 0.15,           // 丰度
        frequency: 0.08,           // 噪音频率
        veinFrequency: 0.04,       // 矿脉频率
        threshold: 0.6,            // 生成阈值
        veinThreshold: 0.3,        // 矿脉阈值
        clusterSize: 8,            // 矿簇大小
        veinLength: 12,            // 矿脉长度
        depthBonus: 0.1,           // 深度加成
        rarity: 1.0                // 稀有度(1.0=常见)
      },
      iron: {
        blockType: 'iron',
        minDepth: 20,
        maxDepth: 250,
        abundance: 0.12,
        frequency: 0.06,
        veinFrequency: 0.03,
        threshold: 0.65,
        veinThreshold: 0.4,
        clusterSize: 6,
        veinLength: 10,
        depthBonus: 0.08,
        rarity: 0.8
      },
      gold: {
        blockType: 'gold',
        minDepth: 5,
        maxDepth: 100,
        abundance: 0.05,
        frequency: 0.04,
        veinFrequency: 0.02,
        threshold: 0.75,
        veinThreshold: 0.6,
        clusterSize: 4,
        veinLength: 6,
        depthBonus: 0.15,
        rarity: 0.3
      },
      diamond: {
        blockType: 'diamond',
        minDepth: 1,
        maxDepth: 50,
        abundance: 0.02,
        frequency: 0.02,
        veinFrequency: 0.01,
        threshold: 0.85,
        veinThreshold: 0.8,
        clusterSize: 2,
        veinLength: 3,
        depthBonus: 0.2,
        rarity: 0.1
      }
    };
    
    console.log('⛏️ OreGenerator 初始化完成');
  }
  
  /**
   * 生成区块的矿物分布
   * @param {number[][]} chunk - 区块数组
   * @param {number} chunkX - 区块X坐标
   * @param {string[]} biomeMap - 生物群系映射
   * @param {Object} worldConfig - 世界配置
   */
  generateOres(chunk, chunkX, biomeMap, worldConfig) {
    const chunkWidth = chunk[0].length;
    const chunkHeight = chunk.length;
    const stoneId = blockConfig.getBlock('stone').id;
    
    // 为每种矿物生成分布
    for (const [oreName, config] of Object.entries(this.oreConfigs)) {
      const oreId = blockConfig.getBlock(config.blockType);
      if (!oreId) continue; // 如果方块类型不存在，跳过
      
      this.generateOreType(chunk, chunkX, oreName, config, oreId.id, stoneId, chunkWidth, chunkHeight);
    }
    
    // 生成特殊矿物团簇
    this.generateOreClusters(chunk, chunkX, chunkWidth, chunkHeight);
    
    // 生成矿脉连接
    this.generateOreVeins(chunk, chunkX, chunkWidth, chunkHeight);
  }
  
  /**
   * 生成特定类型的矿物
   * @param {number[][]} chunk - 区块数组
   * @param {number} chunkX - 区块X坐标
   * @param {string} oreName - 矿物名称
   * @param {Object} config - 矿物配置
   * @param {number} oreId - 矿物方块ID
   * @param {number} stoneId - 石头方块ID
   * @param {number} chunkWidth - 区块宽度
   * @param {number} chunkHeight - 区块高度
   */
  generateOreType(chunk, chunkX, oreName, config, oreId, stoneId, chunkWidth, chunkHeight) {
    const noiseGenerator = this.getNoiseGenerator(oreName);
    
    for (let y = Math.max(0, config.minDepth); y < Math.min(chunkHeight, config.maxDepth); y++) {
      for (let x = 0; x < chunkWidth; x++) {
        // 只在石头中生成矿物
        if (chunk[y][x] !== stoneId) continue;
        
        const absoluteX = chunkX * chunkWidth + x;
        
        // 计算深度加成
        const depthFactor = this.calculateDepthBonus(y, config);
        
        // 基础矿物噪音
        const oreValue = noiseGenerator.fractal(
          absoluteX * config.frequency,
          y * config.frequency,
          3,     // octaves
          0.5,   // persistence
          2.0    // lacunarity
        );
        
        // 矿脉噪音
        const veinValue = this.veinNoise.sample(
          absoluteX * config.veinFrequency,
          y * config.veinFrequency
        );
        
        // 应用深度加成和稀有度
        const adjustedThreshold = config.threshold - (depthFactor * config.depthBonus);
        const finalThreshold = adjustedThreshold / config.rarity;
        
        // 生成矿物
        if (oreValue > finalThreshold && veinValue > config.veinThreshold) {
          chunk[y][x] = oreId;
          
          // 有概率在周围生成更多矿物（矿簇效应）
          this.expandOreCluster(chunk, x, y, oreId, stoneId, config, chunkWidth, chunkHeight);
        }
      }
    }
  }
  
  /**
   * 扩展矿物簇
   * @param {number[][]} chunk - 区块数组
   * @param {number} centerX - 中心X坐标
   * @param {number} centerY - 中心Y坐标
   * @param {number} oreId - 矿物ID
   * @param {number} stoneId - 石头ID
   * @param {Object} config - 矿物配置
   * @param {number} chunkWidth - 区块宽度
   * @param {number} chunkHeight - 区块高度
   */
  expandOreCluster(chunk, centerX, centerY, oreId, stoneId, config, chunkWidth, chunkHeight) {
    const clusterRadius = Math.floor(config.clusterSize / 2);
    
    for (let dy = -clusterRadius; dy <= clusterRadius; dy++) {
      for (let dx = -clusterRadius; dx <= clusterRadius; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const x = centerX + dx;
        const y = centerY + dy;
        
        if (x >= 0 && x < chunkWidth && y >= 0 && y < chunkHeight) {
          if (chunk[y][x] === stoneId) {
            // 距离衰减概率
            const distance = Math.sqrt(dx * dx + dy * dy);
            const probability = Math.max(0, 1 - distance / clusterRadius) * config.abundance;
            
            if (Math.random() < probability) {
              chunk[y][x] = oreId;
            }
          }
        }
      }
    }
  }
  
  /**
   * 生成矿物团簇
   * @param {number[][]} chunk - 区块数组
   * @param {number} chunkX - 区块X坐标
   * @param {number} chunkWidth - 区块宽度
   * @param {number} chunkHeight - 区块高度
   */
  generateOreClusters(chunk, chunkX, chunkWidth, chunkHeight) {
    const stoneId = blockConfig.getBlock('stone').id;
    
    // 在每个区块中生成少量大型矿物团簇
    const clusterCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < clusterCount; i++) {
      const x = Math.floor(Math.random() * chunkWidth);
      const y = Math.floor(Math.random() * (chunkHeight * 0.7)) + Math.floor(chunkHeight * 0.2);
      
      if (chunk[y] && chunk[y][x] === stoneId) {
        const absoluteX = chunkX * chunkWidth + x;
        
        // 根据深度和位置选择矿物类型
        const oreType = this.selectOreTypeForCluster(y, absoluteX);
        if (!oreType) continue;
        
        const oreId = blockConfig.getBlock(oreType.blockType);
        if (!oreId) continue;
        
        // 生成大型矿物团簇
        this.generateLargeCluster(chunk, x, y, oreId.id, stoneId, oreType, chunkWidth, chunkHeight);
      }
    }
  }
  
  /**
   * 为团簇选择矿物类型
   * @param {number} depth - 深度
   * @param {number} worldX - 世界X坐标
   * @returns {Object|null} 矿物配置
   */
  selectOreTypeForCluster(depth, worldX) {
    const availableOres = [];
    
    for (const [oreName, config] of Object.entries(this.oreConfigs)) {
      if (depth >= config.minDepth && depth <= config.maxDepth) {
        // 根据稀有度调整权重
        const weight = config.rarity * 100;
        for (let w = 0; w < weight; w++) {
          availableOres.push(config);
        }
      }
    }
    
    if (availableOres.length === 0) return null;
    
    return availableOres[Math.floor(Math.random() * availableOres.length)];
  }
  
  /**
   * 生成大型矿物团簇
   * @param {number[][]} chunk - 区块数组
   * @param {number} centerX - 中心X坐标
   * @param {number} centerY - 中心Y坐标
   * @param {number} oreId - 矿物ID
   * @param {number} stoneId - 石头ID
   * @param {Object} oreConfig - 矿物配置
   * @param {number} chunkWidth - 区块宽度
   * @param {number} chunkHeight - 区块高度
   */
  generateLargeCluster(chunk, centerX, centerY, oreId, stoneId, oreConfig, chunkWidth, chunkHeight) {
    const radius = oreConfig.clusterSize;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        
        if (x >= 0 && x < chunkWidth && y >= 0 && y < chunkHeight) {
          if (chunk[y][x] === stoneId) {
            // 椭圆形分布
            const ellipseValue = (dx * dx) / (radius * radius) + (dy * dy) / (radius * radius * 0.6);
            
            if (ellipseValue <= 1) {
              const probability = Math.max(0, 1 - ellipseValue) * oreConfig.abundance * 2;
              
              if (Math.random() < probability) {
                chunk[y][x] = oreId;
              }
            }
          }
        }
      }
    }
  }
  
  /**
   * 生成矿脉连接
   * @param {number[][]} chunk - 区块数组
   * @param {number} chunkX - 区块X坐标
   * @param {number} chunkWidth - 区块宽度
   * @param {number} chunkHeight - 区块高度
   */
  generateOreVeins(chunk, chunkX, chunkWidth, chunkHeight) {
    const stoneId = blockConfig.getBlock('stone').id;
    
    // 生成少量长矿脉
    const veinCount = Math.floor(Math.random() * 2) + 1;
    
    for (let i = 0; i < veinCount; i++) {
      const startX = Math.floor(Math.random() * chunkWidth);
      const startY = Math.floor(Math.random() * (chunkHeight * 0.8)) + Math.floor(chunkHeight * 0.1);
      
      if (chunk[startY] && chunk[startY][startX] === stoneId) {
        this.generateVein(chunk, startX, startY, chunkX, chunkWidth, chunkHeight);
      }
    }
  }
  
  /**
   * 生成单条矿脉
   * @param {number[][]} chunk - 区块数组
   * @param {number} startX - 起始X坐标
   * @param {number} startY - 起始Y坐标
   * @param {number} chunkX - 区块X坐标
   * @param {number} chunkWidth - 区块宽度
   * @param {number} chunkHeight - 区块高度
   */
  generateVein(chunk, startX, startY, chunkX, chunkWidth, chunkHeight) {
    const stoneId = blockConfig.getBlock('stone').id;
    
    // 选择矿脉的矿物类型
    const oreType = this.selectOreTypeForCluster(startY, chunkX * chunkWidth + startX);
    if (!oreType) return;
    
    const oreId = blockConfig.getBlock(oreType.blockType);
    if (!oreId) return;
    
    let currentX = startX;
    let currentY = startY;
    const length = oreType.veinLength + Math.floor(Math.random() * 5);
    
    // 随机方向
    let dirX = (Math.random() - 0.5) * 2;
    let dirY = (Math.random() - 0.5) * 0.5; // 更倾向于水平
    
    for (let i = 0; i < length; i++) {
      // 添加一些随机性
      dirX += (Math.random() - 0.5) * 0.3;
      dirY += (Math.random() - 0.5) * 0.2;
      
      // 限制方向
      dirX = Math.max(-1, Math.min(1, dirX));
      dirY = Math.max(-0.5, Math.min(0.5, dirY));
      
      currentX += dirX;
      currentY += dirY;
      
      const x = Math.floor(currentX);
      const y = Math.floor(currentY);
      
      if (x >= 0 && x < chunkWidth && y >= 0 && y < chunkHeight) {
        if (chunk[y] && chunk[y][x] === stoneId) {
          chunk[y][x] = oreId.id;
          
          // 矿脉有一定厚度
          if (Math.random() < 0.3) {
            if (y > 0 && chunk[y-1][x] === stoneId) chunk[y-1][x] = oreId.id;
            if (y < chunkHeight-1 && chunk[y+1][x] === stoneId) chunk[y+1][x] = oreId.id;
          }
        }
      }
    }
  }
  
  /**
   * 获取矿物对应的噪音生成器
   * @param {string} oreName - 矿物名称
   * @returns {SimplexNoise} 噪音生成器
   */
  getNoiseGenerator(oreName) {
    switch (oreName) {
      case 'coal': return this.coalNoise;
      case 'iron': return this.ironNoise;
      case 'gold': return this.goldNoise;
      case 'diamond': return this.diamondNoise;
      default: return this.coalNoise;
    }
  }
  
  /**
   * 计算深度加成
   * @param {number} depth - 当前深度
   * @param {Object} config - 矿物配置
   * @returns {number} 深度因子 (0-1)
   */
  calculateDepthBonus(depth, config) {
    const range = config.maxDepth - config.minDepth;
    if (range <= 0) return 0;
    
    const relativeDepth = (depth - config.minDepth) / range;
    
    // 不同矿物有不同的深度分布模式
    switch (config.blockType) {
      case 'coal':
        // 煤在中等深度最多
        return Math.sin(relativeDepth * Math.PI);
      case 'iron':
        // 铁在中深度更多
        return Math.pow(relativeDepth, 0.8);
      case 'gold':
        // 金在深处更多
        return Math.pow(relativeDepth, 1.5);
      case 'diamond':
        // 钻石在最深处
        return Math.pow(relativeDepth, 2.0);
      default:
        return relativeDepth;
    }
  }
  
  /**
   * 获取矿物生成统计
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      seed: this.seed,
      oreTypes: Object.keys(this.oreConfigs),
      algorithms: ['noise-based', 'cluster-generation', 'vein-connection'],
      features: ['depth-scaling', 'rarity-system', 'realistic-distribution']
    };
  }
}