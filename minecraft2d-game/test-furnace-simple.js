/**
 * 简化版熔炉功能测试脚本
 */

// 模拟浏览器环境中的测试
function runFurnaceTests() {
  console.log('🧪 开始熔炉功能测试...');
  
  // 测试1: 检查必要的类和配置是否存在
  try {
    // 检查FurnaceBlock类
    if (typeof FurnaceBlock !== 'undefined') {
      console.log('✅ FurnaceBlock类存在');
    } else {
      console.log('⚠️ FurnaceBlock类未定义（可能需要在浏览器环境中测试）');
    }
    
    // 检查blockConfig
    if (typeof blockConfig !== 'undefined') {
      console.log('✅ blockConfig存在');
    } else {
      console.log('⚠️ blockConfig未定义（可能需要在浏览器环境中测试）');
    }
    
    // 检查itemConfig
    if (typeof itemConfig !== 'undefined') {
      console.log('✅ itemConfig存在');
    } else {
      console.log('⚠️ itemConfig未定义（可能需要在浏览器环境中测试）');
    }
  } catch (error) {
    console.log('ℹ️  在Node.js环境中无法直接测试浏览器特定功能');
  }
  
  // 测试2: 检查配置文件内容
  console.log('\n📋 检查配置文件内容...');
  
  // 检查BlockConfig.js中是否包含熔炉定义
  fetch('./src/config/BlockConfig.js')
    .then(response => response.text())
    .then(content => {
      if (content.includes('furnace') && content.includes('id: 73')) {
        console.log('✅ BlockConfig.js中包含熔炉方块定义');
      } else {
        console.log('❌ BlockConfig.js中缺少熔炉方块定义');
      }
    })
    .catch(error => {
      console.log('⚠️ 无法读取BlockConfig.js文件:', error.message);
    });
  
  // 检查ItemConfig.js中是否包含熔炉物品定义
  fetch('./src/config/ItemConfig.js')
    .then(response => response.text())
    .then(content => {
      if (content.includes('furnace_item') && content.includes('blockId: 73')) {
        console.log('✅ ItemConfig.js中包含熔炉物品定义');
      } else {
        console.log('❌ ItemConfig.js中缺少熔炉物品定义');
      }
    })
    .catch(error => {
      console.log('⚠️ 无法读取ItemConfig.js文件:', error.message);
    });
  
  // 检查RecipeManager.js中是否包含熔炉配方
  fetch('./src/crafting/RecipeManager.js')
    .then(response => response.text())
    .then(content => {
      if (content.includes('furnace_from_cobblestone')) {
        console.log('✅ RecipeManager.js中包含熔炉合成配方');
      } else {
        console.log('❌ RecipeManager.js中缺少熔炉合成配方');
      }
    })
    .catch(error => {
      console.log('⚠️ 无法读取RecipeManager.js文件:', error.message);
    });
  
  console.log('\n✅ 熔炉功能测试完成');
  console.log('\n📝 请在浏览器中打开 test-furnace-ui.html 进行完整功能测试');
}

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
  // 等待页面加载完成
  window.addEventListener('DOMContentLoaded', runFurnaceTests);
}

// 如果直接运行此脚本
if (typeof module !== 'undefined' && require.main === module) {
  console.log('ℹ️  此测试脚本主要用于浏览器环境，请在浏览器中打开 test-furnace-ui.html 进行测试');
  console.log('ℹ️  或者查看相关文件内容确认熔炉系统已正确实现');
  
  // 简单检查文件是否存在
  const fs = require('fs');
  const path = require('path');
  
  const filesToCheck = [
    './src/blocks/FurnaceBlock.js',
    './src/config/BlockConfig.js',
    './src/config/ItemConfig.js',
    './src/crafting/RecipeManager.js',
    './src/ui/FurnaceUI.jsx'
  ];
  
  console.log('\n📁 检查必要文件是否存在:');
  filesToCheck.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file}`);
    }
  });
  
  console.log('\n✅ 简化版熔炉功能测试完成');
}