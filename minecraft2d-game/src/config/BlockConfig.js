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
        name: 'crafting_table',
        displayName: '制作台',
        solid: true,
        transparent: false,
        color: '#8B4513',
        breakable: true,
        hardness: 2.0,
        drops: ['crafting_table_item']
      },
      {
        id: 17,
        name: 'mushroom',
        displayName: '蘑菇',
        solid: false,
        transparent: true,
        color: '#8B4513',
        breakable: true,
        hardness: 0.1
      },
      {
        id: 18,
        name: 'vine',
        displayName: '藤蔓',
        solid: false,
        transparent: true,
        color: '#2E8B57',
        breakable: true,
        hardness: 0.2
      },
      {
        id: 19,
        name: 'ice',
        displayName: '冰块',
        solid: true,
        transparent: true,
        color: '#B0E0E6',
        breakable: true,
        hardness: 0.5,
        slippery: true
      },
      // 新增的我的世界基础方块
      {
        id: 20,
        name: 'cobblestone',
        displayName: '圆石',
        solid: true,
        transparent: false,
        color: '#808080',
        breakable: true,
        hardness: 2.5,
        blastResistance: 6.0
      },
      {
        id: 21,
        name: 'bedrock',
        displayName: '基岩',
        solid: true,
        transparent: false,
        color: '#1A1A1A',
        breakable: false,
        hardness: -1,
        blastResistance: 3600000.0
      },
      {
        id: 22,
        name: 'oak_planks',
        displayName: '橡木木板',
        solid: true,
        transparent: false,
        color: '#C4965A',
        breakable: true,
        hardness: 2.0,
        flammable: true
      },
      {
        id: 23,
        name: 'oak_log',
        displayName: '橡木原木',
        solid: true,
        transparent: false,
        color: '#976F47',
        breakable: true,
        hardness: 2.0,
        flammable: true,
        drops: ['oak_log']
      },
      {
        id: 24,
        name: 'birch_log',
        displayName: '白桦原木',
        solid: true,
        transparent: false,
        color: '#D7D3C7',
        breakable: true,
        hardness: 2.0,
        flammable: true
      },
      {
        id: 25,
        name: 'spruce_log',
        displayName: '云杉原木',
        solid: true,
        transparent: false,
        color: '#6B4423',
        breakable: true,
        hardness: 2.0,
        flammable: true
      },
      {
        id: 26,
        name: 'oak_leaves',
        displayName: '橡木树叶',
        solid: true,
        transparent: true,
        color: '#2D5016',
        breakable: true,
        hardness: 0.2,
        flammable: true,
        decayable: true
      },
      {
        id: 27,
        name: 'birch_leaves',
        displayName: '白桦树叶',
        solid: true,
        transparent: true,
        color: '#518A3E',
        breakable: true,
        hardness: 0.2,
        flammable: true,
        decayable: true
      },
      {
        id: 28,
        name: 'spruce_leaves',
        displayName: '云杉树叶',
        solid: true,
        transparent: true,
        color: '#0F5B2F',
        breakable: true,
        hardness: 0.2,
        flammable: true,
        decayable: true
      },
      {
        id: 29,
        name: 'clay',
        displayName: '粘土',
        solid: true,
        transparent: false,
        color: '#A0A0A0',
        breakable: true,
        hardness: 0.6,
        drops: ['clay_ball']
      },
      {
        id: 30,
        name: 'snow',
        displayName: '雪块',
        solid: true,
        transparent: false,
        color: '#FFFFFF',
        breakable: true,
        hardness: 0.1,
        requiresTool: false
      },
      {
        id: 31,
        name: 'snow_layer',
        displayName: '雪层',
        solid: false,
        transparent: true,
        color: '#FFFFFF',
        breakable: true,
        hardness: 0.1,
        partial: true
      },
      {
        id: 32,
        name: 'obsidian',
        displayName: '黑曜石',
        solid: true,
        transparent: false,
        color: '#0F0F23',
        breakable: true,
        hardness: 50.0,
        blastResistance: 1200.0,
        requiresTool: true
      },
      {
        id: 33,
        name: 'lava',
        displayName: '岩浆',
        solid: false,
        transparent: true,
        color: '#FF6600',
        breakable: false,
        fluid: true,
        damage: 4,
        lightLevel: 15
      },
      {
        id: 34,
        name: 'sandstone',
        displayName: '砂岩',
        solid: true,
        transparent: false,
        color: '#F4D796',
        breakable: true,
        hardness: 0.8,
        blastResistance: 0.8
      },
      {
        id: 35,
        name: 'red_sand',
        displayName: '红沙',
        solid: true,
        transparent: false,
        color: '#CD853F',
        breakable: true,
        hardness: 0.5,
        gravity: true
      },
      {
        id: 36,
        name: 'red_sandstone',
        displayName: '红砂岩',
        solid: true,
        transparent: false,
        color: '#B8860B',
        breakable: true,
        hardness: 0.8,
        blastResistance: 0.8
      },
      {
        id: 37,
        name: 'granite',
        displayName: '花岗岩',
        solid: true,
        transparent: false,
        color: '#A0522D',
        breakable: true,
        hardness: 1.5,
        blastResistance: 6.0
      },
      {
        id: 38,
        name: 'diorite',
        displayName: '闪长岩',
        solid: true,
        transparent: false,
        color: '#D3D3D3',
        breakable: true,
        hardness: 1.5,
        blastResistance: 6.0
      },
      {
        id: 39,
        name: 'andesite',
        displayName: '安山岩',
        solid: true,
        transparent: false,
        color: '#808080',
        breakable: true,
        hardness: 1.5,
        blastResistance: 6.0
      },
      {
        id: 40,
        name: 'mossy_cobblestone',
        displayName: '苔石',
        solid: true,
        transparent: false,
        color: '#6B8068',
        breakable: true,
        hardness: 2.0,
        blastResistance: 6.0
      },
      {
        id: 41,
        name: 'emerald_ore',
        displayName: '绿宝石矿石',
        solid: true,
        transparent: false,
        color: '#00FF7F',
        breakable: true,
        hardness: 3.0,
        drops: ['emerald'],
        requiresTool: true
      },
      {
        id: 42,
        name: 'redstone_ore',
        displayName: '红石矿石',
        solid: true,
        transparent: false,
        color: '#8B0000',
        breakable: true,
        hardness: 3.0,
        drops: ['redstone'],
        lightLevel: 9
      },
      {
        id: 43,
        name: 'lapis_ore',
        displayName: '青金石矿石',
        solid: true,
        transparent: false,
        color: '#1E3A8A',
        breakable: true,
        hardness: 3.0,
        drops: ['lapis_lazuli']
      },
      {
        id: 44,
        name: 'netherrack',
        displayName: '下界岩',
        solid: true,
        transparent: false,
        color: '#8B4513',
        breakable: true,
        hardness: 0.4,
        dimension: 'nether'
      },
      // 添加更多装饰性方块以增加多样性
      {
        id: 45,
        name: 'rose',
        displayName: '玫瑰',
        solid: false,
        transparent: true,
        color: '#FF0000',
        breakable: true,
        hardness: 0.1
      },
      {
        id: 46,
        name: 'dandelion',
        displayName: '蒲公英',
        solid: false,
        transparent: true,
        color: '#FFFF00',
        breakable: true,
        hardness: 0.1
      },
      {
        id: 47,
        name: 'dead_bush',
        displayName: '枯死的灌木',
        solid: false,
        transparent: true,
        color: '#8B4513',
        breakable: true,
        hardness: 0.1
      },
      {
        id: 48,
        name: 'fern',
        displayName: '蕨类植物',
        solid: false,
        transparent: true,
        color: '#228B22',
        breakable: true,
        hardness: 0.1
      },
      {
        id: 49,
        name: 'poppy',
        displayName: '罂粟花',
        solid: false,
        transparent: true,
        color: '#FF0000',
        breakable: true,
        hardness: 0.1
      },
      {
        id: 50,
        name: 'blue_orchid',
        displayName: '兰花',
        solid: false,
        transparent: true,
        color: '#1E90FF',
        breakable: true,
        hardness: 0.1
      },
      {
        id: 51,
        name: 'allium',
        displayName: '绒球葱',
        solid: false,
        transparent: true,
        color: '#9370DB',
        breakable: true,
        hardness: 0.1
      },
      {
        id: 52,
        name: 'azure_bluet',
        displayName: '蓝花美耳草',
        solid: false,
        transparent: true,
        color: '#F0F8FF',
        breakable: true,
        hardness: 0.1
      },
      {
        id: 53,
        name: 'red_tulip',
        displayName: '红色郁金香',
        solid: false,
        transparent: true,
        color: '#FF0000',
        breakable: true,
        hardness: 0.1
      },
      {
        id: 54,
        name: 'orange_tulip',
        displayName: '橙色郁金香',
        solid: false,
        transparent: true,
        color: '#FFA500',
        breakable: true,
        hardness: 0.1
      },
      {
        id: 55,
        name: 'white_tulip',
        displayName: '白色郁金香',
        solid: false,
        transparent: true,
        color: '#FFFFFF',
        breakable: true,
        hardness: 0.1
      },
      {
        id: 56,
        name: 'pink_tulip',
        displayName: '粉色郁金香',
        solid: false,
        transparent: true,
        color: '#FFC0CB',
        breakable: true,
        hardness: 0.1
      },
      {
        id: 57,
        name: 'oxeye_daisy',
        displayName: '滨菊',
        solid: false,
        transparent: true,
        color: '#FFFFFF',
        breakable: true,
        hardness: 0.1
      },
      // 农作物系统方块
      {
        id: 58,
        name: 'farmland',
        displayName: '耕地',
        solid: true,
        transparent: false,
        color: '#6B4C3B',
        breakable: true,
        hardness: 0.6,
        special: 'farming'
      },
      {
        id: 59,
        name: 'wheat_seeds',
        displayName: '小麦种子',
        solid: false,
        transparent: true,
        color: '#D2B48C',
        breakable: true,
        hardness: 0.1
      },
      {
        id: 60,
        name: 'wheat',
        displayName: '小麦',
        solid: false,
        transparent: true,
        color: '#F5DEB3',
        breakable: true,
        hardness: 0.2,
        special: 'crop'
      },
      {
        id: 61,
        name: 'carrot',
        displayName: '胡萝卜',
        solid: false,
        transparent: true,
        color: '#FFA500',
        breakable: true,
        hardness: 0.2,
        special: 'crop'
      },
      {
        id: 62,
        name: 'potato',
        displayName: '土豆',
        solid: false,
        transparent: true,
        color: '#D2B48C',
        breakable: true,
        hardness: 0.2,
        special: 'crop'
      },
      {
        id: 63,
        name: 'beetroot',
        displayName: '甜菜根',
        solid: false,
        transparent: true,
        color: '#8B0000',
        breakable: true,
        hardness: 0.2,
        special: 'crop'
      },
      // 农作物生长阶段方块
      {
        id: 64,
        name: 'wheat_stage1',
        displayName: '小麦(发芽)',
        solid: false,
        transparent: true,
        color: '#9ACD32',
        breakable: true,
        hardness: 0.1,
        special: 'crop_stage'
      },
      {
        id: 65,
        name: 'wheat_stage2',
        displayName: '小麦(成长)',
        solid: false,
        transparent: true,
        color: '#ADFF2F',
        breakable: true,
        hardness: 0.1,
        special: 'crop_stage'
      },
      {
        id: 66,
        name: 'carrot_stage1',
        displayName: '胡萝卜(发芽)',
        solid: false,
        transparent: true,
        color: '#FFD700',
        breakable: true,
        hardness: 0.1,
        special: 'crop_stage'
      },
      {
        id: 67,
        name: 'carrot_stage2',
        displayName: '胡萝卜(成长)',
        solid: false,
        transparent: true,
        color: '#FFA500',
        breakable: true,
        hardness: 0.1,
        special: 'crop_stage'
      },
      {
        id: 68,
        name: 'potato_stage1',
        displayName: '土豆(发芽)',
        solid: false,
        transparent: true,
        color: '#D2B48C',
        breakable: true,
        hardness: 0.1,
        special: 'crop_stage'
      },
      {
        id: 69,
        name: 'potato_stage2',
        displayName: '土豆(成长)',
        solid: false,
        transparent: true,
        color: '#DEB887',
        breakable: true,
        hardness: 0.1,
        special: 'crop_stage'
      },
      {
        id: 70,
        name: 'beetroot_stage1',
        displayName: '甜菜根(发芽)',
        solid: false,
        transparent: true,
        color: '#DC143C',
        breakable: true,
        hardness: 0.1,
        special: 'crop_stage'
      },
      {
        id: 71,
        name: 'beetroot_stage2',
        displayName: '甜菜根(成长)',
        solid: false,
        transparent: true,
        color: '#8B0000',
        breakable: true,
        hardness: 0.1,
        special: 'crop_stage'
      },
      // 容器方块
      {
        id: 72,
        name: 'chest',
        displayName: '箱子',
        solid: true,
        transparent: false,
        color: '#8B4513',
        breakable: true,
        hardness: 2.5,
        special: 'container',
        drops: ['chest_item']
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
      
      // 新增的我的世界属性
      blastResistance: blockDef.blastResistance ?? 0,
      flammable: blockDef.flammable ?? false,
      decayable: blockDef.decayable ?? false,
      requiresTool: blockDef.requiresTool ?? false,
      partial: blockDef.partial ?? false,
      damage: blockDef.damage ?? 0,
      lightLevel: blockDef.lightLevel ?? 0,
      slippery: blockDef.slippery ?? false,
      slowing: blockDef.slowing ?? false,
      dimension: blockDef.dimension ?? 'overworld',
      underwater: blockDef.underwater ?? false,
      special: blockDef.special ?? null,
      
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
   * 获取方块爆炸防性
   */
  getBlastResistance(blockId) {
    const block = this.getBlock(blockId);
    return block ? block.blastResistance : 0;
  }
  
  /**
   * 检查方块是否可燃
   */
  isFlammable(blockId) {
    const block = this.getBlock(blockId);
    return block ? block.flammable : false;
  }
  
  /**
   * 检查方块是否会腐烂（如树叶）
   */
  isDecayable(blockId) {
    const block = this.getBlock(blockId);
    return block ? block.decayable : false;
  }
  
  /**
   * 检查方块是否需要工具挖掘
   */
  requiresTool(blockId) {
    const block = this.getBlock(blockId);
    return block ? block.requiresTool : false;
  }
  
  /**
   * 获取方块伤害值（如仙人掌、岩浆）
   */
  getBlockDamage(blockId) {
    const block = this.getBlock(blockId);
    return block ? block.damage : 0;
  }
  
  /**
   * 获取方块光照等级
   */
  getLightLevel(blockId) {
    const block = this.getBlock(blockId);
    return block ? block.lightLevel : 0;
  }
  
  /**
   * 检查方块是否湿滑（如冰块）
   */
  isSlippery(blockId) {
    const block = this.getBlock(blockId);
    return block ? block.slippery : false;
  }
  
  /**
   * 检查方块是否会减速（如灵魂沙）
   */
  isSlowing(blockId) {
    const block = this.getBlock(blockId);
    return block ? block.slowing : false;
  }
  
  /**
   * 获取方块所属维度
   */
  getDimension(blockId) {
    const block = this.getBlock(blockId);
    return block ? block.dimension : 'overworld';
  }
  
  /**
   * 检查方块是否为水下方块
   */
  isUnderwater(blockId) {
    const block = this.getBlock(blockId);
    return block ? block.underwater : false;
  }
  
  /**
   * 获取方块特殊属性
   */
  getSpecialProperty(blockId) {
    const block = this.getBlock(blockId);
    return block ? block.special : null;
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
      case 'flammable':
        return allBlocks.filter(block => block.flammable);
      case 'decayable':
        return allBlocks.filter(block => block.decayable);
      case 'ores':
        return allBlocks.filter(block => block.name.includes('ore') || block.drops.length > 0);
      case 'logs':
        return allBlocks.filter(block => block.name.includes('log'));
      case 'leaves':
        return allBlocks.filter(block => block.name.includes('leaves'));
      case 'stones':
        return allBlocks.filter(block => 
          block.name.includes('stone') || 
          block.name.includes('granite') || 
          block.name.includes('diorite') || 
          block.name.includes('andesite')
        );
      case 'planks':
        return allBlocks.filter(block => block.name.includes('planks'));
      case 'light_sources':
        return allBlocks.filter(block => block.lightLevel > 0);
      case 'damage_sources':
        return allBlocks.filter(block => block.damage > 0);
      case 'nether':
        return allBlocks.filter(block => block.dimension === 'nether');
      case 'end':
        return allBlocks.filter(block => block.dimension === 'end');
      case 'overworld':
        return allBlocks.filter(block => block.dimension === 'overworld');
      case 'underwater':
        return allBlocks.filter(block => block.underwater);
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
      fluidBlocks: allBlocks.filter(b => b.fluid).length,
      flammableBlocks: allBlocks.filter(b => b.flammable).length,
      oreBlocks: allBlocks.filter(b => b.name.includes('ore')).length,
      logBlocks: allBlocks.filter(b => b.name.includes('log')).length,
      leavesBlocks: allBlocks.filter(b => b.name.includes('leaves')).length,
      lightSources: allBlocks.filter(b => b.lightLevel > 0).length,
      damageSources: allBlocks.filter(b => b.damage > 0).length,
      dimensionStats: {
        overworld: allBlocks.filter(b => b.dimension === 'overworld').length,
        nether: allBlocks.filter(b => b.dimension === 'nether').length,
        end: allBlocks.filter(b => b.dimension === 'end').length
      }
    };
  }
}

// 导出默认实例
export const blockConfig = new BlockConfig();