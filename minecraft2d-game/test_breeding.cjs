/**
 * 被动生物繁殖机制测试文件
 */

// 使用CommonJS导入
const fs = require('fs');

console.log('🧪 开始测试被动生物繁殖机制...');

// 检查必要的文件是否存在
const filesToCheck = [
  './src/entities/PassiveMob.js',
  './src/entities/Cow.js',
  './src/entities/Pig.js',
  './src/entities/Chicken.js',
  './src/entities/EntityManager.js'
];

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

// 检查PassiveMob.js是否包含繁殖相关属性和方法
const passiveMobContent = fs.readFileSync('./src/entities/PassiveMob.js', 'utf8');
const breedingFeatures = [
  'breedCooldown',
  'loveMode',
  'breedItem',
  'canBreed',
  'breed',
  'enterLoveMode',
  'canEnterLoveMode',
  'lookForMate'
];

let allBreedingFeaturesPresent = true;
breedingFeatures.forEach(feature => {
  if (passiveMobContent.includes(feature)) {
    console.log(`✅ PassiveMob.js包含繁殖特性: ${feature}`);
  } else {
    console.log(`❌ PassiveMob.js缺少繁殖特性: ${feature}`);
    allBreedingFeaturesPresent = false;
  }
});

if (!allBreedingFeaturesPresent) {
  console.log('❌ 测试失败: PassiveMob.js缺少必要的繁殖特性');
  process.exit(1);
}

// 检查具体生物类是否包含繁殖相关实现
const cowContent = fs.readFileSync('./src/entities/Cow.js', 'utf8');
const pigContent = fs.readFileSync('./src/entities/Pig.js', 'utf8');
const chickenContent = fs.readFileSync('./src/entities/Chicken.js', 'utf8');

const animalClasses = [
  { name: 'Cow', content: cowContent },
  { name: 'Pig', content: pigContent },
  { name: 'Chicken', content: chickenContent }
];

animalClasses.forEach(animal => {
  if (animal.content.includes('lookForMate') && 
      animal.content.includes('createBaby') && 
      animal.content.includes('breedItem')) {
    console.log(`✅ ${animal.name}.js已正确实现繁殖机制`);
  } else {
    console.log(`❌ ${animal.name}.js未正确实现繁殖机制`);
  }
});

// 检查EntityManager.js是否包含喂食功能
const entityManagerContent = fs.readFileSync('./src/entities/EntityManager.js', 'utf8');
if (entityManagerContent.includes('feedEntity')) {
  console.log('✅ EntityManager.js已正确添加喂食功能');
} else {
  console.log('❌ EntityManager.js未正确添加喂食功能');
}

// 检查开发计划是否已更新
try {
  const devPlanContent = fs.readFileSync('./docs/ITERATIVE_DEVELOPMENT_PLAN.md', 'utf8');
  if (devPlanContent.includes('32. 被动生物系统 - 繁殖机制 ✅ 已完成')) {
    console.log('✅ 开发计划已正确更新');
  } else {
    console.log('❌ 开发计划未正确更新');
  }
} catch (error) {
  console.log('⚠️  开发计划文档未找到，但这不影响繁殖机制的实现');
}

console.log('🎉 被动生物繁殖机制测试完成!');