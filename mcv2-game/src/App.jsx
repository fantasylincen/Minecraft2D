import React, { useEffect, useRef, useState } from 'react';
import './App.css';

// 导入游戏核心模块
import { GameEngine } from './engine/GameEngine.js';
import { blockConfig } from './config/BlockConfig.js';
import { TerrainGenerator } from './world/TerrainGenerator.js';
import { Player } from './player/Player.js';
import { Camera } from './camera/Camera.js';
import { Renderer } from './renderer/Renderer.js';
import { StorageManager } from './storage/StorageManager.js';

function App() {
  const canvasRef = useRef(null);
  const gameEngineRef = useRef(null);
  const [gameStatus, setGameStatus] = useState('loading');
  const [debugInfo, setDebugInfo] = useState(false);
  const [gameStats, setGameStats] = useState({
    fps: 0,
    blocksRendered: 0,
    playerPos: { x: 0, y: 0 }
  });

  useEffect(() => {
    initializeGame();
    
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
      }
    };
  }, []);

  /**
   * 初始化游戏
   */
  const initializeGame = async () => {
    try {
      setGameStatus('initializing');
      const canvas = canvasRef.current;
      
      if (!canvas) {
        throw new Error('Canvas element not found');
      }

      console.log('🎮 开始初始化MCv2游戏...');
      
      // 创建游戏引擎
      const gameEngine = new GameEngine(canvas);
      gameEngineRef.current = gameEngine;
      
      // 初始化游戏引擎
      const success = await gameEngine.initialize();
      if (!success) {
        throw new Error('游戏引擎初始化失败');
      }
      
      // 创建存储管理器
      const storageManager = new StorageManager();
      
      // 创建地形生成器
      const terrainGenerator = new TerrainGenerator(gameEngine.getWorldConfig());
      
      // 创建玩家
      const player = new Player(gameEngine.getWorldConfig());
      player.setTerrainGenerator(terrainGenerator);
      
      // 创建摄像机
      const camera = new Camera(canvas, gameEngine.getWorldConfig());
      camera.setTarget(player);
      
      // 创建渲染器
      const renderer = new Renderer(canvas, gameEngine.getWorldConfig());
      renderer.setReferences(camera, terrainGenerator, player);
      
      // 注册所有子系统到游戏引擎
      gameEngine.registerSystem('terrainGenerator', terrainGenerator);
      gameEngine.registerSystem('player', player);
      gameEngine.registerSystem('camera', camera);
      gameEngine.registerSystem('renderer', renderer);
      gameEngine.registerSystem('storageManager', storageManager);
      
      // 尝试加载保存的游戏数据
      loadGameData(storageManager, player, terrainGenerator, camera);
      
      // 启动游戏循环
      gameEngine.start();
      
      // 设置状态更新定时器
      const statsInterval = setInterval(() => {
        updateGameStats(gameEngine, renderer, player);
      }, 1000);
      
      // 启动自动保存
      storageManager.startAutoSave(() => {
        saveGameData(storageManager, player, terrainGenerator, camera, renderer);
      }, 30000); // 30秒自动保存
      
      setGameStatus('running');
      console.log('🎉 MCv2游戏启动成功！');
      
      // 清理函数
      return () => {
        clearInterval(statsInterval);
        storageManager.stopAutoSave();
      };
      
    } catch (error) {
      console.error('❌ 游戏初始化失败:', error);
      setGameStatus('error');
    }
  };
  
  /**
   * 加载游戏数据
   */
  const loadGameData = (storageManager, player, terrainGenerator, camera) => {
    try {
      const gameState = storageManager.loadGameState();
      
      if (gameState) {
        // 恢复玩家数据
        if (gameState.player) {
          player.importData(gameState.player);
          console.log('✅ 玩家数据已恢复');
        }
        
        // 恢复世界数据
        if (gameState.world && gameState.world.seed) {
          terrainGenerator.seed = gameState.world.seed;
          if (gameState.world.terrainParams) {
            terrainGenerator.terrainParams = { ...terrainGenerator.terrainParams, ...gameState.world.terrainParams };
          }
          console.log('✅ 世界数据已恢复');
        }
        
        // 恢复摄像机位置
        const playerPos = player.getPosition();
        camera.setPosition(playerPos.x, playerPos.y, true);
      }
    } catch (error) {
      console.warn('⚠️  加载游戏数据失败，使用默认设置:', error);
    }
  };
  
  /**
   * 保存游戏数据
   */
  const saveGameData = (storageManager, player, terrainGenerator, camera, renderer) => {
    try {
      const gameState = {
        player: player.exportData(),
        world: {
          seed: terrainGenerator.seed,
          terrainParams: terrainGenerator.terrainParams
        },
        camera: camera.exportData(),
        settings: {
          showDebugInfo: renderer.settings.showDebugInfo,
          showGrid: renderer.settings.showGrid,
          enableParticles: renderer.settings.enableParticles
        }
      };
      
      storageManager.saveGameState(gameState);
    } catch (error) {
      console.error('❌ 保存游戏数据失败:', error);
    }
  };
  
  /**
   * 更新游戏统计信息
   */
  const updateGameStats = (gameEngine, renderer, player) => {
    if (gameEngine && renderer && player) {
      const stats = renderer.getStats();
      const playerPos = player.getPosition();
      
      setGameStats({
        fps: stats.fps,
        blocksRendered: stats.blocksRendered,
        playerPos: {
          x: Math.round(playerPos.x),
          y: Math.round(playerPos.y)
        }
      });
    }
  };
  
  /**
   * 切换调试信息
   */
  const toggleDebugInfo = () => {
    if (gameEngineRef.current) {
      const renderer = gameEngineRef.current.systems.renderer;
      if (renderer) {
        renderer.toggleDebugInfo();
        setDebugInfo(!debugInfo);
      }
    }
  };
  
  /**
   * 手动保存游戏
   */
  const saveGame = () => {
    if (gameEngineRef.current) {
      const { storageManager, player, terrainGenerator, camera, renderer } = gameEngineRef.current.systems;
      if (storageManager) {
        saveGameData(storageManager, player, terrainGenerator, camera, renderer);
        alert('游戏已保存！');
      }
    }
  };
  
  /**
   * 重新生成世界
   */
  const regenerateWorld = () => {
    if (gameEngineRef.current) {
      const { terrainGenerator, player } = gameEngineRef.current.systems;
      if (terrainGenerator && player) {
        terrainGenerator.regenerate();
        player.respawn();
        console.log('🌍 世界已重新生成');
      }
    }
  };

  // 渲染加载状态
  if (gameStatus === 'loading' || gameStatus === 'initializing') {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h1>MCv2 - 2D Minecraft</h1>
          <div className="loading-spinner"></div>
          <p>{gameStatus === 'loading' ? '正在加载...' : '正在初始化游戏引擎...'}</p>
        </div>
      </div>
    );
  }
  
  // 渲染错误状态
  if (gameStatus === 'error') {
    return (
      <div className="error-screen">
        <div className="error-content">
          <h1>游戏启动失败</h1>
          <p>抱歉，游戏无法正常启动。请刷新页面重试。</p>
          <button onClick={() => window.location.reload()}>重新加载</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* 游戏画布 */}
      <canvas
        ref={canvasRef}
        className="game-canvas"
        tabIndex={0}
      />
      
      {/* 游戏UI */}
      <div className="game-ui">
        {/* 顶部状态栏 */}
        <div className="top-bar">
          <div className="game-title">
            <h2>MCv2 - 2D Minecraft</h2>
            <span className="version">v1.0.0</span>
          </div>
          
          <div className="game-stats">
            <span>FPS: {gameStats.fps}</span>
            <span>方块: {gameStats.blocksRendered}</span>
            <span>位置: ({gameStats.playerPos.x}, {gameStats.playerPos.y})</span>
          </div>
        </div>
        
        {/* 控制面板 */}
        <div className="control-panel">
          <button onClick={toggleDebugInfo}>
            {debugInfo ? '隐藏调试信息' : '显示调试信息'}
          </button>
          <button onClick={saveGame}>保存游戏</button>
          <button onClick={regenerateWorld}>重新生成世界</button>
        </div>
        
        {/* 控制说明 */}
        <div className="controls-help">
          <h3>控制说明:</h3>
          <ul>
            <li><strong>WASD / 方向键:</strong> 移动</li>
            <li><strong>空格键:</strong> 跳跃</li>
            <li><strong>ESC:</strong> 暂停/继续</li>
            <li><strong>F3:</strong> 切换调试信息</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
