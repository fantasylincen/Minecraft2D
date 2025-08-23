/**
 * 洞穴生成器
 * 使用Cellular Automata算法生成自然洞穴系统
 */

import { SimplexNoise } from '../noise/SimplexNoise.js';
import { blockConfig } from '../../config/BlockConfig.js';

export class CaveGenerator {
  constructor(seed) {
    this.seed = seed;
    this.caveNoise = new SimplexNoise(seed + 4000);
    this.tunnelNoise = new SimplexNoise(seed + 5000);
    this.chamberNoise = new SimplexNoise(seed + 6000);
    
    // 洞穴生成参数
    this.params = {
      // Cellular Automata参数
      initialCaveChance: 0.45,     // 初始洞穴概率
      iterations: 5,               // CA迭代次数
      birthLimit: 4,               // 生成洞穴的邻居阈值
      deathLimit: 3,               // 移除洞穴的邻居阈值
      
      // 洞穴分布参数
      minDepth: 20,                // 最小生成深度
      maxDepth: 0.8,               // 最大生成深度比例
      caveScale: 0.02,             // 洞穴噪音尺度
      tunnelScale: 0.015,          // 隧道噪音尺度
      chamberScale: 0.008,         // 洞室噪音尺度
      
      // 洞穴特征参数
      tunnelThreshold: 0.3,        // 隧道生成阈值
      chamberThreshold: 0.6,       // 洞室生成阈值
      connectionThreshold: 0.4,    // 连接通道阈值
    };
    
    console.log('🕳️ CaveGenerator 初始化完成');
  }
  
  /**
   * 生成区块的洞穴系统
   * @param {number[][]} chunk - 区块数组
   * @param {number} chunkX - 区块X坐标
   * @param {string[]} biomeMap - 生物群系映射
   * @param {Object} worldConfig - 世界配置
   */
  generateCaves(chunk, chunkX, biomeMap, worldConfig) {
    const chunkWidth = chunk[0].length;
    const chunkHeight = chunk.length;
    const minDepth = this.params.minDepth;
    const maxDepth = Math.floor(chunkHeight * this.params.maxDepth);
    
    // 只在地下生成洞穴
    if (maxDepth <= minDepth) return;
    
    // 第一步：生成初始洞穴种子
    let caveMap = this.generateInitialCaveSeeds(chunkWidth, chunkHeight, chunkX, minDepth, maxDepth);
    
    // 第二步：应用Cellular Automata
    for (let i = 0; i < this.params.iterations; i++) {
      caveMap = this.applyCellularAutomata(caveMap, chunkWidth, chunkHeight);
    }
    
    // 第三步：生成隧道连接
    this.generateTunnels(caveMap, chunkWidth, chunkHeight, chunkX, minDepth, maxDepth);
    
    // 第四步：生成大型洞室
    this.generateChambers(caveMap, chunkWidth, chunkHeight, chunkX, minDepth, maxDepth);
    
    // 第五步：应用洞穴到区块
    this.applyCavesToChunk(chunk, caveMap, minDepth);
    
    // 第六步：后处理（移除浮空方块等）
    this.postProcessCaves(chunk, caveMap, minDepth);
  }
  
  /**
   * 生成初始洞穴种子
   * @param {number} width - 区块宽度
   * @param {number} height - 区块高度
   * @param {number} chunkX - 区块X坐标
   * @param {number} minDepth - 最小深度
   * @param {number} maxDepth - 最大深度
   * @returns {number[][]} 洞穴地图 (1=洞穴, 0=实体)
   */
  generateInitialCaveSeeds(width, height, chunkX, minDepth, maxDepth) {
    const caveMap = [];
    
    for (let y = 0; y < height; y++) {
      caveMap[y] = [];
      for (let x = 0; x < width; x++) {
        if (y < minDepth || y > maxDepth) {
          // 地表和深层不生成洞穴
          caveMap[y][x] = 0;
        } else {
          const absoluteX = chunkX * width + x;
          
          // 使用深度衰减的洞穴概率
          const depthFactor = (y - minDepth) / (maxDepth - minDepth);
          const depthModifier = Math.sin(depthFactor * Math.PI); // 中间深度洞穴最多
          
          // 基于噪音的洞穴分布
          const caveNoise = this.caveNoise.sample(
            absoluteX * this.params.caveScale, 
            y * this.params.caveScale
          );
          
          const adjustedChance = this.params.initialCaveChance * depthModifier;
          caveMap[y][x] = caveNoise > (1 - adjustedChance) ? 1 : 0;
        }
      }
    }
    
    return caveMap;
  }
  
  /**
   * 应用Cellular Automata规则
   * @param {number[][]} caveMap - 当前洞穴地图
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @returns {number[][]} 新的洞穴地图
   */
  applyCellularAutomata(caveMap, width, height) {
    const newMap = [];
    
    for (let y = 0; y < height; y++) {
      newMap[y] = [];
      for (let x = 0; x < width; x++) {
        const neighbors = this.countCaveNeighbors(caveMap, x, y, width, height);
        
        if (caveMap[y][x] === 1) {
          // 当前是洞穴
          newMap[y][x] = neighbors >= this.params.deathLimit ? 1 : 0;
        } else {
          // 当前是实体
          newMap[y][x] = neighbors > this.params.birthLimit ? 1 : 0;
        }
      }
    }
    
    return newMap;
  }
  
  /**
   * 计算洞穴邻居数量
   * @param {number[][]} caveMap - 洞穴地图
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @returns {number} 邻居洞穴数量
   */
  countCaveNeighbors(caveMap, x, y, width, height) {
    let count = 0;
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          // 边界视为实体
          count++;
        } else {
          count += caveMap[ny][nx];
        }
      }
    }
    
    return count;
  }
  
  /**
   * 生成隧道连接
   * @param {number[][]} caveMap - 洞穴地图
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} chunkX - 区块X坐标
   * @param {number} minDepth - 最小深度
   * @param {number} maxDepth - 最大深度
   */
  generateTunnels(caveMap, width, height, chunkX, minDepth, maxDepth) {
    for (let y = minDepth; y < maxDepth; y++) {
      for (let x = 0; x < width; x++) {
        const absoluteX = chunkX * width + x;
        
        const tunnelNoise = this.tunnelNoise.sample(
          absoluteX * this.params.tunnelScale,
          y * this.params.tunnelScale
        );
        
        // 生成水平隧道
        if (tunnelNoise > this.params.tunnelThreshold) {
          caveMap[y][x] = 1;
          
          // 扩展隧道宽度
          if (y > minDepth) caveMap[y - 1][x] = 1;
          if (y < maxDepth - 1) caveMap[y + 1][x] = 1;
        }
        
        // 生成垂直隧道
        const verticalTunnel = this.tunnelNoise.sample(
          absoluteX * this.params.tunnelScale * 1.3,
          y * this.params.tunnelScale * 0.7
        );
        
        if (verticalTunnel > this.params.tunnelThreshold + 0.1) {
          caveMap[y][x] = 1;
          
          // 扩展隧道宽度
          if (x > 0) caveMap[y][x - 1] = 1;
          if (x < width - 1) caveMap[y][x + 1] = 1;
        }
      }
    }
  }
  
  /**
   * 生成大型洞室
   * @param {number[][]} caveMap - 洞穴地图
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} chunkX - 区块X坐标
   * @param {number} minDepth - 最小深度
   * @param {number} maxDepth - 最大深度
   */
  generateChambers(caveMap, width, height, chunkX, minDepth, maxDepth) {
    for (let y = minDepth + 2; y < maxDepth - 2; y++) {
      for (let x = 2; x < width - 2; x++) {
        const absoluteX = chunkX * width + x;
        
        const chamberNoise = this.chamberNoise.sample(
          absoluteX * this.params.chamberScale,
          y * this.params.chamberScale
        );
        
        if (chamberNoise > this.params.chamberThreshold) {
          // 创建椭圆形洞室
          this.createChamber(caveMap, x, y, width, height, 3, 2);
        }
      }
    }
  }
  
  /**
   * 创建椭圆形洞室
   * @param {number[][]} caveMap - 洞穴地图
   * @param {number} centerX - 中心X坐标
   * @param {number} centerY - 中心Y坐标
   * @param {number} width - 地图宽度
   * @param {number} height - 地图高度
   * @param {number} radiusX - X轴半径
   * @param {number} radiusY - Y轴半径
   */
  createChamber(caveMap, centerX, centerY, width, height, radiusX, radiusY) {
    for (let dy = -radiusY; dy <= radiusY; dy++) {
      for (let dx = -radiusX; dx <= radiusX; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
          // 椭圆形判断
          const ellipseValue = (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY);
          
          if (ellipseValue <= 1) {
            caveMap[y][x] = 1;
          }
        }
      }
    }
  }
  
  /**
   * 将洞穴应用到区块
   * @param {number[][]} chunk - 区块数组
   * @param {number[][]} caveMap - 洞穴地图
   * @param {number} minDepth - 最小深度
   */
  applyCavesToChunk(chunk, caveMap, minDepth) {
    const airId = blockConfig.getBlock('air').id;
    const chunkHeight = chunk.length;
    const chunkWidth = chunk[0].length;
    
    for (let y = minDepth; y < chunkHeight; y++) {
      for (let x = 0; x < chunkWidth; x++) {
        if (caveMap[y] && caveMap[y][x] === 1) {
          // 只在固体方块中挖洞
          const currentBlock = chunk[y][x];
          if (currentBlock !== airId) {
            chunk[y][x] = airId;
          }
        }
      }
    }
  }
  
  /**
   * 洞穴后处理
   * @param {number[][]} chunk - 区块数组
   * @param {number[][]} caveMap - 洞穴地图
   * @param {number} minDepth - 最小深度
   */
  postProcessCaves(chunk, caveMap, minDepth) {
    // 移除浮空的小方块团
    this.removeFloatingBlocks(chunk, minDepth);
    
    // 在洞穴底部添加一些砾石或沙子
    this.addCaveDeposits(chunk, caveMap, minDepth);
  }
  
  /**
   * 移除浮空方块
   * @param {number[][]} chunk - 区块数组
   * @param {number} minDepth - 最小深度
   */
  removeFloatingBlocks(chunk, minDepth) {
    const airId = blockConfig.getBlock('air').id;
    const chunkHeight = chunk.length;
    const chunkWidth = chunk[0].length;
    
    for (let y = minDepth; y < chunkHeight - 1; y++) {
      for (let x = 1; x < chunkWidth - 1; x++) {
        if (chunk[y][x] !== airId) {
          // 检查是否被空气包围
          let airNeighbors = 0;
          const neighbors = [
            [x-1, y], [x+1, y], [x, y-1], [x, y+1]
          ];
          
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < chunkWidth && ny >= 0 && ny < chunkHeight) {
              if (chunk[ny][nx] === airId) airNeighbors++;
            }
          }
          
          // 如果4个方向都是空气，移除这个方块
          if (airNeighbors >= 4) {
            chunk[y][x] = airId;
          }
        }
      }
    }
  }
  
  /**
   * 添加洞穴沉积物
   * @param {number[][]} chunk - 区块数组
   * @param {number[][]} caveMap - 洞穴地图
   * @param {number} minDepth - 最小深度
   */
  addCaveDeposits(chunk, caveMap, minDepth) {
    const airId = blockConfig.getBlock('air').id;
    const gravelId = blockConfig.getBlock('gravel') ? blockConfig.getBlock('gravel').id : blockConfig.getBlock('dirt').id;
    const chunkHeight = chunk.length;
    const chunkWidth = chunk[0].length;
    
    for (let y = minDepth; y < chunkHeight - 1; y++) {
      for (let x = 0; x < chunkWidth; x++) {
        // 在洞穴底部添加砾石
        if (caveMap[y] && caveMap[y][x] === 1 && chunk[y][x] === airId) {
          if (y + 1 < chunkHeight && chunk[y + 1][x] !== airId) {
            // 有一定概率在洞穴底部生成砾石
            if (Math.random() < 0.1) {
              chunk[y][x] = gravelId;
            }
          }
        }
      }
    }
  }
  
  /**
   * 获取洞穴生成统计
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      seed: this.seed,
      params: this.params,
      algorithm: 'Cellular Automata',
      features: ['tunnels', 'chambers', 'deposits']
    };
  }
}