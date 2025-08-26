/**
 * 地形生成器
 * 集成新的模块化地形生成系统
 */

import { blockConfig } from '../config/BlockConfig.js';
import { WorldGenerator } from './WorldGenerator.js';

export class TerrainGenerator {
  constructor(worldConfig) {
    this.worldConfig = worldConfig;
    
    // 创建新的世界生成器
    this.worldGenerator = new WorldGenerator();
    this.worldGenerator.setWorldConfig(worldConfig);
    
    // 季节系统引用
    this.seasonSystem = null;
    
    // 容器管理器引用
    this.containerManager = null;
    
    // 世界数据存储
    this.chunks = new Map(); // 区块数据
    this.loadedChunks = new Set(); // 已加载的区块
    
    // 兼容性：保持原有接口
    this.seed = this.worldGenerator.getSeed();
    
    // 地形生成参数（兼容性）
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
    
    console.log('🌍 TerrainGenerator (新版) 初始化完成');
  }
  
  /**
   * 更新地形生成器
   */
  update(deltaTime) {
    // 暂时为空，后续可添加动态生成逻辑
  }
  
  /**
   * 设置季节系统
   * @param {Object} seasonSystem - 季节系统引用
   */
  setSeasonSystem(seasonSystem) {
    this.seasonSystem = seasonSystem;
    // 将季节系统传递给世界生成器
    if (this.worldGenerator) {
      this.worldGenerator.setSeasonSystem(seasonSystem);
    }
  }
  
  /**
   * 设置容器管理器
   * @param {Object} containerManager - 容器管理器引用
   */
  setContainerManager(containerManager) {
    this.containerManager = containerManager;
    // 将容器管理器传递给世界生成器
    if (this.worldGenerator) {
      this.worldGenerator.setContainerManager(containerManager);
    }
  }
  
  /**
   * 生成指定区块
   */
  generateChunk(chunkX) {
    if (this.loadedChunks.has(chunkX)) {
      return this.chunks.get(chunkX);
    }
    
    // 使用新的世界生成器
    const chunkData = this.worldGenerator.generateChunk(chunkX);
    const chunk = chunkData.chunk;
    
    // 存储到旧的数据结构中（兼容性）
    this.chunks.set(chunkX, chunk);
    this.loadedChunks.add(chunkX);
    
    console.log(`🌱 生成区块: ${chunkX} (使用新算法)`);
    return chunk;
  }
  
  /**
   * 获取方块类型
   */
  getBlock(x, y) {
    const chunkSize = this.worldConfig.CHUNK_SIZE;
    const chunkX = Math.floor(x / chunkSize);
    const localX = ((x % chunkSize) + chunkSize) % chunkSize;
    
    // 确保区块已生成
    const chunk = this.generateChunk(chunkX);
    
    // 检查坐标有效性
    if (y < 0 || y >= chunk.length || localX < 0 || localX >= chunkSize) {
      return blockConfig.getBlock('air').id;
    }
    
    return chunk[y][localX];
  }
  
  /**
   * 设置方块类型
   */
  setBlock(x, y, blockId) {
    const chunkSize = this.worldConfig.CHUNK_SIZE;
    const chunkX = Math.floor(x / chunkSize);
    const localX = ((x % chunkSize) + chunkSize) % chunkSize;
    
    // 确保区块已生成
    const chunk = this.generateChunk(chunkX);
    
    // 检查坐标有效性
    if (y < 0 || y >= chunk.length || localX < 0 || localX >= chunkSize) {
      return false;
    }
    
    chunk[y][localX] = blockId;
    return true;
  }
  
  /**
   * 重新生成世界
   */
  regenerate(newSeed) {
    this.chunks.clear();
    this.loadedChunks.clear();
    
    if (newSeed !== undefined) {
      this.seed = newSeed;
    }
    
    this.worldGenerator.regenerate(this.seed);
    console.log('🔄 地形已重新生成');
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    const worldStats = this.worldGenerator.getStats();
    return {
      loadedChunks: this.loadedChunks.size,
      seed: this.seed,
      worldGeneratorStats: worldStats
    };
  }
}