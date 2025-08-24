/**
 * Minecraft2D 游戏功能测试
 * 验证所有核心系统的功能正确性
 */

import { GameEngine } from '../engine/GameEngine.js';
import { blockConfig } from '../config/BlockConfig.js';
import { TerrainGenerator } from '../world/TerrainGenerator.js';
import { Player } from '../player/Player.js';
import { Camera } from '../camera/Camera.js';
import { Renderer } from '../renderer/Renderer.js';
import { StorageManager } from '../storage/StorageManager.js';

export class GameTest {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🧪 开始Minecraft2D游戏功能测试...');
    
    // 创建测试用的画布
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    const worldConfig = {
      WORLD_HEIGHT: 512,
      CHUNK_SIZE: 16,
      BLOCK_SIZE: 16
    };

    try {
      // 测试各个模块
      await this.testBlockConfig();
      await this.testGameEngine(canvas);
      await this.testTerrainGenerator(worldConfig);
      await this.testPlayer(worldConfig);
      await this.testCamera(canvas, worldConfig);
      await this.testRenderer(canvas, worldConfig);
      await this.testStorageManager();
      await this.testIntegration(canvas, worldConfig);

      // 输出测试结果
      this.printTestResults();
      
    } catch (error) {
      console.error('❌ 测试执行失败:', error);
      this.addTestResult('测试执行', false, error.message);
    }

    return this.getTestSummary();
  }

  /**
   * 测试方块配置系统
   */
  async testBlockConfig() {
    console.log('🧱 测试方块配置系统...');

    // 测试方块定义
    this.test('方块配置初始化', () => {
      return blockConfig.getAllBlocks().length > 0;
    });

    // 测试基础方块
    this.test('空气方块存在', () => {
      const air = blockConfig.getBlock('air');
      return air && air.id === 0 && !air.solid;
    });

    this.test('草方块存在', () => {
      const grass = blockConfig.getBlock('grass');
      return grass && grass.id === 1 && grass.solid;
    });

    // 测试方块属性查询
    this.test('固体方块判断', () => {
      return blockConfig.isSolid(1) && !blockConfig.isSolid(0);
    });

    this.test('透明方块判断', () => {
      return blockConfig.isTransparent(0) && !blockConfig.isTransparent(1);
    });

    // 测试方块统计
    this.test('方块统计功能', () => {
      const stats = blockConfig.getStats();
      return stats.totalBlocks > 0 && 
             stats.solidBlocks > 0 && 
             stats.transparentBlocks > 0;
    });
  }

  /**
   * 测试游戏引擎
   */
  async testGameEngine(canvas) {
    console.log('🎮 测试游戏引擎...');

    const engine = new GameEngine(canvas);

    this.test('游戏引擎创建', () => {
      return engine && engine.canvas === canvas;
    });

    this.test('游戏引擎初始化', async () => {
      const success = await engine.initialize();
      return success === true;
    });

    this.test('游戏状态管理', () => {
      engine.start();
      const isRunning = engine.gameState.isRunning;
      engine.stop();
      return isRunning && !engine.gameState.isRunning;
    });

    this.test('按键状态检测', () => {
      // 模拟按键
      engine.keys['KeyW'] = true;
      const pressed = engine.isKeyPressed('KeyW');
      engine.keys['KeyW'] = false;
      return pressed;
    });

    this.test('世界配置获取', () => {
      const config = engine.getWorldConfig();
      return config && 
             config.WORLD_HEIGHT === 512 && 
             config.CHUNK_SIZE === 16 && 
             config.BLOCK_SIZE === 16;
    });

    engine.destroy();
  }

  /**
   * 测试地形生成器
   */
  async testTerrainGenerator(worldConfig) {
    console.log('🌍 测试地形生成器...');

    const generator = new TerrainGenerator(worldConfig);

    this.test('地形生成器创建', () => {
      return generator && generator.worldConfig === worldConfig;
    });

    this.test('区块生成', () => {
      const chunk = generator.generateChunk(0);
      return chunk && 
             chunk.length === worldConfig.WORLD_HEIGHT &&
             chunk[0].length === worldConfig.CHUNK_SIZE;
    });

    this.test('方块获取', () => {
      const blockId = generator.getBlock(0, 100);
      return typeof blockId === 'number' && blockId >= 0;
    });

    this.test('方块设置', () => {
      const success = generator.setBlock(0, 100, 1);
      const blockId = generator.getBlock(0, 100);
      return success && blockId === 1;
    });

    this.test('多区块生成', () => {
      const chunk1 = generator.generateChunk(0);
      const chunk2 = generator.generateChunk(1);
      return chunk1 !== chunk2 && 
             generator.loadedChunks.has(0) && 
             generator.loadedChunks.has(1);
    });

    this.test('地形统计', () => {
      const stats = generator.getStats();
      return stats && 
             stats.loadedChunks >= 0 && 
             typeof stats.seed === 'number';
    });
  }

  /**
   * 测试玩家系统
   */
  async testPlayer(worldConfig) {
    console.log('👤 测试玩家系统...');

    const player = new Player(worldConfig);
    const generator = new TerrainGenerator(worldConfig);
    player.setTerrainGenerator(generator);

    this.test('玩家创建', () => {
      return player && 
             player.position && 
             player.physics && 
             player.size;
    });

    this.test('玩家位置管理', () => {
      const originalPos = player.getPosition();
      player.setPosition(100, 200);
      const newPos = player.getPosition();
      return newPos.x === 100 && newPos.y === 200;
    });

    this.test('玩家物理属性', () => {
      return player.physics.speed > 0 && 
             player.physics.jumpForce > 0 && 
             player.physics.gravity > 0;
    });

    this.test('玩家尺寸设置', () => {
      return player.size.width > 0 && 
             player.size.height > 0;
    });

    this.test('玩家状态导出', () => {
      const data = player.exportData();
      return data && 
             data.position && 
             data.physics && 
             data.appearance;
    });

    this.test('玩家数据导入', () => {
      const testData = {
        position: { x: 50, y: 150 },
        physics: { velocity: { x: 10, y: 20 } },
        appearance: { color: '#FF0000' }
      };
      player.importData(testData);
      const pos = player.getPosition();
      return pos.x === 50 && pos.y === 150;
    });
  }

  /**
   * 测试摄像机系统
   */
  async testCamera(canvas, worldConfig) {
    console.log('📷 测试摄像机系统...');

    const camera = new Camera(canvas, worldConfig);
    const player = new Player(worldConfig);

    this.test('摄像机创建', () => {
      return camera && 
             camera.canvas === canvas && 
             camera.worldConfig === worldConfig;
    });

    this.test('摄像机跟随设置', () => {
      camera.setTarget(player);
      return camera.target === player;
    });

    this.test('坐标转换', () => {
      const worldPos = { x: 100, y: 200 };
      const screenPos = camera.worldToScreen(worldPos.x, worldPos.y);
      const backToWorld = camera.screenToWorld(screenPos.x, screenPos.y);
      
      return Math.abs(backToWorld.x - worldPos.x) < 1 && 
             Math.abs(backToWorld.y - worldPos.y) < 1;
    });

    this.test('视野检测', () => {
      camera.setPosition(0, 0, true);
      return camera.isInView(0, 0) && 
             !camera.isInView(10000, 10000);
    });

    this.test('缩放功能', () => {
      camera.setZoom(2.0, true);
      return camera.zoom === 2.0;
    });

    this.test('可见方块范围', () => {
      const range = camera.getVisibleBlockRange();
      return range && 
             typeof range.minX === 'number' && 
             typeof range.maxX === 'number' && 
             typeof range.minY === 'number' && 
             typeof range.maxY === 'number';
    });

    this.test('摄像机数据导出导入', () => {
      camera.setPosition(100, 200, true);
      const data = camera.exportData();
      
      const newCamera = new Camera(canvas, worldConfig);
      newCamera.importData(data);
      
      return Math.abs(newCamera.position.x - 100) < 1 && 
             Math.abs(newCamera.position.y - 200) < 1;
    });
  }

  /**
   * 测试渲染系统
   */
  async testRenderer(canvas, worldConfig) {
    console.log('🎨 测试渲染系统...');

    const renderer = new Renderer(canvas, worldConfig);
    const camera = new Camera(canvas, worldConfig);
    const generator = new TerrainGenerator(worldConfig);
    const player = new Player(worldConfig);

    this.test('渲染器创建', () => {
      return renderer && 
             renderer.canvas === canvas && 
             renderer.worldConfig === worldConfig;
    });

    this.test('渲染器引用设置', () => {
      renderer.setReferences(camera, generator, player);
      return renderer.camera === camera && 
             renderer.terrainGenerator === generator && 
             renderer.player === player;
    });

    this.test('渲染设置', () => {
      return renderer.settings && 
             typeof renderer.settings.showGrid === 'boolean' && 
             typeof renderer.settings.showDebugInfo === 'boolean';
    });

    this.test('环境设置', () => {
      return renderer.environment && 
             renderer.environment.skyColor && 
             renderer.environment.cloudColor;
    });

    this.test('时间设置', () => {
      renderer.setTimeOfDay(0.5);
      return renderer.environment.timeOfDay === 0.5;
    });

    this.test('调试功能切换', () => {
      const originalState = renderer.settings.showDebugInfo;
      renderer.toggleDebugInfo();
      return renderer.settings.showDebugInfo !== originalState;
    });

    this.test('统计信息', () => {
      const stats = renderer.getStats();
      return stats && 
             typeof stats.fps === 'number' && 
             typeof stats.drawCalls === 'number';
    });
  }

  /**
   * 测试存储管理器
   */
  async testStorageManager() {
    console.log('💾 测试存储管理器...');

    const storage = new StorageManager();

    this.test('存储管理器创建', () => {
      return storage && storage.storageTypes;
    });

    this.test('存储可用性检测', () => {
      return storage.isStorageAvailable();
    });

    // 测试玩家数据保存和加载
    this.test('玩家数据保存加载', () => {
      const testData = {
        position: { x: 100, y: 200 },
        health: 100,
        score: 1000
      };
      
      const saved = storage.savePlayerData(testData);
      const loaded = storage.loadPlayerData();
      
      return saved && 
             loaded && 
             loaded.position.x === testData.position.x && 
             loaded.health === testData.health;
    });

    // 测试世界数据保存和加载
    this.test('世界数据保存加载', () => {
      const testData = {
        seed: 12345,
        terrainParams: { heightScale: 80 }
      };
      
      const saved = storage.saveWorldData(testData);
      const loaded = storage.loadWorldData();
      
      return saved && 
             loaded && 
             loaded.seed === testData.seed;
    });

    // 测试游戏设置
    this.test('游戏设置保存加载', () => {
      const testSettings = {
        volume: 0.8,
        showDebugInfo: true
      };
      
      const saved = storage.saveGameSettings(testSettings);
      const loaded = storage.loadGameSettings();
      
      return saved && 
             loaded && 
             loaded.volume === testSettings.volume;
    });

    // 测试存储信息
    this.test('存储信息获取', () => {
      const info = storage.getStorageInfo();
      return info && 
             typeof info.totalSize === 'number' && 
             typeof info.gameDataSize === 'number';
    });

    // 清理测试数据
    storage.clearAllData();
  }

  /**
   * 测试集成功能
   */
  async testIntegration(canvas, worldConfig) {
    console.log('🔗 测试系统集成...');

    // 创建完整的游戏系统
    const engine = new GameEngine(canvas);
    await engine.initialize();
    
    const generator = new TerrainGenerator(worldConfig);
    const player = new Player(worldConfig);
    const camera = new Camera(canvas, worldConfig);
    const renderer = new Renderer(canvas, worldConfig);
    const storage = new StorageManager();

    // 设置系统关联
    player.setTerrainGenerator(generator);
    camera.setTarget(player);
    renderer.setReferences(camera, generator, player);

    // 注册系统
    engine.registerSystem('terrainGenerator', generator);
    engine.registerSystem('player', player);
    engine.registerSystem('camera', camera);
    engine.registerSystem('renderer', renderer);
    engine.registerSystem('storageManager', storage);

    this.test('系统注册', () => {
      return engine.systems.terrainGenerator === generator && 
             engine.systems.player === player && 
             engine.systems.camera === camera && 
             engine.systems.renderer === renderer && 
             engine.systems.storageManager === storage;
    });

    this.test('玩家地形交互', () => {
      // 将玩家放置在固体方块上
      generator.setBlock(0, 100, 1); // 设置草方块
      player.setPosition(0, 100 * worldConfig.BLOCK_SIZE + 50);
      
      // 模拟重力更新
      const keys = {};
      player.update(0.016, keys); // 模拟一帧更新
      
      return true; // 如果没有错误就算通过
    });

    this.test('摄像机跟随玩家', () => {
      player.setPosition(200, 300);
      camera.update(1.0); // 更新1秒
      
      // 检查摄像机是否跟随到玩家附近
      const cameraDist = Math.abs(camera.position.targetX - 200);
      return cameraDist < 50; // 允许一定误差
    });

    this.test('完整游戏状态保存加载', () => {
      // 设置一些状态
      player.setPosition(150, 250);
      camera.setZoom(1.5);
      
      // 创建游戏状态
      const gameState = {
        player: player.exportData(),
        world: { seed: generator.seed },
        camera: camera.exportData(),
        settings: renderer.settings
      };
      
      // 保存和加载
      const saved = storage.saveGameState(gameState);
      const loaded = storage.loadGameState();
      
      return saved && loaded && loaded.player && loaded.world;
    });

    engine.destroy();
  }

  /**
   * 执行单个测试
   */
  test(name, testFn) {
    this.totalTests++;
    
    try {
      const result = testFn();
      
      // 处理异步测试
      if (result instanceof Promise) {
        return result.then(asyncResult => {
          this.addTestResult(name, asyncResult);
          return asyncResult;
        }).catch(error => {
          this.addTestResult(name, false, error.message);
          return false;
        });
      } else {
        this.addTestResult(name, result);
        return result;
      }
    } catch (error) {
      this.addTestResult(name, false, error.message);
      return false;
    }
  }

  /**
   * 添加测试结果
   */
  addTestResult(name, passed, error = null) {
    this.testResults.push({
      name,
      passed,
      error
    });
    
    if (passed) {
      this.passedTests++;
      console.log(`✅ ${name}`);
    } else {
      this.failedTests++;
      console.log(`❌ ${name}${error ? `: ${error}` : ''}`);
    }
  }

  /**
   * 打印测试结果
   */
  printTestResults() {
    console.log('\n📊 测试结果汇总:');
    console.log(`总测试数: ${this.totalTests}`);
    console.log(`通过: ${this.passedTests}`);
    console.log(`失败: ${this.failedTests}`);
    console.log(`成功率: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
    
    if (this.failedTests > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults
        .filter(result => !result.passed)
        .forEach(result => {
          console.log(`  - ${result.name}${result.error ? `: ${result.error}` : ''}`);
        });
    }
  }

  /**
   * 获取测试摘要
   */
  getTestSummary() {
    return {
      total: this.totalTests,
      passed: this.passedTests,
      failed: this.failedTests,
      successRate: (this.passedTests / this.totalTests) * 100,
      results: this.testResults
    };
  }
}

// 导出测试类
export default GameTest;