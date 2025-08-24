/**
 * 洞穴生成器
 * 使用Cellular Automata算法生成自然洞穴系统
 */

import { SimplexNoise } from '../noise/SimplexNoise.js';
import { blockConfig } from '../../config/BlockConfig.js';
import { gameConfig } from '../../config/GameConfig.js';

export class CaveGenerator {
  constructor(seed) {
    this.seed = seed;
    this.caveNoise = new SimplexNoise(seed + 4000);
    this.tunnelNoise = new SimplexNoise(seed + 5000);
    this.chamberNoise = new SimplexNoise(seed + 6000);
    
    // 洞穴生成参数
    this.caveParams = {
      initialCaveChance: 0.38,  // 调整初始洞穴概率 (从0.42改为0.38)
      smoothingIterations: 4,   // 保持平滑迭代次数
      neighborThreshold: 4,     // 保持邻居阈值
      depthThreshold: 0.7,      // 调整深度阈值 (从0.65改为0.7)
      // 新增：洞穴密度控制
      densityFactor: 0.3        // 洞穴密度因子 (从0.4改为0.3)
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
    
    // 第一步：生成初始洞穴种子
    let caveMap = this.generateInitialCaveSeeds(chunkWidth, chunkHeight, chunkX);
    
    // 第二步：应用Cellular Automata
    for (let i = 0; i < this.caveParams.smoothingIterations; i++) {
      caveMap = this.applyCellularAutomata(caveMap, chunkWidth, chunkHeight);
    }
    
    // 第三步：生成隧道连接
    this.generateTunnels(caveMap, chunkWidth, chunkHeight, chunkX);
    
    // 第四步：生成大型洞室
    this.generateChambers(caveMap, chunkWidth, chunkHeight, chunkX);
    
    // 第五步：应用洞穴到区块
    this.applyCavesToChunk(chunk, caveMap);
    
    // 第六步：后处理（移除浮空方块等）
    this.postProcessCaves(chunk, caveMap);
  }
  
  /**
   * 生成初始洞穴种子
   * @param {number} width - 区块宽度
   * @param {number} height - 区块高度
   * @param {number} chunkX - 区块X坐标
   * @returns {number[][]} 洞穴地图 (1=洞穴, 0=实体)
   */
  generateInitialCaveSeeds(width, height, chunkX) {
    const caveMap = [];
    // 调整深度阈值以控制洞穴生成深度
    const depthThreshold = this.caveParams.depthThreshold;
    
    for (let y = 0; y < height; y++) {
      caveMap[y] = [];
      for (let x = 0; x < width; x++) {
        const worldX = chunkX * width + x;
        
        // 只在地下生成洞穴，使用调整后的深度阈值
        if (y < height * depthThreshold) {
          // 应用密度因子控制洞穴密度
          const caveChance = (this.caveNoise.sample(worldX * 0.02, y * 0.02) + 1) / 2;
          caveMap[y][x] = caveChance > (1 - this.caveParams.initialCaveChance * this.caveParams.densityFactor) ? 1 : 0;
        } else {
          caveMap[y][x] = 0;
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
          newMap[y][x] = neighbors >= this.caveParams.neighborThreshold ? 1 : 0;
        } else {
          // 当前是实体
          newMap[y][x] = neighbors > this.caveParams.neighborThreshold ? 1 : 0;
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
   */
  generateTunnels(caveMap, width, height, chunkX) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const worldX = chunkX * width + x;
        
        const tunnelNoise = this.tunnelNoise.sample(
          worldX * 0.015,
          y * 0.015
        );
        
        // 生成水平隧道
        if (tunnelNoise > 0.4) {
          caveMap[y][x] = 1;
          
          // 扩展隧道宽度
          if (y > 0) caveMap[y - 1][x] = 1;
          if (y < height - 1) caveMap[y + 1][x] = 1;
        }
        
        // 生成垂直隧道
        const verticalTunnel = this.tunnelNoise.sample(
          worldX * 0.015 * 1.3,
          y * 0.015 * 0.7
        );
        
        if (verticalTunnel > 0.4 + 0.1) {
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
   */
  generateChambers(caveMap, width, height, chunkX) {
    for (let y = 2; y < height - 2; y++) {
      for (let x = 2; x < width - 2; x++) {
        const worldX = chunkX * width + x;
        
        const chamberNoise = this.chamberNoise.sample(
          worldX * 0.008,
          y * 0.008
        );
        
        if (chamberNoise > 0.4) {
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
   */
  applyCavesToChunk(chunk, caveMap) {
    const airId = blockConfig.getBlock('air').id;
    const chunkHeight = chunk.length;
    const chunkWidth = chunk[0].length;
    
    for (let y = 0; y < chunkHeight; y++) {
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
   */
  postProcessCaves(chunk, caveMap) {
    // 移除浮空的小方块团
    this.removeFloatingBlocks(chunk);
    
    // 在洞穴底部添加一些砾石或沙子
    this.addCaveDeposits(chunk, caveMap);
  }
  
  /**
   * 移除浮空方块
   * @param {number[][]} chunk - 区块数组
   */
  removeFloatingBlocks(chunk) {
    const airId = blockConfig.getBlock('air').id;
    const chunkHeight = chunk.length;
    const chunkWidth = chunk[0].length;
    
    for (let y = 0; y < chunkHeight - 1; y++) {
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
   */
  addCaveDeposits(chunk, caveMap) {
    const airId = blockConfig.getBlock('air').id;
    const gravelId = blockConfig.getBlock('gravel') ? blockConfig.getBlock('gravel').id : blockConfig.getBlock('dirt').id;
    const chunkHeight = chunk.length;
    const chunkWidth = chunk[0].length;
    
    for (let y = 0; y < chunkHeight - 1; y++) {
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
      params: this.caveParams,
      algorithm: 'Cellular Automata',
      features: ['tunnels', 'chambers', 'deposits', 'coverage-control'],
      coverageTarget: `${this.caveParams.coveragePercentage}%`
    };
  }
}