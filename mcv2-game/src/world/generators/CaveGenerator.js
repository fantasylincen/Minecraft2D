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
    
    // 洞穴生成参数 - 从GameConfig获取
    this.getParams = () => ({
      // Cellular Automata参数
      initialCaveChance: gameConfig.get('cave', 'initialCaveChance'),
      iterations: gameConfig.get('cave', 'iterations'),
      birthLimit: gameConfig.get('cave', 'birthLimit'),
      deathLimit: gameConfig.get('cave', 'deathLimit'),
      
      // 洞穴分布参数
      minDepth: gameConfig.get('cave', 'minDepth'),
      maxDepthRatio: gameConfig.get('cave', 'maxDepthRatio'),
      coveragePercentage: gameConfig.get('cave', 'coveragePercentage'),
      
      // 洞穴特征参数
      tunnelThreshold: gameConfig.get('cave', 'tunnelThreshold'),
      chamberThreshold: gameConfig.get('cave', 'chamberThreshold'),
      
      // 噪音尺度（固定值）
      caveScale: 0.02,
      tunnelScale: 0.015,
      chamberScale: 0.008,
      connectionThreshold: 0.4
    });
    
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
    const params = this.getParams();
    const chunkWidth = chunk[0].length;
    const chunkHeight = chunk.length;
    const minDepth = params.minDepth;
    const maxDepth = Math.floor(chunkHeight * params.maxDepthRatio);
    
    // 只在地下生成洞穴
    if (maxDepth <= minDepth) return;
    
    // 第一步：生成初始洞穴种子
    let caveMap = this.generateInitialCaveSeeds(chunkWidth, chunkHeight, chunkX, minDepth, maxDepth, params);
    
    // 第二步：应用Cellular Automata
    for (let i = 0; i < params.iterations; i++) {
      caveMap = this.applyCellularAutomata(caveMap, chunkWidth, chunkHeight, params);
    }
    
    // 第三步：检查覆盖率并调整
    caveMap = this.adjustCaveCoverage(caveMap, chunkWidth, chunkHeight, minDepth, maxDepth, params);
    
    // 第四步：生成隧道连接
    this.generateTunnels(caveMap, chunkWidth, chunkHeight, chunkX, minDepth, maxDepth, params);
    
    // 第五步：生成大型洞室
    this.generateChambers(caveMap, chunkWidth, chunkHeight, chunkX, minDepth, maxDepth, params);
    
    // 第六步：最终覆盖率检查
    caveMap = this.finalCoverageCheck(caveMap, chunkWidth, chunkHeight, minDepth, maxDepth, params);
    
    // 第七步：应用洞穴到区块
    this.applyCavesToChunk(chunk, caveMap, minDepth);
    
    // 第八步：后处理（移除浮空方块等）
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
  generateInitialCaveSeeds(width, height, chunkX, minDepth, maxDepth, params) {
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
            absoluteX * params.caveScale, 
            y * params.caveScale
          );
          
          const adjustedChance = params.initialCaveChance * depthModifier;
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
  applyCellularAutomata(caveMap, width, height, params) {
    const newMap = [];
    
    for (let y = 0; y < height; y++) {
      newMap[y] = [];
      for (let x = 0; x < width; x++) {
        const neighbors = this.countCaveNeighbors(caveMap, x, y, width, height);
        
        if (caveMap[y][x] === 1) {
          // 当前是洞穴
          newMap[y][x] = neighbors >= params.deathLimit ? 1 : 0;
        } else {
          // 当前是实体
          newMap[y][x] = neighbors > params.birthLimit ? 1 : 0;
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
  generateTunnels(caveMap, width, height, chunkX, minDepth, maxDepth, params) {
    for (let y = minDepth; y < maxDepth; y++) {
      for (let x = 0; x < width; x++) {
        const absoluteX = chunkX * width + x;
        
        const tunnelNoise = this.tunnelNoise.sample(
          absoluteX * params.tunnelScale,
          y * params.tunnelScale
        );
        
        // 生成水平隧道
        if (tunnelNoise > params.tunnelThreshold) {
          caveMap[y][x] = 1;
          
          // 扩展隧道宽度
          if (y > minDepth) caveMap[y - 1][x] = 1;
          if (y < maxDepth - 1) caveMap[y + 1][x] = 1;
        }
        
        // 生成垂直隧道
        const verticalTunnel = this.tunnelNoise.sample(
          absoluteX * params.tunnelScale * 1.3,
          y * params.tunnelScale * 0.7
        );
        
        if (verticalTunnel > params.tunnelThreshold + 0.1) {
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
  generateChambers(caveMap, width, height, chunkX, minDepth, maxDepth, params) {
    for (let y = minDepth + 2; y < maxDepth - 2; y++) {
      for (let x = 2; x < width - 2; x++) {
        const absoluteX = chunkX * width + x;
        
        const chamberNoise = this.chamberNoise.sample(
          absoluteX * params.chamberScale,
          y * params.chamberScale
        );
        
        if (chamberNoise > params.chamberThreshold) {
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
   * 调整洞穴覆盖率
   * @param {number[][]} caveMap - 洞穴地图
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} minDepth - 最小深度
   * @param {number} maxDepth - 最大深度
   * @param {Object} params - 参数对象
   * @returns {number[][]} 调整后的洞穴地图
   */
  adjustCaveCoverage(caveMap, width, height, minDepth, maxDepth, params) {
    const targetCoverage = params.coveragePercentage / 100;
    const currentCoverage = this.calculateCoverage(caveMap, width, height, minDepth, maxDepth);
    
    console.log(`🕳️ 当前洞穴覆盖率: ${(currentCoverage * 100).toFixed(1)}%, 目标: ${params.coveragePercentage}%`);
    
    if (Math.abs(currentCoverage - targetCoverage) < 0.02) {
      // 覆盖率已经接近目标值
      return caveMap;
    }
    
    if (currentCoverage > targetCoverage) {
      // 洞穴太多，需要填充一些
      return this.reduceCaveCoverage(caveMap, width, height, minDepth, maxDepth, currentCoverage, targetCoverage);
    } else {
      // 洞穴太少，需要挖掘更多
      return this.increaseCaveCoverage(caveMap, width, height, minDepth, maxDepth, currentCoverage, targetCoverage);
    }
  }
  
  /**
   * 计算洞穴覆盖率
   * @param {number[][]} caveMap - 洞穴地图
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} minDepth - 最小深度
   * @param {number} maxDepth - 最大深度
   * @returns {number} 覆盖率 (0-1)
   */
  calculateCoverage(caveMap, width, height, minDepth, maxDepth) {
    let caveBlocks = 0;
    let totalBlocks = 0;
    
    for (let y = minDepth; y < maxDepth; y++) {
      for (let x = 0; x < width; x++) {
        totalBlocks++;
        if (caveMap[y] && caveMap[y][x] === 1) {
          caveBlocks++;
        }
      }
    }
    
    return totalBlocks > 0 ? caveBlocks / totalBlocks : 0;
  }
  
  /**
   * 减少洞穴覆盖率
   * @param {number[][]} caveMap - 洞穴地图
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} minDepth - 最小深度
   * @param {number} maxDepth - 最大深度
   * @param {number} currentCoverage - 当前覆盖率
   * @param {number} targetCoverage - 目标覆盖率
   * @returns {number[][]} 调整后的洞穴地图
   */
  reduceCaveCoverage(caveMap, width, height, minDepth, maxDepth, currentCoverage, targetCoverage) {
    const reductionRatio = 1 - (targetCoverage / currentCoverage);
    const newMap = JSON.parse(JSON.stringify(caveMap)); // 深拷贝
    
    // 优先填充边缘和小洞穴
    for (let y = minDepth; y < maxDepth; y++) {
      for (let x = 0; x < width; x++) {
        if (newMap[y][x] === 1) {
          // 计算这个洞穴块的重要性（边缘块更容易被填充）
          const neighbors = this.countCaveNeighbors(caveMap, x, y, width, height);
          const edgeScore = 8 - neighbors; // 邻居越少（越靠近边缘），分数越高
          
          // 根据边缘分数和随机因子决定是否填充
          const fillProbability = (edgeScore / 8) * reductionRatio * 2.0; // 增加调整强度
          
          if (Math.random() < fillProbability) {
            newMap[y][x] = 0;
          }
        }
      }
    }
    
    return newMap;
  }
  
  /**
   * 增加洞穴覆盖率
   * @param {number[][]} caveMap - 洞穴地图
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} minDepth - 最小深度
   * @param {number} maxDepth - 最大深度
   * @param {number} currentCoverage - 当前覆盖率
   * @param {number} targetCoverage - 目标覆盖率
   * @returns {number[][]} 调整后的洞穴地图
   */
  increaseCaveCoverage(caveMap, width, height, minDepth, maxDepth, currentCoverage, targetCoverage) {
    const expansionRatio = Math.min((targetCoverage / currentCoverage) - 1, 0.8); // 增加扩展比例上限
    const newMap = JSON.parse(JSON.stringify(caveMap)); // 深拷贝
    
    // 优先扩展现有洞穴的边缘
    for (let y = minDepth; y < maxDepth; y++) {
      for (let x = 0; x < width; x++) {
        if (newMap[y][x] === 0) {
          // 计算这个实体块周围的洞穴密度
          const caveNeighbors = this.countCaveNeighbors(caveMap, x, y, width, height);
          
          if (caveNeighbors > 0) {
            const expandProbability = Math.min((caveNeighbors / 8) * expansionRatio * 2.0, 0.6); // 增加调整强度
            
            if (Math.random() < expandProbability) {
              newMap[y][x] = 1;
            }
          }
        }
      }
    }
    
    return newMap;
  }
  
  /**
   * 最终覆盖率检查
   * @param {number[][]} caveMap - 洞穴地图
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} minDepth - 最小深度
   * @param {number} maxDepth - 最大深度
   * @param {Object} params - 参数对象
   * @returns {number[][]} 最终调整后的洞穴地图
   */
  finalCoverageCheck(caveMap, width, height, minDepth, maxDepth, params) {
    const finalCoverage = this.calculateCoverage(caveMap, width, height, minDepth, maxDepth);
    const targetCoverage = params.coveragePercentage / 100;
    const tolerance = 0.03; // 3%的容差
    
    console.log(`🎯 最终洞穴覆盖率: ${(finalCoverage * 100).toFixed(1)}%, 目标: ${params.coveragePercentage}%`);
    
    if (Math.abs(finalCoverage - targetCoverage) > tolerance) {
      console.log(`⚠️ 覆盖率偏差较大，进行微调...`);
      
      if (finalCoverage > targetCoverage + tolerance) {
        return this.reduceCaveCoverage(caveMap, width, height, minDepth, maxDepth, finalCoverage, targetCoverage);
      } else if (finalCoverage < targetCoverage - tolerance) {
        return this.increaseCaveCoverage(caveMap, width, height, minDepth, maxDepth, finalCoverage, targetCoverage);
      }
    }
    
    return caveMap;
  }
  
  /**
   * 获取洞穴生成统计
   * @returns {Object} 统计信息
   */
  getStats() {
    const params = this.getParams();
    return {
      seed: this.seed,
      params: params,
      algorithm: 'Cellular Automata',
      features: ['tunnels', 'chambers', 'deposits', 'coverage-control'],
      coverageTarget: `${params.coveragePercentage}%`
    };
  }
}