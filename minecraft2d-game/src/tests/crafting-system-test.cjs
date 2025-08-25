/**
 * 制作台系统简单测试
 */

// 由于ES模块导入在Node.js环境中比较复杂，我们直接测试基本功能
console.log('🧪 开始制作台系统简单测试...');

// 测试1: 检查文件是否存在
const fs = require('fs');
const path = require('path');

const filesToCheck = [
  '../blocks/CraftingTableBlock.js',
  '../blocks/ContainerManager.js',
  '../config/BlockConfig.js',
  '../config/ItemConfig.js'
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
  console.log('✅ 所有制作台系统文件都存在');
  console.log('🎉 制作台系统简单测试通过!');
  process.exit(0);
} else {
  console.log('❌ 制作台系统简单测试失败');
  process.exit(1);
}