/**
 * 熔炉系统简单测试
 */

console.log('🧪 开始熔炉系统简单测试...');

// 测试1: 检查文件是否存在
const fs = require('fs');
const path = require('path');

const filesToCheck = [
  '../blocks/FurnaceBlock.js',
  '../blocks/ContainerManager.js'
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
  console.log('✅ 所有熔炉系统文件都存在');
  
  // 测试2: 检查方块配置
  try {
    const { blockConfig } = require('../config/BlockConfig.js');
    
    const furnaceBlock = blockConfig.getBlock('furnace');
    if (furnaceBlock && furnaceBlock.id === 19) {
      console.log('✅ 熔炉方块配置正确');
      console.log(`🆔 ID: ${furnaceBlock.id}`);
      console.log(`🏷️  名称: ${furnaceBlock.name}`);
      console.log(`🔤 显示名称: ${furnaceBlock.displayName}`);
    } else {
      console.log('❌ 熔炉方块配置错误');
      process.exit(1);
    }
    
    // 测试3: 检查物品配置
    const { itemConfig } = require('../config/ItemConfig.js');
    
    const furnaceItem = itemConfig.getItem('furnace_item');
    if (furnaceItem && furnaceItem.blockId === furnaceBlock.id) {
      console.log('✅ 熔炉物品配置正确');
      console.log(`🆔 ID: ${furnaceItem.id}`);
      console.log(`🏷️  名称: ${furnaceItem.name}`);
      console.log(`🔤 显示名称: ${furnaceItem.displayName}`);
      console.log(`📦 类型: ${furnaceItem.type}`);
      console.log(`🧱 方块ID: ${furnaceItem.blockId}`);
    } else {
      console.log('❌ 熔炉物品配置错误');
      process.exit(1);
    }
    
    console.log('🎉 熔炉系统简单测试通过!');
    process.exit(0);
  } catch (error) {
    console.log(`❌ 熔炉系统测试失败: ${error.message}`);
    process.exit(1);
  }
} else {
  console.log('❌ 熔炉系统简单测试失败');
  process.exit(1);
}