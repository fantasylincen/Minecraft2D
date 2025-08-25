/**
 * 配方系统简单测试
 */

console.log('🧪 开始配方系统简单测试...');

// 测试1: 检查文件是否存在
const fs = require('fs');
const path = require('path');

const filesToCheck = [
  '../crafting/Recipe.js',
  '../crafting/RecipeManager.js'
];

let allFilesExist = true;
filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ 文件存在: ${file}`);
  } else {
    console.log(`❌ 文件不存在: ${file}`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('✅ 所有配方系统文件都存在');
  
  // 测试2: 尝试导入模块
  try {
    const { Recipe } = require('../crafting/Recipe.js');
    const { RecipeManager } = require('../crafting/RecipeManager.js');
    
    console.log('✅ 配方系统模块导入成功');
    
    // 测试3: 创建配方管理器
    const recipeManager = new RecipeManager();
    console.log('✅ 配方管理器创建成功');
    
    // 测试4: 检查默认配方
    const stats = recipeManager.getStats();
    console.log(`✅ 配方统计: ${stats.totalRecipes} 个配方`);
    
    if (stats.totalRecipes > 0) {
      console.log('✅ 默认配方初始化成功');
    } else {
      console.log('❌ 默认配方初始化失败');
      process.exit(1);
    }
    
    // 测试5: 查找匹配的配方
    const materials = [
      { itemId: 'wood_item', count: 1 }
    ];
    
    const matchingRecipe = recipeManager.findMatchingRecipe(materials);
    if (matchingRecipe) {
      console.log(`✅ 找到匹配的配方: ${matchingRecipe.name}`);
    } else {
      console.log('❌ 未找到匹配的配方');
    }
    
    console.log('🎉 配方系统简单测试通过!');
    process.exit(0);
  } catch (error) {
    console.log(`❌ 配方系统测试失败: ${error.message}`);
    process.exit(1);
  }
} else {
  console.log('❌ 配方系统简单测试失败');
  process.exit(1);
}