/**
 * 植被生成器
 * 实现丰富的植被多样性系统
 */

import { SimplexNoise } from '../noise/SimplexNoise.js';
import { getBiomeConfig, BIOME_TYPES } from '../biomes/BiomeTypes.js';
import { blockConfig } from '../../config/BlockConfig.js';

export class VegetationGenerator {
  constructor(seed) {
    this.seed = seed;
    
    // 植被噪音生成器
    this.vegetationNoise = new SimplexNoise(seed + 8000);
    this.treeNoise = new SimplexNoise(seed + 9000);
    this.grassNoise = new SimplexNoise(seed + 10000);
    this.flowerNoise = new SimplexNoise(seed + 11000);
    this.shrubNoise = new SimplexNoise(seed + 12000);
    this.mushroomNoise = new SimplexNoise(seed + 13000);
    
    // 植被生成参数
    this.params = {
      tree: {
        baseChance: 0.15,
        noiseScale: 0.1,
        minSpacing: 3,
        maxHeight: 8,
        minHeight: 4
      },
      grass: {
        baseChance: 0.4,
        noiseScale: 0.2,
        density: 0.6
      },
      flower: {
        baseChance: 0.08,
        noiseScale: 0.15,
        seasonality: true
      },
      shrub: {
        baseChance: 0.12,
        noiseScale: 0.12,
        clustered: true
      },
      mushroom: {
        baseChance: 0.03,
        noiseScale: 0.08,
        darkPlaces: true
      }
    };
    
    // 树木类型配置
    this.treeTypes = {
      [BIOME_TYPES.FOREST]: {
        types: ['oak', 'birch'],
        oakChance: 0.7,
        birchChance: 0.3,
        density: 0.3,
        minHeight: 5,
        maxHeight: 9
      },
      [BIOME_TYPES.PLAINS]: {
        types: ['oak'],
        oakChance: 1.0,
        density: 0.1,
        minHeight: 4,
        maxHeight: 7
      },
      [BIOME_TYPES.SWAMP]: {
        types: ['swamp_oak'],
        oakChance: 1.0,
        density: 0.2,
        minHeight: 6,
        maxHeight: 10,
        vines: true
      },
      [BIOME_TYPES.TUNDRA]: {
        types: ['spruce'],
        spruceChance: 1.0,
        density: 0.15,
        minHeight: 4,
        maxHeight: 8
      }
    };
    
    console.log('🌿 VegetationGenerator 初始化完成');
  }
  
  /**
   * 生成区块的植被
   * @param {number[][]} chunk - 区块数组
   * @param {number} chunkX - 区块X坐标
   * @param {string[]} biomeMap - 生物群系映射
   * @param {Object} worldConfig - 世界配置
   */
  generateVegetation(chunk, chunkX, biomeMap, worldConfig) {
    const chunkWidth = chunk[0].length;
    const chunkHeight = chunk.length;
    
    // 找到所有地表位置
    const surfaceMap = this.findSurfacePositions(chunk, chunkWidth, chunkHeight);
    
    // 生成不同类型的植被
    this.generateTrees(chunk, chunkX, biomeMap, surfaceMap, chunkWidth, chunkHeight);
    this.generateGrass(chunk, chunkX, biomeMap, surfaceMap, chunkWidth, chunkHeight);
    this.generateFlowers(chunk, chunkX, biomeMap, surfaceMap, chunkWidth, chunkHeight);
    this.generateShrubs(chunk, chunkX, biomeMap, surfaceMap, chunkWidth, chunkHeight);
    this.generateMushrooms(chunk, chunkX, biomeMap, surfaceMap, chunkWidth, chunkHeight);
    
    // 特殊生物群系的额外植被
    this.generateBiomeSpecificVegetation(chunk, chunkX, biomeMap, surfaceMap, chunkWidth, chunkHeight);
  }
  
  /**
   * 找到地表位置
   * @param {number[][]} chunk - 区块数组
   * @param {number} chunkWidth - 区块宽度
   * @param {number} chunkHeight - 区块高度
   * @returns {number[]} 地表高度数组
   */
  findSurfacePositions(chunk, chunkWidth, chunkHeight) {
    const surfaceMap = [];
    const airId = blockConfig.getBlock('air').id;
    const grassId = blockConfig.getBlock('grass').id;
    const dirtId = blockConfig.getBlock('dirt').id;
    const stoneId = blockConfig.getBlock('stone').id;
    
    for (let x = 0; x < chunkWidth; x++) {
      surfaceMap[x] = -1;
      
      // 从上往下找地表
      for (let y = chunkHeight - 1; y >= 0; y--) {
        const currentBlock = chunk[y][x];
        const aboveBlock = y + 1 < chunkHeight ? chunk[y + 1][x] : airId;
        
        // 地表条件：当前是固体，上面是空气，且是适合植被生长的方块
        if (currentBlock !== airId && aboveBlock === airId) {
          // 扩大适合植被生长的方块类型
          if (currentBlock === grassId || currentBlock === dirtId || 
              currentBlock === stoneId || this.isSuitableForVegetation(currentBlock)) {
            surfaceMap[x] = y;
            break;
          }
        }
      }
    }
    
    return surfaceMap;
  }
  
  /**
   * 检查方块是否适合植被生长
   * Author: Minecraft2D Development Team
   * @param {number} blockId - 方块ID
   * @returns {boolean} 是否适合
   */
  isSuitableForVegetation(blockId) {
    // 获取所有适合植被生长的方块ID
    const suitableBlocks = [
      blockConfig.getBlock('grass')?.id,
      blockConfig.getBlock('dirt')?.id,
      blockConfig.getBlock('stone')?.id,
      blockConfig.getBlock('sand')?.id,
      blockConfig.getBlock('gravel')?.id
    ].filter(id => id !== undefined);
    
    return suitableBlocks.includes(blockId);
  }
  
  /**
   * 生成树木
   * @param {number[][]} chunk - 区块数组
   * @param {number} chunkX - 区块X坐标
   * @param {string[]} biomeMap - 生物群系映射
   * @param {number[]} surfaceMap - 地表映射
   * @param {number} chunkWidth - 区块宽度
   * @param {number} chunkHeight - 区块高度
   */
  generateTrees(chunk, chunkX, biomeMap, surfaceMap, chunkWidth, chunkHeight) {
    const lastTreeX = [];
    
    for (let x = 0; x < chunkWidth; x++) {
      const surfaceY = surfaceMap[x];
      if (surfaceY < 0 || surfaceY >= chunkHeight - 3) continue;
      
      const biome = biomeMap[x];
      const treeConfig = this.treeTypes[biome];
      if (!treeConfig) continue;
      
      const absoluteX = chunkX * chunkWidth + x;
      
      // 检查最小间距
      if (this.checkTreeSpacing(x, lastTreeX, this.params.tree.minSpacing)) {
        const treeNoise = this.treeNoise.sample(
          absoluteX * this.params.tree.noiseScale,
          surfaceY * this.params.tree.noiseScale
        );
        
        const adjustedChance = this.params.tree.baseChance * treeConfig.density;
        
        if (treeNoise > (1 - adjustedChance)) {
          const treeType = this.selectTreeType(treeConfig, absoluteX);
          const treeHeight = this.calculateTreeHeight(treeConfig, absoluteX);
          
          if (this.generateTree(chunk, x, surfaceY + 1, treeType, treeHeight, chunkWidth, chunkHeight)) {
            lastTreeX.push(x);
          }
        }
      }
    }
  }
  
  /**
   * 检查树木间距
   * @param {number} x - 当前X坐标
   * @param {number[]} lastTreeX - 已有树木X坐标
   * @param {number} minSpacing - 最小间距
   * @returns {boolean} 是否可以种植
   */
  checkTreeSpacing(x, lastTreeX, minSpacing) {
    for (const treeX of lastTreeX) {
      if (Math.abs(x - treeX) < minSpacing) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * 选择树木类型
   * @param {Object} treeConfig - 树木配置
   * @param {number} worldX - 世界X坐标
   * @returns {string} 树木类型
   */
  selectTreeType(treeConfig, worldX) {
    const types = treeConfig.types;
    if (types.length === 1) return types[0];
    
    // 基于位置的伪随机选择
    const random = (Math.sin(worldX * 0.1) + 1) / 2;
    
    if (types.includes('oak') && types.includes('birch')) {
      return random < treeConfig.oakChance ? 'oak' : 'birch';
    }
    
    return types[Math.floor(random * types.length)];
  }
  
  /**
   * 计算树木高度
   * @param {Object} treeConfig - 树木配置
   * @param {number} worldX - 世界X坐标
   * @returns {number} 树木高度
   */
  calculateTreeHeight(treeConfig, worldX) {
    const random = (Math.sin(worldX * 0.123) + 1) / 2;
    const range = treeConfig.maxHeight - treeConfig.minHeight;
    return treeConfig.minHeight + Math.floor(random * range);
  }
  
  /**
   * 生成单棵树
   * @param {number[][]} chunk - 区块数组
   * @param {number} x - X坐标
   * @param {number} baseY - 基础Y坐标
   * @param {string} treeType - 树木类型
   * @param {number} treeHeight - 树木高度
   * @param {number} chunkWidth - 区块宽度
   * @param {number} chunkHeight - 区块高度
   * @returns {boolean} 是否成功生成
   */
  generateTree(chunk, x, baseY, treeType, treeHeight, chunkWidth, chunkHeight) {
    const airId = blockConfig.getBlock('air').id;
    const woodId = blockConfig.getBlock('wood') ? blockConfig.getBlock('wood').id : blockConfig.getBlock('dirt').id;
    const leavesId = blockConfig.getBlock('leaves') ? blockConfig.getBlock('leaves').id : blockConfig.getBlock('grass').id;
    
    // 检查空间是否足够
    if (baseY + treeHeight >= chunkHeight) return false;
    
    // 检查树干区域是否为空
    for (let y = baseY; y < baseY + treeHeight; y++) {
      if (chunk[y][x] !== airId) return false;
    }
    
    // 生成树干
    for (let y = baseY; y < baseY + treeHeight; y++) {
      chunk[y][x] = woodId;
    }
    
    // 生成树叶
    this.generateTreeCanopy(chunk, x, baseY + treeHeight - 1, treeType, leavesId, chunkWidth, chunkHeight);
    
    return true;
  }
  
  /**
   * 生成树冠
   * @param {number[][]} chunk - 区块数组
   * @param {number} centerX - 中心X坐标
   * @param {number} topY - 顶部Y坐标
   * @param {string} treeType - 树木类型
   * @param {number} leavesId - 树叶ID
   * @param {number} chunkWidth - 区块宽度
   * @param {number} chunkHeight - 区块高度
   */
  generateTreeCanopy(chunk, centerX, topY, treeType, leavesId, chunkWidth, chunkHeight) {
    const airId = blockConfig.getBlock('air').id;
    
    switch (treeType) {
      case 'oak':
      case 'swamp_oak':
        this.generateOakCanopy(chunk, centerX, topY, leavesId, airId, chunkWidth, chunkHeight);
        break;
      case 'birch':
        this.generateBirchCanopy(chunk, centerX, topY, leavesId, airId, chunkWidth, chunkHeight);
        break;
      case 'spruce':
        this.generateSpruceCanopy(chunk, centerX, topY, leavesId, airId, chunkWidth, chunkHeight);
        break;
      default:
        this.generateOakCanopy(chunk, centerX, topY, leavesId, airId, chunkWidth, chunkHeight);
    }
  }
  
  /**
   * 生成橡树树冠
   */
  generateOakCanopy(chunk, centerX, topY, leavesId, airId, chunkWidth, chunkHeight) {
    const layers = [
      { dy: 0, radius: 1 },
      { dy: 1, radius: 2 },
      { dy: 2, radius: 2 },
      { dy: 3, radius: 1 }
    ];
    
    for (const layer of layers) {
      const y = topY + layer.dy;
      if (y >= chunkHeight) break;
      
      for (let dx = -layer.radius; dx <= layer.radius; dx++) {
        const x = centerX + dx;
        if (x >= 0 && x < chunkWidth && chunk[y][x] === airId) {
          // 圆形分布，边缘有随机性
          const distance = Math.abs(dx);
          if (distance <= layer.radius) {
            const probability = distance === layer.radius ? 0.6 : 0.9;
            if (Math.random() < probability) {
              chunk[y][x] = leavesId;
            }
          }
        }
      }
    }
  }
  
  /**
   * 生成桦树树冠（更窄更高）
   */
  generateBirchCanopy(chunk, centerX, topY, leavesId, airId, chunkWidth, chunkHeight) {
    const layers = [
      { dy: 0, radius: 1 },
      { dy: 1, radius: 1 },
      { dy: 2, radius: 2 },
      { dy: 3, radius: 1 },
      { dy: 4, radius: 1 }
    ];
    
    for (const layer of layers) {
      const y = topY + layer.dy;
      if (y >= chunkHeight) break;
      
      for (let dx = -layer.radius; dx <= layer.radius; dx++) {
        const x = centerX + dx;
        if (x >= 0 && x < chunkWidth && chunk[y][x] === airId) {
          if (Math.abs(dx) <= layer.radius) {
            chunk[y][x] = leavesId;
          }
        }
      }
    }
  }
  
  /**
   * 生成云杉树冠（锥形）
   */
  generateSpruceCanopy(chunk, centerX, topY, leavesId, airId, chunkWidth, chunkHeight) {
    const layers = [
      { dy: 0, radius: 0 },
      { dy: 1, radius: 1 },
      { dy: 2, radius: 1 },
      { dy: 3, radius: 2 },
      { dy: 4, radius: 2 }
    ];
    
    for (const layer of layers) {
      const y = topY + layer.dy;
      if (y >= chunkHeight) break;
      
      for (let dx = -layer.radius; dx <= layer.radius; dx++) {
        const x = centerX + dx;
        if (x >= 0 && x < chunkWidth && chunk[y][x] === airId) {
          chunk[y][x] = leavesId;
        }
      }
    }
  }
  
  /**
   * 生成草地
   */
  generateGrass(chunk, chunkX, biomeMap, surfaceMap, chunkWidth, chunkHeight) {
    const airId = blockConfig.getBlock('air').id;
    const tallGrassId = blockConfig.getBlock('tallgrass') ? blockConfig.getBlock('tallgrass').id : blockConfig.getBlock('grass').id;
    
    for (let x = 0; x < chunkWidth; x++) {
      const surfaceY = surfaceMap[x];
      if (surfaceY < 0 || surfaceY >= chunkHeight - 1) continue;
      
      const biome = biomeMap[x];
      const biomeConfig = getBiomeConfig(biome);
      if (!biomeConfig.vegetation || !biomeConfig.vegetation.grass) continue;
      
      const absoluteX = chunkX * chunkWidth + x;
      const grassNoise = this.grassNoise.sample(
        absoluteX * this.params.grass.noiseScale,
        surfaceY * this.params.grass.noiseScale
      );
      
      const grassChance = this.params.grass.baseChance * biomeConfig.vegetation.grass;
      
      if (grassNoise > (1 - grassChance) && chunk[surfaceY + 1][x] === airId) {
        chunk[surfaceY + 1][x] = tallGrassId;
      }
    }
  }
  
  /**
   * 生成花朵
   */
  generateFlowers(chunk, chunkX, biomeMap, surfaceMap, chunkWidth, chunkHeight) {
    const airId = blockConfig.getBlock('air').id;
    const flowerId = blockConfig.getBlock('flower') ? blockConfig.getBlock('flower').id : blockConfig.getBlock('tallgrass').id;
    
    for (let x = 0; x < chunkWidth; x++) {
      const surfaceY = surfaceMap[x];
      if (surfaceY < 0 || surfaceY >= chunkHeight - 1) continue;
      
      const biome = biomeMap[x];
      const biomeConfig = getBiomeConfig(biome);
      if (!biomeConfig.vegetation || !biomeConfig.vegetation.flowers) continue;
      
      const absoluteX = chunkX * chunkWidth + x;
      const flowerNoise = this.flowerNoise.sample(
        absoluteX * this.params.flower.noiseScale,
        surfaceY * this.params.flower.noiseScale
      );
      
      const flowerChance = this.params.flower.baseChance * biomeConfig.vegetation.flowers;
      
      if (flowerNoise > (1 - flowerChance) && chunk[surfaceY + 1][x] === airId) {
        chunk[surfaceY + 1][x] = flowerId;
      }
    }
  }
  
  /**
   * 生成灌木
   */
  generateShrubs(chunk, chunkX, biomeMap, surfaceMap, chunkWidth, chunkHeight) {
    const airId = blockConfig.getBlock('air').id;
    const leavesId = blockConfig.getBlock('leaves') ? blockConfig.getBlock('leaves').id : blockConfig.getBlock('grass').id;
    
    for (let x = 0; x < chunkWidth; x++) {
      const surfaceY = surfaceMap[x];
      if (surfaceY < 0 || surfaceY >= chunkHeight - 2) continue;
      
      const biome = biomeMap[x];
      if (biome !== BIOME_TYPES.DESERT && biome !== BIOME_TYPES.PLAINS) continue;
      
      const absoluteX = chunkX * chunkWidth + x;
      const shrubNoise = this.shrubNoise.sample(
        absoluteX * this.params.shrub.noiseScale,
        0
      );
      
      if (shrubNoise > (1 - this.params.shrub.baseChance) && chunk[surfaceY + 1][x] === airId) {
        // 生成小灌木
        chunk[surfaceY + 1][x] = leavesId;
        
        // 有时生成2格高的灌木
        if (Math.random() < 0.3 && chunk[surfaceY + 2][x] === airId) {
          chunk[surfaceY + 2][x] = leavesId;
        }
      }
    }
  }
  
  /**
   * 生成蘑菇
   */
  generateMushrooms(chunk, chunkX, biomeMap, surfaceMap, chunkWidth, chunkHeight) {
    const airId = blockConfig.getBlock('air').id;
    const mushroomId = blockConfig.getBlock('mushroom') ? blockConfig.getBlock('mushroom').id : blockConfig.getBlock('flower').id;
    
    for (let x = 0; x < chunkWidth; x++) {
      const surfaceY = surfaceMap[x];
      if (surfaceY < 0 || surfaceY >= chunkHeight - 1) continue;
      
      const biome = biomeMap[x];
      if (biome !== BIOME_TYPES.FOREST && biome !== BIOME_TYPES.SWAMP) continue;
      
      // 检查是否在阴暗处（树木附近）
      if (!this.isInShadow(chunk, x, surfaceY, chunkWidth, chunkHeight)) continue;
      
      const absoluteX = chunkX * chunkWidth + x;
      const mushroomNoise = this.mushroomNoise.sample(
        absoluteX * this.params.mushroom.noiseScale,
        0
      );
      
      if (mushroomNoise > (1 - this.params.mushroom.baseChance) && chunk[surfaceY + 1][x] === airId) {
        chunk[surfaceY + 1][x] = mushroomId;
      }
    }
  }
  
  /**
   * 检查是否在阴影中
   */
  isInShadow(chunk, x, surfaceY, chunkWidth, chunkHeight) {
    const leavesId = blockConfig.getBlock('leaves') ? blockConfig.getBlock('leaves').id : blockConfig.getBlock('grass').id;
    
    // 检查上方是否有树叶
    for (let y = surfaceY + 2; y < Math.min(chunkHeight, surfaceY + 8); y++) {
      for (let dx = -2; dx <= 2; dx++) {
        const checkX = x + dx;
        if (checkX >= 0 && checkX < chunkWidth) {
          if (chunk[y][checkX] === leavesId) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * 生成生物群系特有植被
   */
  generateBiomeSpecificVegetation(chunk, chunkX, biomeMap, surfaceMap, chunkWidth, chunkHeight) {
    for (let x = 0; x < chunkWidth; x++) {
      const biome = biomeMap[x];
      const surfaceY = surfaceMap[x];
      
      if (surfaceY < 0) continue;
      
      switch (biome) {
        case BIOME_TYPES.DESERT:
          this.generateCactus(chunk, x, surfaceY, chunkX, chunkWidth, chunkHeight);
          break;
        case BIOME_TYPES.SWAMP:
          this.generateSwampVines(chunk, x, surfaceY, chunkWidth, chunkHeight);
          break;
        case BIOME_TYPES.TUNDRA:
          this.generateIce(chunk, x, surfaceY, chunkWidth, chunkHeight);
          break;
      }
    }
  }
  
  /**
   * 生成仙人掌
   */
  generateCactus(chunk, x, surfaceY, chunkX, chunkWidth, chunkHeight) {
    const absoluteX = chunkX * chunkWidth + x;
    const cactusNoise = this.vegetationNoise.sample(absoluteX * 0.05, 0);
    
    if (cactusNoise > 0.85 && surfaceY + 3 < chunkHeight) {
      const airId = blockConfig.getBlock('air').id;
      const cactusId = blockConfig.getBlock('cactus') ? blockConfig.getBlock('cactus').id : blockConfig.getBlock('grass').id;
      
      const height = 2 + Math.floor(Math.random() * 3);
      
      for (let dy = 1; dy <= height; dy++) {
        if (surfaceY + dy < chunkHeight && chunk[surfaceY + dy][x] === airId) {
          chunk[surfaceY + dy][x] = cactusId;
        }
      }
    }
  }
  
  /**
   * 生成沼泽藤蔓
   */
  generateSwampVines(chunk, x, surfaceY, chunkWidth, chunkHeight) {
    const vineId = blockConfig.getBlock('vine') ? blockConfig.getBlock('vine').id : blockConfig.getBlock('tallgrass').id;
    const airId = blockConfig.getBlock('air').id;
    
    // 在树木下方生成垂悬藤蔓
    for (let dy = 2; dy <= 6; dy++) {
      const y = surfaceY + dy;
      if (y >= chunkHeight) break;
      
      if (chunk[y][x] === blockConfig.getBlock('leaves').id) {
        // 向下生成藤蔓
        for (let vineY = y - 1; vineY > surfaceY; vineY--) {
          if (chunk[vineY][x] === airId && Math.random() < 0.4) {
            chunk[vineY][x] = vineId;
          } else {
            break;
          }
        }
        break;
      }
    }
  }
  
  /**
   * 生成冰块
   */
  generateIce(chunk, x, surfaceY, chunkWidth, chunkHeight) {
    // 在苔原生物群系的水面生成冰
    const waterLevel = 100; // 假设水平面
    
    if (surfaceY <= waterLevel) {
      const iceId = blockConfig.getBlock('ice') ? blockConfig.getBlock('ice').id : blockConfig.getBlock('stone').id;
      const waterY = Math.min(surfaceY + 1, waterLevel);
      
      if (waterY < chunkHeight && Math.random() < 0.7) {
        chunk[waterY][x] = iceId;
      }
    }
  }
  
  /**
   * 生成植被
   * @param {number[][]} chunk - 区块数组
   * @param {number} x - X坐标
   * @param {number} surfaceY - 地表Y坐标
   * @param {number} worldX - 世界X坐标
   * @param {Object} biomeConfig - 生物群系配置
   */
  generateVegetationAt(chunk, x, surfaceY, worldX, biomeConfig) {
    const treeChance = (this.treeNoise.sample(worldX * 0.1, 0) + 1) / 2;
    const grassChance = (this.vegetationNoise.sample(worldX * 0.2, 0) + 1) / 2;
    const flowerChance = (this.vegetationNoise.sample(worldX * 0.15, 100) + 1) / 2;
    
    // 大幅增加植被生成概率
    const treeDensity = Math.min(biomeConfig.vegetation.trees * 3.0, 1.0); // 从2.0增加到3.0
    const grassDensity = Math.min(biomeConfig.vegetation.grass * 3.0, 1.0); // 从2.2增加到3.0
    const flowerDensity = Math.min(biomeConfig.vegetation.flowers * 3.5, 0.8); // 从2.5增加到3.5
    
    // 生成树木
    if (treeChance > 0.2 && treeDensity > Math.random()) { // 从0.3降低到0.2
      this.generateTree(chunk, x, surfaceY + 1);
    }
    // 生成草
    else if (grassChance > 0.01 && grassDensity > Math.random()) { // 从0.02降低到0.01
      if (surfaceY + 1 < chunk.length) {
        // 随机选择草的类型
        const grassTypes = ['grass', 'tallgrass', 'fern'];
        const selectedGrass = grassTypes[Math.floor(Math.random() * grassTypes.length)];
        chunk[surfaceY + 1][x] = blockConfig.getBlock(selectedGrass).id;
      }
    }
    // 生成花朵
    else if (flowerChance > 0.05 && flowerDensity > Math.random()) { // 从0.1降低到0.05
      if (surfaceY + 1 < chunk.length) {
        // 随机选择花朵类型
        const flowerTypes = ['flower', 'rose', 'dandelion', 'poppy', 'blue_orchid', 'allium', 'azure_bluet', 'red_tulip', 'orange_tulip', 'white_tulip', 'pink_tulip', 'oxeye_daisy'];
        const selectedFlower = flowerTypes[Math.floor(Math.random() * flowerTypes.length)];
        const flowerBlock = blockConfig.getBlock(selectedFlower);
        if (flowerBlock) {
          chunk[surfaceY + 1][x] = flowerBlock.id;
        } else {
          // 如果特定花朵不存在，使用默认花朵
          chunk[surfaceY + 1][x] = blockConfig.getBlock('flower').id;
        }
      }
    }
    // 添加额外的植被生成机会
    else if (Math.random() < 0.2) { // 从0.1增加到0.2
      if (surfaceY + 1 < chunk.length) {
        // 随机选择植被类型
        const vegetationTypes = ['grass', 'tallgrass', 'fern', 'flower', 'rose', 'dandelion', 'dead_bush'];
        const selectedVegetation = vegetationTypes[Math.floor(Math.random() * vegetationTypes.length)];
        const vegetationBlock = blockConfig.getBlock(selectedVegetation);
        if (vegetationBlock) {
          chunk[surfaceY + 1][x] = vegetationBlock.id;
        }
      }
    }
    // 添加额外的草生成机会
    else if (Math.random() < 0.15) { // 15%的概率生成额外的草
      if (surfaceY + 1 < chunk.length) {
        // 随机选择草的类型
        const grassTypes = ['grass', 'tallgrass', 'fern'];
        const selectedGrass = grassTypes[Math.floor(Math.random() * grassTypes.length)];
        chunk[surfaceY + 1][x] = blockConfig.getBlock(selectedGrass).id;
      }
    }
  }
  
  /**
   * 获取植被生成统计
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      seed: this.seed,
      vegetationTypes: ['trees', 'grass', 'flowers', 'shrubs', 'mushrooms'],
      treeTypes: Object.keys(this.treeTypes),
      specialFeatures: ['biome-specific', 'seasonal-effects', 'clustered-distribution'],
      algorithms: ['noise-based', 'spacing-control', 'shadow-detection']
    };
  }
}