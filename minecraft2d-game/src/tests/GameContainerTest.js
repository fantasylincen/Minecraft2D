/**
 * 游戏容器系统集成测试
 * 测试容器系统在游戏中的完整集成
 */

import { GameEngine } from '../engine/GameEngine.js';
import { Player } from '../player/Player.js';
import { TerrainGenerator } from '../world/generators/TerrainGenerator.js';
import { blockConfig } from '../config/BlockConfig.js';

export class GameContainerTest {
  constructor() {
    this.gameEngine = null;
    this.player = null;
    this.terrainGenerator = null;
    console.log('🎮 游戏容器系统集成测试初始化完成');
  }
  
  /**
   * 初始化测试环境
   */
  async initialize() {
    console.log('🔧 初始化测试环境...');
    
    // 创建一个虚拟的canvas元素用于测试
    const canvas = {
      width: 800,
      height: 600,
      getContext: () => {
        return {
          fillRect: () => {},
          clearRect: () => {},
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          stroke: () => {},
          fill: () => {},
          save: () => {},
          restore: () => {},
          translate: () => {},
          rotate: () => {},
          scale: () => {},
          fillText: () => {},
          strokeText: () => {},
          measureText: () => ({ width: 10 }),
          createLinearGradient: () => ({
            addColorStop: () => {}
          }),
          drawImage: () => {}
        };
      }
    };
    
    // 创建游戏引擎
    this.gameEngine = new GameEngine(canvas);
    await this.gameEngine.initialize();
    
    // 创建子系统
    this.terrainGenerator = new TerrainGenerator(12345);
    this.player = new Player(this.gameEngine.worldConfig);
    
    // 设置引用
    this.player.setTerrainGenerator(this.terrainGenerator);
    this.player.setGameEngine(this.gameEngine);
    this.terrainGenerator.setContainerManager(this.gameEngine.containerManager);
    
    // 注册子系统
    this.gameEngine.registerSystem('terrainGenerator', this.terrainGenerator);
    this.gameEngine.registerSystem('player', this.player);
    
    console.log('✅ 测试环境初始化完成');
  }
  
  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🧪 开始运行游戏容器系统集成测试...');
    
    try {
      await this.initialize();
      this.testContainerPlacement();
      this.testContainerInteraction();
      this.testContainerSerialization();
      
      console.log('✅ 所有游戏容器系统集成测试通过!');
      return true;
    } catch (error) {
      console.error('❌ 游戏容器系统集成测试失败:', error);
      return false;
    }
  }
  
  /**
   * 测试容器放置
   */
  testContainerPlacement() {
    console.log('🧪 测试容器放置...');
    
    // 给玩家一些箱子物品用于测试
    this.player.inventory.addItem('chest_item', 5);
    
    // 检查玩家是否有箱子物品
    const hasChestItem = this.player.inventory.hasItem('chest_item', 1);
    if (!hasChestItem) {
      throw new Error('玩家物品栏中没有箱子物品');
    }
    console.log('✅ 玩家拥有箱子物品');
    
    console.log('✅ 容器放置测试通过');
  }
  
  /**
   * 测试容器交互
   */
  testContainerInteraction() {
    console.log('🧪 测试容器交互...');
    
    // 创建一个箱子方块在世界中
    const chest = this.gameEngine.containerManager.createChest(10, 10);
    
    // 检查箱子是否正确创建
    if (!chest) {
      throw new Error('未能正确创建箱子');
    }
    console.log('✅ 箱子创建成功');
    
    // 向箱子中添加一些物品
    chest.addItem('block_dirt', 10);
    chest.addItem('block_stone', 5);
    
    // 检查物品是否正确添加
    const dirtCount = chest.getItemCount('block_dirt');
    const stoneCount = chest.getItemCount('block_stone');
    
    if (dirtCount !== 10) {
      throw new Error(`泥土数量不正确: 期望10，实际${dirtCount}`);
    }
    
    if (stoneCount !== 5) {
      throw new Error(`石头数量不正确: 期望5，实际${stoneCount}`);
    }
    console.log('✅ 物品添加成功');
    
    console.log('✅ 容器交互测试通过');
  }
  
  /**
   * 测试容器序列化
   */
  testContainerSerialization() {
    console.log('🧪 测试容器序列化...');
    
    // 创建一些容器用于测试
    const chest1 = this.gameEngine.containerManager.createChest(0, 0);
    const chest2 = this.gameEngine.containerManager.createChest(1, 0);
    
    // 向容器中添加物品
    chest1.addItem('block_dirt', 10);
    chest2.addItem('block_stone', 5);
    
    // 连接箱子创建大箱子
    this.gameEngine.containerManager.tryConnectChests(0, 0);
    
    // 序列化容器数据
    const serializedData = this.gameEngine.containerManager.serialize();
    
    // 检查序列化数据
    if (!Array.isArray(serializedData)) {
      throw new Error('序列化数据格式不正确');
    }
    
    if (serializedData.length < 2) {
      throw new Error('序列化数据数量不正确');
    }
    console.log('✅ 容器序列化成功');
    
    // 创建新的容器管理器并反序列化
    const newContainerManager = new ContainerManager();
    newContainerManager.deserialize(serializedData);
    
    // 检查反序列化后的容器
    const deserializedChest1 = newContainerManager.getContainer(0, 0);
    const deserializedChest2 = newContainerManager.getContainer(1, 0);
    
    if (!deserializedChest1) {
      throw new Error('反序列化后未能找到第一个箱子');
    }
    
    if (!deserializedChest2) {
      throw new Error('反序列化后未能找到第二个箱子');
    }
    
    // 检查物品是否正确恢复
    const dirtCount = deserializedChest1.getItemCount('block_dirt');
    const stoneCount = deserializedChest2.getItemCount('block_stone');
    
    if (dirtCount !== 10) {
      throw new Error(`反序列化后泥土数量不正确: 期望10，实际${dirtCount}`);
    }
    
    if (stoneCount !== 5) {
      throw new Error(`反序列化后石头数量不正确: 期望5，实际${stoneCount}`);
    }
    console.log('✅ 容器反序列化成功');
    
    console.log('✅ 容器序列化测试通过');
  }
}

// 运行测试
if (typeof window === 'undefined') {
  // Node.js环境
  const test = new GameContainerTest();
  test.runAllTests().then(success => {
    if (success) {
      console.log('🎉 所有测试完成!');
      process.exit(0);
    } else {
      console.log('💥 测试失败!');
      process.exit(1);
    }
  });
}