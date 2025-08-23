/**
 * 地形生成器
 * 负责生成随机地形和管理世界数据
 */

import { blockConfig } from '../config/BlockConfig.js';

export class TerrainGenerator {
  constructor(worldConfig) {
    this.worldConfig = worldConfig;
    
    // 世界数据存储
    this.chunks = new Map(); // 区块数据
    this.loadedChunks = new Set(); // 已加载的区块
    
    // 噪音生成器种子
    this.seed = Math.random() * 1000000;
    
    // 地形生成参数
    this.terrainParams = {
      heightScale: 80,        // 地形高度变化幅度
      baseHeight: 200,        // 基础地形高度
      frequency: 0.01,        // 噪音频率
      octaves: 4,             // 噪音层数
      persistence: 0.5,       // 噪音持续性
      lacunarity: 2.0,        // 噪音间隙
      waterLevel: 180,        // 水位线
      oreFrequency: 0.02,     // 矿物生成频率
      treeFrequency: 0.05,    // 树木生成频率
    };
    
    console.log('🌍 TerrainGenerator 初始化完成');
  }
  
  /**
   * 更新地形生成器
   */
  update(deltaTime) {
    // 暂时为空，后续可添加动态生成逻辑
  }
  
  /**
   * 生成指定区块
   */
  generateChunk(chunkX) {
    if (this.loadedChunks.has(chunkX)) {
      return this.chunks.get(chunkX);
    }
    
    const chunk = this.createChunk(chunkX);
    this.chunks.set(chunkX, chunk);
    this.loadedChunks.add(chunkX);
    
    console.log(`🌱 生成区块: ${chunkX}`);
    return chunk;
  }
  
  /**
   * 创建新区块
   */
  createChunk(chunkX) {
    const chunkSize = this.worldConfig.CHUNK_SIZE;
    const worldHeight = this.worldConfig.WORLD_HEIGHT;
    
    // 创建区块数据数组
    const chunk = [];
    for (let y = 0; y < worldHeight; y++) {
      chunk[y] = [];
      for (let x = 0; x < chunkSize; x++) {
        chunk[y][x] = 0; // 默认为空气
      }
    }
    
    // 生成地形
    this.generateTerrain(chunk, chunkX);
    
    // 生成矿物
    this.generateOres(chunk, chunkX);
    
    // 生成植被
    this.generateVegetation(chunk, chunkX);
    
    return chunk;
  }
  
  /**
   * 生成基础地形
   */
  generateTerrain(chunk, chunkX) {
    const chunkSize = this.worldConfig.CHUNK_SIZE;
    const worldHeight = this.worldConfig.WORLD_HEIGHT;
    
    for (let localX = 0; localX < chunkSize; localX++) {
      const worldX = chunkX * chunkSize + localX;
      
      // 使用多层噪音生成地形高度
      let height = this.terrainParams.baseHeight;
      let amplitude = this.terrainParams.heightScale;
      let frequency = this.terrainParams.frequency;
      
      for (let octave = 0; octave < this.terrainParams.octaves; octave++) {
        height += this.noise(worldX * frequency + this.seed) * amplitude;
        amplitude *= this.terrainParams.persistence;
        frequency *= this.terrainParams.lacunarity;
      }
      
      height = Math.floor(height);
      height = Math.max(50, Math.min(worldHeight - 50, height)); // 限制高度范围
      
      // 生成地表
      this.generateColumn(chunk, localX, height, worldHeight);
    }
  }
  
  /**
   * 生成单列地形
   */
  generateColumn(chunk, x, surfaceHeight, worldHeight) {
    for (let y = 0; y < worldHeight; y++) {
      if (y < 10) {
        // 基岩层
        chunk[y][x] = blockConfig.getBlock('stone').id;
      } else if (y < surfaceHeight - 5) {
        // 深层石头
        chunk[y][x] = blockConfig.getBlock('stone').id;
      } else if (y < surfaceHeight - 1) {
        // 泥土层
        chunk[y][x] = blockConfig.getBlock('dirt').id;
      } else if (y < surfaceHeight) {
        // 表层草地
        chunk[y][x] = blockConfig.getBlock('grass').id;
      } else if (y < this.terrainParams.waterLevel) {
        // 水层
        chunk[y][x] = blockConfig.getBlock('water').id;
      } else {
        // 空气
        chunk[y][x] = blockConfig.getBlock('air').id;
      }
    }
    
    // 在水位以下的地面生成沙子
    if (surfaceHeight < this.terrainParams.waterLevel) {
      for (let y = Math.max(10, surfaceHeight - 3); y < surfaceHeight; y++) {
        chunk[y][x] = blockConfig.getBlock('sand').id;
      }
    }
  }
  
  /**
   * 生成矿物
   */
  generateOres(chunk, chunkX) {
    const chunkSize = this.worldConfig.CHUNK_SIZE;
    const worldHeight = this.worldConfig.WORLD_HEIGHT;
    
    for (let y = 10; y < worldHeight - 100; y++) {
      for (let x = 0; x < chunkSize; x++) {
        if (chunk[y][x] === blockConfig.getBlock('stone').id) {
          const worldX = chunkX * chunkSize + x;
          const oreNoise = this.noise(worldX * 0.1 + y * 0.1 + this.seed * 2);
          
          // 根据深度和噪音值生成不同矿物
          if (oreNoise > 0.7) {
            if (y < 50) {
              // 深层：钻石
              if (oreNoise > 0.95) {
                chunk[y][x] = blockConfig.getBlock('diamond').id;
              } else if (oreNoise > 0.85) {
                chunk[y][x] = blockConfig.getBlock('gold').id;
              }
            } else if (y < 100) {
              // 中层：金矿、铁矿
              if (oreNoise > 0.9) {
                chunk[y][x] = blockConfig.getBlock('gold').id;
              } else if (oreNoise > 0.8) {
                chunk[y][x] = blockConfig.getBlock('iron').id;
              }
            } else {
              // 浅层：煤矿、铁矿
              if (oreNoise > 0.85) {
                chunk[y][x] = blockConfig.getBlock('iron').id;
              } else if (oreNoise > 0.75) {
                chunk[y][x] = blockConfig.getBlock('coal').id;
              }
            }
          }
        }
      }
    }
  }
  
  /**
   * 生成植被
   */
  generateVegetation(chunk, chunkX) {
    const chunkSize = this.worldConfig.CHUNK_SIZE;
    const worldHeight = this.worldConfig.WORLD_HEIGHT;
    
    for (let x = 0; x < chunkSize; x++) {
      // 寻找地表
      for (let y = worldHeight - 1; y >= 0; y--) {
        if (chunk[y][x] === blockConfig.getBlock('grass').id) {
          const worldX = chunkX * chunkSize + x;
          const treeNoise = this.noise(worldX * 0.05 + this.seed * 3);
          
          // 生成树木
          if (treeNoise > 0.7 && y + 5 < worldHeight) {
            this.generateTree(chunk, x, y + 1, worldHeight);
          }
          break;
        }
      }
    }
  }
  
  /**
   * 生成单棵树
   */
  generateTree(chunk, x, baseY, worldHeight) {
    const treeHeight = 4 + Math.floor(Math.random() * 3);
    const woodBlockId = blockConfig.getBlock('wood').id;
    
    // 生成树干
    for (let i = 0; i < treeHeight && baseY + i < worldHeight; i++) {
      chunk[baseY + i][x] = woodBlockId;
    }
    
    // 简单的树叶（使用草方块代替，后续可添加专门的树叶方块）
    const leafBlockId = blockConfig.getBlock('grass').id;
    const leafY = baseY + treeHeight - 1;
    
    if (leafY < worldHeight) {
      // 树冠
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = 0; dy <= 1; dy++) {
          const leafX = x + dx;
          const currentY = leafY + dy;
          
          if (leafX >= 0 && leafX < chunk[0].length && currentY < worldHeight) {
            if (chunk[currentY][leafX] === blockConfig.getBlock('air').id) {
              chunk[currentY][leafX] = leafBlockId;
            }
          }
        }
      }
    }
  }
  
  /**
   * 简单噪音函数（基于正弦波）
   */
  noise(x) {
    return Math.sin(x * 12.9898) * 43758.5453 % 1;
  }
  
  /**
   * 获取指定位置的方块
   */
  getBlock(worldX, worldY) {
    if (worldY < 0 || worldY >= this.worldConfig.WORLD_HEIGHT) {
      return blockConfig.getBlock('air').id;
    }
    
    const chunkX = Math.floor(worldX / this.worldConfig.CHUNK_SIZE);
    const localX = worldX - chunkX * this.worldConfig.CHUNK_SIZE;
    
    if (localX < 0) {
      return blockConfig.getBlock('air').id;
    }
    
    const chunk = this.generateChunk(chunkX);
    return chunk[worldY] && chunk[worldY][localX] !== undefined 
      ? chunk[worldY][localX] 
      : blockConfig.getBlock('air').id;
  }
  
  /**
   * 设置指定位置的方块
   */
  setBlock(worldX, worldY, blockId) {
    if (worldY < 0 || worldY >= this.worldConfig.WORLD_HEIGHT) {
      return false;
    }
    
    const chunkX = Math.floor(worldX / this.worldConfig.CHUNK_SIZE);
    const localX = worldX - chunkX * this.worldConfig.CHUNK_SIZE;
    
    if (localX < 0) {
      return false;
    }
    
    const chunk = this.generateChunk(chunkX);
    if (chunk[worldY] && localX < this.worldConfig.CHUNK_SIZE) {
      chunk[worldY][localX] = blockId;
      return true;
    }
    
    return false;
  }
  
  /**
   * 获取区块范围内的方块数据
   */
  getChunkData(chunkX) {
    return this.generateChunk(chunkX);
  }
  
  /**
   * 卸载远离的区块以节省内存
   */
  unloadDistantChunks(centerChunkX, maxDistance = 5) {
    const chunksToUnload = [];
    
    for (const chunkX of this.loadedChunks) {
      if (Math.abs(chunkX - centerChunkX) > maxDistance) {
        chunksToUnload.push(chunkX);
      }
    }
    
    chunksToUnload.forEach(chunkX => {
      this.chunks.delete(chunkX);
      this.loadedChunks.delete(chunkX);
    });
    
    if (chunksToUnload.length > 0) {
      console.log(`🗑️  卸载 ${chunksToUnload.length} 个远距离区块`);
    }
  }
  
  /**
   * 获取地形统计信息
   */
  getStats() {
    return {
      loadedChunks: this.loadedChunks.size,
      seed: this.seed,
      terrainParams: { ...this.terrainParams }
    };
  }
  
  /**
   * 重新生成地形（使用新种子）
   */
  regenerate(newSeed = null) {
    if (newSeed !== null) {
      this.seed = newSeed;
    } else {
      this.seed = Math.random() * 1000000;
    }
    
    // 清除所有已生成的区块
    this.chunks.clear();
    this.loadedChunks.clear();
    
    console.log(`🔄 重新生成地形，种子: ${this.seed}`);
  }
}