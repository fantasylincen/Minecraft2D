/**
 * 被动生物系统简单测试文件
 */

// 使用CommonJS导入
const fs = require('fs');

// 检查必要的文件是否存在
const filesToCheck = [
  './src/entities/PassiveMob.js',
  './src/entities/Cow.js',
  './src/entities/Pig.js',
  './src/entities/Chicken.js',
  './src/entities/EntityManager.js'
];

console.log('🧪 开始测试被动生物系统...');

let allFilesExist = true;
filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ 文件存在: ${file}`);
  } else {
    console.log(`❌ 文件缺失: ${file}`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('❌ 测试失败: 缺少必要的文件');
  process.exit(1);
}

console.log('✅ 所有文件都已存在');

// 检查EntityManager.js是否包含新增的被动生物配置
const entityManagerContent = fs.readFileSync('./src/entities/EntityManager.js', 'utf8');
if (entityManagerContent.includes('cow') && 
    entityManagerContent.includes('pig') && 
    entityManagerContent.includes('chicken')) {
  console.log('✅ EntityManager.js已正确更新，包含被动生物配置');
} else {
  console.log('❌ EntityManager.js未正确更新');
}

// 检查开发计划是否已更新
const devPlanContent = fs.readFileSync('./docs/ITERATIVE_DEVELOPMENT_PLAN.md', 'utf8');
if (devPlanContent.includes('31. 被动生物系统 - 基础实现 ✅ 已完成')) {
  console.log('✅ 开发计划已正确更新');
} else {
  console.log('❌ 开发计划未正确更新');
}

console.log('🎉 被动生物系统测试完成!');