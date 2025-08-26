/**
 * Player模块测试运行脚本
 */

// 由于这是一个浏览器环境的项目，我们创建一个简单的测试运行器来验证模块是否能正确加载

async function runTests() {
  console.log('开始运行Player模块测试...\n');
  
  try {
    // 测试1: 模块导入
    console.log('测试1: 模块导入测试');
    const { Player } = await import('../player/Player.js');
    const { PlayerPhysics } = await import('../player/PlayerPhysics.js');
    const { PlayerMovement } = await import('../player/PlayerMovement.js');
    const { PlayerHealth } = await import('../player/PlayerHealth.js');
    const { PlayerMining } = await import('../player/PlayerMining.js');
    const { PlayerPlacement } = await import('../player/PlayerPlacement.js');
    const { PlayerRendering } = await import('../player/PlayerRendering.js');
    const { PlayerInventory } = await import('../player/PlayerInventory.js');
    const { PlayerInteraction } = await import('../player/PlayerInteraction.js');
    
    console.log('✅ 所有模块导入成功\n');
    
    // 测试2: Player实例化
    console.log('测试2: Player实例化测试');
    const mockWorldConfig = {
      BLOCK_SIZE: 16,
      WORLD_HEIGHT: 256
    };
    
    const player = new Player(mockWorldConfig);
    console.log('✅ Player实例化成功\n');
    
    // 测试3: 子模块初始化
    console.log('测试3: 子模块初始化测试');
    if (player.physicsModule && player.movementModule && player.healthModule && 
        player.miningModule && player.placementModule && player.renderingModule && 
        player.inventoryModule && player.interactionModule) {
      console.log('✅ 所有子模块正确初始化\n');
    } else {
      console.log('❌ 子模块初始化失败\n');
      return false;
    }
    
    // 测试4: 基本功能测试
    console.log('测试4: 基本功能测试');
    
    // 测试获取位置
    const position = player.getPosition();
    if (position && typeof position.x === 'number' && typeof position.y === 'number') {
      console.log('✅ 获取位置功能正常');
    } else {
      console.log('❌ 获取位置功能异常');
      return false;
    }
    
    // 测试飞行模式切换
    const wasFlying = player.isFlying();
    player.toggleFlyMode();
    const isFlying = player.isFlying();
    player.toggleFlyMode(); // 切换回来
    if (isFlying !== wasFlying) {
      console.log('✅ 飞行模式切换功能正常');
    } else {
      console.log('❌ 飞行模式切换功能异常');
      return false;
    }
    
    // 测试获取飞行速度
    const speed = player.getFlySpeedPercentage();
    if (typeof speed === 'number' && speed >= 0 && speed <= 1000) {
      console.log('✅ 获取飞行速度功能正常');
    } else {
      console.log('❌ 获取飞行速度功能异常');
      return false;
    }
    
    // 测试获取物品栏
    const inventory = player.getInventory();
    if (inventory) {
      console.log('✅ 获取物品栏功能正常');
    } else {
      console.log('❌ 获取物品栏功能异常');
      return false;
    }
    
    console.log('\n✅ 所有测试通过！Player模块拆分成功！');
    return true;
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return false;
  }
}

// 运行测试
runTests().then(success => {
  if (success) {
    console.log('\n🎉 Player模块拆分和测试完成！');
  } else {
    console.log('\n💥 Player模块拆分或测试存在问题，请检查代码。');
  }
});