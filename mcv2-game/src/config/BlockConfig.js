/**
 * 方块配置管理器
 * 负责管理所有方块类型的定义和属性
 */

export class BlockConfig {
  constructor() {
    this.blocks = new Map();
    this.blockTextures = new Map();
    this.initializeBlocks();
    console.log('🧱 BlockConfig 初始化完成');
  }
  
  /**
   * 初始化方块定义
   */
  initializeBlocks() {
    // 定义方块类型
    const blockDefinitions = [
      {
        id: 0,
        name: 'air',
        displayName: '空气',
        solid: false,
        transparent: true,
        color: 'transparent',
        breakable: false
      },
      {
        id: 1,
        name: 'grass',
        displayName: '草方块',
        solid: true,
        transparent: false,
        color: '#7CBB3A',
        breakable: true,
        hardness: 1.0
      },
      {
        id: 2,
        name: 'dirt',
        displayName: '泥土',
        solid: true,
        transparent: false,
        color: '#8B4513',
        breakable: true,
        hardness: 0.8
      },
      {
        id: 3,
        name: 'sand',
        displayName: '沙子',
        solid: true,
        transparent: false,
        color: '#F4A460',
        breakable: true,
        hardness: 0.6,
        gravity: true
      },
      {
        id: 4,
        name: 'water',
        displayName: '水',
        solid: false,
        transparent: true,
        color: '#1E90FF',
        breakable: false,
        fluid: true
      },
      {
        id: 5,
        name: 'stone',
        displayName: '石头',
        solid: true,
        transparent: false,
        color: '#696969',
        breakable: true,
        hardness: 2.0
      },
      {
        id: 6,
        name: 'coal',
        displayName: '煤矿',
        solid: true,
        transparent: false,
        color: '#2F2F2F',
        breakable: true,
        hardness: 3.0,
        drops: ['coal_item']
      },
      {
        id: 7,
        name: 'gold',
        displayName: '金矿',
        solid: true,
        transparent: false,
        color: '#FFD700',
        breakable: true,
        hardness: 4.0,
        drops: ['gold_item']
      },
      {
        id: 8,
        name: 'iron',
        displayName: '铁矿',
        solid: true,
        transparent: false,
        color: '#C0C0C0',
        breakable: true,
        hardness: 3.5,
        drops: ['iron_item']
      },
      {
        id: 9,
        name: 'diamond',
        displayName: '钻石',
        solid: true,
        transparent: false,
        color: '#B9F2FF',
        breakable: true,
        hardness: 5.0,
        drops: ['diamond_item']
      },
      {
        id: 10,
        name: 'wood',
        displayName: '木头',
        solid: true,
        transparent: false,
        color: '#8B4513',
        breakable: true,
        hardness: 1.5,
        drops: ['wood_item']
      },
      {
        id: 11,
        name: 'leaves',
        displayName: '树叶',
        solid: true,
        transparent: true,
        color: '#228B22',
        breakable: true,
        hardness: 0.3
      },
      {
        id: 12,
        name: 'tallgrass',
        displayName: '高草',
        solid: false,
        transparent: true,
        color: '#90EE90',
        breakable: true,
        hardness: 0.1
      },
      {
        id: 13,
        name: 'flower',
        displayName: '花朵',
        solid: false,
        transparent: true,
        color: '#FF69B4',
        breakable: true,
        hardness: 0.1
      },
      {
        id: 14,
        name: 'gravel',
        displayName: '砾石',
        solid: true,
        transparent: false,
        color: '#696969',
        breakable: true,
        hardness: 0.8,
        gravity: true
      },
      {
        id: 15,
        name: 'mushroom',
        displayName: '蘑菇',
        solid: false,
        transparent: true,
        color: '#8B4513',
        breakable: true,
        hardness: 0.1
      },
      {
        id: 16,
        name: 'cactus',
        displayName: '仙人掌',
        solid: true,
        transparent: false,
        color: '#228B22',
        breakable: true,
        hardness: 0.5,
        damage: 1  // 接触伤害
      },
      {
        id: 17,
        name: 'vine',
        displayName: '藤蔓',
        solid: false,
        transparent: true,
        color: '#2E8B57',
        breakable: true,
        hardness: 0.2
      },
      {
        id: 18,
        name: 'ice',
        displayName: '冰块',
        solid: true,
        transparent: true,
        color: '#B0E0E6',
        breakable: true,
        hardness: 0.5,
        slippery: true
      }
    ];
    
    // 注册所有方块类型
    blockDefinitions.forEach(block => {
      this.registerBlock(block);
    });
    
    console.log(`📦 已注册 ${this.blocks.size} 种方块类型`);
  }
  
  /**
   * 注册方块类型
   */
  registerBlock(blockDef) {
    const block = {
      id: blockDef.id,
      name: blockDef.name,
      displayName: blockDef.displayName,
      solid: blockDef.solid ?? true,
      transparent: blockDef.transparent ?? false,
      color: blockDef.color ?? '#FFFFFF',
      breakable: blockDef.breakable ?? true,
      hardness: blockDef.hardness ?? 1.0,
      gravity: blockDef.gravity ?? false,
      fluid: blockDef.fluid ?? false,
      drops: blockDef.drops ?? [],
      // 添加创建时间戳
      createdAt: Date.now()
    };
    
    this.blocks.set(block.id, block);
    this.blocks.set(block.name, block); // 支持按名称查找
  }
  
  /**
   * 获取方块定义
   */
  getBlock(idOrName) {
    return this.blocks.get(idOrName);
  }
  
  /**
   * 获取所有方块定义
   */
  getAllBlocks() {
    const blockList = [];
    const seenIds = new Set();
    
    for (const [key, block] of this.blocks) {
      if (typeof key === 'number' && !seenIds.has(key)) {
        blockList.push(block);
        seenIds.add(key);
      }
    }
    
    return blockList.sort((a, b) => a.id - b.id);
  }
  
  /**
   * 检查方块是否为固体
   */
  isSolid(blockId) {
    const block = this.getBlock(blockId);
    return block ? block.solid : false;
  }
  
  /**
   * 检查方块是否透明
   */
  isTransparent(blockId) {
    const block = this.getBlock(blockId);
    return block ? block.transparent : false;
  }
  
  /**
   * 检查方块是否可破坏
   */
  isBreakable(blockId) {
    const block = this.getBlock(blockId);
    return block ? block.breakable : false;
  }
  
  /**
   * 获取方块颜色
   */
  getBlockColor(blockId) {
    const block = this.getBlock(blockId);
    return block ? block.color : '#FFFFFF';
  }
  
  /**
   * 获取方块硬度
   */
  getBlockHardness(blockId) {
    const block = this.getBlock(blockId);
    return block ? block.hardness : 1.0;
  }
  
  /**
   * 获取方块掉落物
   */
  getBlockDrops(blockId) {
    const block = this.getBlock(blockId);
    return block ? [...block.drops] : [];
  }
  
  /**
   * 检查方块是否受重力影响
   */
  hasGravity(blockId) {
    const block = this.getBlock(blockId);
    return block ? block.gravity : false;
  }
  
  /**
   * 检查方块是否为流体
   */
  isFluid(blockId) {
    const block = this.getBlock(blockId);
    return block ? block.fluid : false;
  }
  
  /**
   * 按类型过滤方块
   */
  getBlocksByType(type) {
    const allBlocks = this.getAllBlocks();
    
    switch (type) {
      case 'solid':
        return allBlocks.filter(block => block.solid);
      case 'transparent':
        return allBlocks.filter(block => block.transparent);
      case 'breakable':
        return allBlocks.filter(block => block.breakable);
      case 'gravity':
        return allBlocks.filter(block => block.gravity);
      case 'fluid':
        return allBlocks.filter(block => block.fluid);
      default:
        return allBlocks;
    }
  }
  
  /**
   * 添加新的方块类型（动态扩展）
   */
  addBlock(blockDef) {
    if (this.getBlock(blockDef.id) || this.getBlock(blockDef.name)) {
      console.warn(`⚠️  方块 ${blockDef.id}/${blockDef.name} 已存在`);
      return false;
    }
    
    this.registerBlock(blockDef);
    console.log(`✅ 添加新方块: ${blockDef.displayName}`);
    return true;
  }
  
  /**
   * 移除方块类型
   */
  removeBlock(idOrName) {
    const block = this.getBlock(idOrName);
    if (!block) {
      console.warn(`⚠️  方块 ${idOrName} 不存在`);
      return false;
    }
    
    this.blocks.delete(block.id);
    this.blocks.delete(block.name);
    console.log(`🗑️  移除方块: ${block.displayName}`);
    return true;
  }
  
  /**
   * 导出方块配置（用于保存）
   */
  exportConfig() {
    const config = {
      version: '1.0.0',
      blocks: this.getAllBlocks(),
      exportedAt: new Date().toISOString()
    };
    
    return JSON.stringify(config, null, 2);
  }
  
  /**
   * 导入方块配置（用于加载）
   */
  importConfig(configJson) {
    try {
      const config = JSON.parse(configJson);
      
      if (!config.blocks || !Array.isArray(config.blocks)) {
        throw new Error('Invalid config format');
      }
      
      // 清空现有配置
      this.blocks.clear();
      
      // 重新注册方块
      config.blocks.forEach(block => {
        this.registerBlock(block);
      });
      
      console.log(`📥 导入配置成功，包含 ${config.blocks.length} 种方块`);
      return true;
    } catch (error) {
      console.error('❌ 导入配置失败:', error);
      return false;
    }
  }
  
  /**
   * 获取配置统计信息
   */
  getStats() {
    const allBlocks = this.getAllBlocks();
    
    return {
      totalBlocks: allBlocks.length,
      solidBlocks: allBlocks.filter(b => b.solid).length,
      transparentBlocks: allBlocks.filter(b => b.transparent).length,
      breakableBlocks: allBlocks.filter(b => b.breakable).length,
      gravityBlocks: allBlocks.filter(b => b.gravity).length,
      fluidBlocks: allBlocks.filter(b => b.fluid).length
    };
  }
}

// 导出默认实例
export const blockConfig = new BlockConfig();