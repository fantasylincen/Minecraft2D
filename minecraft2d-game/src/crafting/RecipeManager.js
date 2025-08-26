/**
 * 配方管理器
 * 负责管理所有合成配方
 */

import { Recipe } from './Recipe.js';

export class RecipeManager {
  constructor() {
    this.recipes = new Map();
    this.recipeGroups = new Map(); // 按类型分组的配方
    this.initializeDefaultRecipes();
    console.log('🍳 RecipeManager 初始化完成');
  }
  
  /**
   * 初始化默认配方
   */
  initializeDefaultRecipes() {
    // 木板配方
    this.addRecipe(new Recipe(
      'planks_from_wood',
      '木板',
      [{ itemId: 'wood_item', count: 1 }],
      { itemId: 'planks_item', count: 4 },
      'crafting_table',
      500
    ));
    
    // 木棍配方
    this.addRecipe(new Recipe(
      'sticks_from_planks',
      '木棍',
      [
        { itemId: 'planks_item', count: 2 }
      ],
      { itemId: 'sticks_item', count: 4 },
      'crafting_table',
      500
    ));
    
    // 工作台配方
    this.addRecipe(new Recipe(
      'crafting_table_from_planks',
      '制作台',
      [
        { itemId: 'planks_item', count: 4 }
      ],
      { itemId: 'crafting_table_item', count: 1 },
      'crafting_table',
      1000
    ));
    
    // 木镐配方
    this.addRecipe(new Recipe(
      'wooden_pickaxe',
      '木镐',
      [
        { itemId: 'planks_item', count: 3 },
        { itemId: 'sticks_item', count: 2 }
      ],
      { itemId: 'wooden_pickaxe_item', count: 1 },
      'crafting_table',
      1500
    ));
    
    // 木剑配方
    this.addRecipe(new Recipe(
      'wooden_sword',
      '木剑',
      [
        { itemId: 'planks_item', count: 2 },
        { itemId: 'sticks_item', count: 1 }
      ],
      { itemId: 'wooden_sword_item', count: 1 },
      'crafting_table',
      1000
    ));
    
    // 石镐配方
    this.addRecipe(new Recipe(
      'stone_pickaxe',
      '石镐',
      [
        { itemId: 'stone_item', count: 3 },
        { itemId: 'sticks_item', count: 2 }
      ],
      { itemId: 'stone_pickaxe_item', count: 1 },
      'crafting_table',
      2000
    ));
    
    // 石剑配方
    this.addRecipe(new Recipe(
      'stone_sword',
      '石剑',
      [
        { itemId: 'stone_item', count: 2 },
        { itemId: 'sticks_item', count: 1 }
      ],
      { itemId: 'stone_sword_item', count: 1 },
      'crafting_table',
      1500
    ));
    
    // 铁镐配方
    this.addRecipe(new Recipe(
      'iron_pickaxe',
      '铁镐',
      [
        { itemId: 'iron_item', count: 3 },
        { itemId: 'sticks_item', count: 2 }
      ],
      { itemId: 'iron_pickaxe_item', count: 1 },
      'crafting_table',
      2500
    ));
    
    // 铁剑配方
    this.addRecipe(new Recipe(
      'iron_sword',
      '铁剑',
      [
        { itemId: 'iron_item', count: 2 },
        { itemId: 'sticks_item', count: 1 }
      ],
      { itemId: 'iron_sword_item', count: 1 },
      'crafting_table',
      2000
    ));
    
    // 钻石镐配方
    this.addRecipe(new Recipe(
      'diamond_pickaxe',
      '钻石镐',
      [
        { itemId: 'diamond_item', count: 3 },
        { itemId: 'sticks_item', count: 2 }
      ],
      { itemId: 'diamond_pickaxe_item', count: 1 },
      'crafting_table',
      3000
    ));
    
    // 钻石剑配方
    this.addRecipe(new Recipe(
      'diamond_sword',
      '钻石剑',
      [
        { itemId: 'diamond_item', count: 2 },
        { itemId: 'sticks_item', count: 1 }
      ],
      { itemId: 'diamond_sword_item', count: 1 },
      'crafting_table',
      2500
    ));
    
    // 添加熔炉配方 (熔炉系统 - 功能实现)
    this.addRecipe(new Recipe(
      'furnace_from_cobblestone',
      '熔炉',
      [
        { itemId: 'cobblestone_item', count: 8 }
      ],
      { itemId: 'furnace_item', count: 1 },
      'crafting_table',
      2000
    ));
    
    console.log(`✅ 初始化了 ${this.recipes.size} 个默认配方`);
  }
  
  /**
   * 添加配方
   * @param {Recipe} recipe - 配方实例
   * @returns {boolean} 是否成功添加
   */
  addRecipe(recipe) {
    if (!recipe || !recipe.id) {
      console.warn('⚠️  无效的配方');
      return false;
    }
    
    this.recipes.set(recipe.id, recipe);
    
    // 按类型分组
    if (!this.recipeGroups.has(recipe.type)) {
      this.recipeGroups.set(recipe.type, []);
    }
    this.recipeGroups.get(recipe.type).push(recipe);
    
    console.log(`✅ 添加配方: ${recipe.name} (${recipe.id})`);
    return true;
  }
  
  /**
   * 移除配方
   * @param {string} recipeId - 配方ID
   * @returns {boolean} 是否成功移除
   */
  removeRecipe(recipeId) {
    const recipe = this.recipes.get(recipeId);
    if (!recipe) {
      console.warn(`⚠️  配方 ${recipeId} 不存在`);
      return false;
    }
    
    this.recipes.delete(recipeId);
    
    // 从分组中移除
    const group = this.recipeGroups.get(recipe.type);
    if (group) {
      const index = group.indexOf(recipe);
      if (index !== -1) {
        group.splice(index, 1);
      }
    }
    
    console.log(`🗑️  移除配方: ${recipe.name} (${recipeId})`);
    return true;
  }
  
  /**
   * 获取配方
   * @param {string} recipeId - 配方ID
   * @returns {Recipe|null} 配方实例
   */
  getRecipe(recipeId) {
    return this.recipes.get(recipeId) || null;
  }
  
  /**
   * 根据材料查找匹配的配方
   * @param {Array} materials - 材料数组
   * @param {string} type - 配方类型
   * @returns {Recipe|null} 匹配的配方
   */
  findMatchingRecipe(materials, type = 'crafting_table') {
    const recipes = this.recipeGroups.get(type) || [];
    
    for (const recipe of recipes) {
      if (recipe.matches(materials)) {
        return recipe;
      }
    }
    
    return null;
  }
  
  /**
   * 获取指定类型的配方
   * @param {string} type - 配方类型
   * @returns {Array} 配方数组
   */
  getRecipesByType(type) {
    return this.recipeGroups.get(type) || [];
  }
  
  /**
   * 获取所有配方
   * @returns {Array} 配方数组
   */
  getAllRecipes() {
    return Array.from(this.recipes.values());
  }
  
  /**
   * 检查是否存在指定ID的配方
   * @param {string} recipeId - 配方ID
   * @returns {boolean} 是否存在
   */
  hasRecipe(recipeId) {
    return this.recipes.has(recipeId);
  }
  
  /**
   * 获取配方统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const totalRecipes = this.recipes.size;
    const recipeTypes = {};
    
    for (const [type, recipes] of this.recipeGroups) {
      recipeTypes[type] = recipes.length;
    }
    
    return {
      totalRecipes,
      recipeTypes
    };
  }
  
  /**
   * 序列化所有配方
   * @returns {Array} 序列化数据数组
   */
  serialize() {
    return Array.from(this.recipes.values()).map(recipe => recipe.serialize());
  }
  
  /**
   * 从序列化数据恢复配方
   * @param {Array} data - 序列化数据数组
   */
  deserialize(data) {
    this.recipes.clear();
    this.recipeGroups.clear();
    
    if (!Array.isArray(data)) {
      console.warn('⚠️  无效的配方数据格式');
      return;
    }
    
    data.forEach(recipeData => {
      try {
        const recipe = Recipe.deserialize(recipeData);
        this.addRecipe(recipe);
      } catch (error) {
        console.warn(`⚠️  恢复配方失败: ${recipeData.id}`, error);
      }
    });
    
    console.log(`📥 恢复了 ${this.recipes.size} 个配方`);
  }
}