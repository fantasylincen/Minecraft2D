/**
 * 物品配置系统
 * 定义游戏中所有物品的类型、属性和行为
 */

import { blockConfig } from './BlockConfig.js';

/**
 * 物品类型枚举
 */
export const ItemType = {
  // 方块类物品
  BLOCK: 'block',
  
  // 工具类
  TOOL_PICKAXE: 'tool_pickaxe',
  TOOL_SHOVEL: 'tool_shovel',
  TOOL_AXE: 'tool_axe',
  TOOL_HOE: 'tool_hoe',
  
  // 武器类
  WEAPON_SWORD: 'weapon_sword',
  WEAPON_BOW: 'weapon_bow',
  
  // 食物类
  FOOD: 'food',
  
  // 材料类
  MATERIAL: 'material',
  
  // 其他
  MISC: 'misc'
};

/**
 * 物品稀有度
 */
export const ItemRarity = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

/**
 * 工具材质等级
 */
export const ToolMaterial = {
  WOOD: { level: 1, durability: 32, speed: 1.0, damage: 1 },
  STONE: { level: 2, durability: 64, speed: 1.5, damage: 2 },
  IRON: { level: 3, durability: 128, speed: 2.0, damage: 3 },
  DIAMOND: { level: 4, durability: 256, speed: 3.0, damage: 4 },
  NETHERITE: { level: 5, durability: 512, speed: 4.0, damage: 5 }
};

/**
 * 物品定义
 */
export const itemDefinitions = {
  // 方块类物品（对应 BlockConfig 中的方块类型）
  'block_dirt': {
    id: 'block_dirt',
    name: '泥土',
    type: ItemType.BLOCK,
    blockId: 1, // 对应 BlockConfig 中的方块ID
    maxStack: 64,
    rarity: ItemRarity.COMMON,
    description: '基础的泥土方块，可以种植植物'
  },
  
  'block_stone': {
    id: 'block_stone',
    name: '石头',
    type: ItemType.BLOCK,
    blockId: 2,
    maxStack: 64,
    rarity: ItemRarity.COMMON,
    description: '坚硬的石头方块'
  },
  
  'block_grass': {
    id: 'block_grass',
    name: '草方块',
    type: ItemType.BLOCK,
    blockId: 3,
    maxStack: 64,
    rarity: ItemRarity.COMMON,
    description: '长满草的泥土方块'
  },
  
  'block_sand': {
    id: 'block_sand',
    name: '沙子',
    type: ItemType.BLOCK,
    blockId: 4,
    maxStack: 64,
    rarity: ItemRarity.COMMON,
    description: '细腻的沙子方块'
  },
  
  'block_water': {
    id: 'block_water',
    name: '水',
    type: ItemType.BLOCK,
    blockId: 5,
    maxStack: 1,
    rarity: ItemRarity.COMMON,
    description: '清澈的水'
  },
  
  'block_wood': {
    id: 'block_wood',
    name: '木头',
    type: ItemType.BLOCK,
    blockId: 6,
    maxStack: 64,
    rarity: ItemRarity.COMMON,
    description: '天然的木头方块'
  },
  
  'block_leaves': {
    id: 'block_leaves',
    name: '树叶',
    type: ItemType.BLOCK,
    blockId: 7,
    maxStack: 64,
    rarity: ItemRarity.COMMON,
    description: '绿色的树叶方块'
  },
  
  'block_iron_ore': {
    id: 'block_iron_ore',
    name: '铁矿石',
    type: ItemType.BLOCK,
    blockId: 8,
    maxStack: 64,
    rarity: ItemRarity.UNCOMMON,
    description: '含有铁矿的石头'
  },
  
  'block_gold_ore': {
    id: 'block_gold_ore',
    name: '金矿石',
    type: ItemType.BLOCK,
    blockId: 9,
    maxStack: 64,
    rarity: ItemRarity.RARE,
    description: '珍贵的金矿石'
  },
  
  'block_diamond_ore': {
    id: 'block_diamond_ore',
    name: '钻石矿石',
    type: ItemType.BLOCK,
    blockId: 10,
    maxStack: 64,
    rarity: ItemRarity.EPIC,
    description: '极其珍贵的钻石矿石'
  },
  
  // 工具类物品
  'pickaxe_wood': {
    id: 'pickaxe_wood',
    name: '木镐',
    type: ItemType.TOOL_PICKAXE,
    material: ToolMaterial.WOOD,
    maxStack: 1,
    durability: ToolMaterial.WOOD.durability,
    rarity: ItemRarity.COMMON,
    description: '基础的木制镐子，可以挖掘石头和矿物',
    canMine: ['stone', 'dirt', 'sand', 'iron_ore']
  },
  
  'pickaxe_stone': {
    id: 'pickaxe_stone',
    name: '石镐',
    type: ItemType.TOOL_PICKAXE,
    material: ToolMaterial.STONE,
    maxStack: 1,
    durability: ToolMaterial.STONE.durability,
    rarity: ItemRarity.COMMON,
    description: '石制镐子，比木镐更耐用',
    canMine: ['stone', 'dirt', 'sand', 'iron_ore', 'gold_ore']
  },
  
  'pickaxe_iron': {
    id: 'pickaxe_iron',
    name: '铁镐',
    type: ItemType.TOOL_PICKAXE,
    material: ToolMaterial.IRON,
    maxStack: 1,
    durability: ToolMaterial.IRON.durability,
    rarity: ItemRarity.UNCOMMON,
    description: '铁制镐子，可以挖掘大部分矿物',
    canMine: ['stone', 'dirt', 'sand', 'iron_ore', 'gold_ore', 'diamond_ore']
  },
  
  'pickaxe_diamond': {
    id: 'pickaxe_diamond',
    name: '钻石镐',
    type: ItemType.TOOL_PICKAXE,
    material: ToolMaterial.DIAMOND,
    maxStack: 1,
    durability: ToolMaterial.DIAMOND.durability,
    rarity: ItemRarity.EPIC,
    description: '钻石制镐子，最高级的挖掘工具',
    canMine: ['stone', 'dirt', 'sand', 'iron_ore', 'gold_ore', 'diamond_ore']
  },
  
  // 材料类物品
  'iron_ingot': {
    id: 'iron_ingot',
    name: '铁锭',
    type: ItemType.MATERIAL,
    maxStack: 64,
    rarity: ItemRarity.UNCOMMON,
    description: '冶炼铁矿石得到的铁锭'
  },
  
  'gold_ingot': {
    id: 'gold_ingot',
    name: '金锭',
    type: ItemType.MATERIAL,
    maxStack: 64,
    rarity: ItemRarity.RARE,
    description: '冶炼金矿石得到的金锭'
  },
  
  'diamond': {
    id: 'diamond',
    name: '钻石',
    type: ItemType.MATERIAL,
    maxStack: 64,
    rarity: ItemRarity.EPIC,
    description: '闪闪发光的钻石'
  },
  
  'stick': {
    id: 'stick',
    name: '木棍',
    type: ItemType.MATERIAL,
    maxStack: 64,
    rarity: ItemRarity.COMMON,
    description: '制作工具的基础材料'
  },
  
  // 食物类物品
  'apple': {
    id: 'apple',
    name: '苹果',
    type: ItemType.FOOD,
    maxStack: 64,
    rarity: ItemRarity.COMMON,
    description: '美味的苹果，可以恢复饥饿值',
    foodValue: 4,
    saturation: 2.4
  },
  
  'bread': {
    id: 'bread',
    name: '面包',
    type: ItemType.FOOD,
    maxStack: 64,
    rarity: ItemRarity.COMMON,
    description: '香喷喷的面包',
    foodValue: 5,
    saturation: 6.0
  },
  
  // 容器类物品
  'chest_item': {
    id: 'chest_item',
    name: '箱子',
    type: ItemType.BLOCK,
    blockId: 71, // 对应 BlockConfig 中的箱子方块ID
    maxStack: 1,
    rarity: ItemRarity.UNCOMMON,
    description: '可以存储物品的箱子'
  },
  
  // 新增：制作台物品 (制作台系统 - 方块实现)
  'crafting_table_item': {
    id: 'crafting_table_item',
    name: 'crafting_table',
    displayName: '制作台',
    type: ItemType.BLOCK,
    blockId: blockConfig.getBlock('crafting_table').id,
    maxStack: 64,
    durability: null,
    rarity: ItemRarity.UNCOMMON,
    description: '用于制作各种物品的制作台'
  },
  // 新增：木板物品 (合成配方系统 - 数据结构)
  'planks_item': {
    id: 'planks_item',
    name: 'planks',
    displayName: '木板',
    type: ItemType.MATERIAL,
    maxStack: 64,
    durability: null,
    rarity: ItemRarity.COMMON,
    description: '基础建筑材料，由原木制成'
  },
  // 新增：木棍物品 (合成配方系统 - 数据结构)
  'sticks_item': {
    id: 'sticks_item',
    name: 'sticks',
    displayName: '木棍',
    type: ItemType.MATERIAL,
    maxStack: 64,
    durability: null,
    rarity: ItemRarity.COMMON,
    description: '制作工具的基础材料'
  },
  // 新增：木镐物品 (合成配方系统 - 数据结构)
  'wooden_pickaxe_item': {
    id: 'wooden_pickaxe_item',
    name: 'wooden_pickaxe',
    displayName: '木镐',
    type: ItemType.TOOL,
    maxStack: 1,
    durability: 60,
    rarity: ItemRarity.COMMON,
    description: '基础挖掘工具，可以挖掘石头等方块'
  },
  // 新增：木剑物品 (合成配方系统 - 数据结构)
  'wooden_sword_item': {
    id: 'wooden_sword_item',
    name: 'wooden_sword',
    displayName: '木剑',
    type: ItemType.WEAPON,
    maxStack: 1,
    durability: 60,
    rarity: ItemRarity.COMMON,
    description: '基础武器，用于近战攻击'
  },
  // 新增：石镐物品 (合成配方系统 - 数据结构)
  'stone_pickaxe_item': {
    id: 'stone_pickaxe_item',
    name: 'stone_pickaxe',
    displayName: '石镐',
    type: ItemType.TOOL,
    maxStack: 1,
    durability: 132,
    rarity: ItemRarity.UNCOMMON,
    description: '中级挖掘工具，比木镐更耐用'
  },
  // 新增：石剑物品 (合成配方系统 - 数据结构)
  'stone_sword_item': {
    id: 'stone_sword_item',
    name: 'stone_sword',
    displayName: '石剑',
    type: ItemType.WEAPON,
    maxStack: 1,
    durability: 132,
    rarity: ItemRarity.UNCOMMON,
    description: '中级武器，比木剑更锋利'
  },
  // 新增：铁镐物品 (合成配方系统 - 数据结构)
  'iron_pickaxe_item': {
    id: 'iron_pickaxe_item',
    name: 'iron_pickaxe',
    displayName: '铁镐',
    type: ItemType.TOOL,
    maxStack: 1,
    durability: 251,
    rarity: ItemRarity.RARE,
    description: '高级挖掘工具，可以挖掘铁矿和金矿'
  },
  // 新增：铁剑物品 (合成配方系统 - 数据结构)
  'iron_sword_item': {
    id: 'iron_sword_item',
    name: 'iron_sword',
    displayName: '铁剑',
    type: ItemType.WEAPON,
    maxStack: 1,
    durability: 251,
    rarity: ItemRarity.RARE,
    description: '高级武器，攻击力更强'
  },
  // 新增：钻石镐物品 (合成配方系统 - 数据结构)
  'diamond_pickaxe_item': {
    id: 'diamond_pickaxe_item',
    name: 'diamond_pickaxe',
    displayName: '钻石镐',
    type: ItemType.TOOL,
    maxStack: 1,
    durability: 1562,
    rarity: ItemRarity.EPIC,
    description: '顶级挖掘工具，可以挖掘所有方块'
  },
  // 新增：钻石剑物品 (合成配方系统 - 数据结构)
  'diamond_sword_item': {
    id: 'diamond_sword_item',
    name: 'diamond_sword',
    displayName: '钻石剑',
    type: ItemType.WEAPON,
    maxStack: 1,
    durability: 1562,
    rarity: ItemRarity.EPIC,
    description: '顶级武器，拥有最强的攻击力'
  },
  // 添加圆石物品定义 (熔炉系统 - 功能实现)
  'cobblestone_item': {
    id: 'cobblestone_item',
    name: 'cobblestone',
    displayName: '圆石',
    type: ItemType.MATERIAL,
    maxStack: 64,
    durability: null,
    rarity: ItemRarity.COMMON,
    description: '由石头烧制而成的圆石'
  },
  // 添加熔炉物品定义 (熔炉系统 - 功能实现)
  'furnace_item': {
    id: 'furnace_item',
    name: 'furnace',
    displayName: '熔炉',
    type: ItemType.BLOCK,
    blockId: 73, // 对应 BlockConfig 中的熔炉方块ID
    maxStack: 64,
    durability: null,
    rarity: ItemRarity.UNCOMMON,
    description: '用于熔炼矿石和烹饪食物的熔炉'
  }
};

/**
 * 物品配置管理类
 */
export class ItemConfig {
  constructor() {
    this.items = new Map();
    this.loadItems();
  }
  
  /**
   * 加载物品定义
   */
  loadItems() {
    for (const [itemId, definition] of Object.entries(itemDefinitions)) {
      this.items.set(itemId, definition);
    }
  }
  
  /**
   * 获取物品定义
   * @param {string} itemId 物品ID
   * @returns {Object|null} 物品定义
   */
  getItem(itemId) {
    return this.items.get(itemId) || null;
  }
  
  /**
   * 检查物品是否存在
   * @param {string} itemId 物品ID
   * @returns {boolean}
   */
  hasItem(itemId) {
    return this.items.has(itemId);
  }
  
  /**
   * 获取所有物品定义
   * @returns {Map} 所有物品定义
   */
  getAllItems() {
    return this.items;
  }
  
  /**
   * 根据类型获取物品列表
   * @param {string} type 物品类型
   * @returns {Array} 物品列表
   */
  getItemsByType(type) {
    const items = [];
    for (const [itemId, definition] of this.items) {
      if (definition.type === type) {
        items.push(definition);
      }
    }
    return items;
  }
  
  /**
   * 获取方块对应的物品ID
   * @param {number} blockId 方块ID
   * @returns {string|null} 物品ID
   */
  getItemIdByBlockId(blockId) {
    for (const [itemId, definition] of this.items) {
      if (definition.type === ItemType.BLOCK && definition.blockId === blockId) {
        return itemId;
      }
    }
    return null;
  }
  
  /**
   * 检查物品是否可以堆叠
   * @param {string} itemId 物品ID
   * @returns {boolean}
   */
  isStackable(itemId) {
    const item = this.getItem(itemId);
    return item && item.maxStack > 1;
  }
  
  /**
   * 获取物品最大堆叠数量
   * @param {string} itemId 物品ID
   * @returns {number}
   */
  getMaxStack(itemId) {
    const item = this.getItem(itemId);
    return item ? item.maxStack : 1;
  }
  
  /**
   * 检查工具是否可以挖掘指定方块
   * @param {string} toolItemId 工具物品ID
   * @param {string} blockType 方块类型
   * @returns {boolean}
   */
  canToolMineBlock(toolItemId, blockType) {
    const tool = this.getItem(toolItemId);
    if (!tool || !tool.canMine) {
      return false;
    }
    return tool.canMine.includes(blockType);
  }
}

// 创建全局物品配置实例
export const itemConfig = new ItemConfig();