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
import { ConfigPanel } from './ui/ConfigPanel.js';
import DebugConsole from './ui/DebugConsole.jsx';
import { gameConfig } from './config/GameConfig.js';

function App() {
  const canvasRef = useRef(null);
  const gameEngineRef = useRef(null);
  const configPanelRef = useRef(null);
  const [gameStatus, setGameStatus] = useState('loading');
  const [debugInfo, setDebugInfo] = useState(false);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [gameStats, setGameStats] = useState({
    fps: 0,
    blocksRendered: 0,
    playerPos: { x: 0, y: 0 },
    isFlying: false,
    flySpeed: 100
  });
  const [showControlsHelp, setShowControlsHelp] = useState(false); // 控制说明默认隐藏 (TODO #21)

  useEffect(() => {
    let mounted = true;
    
    // 确保Canvas元素已经准备好后再初始化游戏
    const initGame = async () => {
      // 等待DOM完全渲染
      await new Promise(resolve => setTimeout(resolve, 150));
      
      if (!mounted) return;
      
      // 检查Canvas是否准备好
      let retryCount = 0;
      const maxRetries = 15;
      
      const checkCanvasAndInit = async () => {
        if (!mounted) return;
        
        const canvas = canvasRef.current;
        console.log(`🔍 检查Canvas状态 (尝试 ${retryCount + 1}/${maxRetries + 1}):`, {
          canvasExists: !!canvas,
          canvasParent: canvas?.parentElement?.tagName,
          canvasSize: canvas ? `${canvas.offsetWidth}x${canvas.offsetHeight}` : 'N/A',
          hasGetContext: canvas ? !!canvas.getContext : false
        });
        
        if (canvas && canvas.getContext && canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
          try {
            // 测试Canvas是否真正可用
            const testCtx = canvas.getContext('2d');
            if (testCtx) {
              console.log('✅ Canvas元素已就绪，开始初始化游戏');
              await initializeGame();
              return;
            }
          } catch (error) {
            console.warn('⚠️ Canvas getContext测试失败:', error);
          }
        }
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`⏳ Canvas未准备好，${300}ms后重试...`);
          setTimeout(checkCanvasAndInit, 300);
        } else {
          console.error('❌ Canvas元素未能在预期时间内准备好');
          if (mounted) {
            setGameStatus('error');
          }
        }
      };
      
      checkCanvasAndInit();
    };
    
    initGame();
    
    return () => {
      mounted = false;
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
        throw new Error('Canvas element not found - DOM may not be ready');
      }
      
      // 检查Canvas的基本属性
      if (!canvas.getContext) {
        throw new Error('Canvas does not support getContext method');
      }
      
      // 确保Canvas有正确的尺寸
      if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
        throw new Error(`Canvas has invalid size: ${canvas.offsetWidth}x${canvas.offsetHeight}`);
      }
      
      // 测试2D上下文是否可用
      const testCtx = canvas.getContext('2d');
      if (!testCtx) {
        throw new Error('Failed to get 2D rendering context');
      }

      console.log('🎮 开始初始化MCv2游戏...');
      console.log('Canvas element:', canvas);
      console.log('Canvas size:', canvas.offsetWidth, 'x', canvas.offsetHeight);
      
      // 创建游戏引擎
      console.log('创建游戏引擎...');
      const gameEngine = new GameEngine(canvas);
      gameEngineRef.current = gameEngine;
      
      // 初始化游戏引擎
      console.log('初始化游戏引擎...');
      const success = await gameEngine.initialize();
      if (!success) {
        throw new Error('游戏引擎初始化失败');
      }
      console.log('✅ 游戏引擎初始化成功');
      
      // 创建存储管理器
      console.log('创建存储管理器...');
      const storageManager = new StorageManager();
      
      // 创建地形生成器
      console.log('创建地形生成器...');
      const terrainGenerator = new TerrainGenerator(gameEngine.getWorldConfig());
      
      // 创建玩家
      console.log('创建玩家...');
      const player = new Player(gameEngine.getWorldConfig());
      player.setTerrainGenerator(terrainGenerator);
      
      // 创建摄像机
      console.log('创建摄像机...');
      const camera = new Camera(canvas, gameEngine.getWorldConfig());
      camera.setTarget(player);
      
      // 创建渲染器
      console.log('创建渲染器...');
      const renderer = new Renderer(canvas, gameEngine.getWorldConfig());
      renderer.setReferences(camera, terrainGenerator, player);
      
      // 注册所有子系统到游戏引擎
      console.log('注册子系统...');
      gameEngine.registerSystem('terrainGenerator', terrainGenerator);
      gameEngine.registerSystem('player', player);
      gameEngine.registerSystem('camera', camera);
      gameEngine.registerSystem('renderer', renderer);
      gameEngine.registerSystem('storageManager', storageManager);
      
      console.log('✅ 所有子系统注册完成');
      
      // 尝试加载保存的游戏数据
      console.log('加载游戏数据...');
      try {
        loadGameData(storageManager, player, terrainGenerator, camera);
      } catch (loadError) {
        console.warn('⚠️ 加载游戏数据失败，使用默认设置:', loadError);
      }
      
      // 启动游戏循环
      console.log('启动游戏循环...');
      
      // 从配置中设置目标帧率 (TODO #23)
      const targetFPS = gameConfig.get('performance', 'targetFPS') || 60;
      gameEngine.setTargetFPS(targetFPS);
      
      gameEngine.start();
      
      // 设置状态更新定时器
      const statsInterval = setInterval(() => {
        updateGameStats(gameEngine, renderer, player);
      }, 1000);
      
      // 启动自动保存
      console.log('启动自动保存...');
      storageManager.startAutoSave(() => {
        saveGameData(storageManager, player, terrainGenerator, camera, renderer);
      }, 30000); // 30秒自动保存
      
      // 初始化配置面板
      console.log('初始化配置面板...');
      const configPanel = new ConfigPanel();
      configPanelRef.current = configPanel;
      
      // 为配置面板提供游戏引擎访问权限 (TODO #15)
      configPanel.gameEngine = gameEngine;
      window.gameEngine = gameEngine; // 全局访问
      
      // 设置配置变更回调 (TODO #23)
      configPanel.onUpdate('performance', 'targetFPS', (value) => {
        gameEngine.setTargetFPS(value);
        console.log(`🎮 目标帧率更新为: ${value} FPS`);
      });
      
      // 设置配置变更回调
      configPanel.onUpdate('cave', 'coveragePercentage', (value) => {
        console.log(`🕳️ 洞穴覆盖率更新为: ${value}%`);
      });
      
      configPanel.onUpdate('cave', 'initialCaveChance', (value) => {
        console.log(`🕳️ 洞穴初始概率更新为: ${value}`);
      });
      
      console.log('✅ 配置面板初始化完成');
      
      setGameStatus('running');
      console.log('🎉 MCv2游戏启动成功！');
      
      // 清理函数
      return () => {
        clearInterval(statsInterval);
        storageManager.stopAutoSave();
      };
      
    } catch (error) {
      console.error('❌ 游戏初始化失败:', error);
      console.error('错误堆栈:', error.stack);
      setGameStatus('error');
      
      // 显示更详细的错误信息
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        canvas: canvasRef.current ? 'Available' : 'Not found',
        canvasReady: canvasRef.current && canvasRef.current.getContext ? 'Ready' : 'Not ready',
        localStorage: typeof localStorage !== 'undefined' ? 'Available' : 'Not available',
        timestamp: new Date().toISOString()
      };
      console.error('错误详情:', errorDetails);
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
   * 更新游戏统计信息 (TODO #17: 添加时间信息)
   */
  const updateGameStats = (gameEngine, renderer, player) => {
    if (gameEngine && renderer && player) {
      const stats = renderer.getStats();
      const playerPos = player.getPosition();
      const playerStatus = player.getStatus();
      
      // 将像素坐标转换为世界方块坐标系 (TODO #22)
      const worldConfig = gameEngine.getWorldConfig();
      const blockSize = worldConfig.BLOCK_SIZE;
      
      // 获取时间信息 (TODO #17)
      const timeInfo = gameEngine.getTimeInfo();
      
      setGameStats({
        fps: stats.fps,
        blocksRendered: stats.blocksRendered,
        playerPos: {
          x: Math.round(playerPos.x / blockSize * 10) / 10, // 保留一位小数
          y: Math.round(playerPos.y / blockSize * 10) / 10  // 保留一位小数
        },
        isFlying: playerStatus.isFlying,
        flySpeed: playerStatus.flySpeed || 100,
        health: playerStatus.health || 100,      // 生命值 (TODO #18)
        maxHealth: playerStatus.maxHealth || 100, // 最大生命值
        // 时间信息 (TODO #17)
        timeString: timeInfo.timeString,
        timePhase: timeInfo.phase,
        timeOfDay: timeInfo.timeOfDay
      });
    }
  };
  
  /**
   * 切换调试信息和调试控制台
   * Author: MCv2 Development Team
   */
  const toggleDebugInfo = () => {
    if (gameEngineRef.current) {
      const renderer = gameEngineRef.current.systems.renderer;
      if (renderer) {
        // 切换调试信息显示
        renderer.toggleDebugInfo();
        setDebugInfo(!debugInfo);
        
        // 同时切换调试控制台显示
        renderer.setDebugConsoleVisible(!debugInfo);
        setShowDebugConsole(!debugInfo);
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
  
  /**
   * 打开配置管理面板
   */
  const openConfigPanel = () => {
    if (configPanelRef.current) {
      configPanelRef.current.show();
    }
  };
  
  /**
   * 切换配置管理面板
   */
  const toggleConfigPanel = () => {
    if (configPanelRef.current) {
      configPanelRef.current.toggle();
    }
  };
  
  /**
   * 切换控制说明显示
   */
  const toggleControlsHelp = () => {
    setShowControlsHelp(!showControlsHelp);
  };
  
  /**
   * 调节帧率 (TODO #30)
   * Author: MCv2 Development Team
   */
  const adjustFPS = (delta) => {
    if (gameEngineRef.current && configPanelRef.current?.gameConfig) {
      const gameConfig = configPanelRef.current.gameConfig;
      const currentFPS = gameConfig.get('performance', 'targetFPS') || 60;
      const newFPS = Math.max(10, Math.min(120, currentFPS + delta));
      
      // 限制步长为5的倍数
      const adjustedFPS = Math.round(newFPS / 5) * 5;
      
      gameConfig.set('performance', 'targetFPS', adjustedFPS);
      gameEngineRef.current.setTargetFPS(adjustedFPS);
      
      console.log(`🎯 帧率调节: ${adjustedFPS} FPS`);
    }
  };
  
  /**
   * 调节时间 (TODO #17)
   * Author: MCv2 Development Team
   */
  const adjustTime = (delta) => {
    if (gameEngineRef.current) {
      const currentTime = gameEngineRef.current.timeSystem.timeOfDay;
      const newTime = Math.max(0, Math.min(1, currentTime + delta));
      
      gameEngineRef.current.setTimeOfDay(newTime);
    }
  };
  
  /**
   * 调节时间速度 (TODO #17)
   * Author: MCv2 Development Team
   */
  const adjustTimeSpeed = (delta) => {
    if (gameEngineRef.current) {
      const currentSpeed = gameEngineRef.current.timeSystem.timeSpeed;
      const newSpeed = Math.max(0.1, Math.min(5, currentSpeed + delta));
      
      gameEngineRef.current.setTimeSpeed(newSpeed);
    }
  };
  
  /**
   * 切换时间系统状态 (TODO #17)
   * Author: MCv2 Development Team
   */
  const toggleTimeSystem = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.toggleTimeSystem();
    }
  };
  
  // 键盘事件监听，处理H键切换控制说明、F3键切换调试信息和帧率调节键
  useEffect(() => {
    const handleKeyPress = (event) => {
      // H键切换控制说明
      if (event.key === 'h' || event.key === 'H') {
        event.preventDefault();
        toggleControlsHelp();
      }
      // F3键切换调试信息和调试控制台
      else if (event.key === 'F3') {
        event.preventDefault();
        toggleDebugInfo();
      }
      // [ 键降低帧率 (TODO #30)
      else if (event.key === '[') {
        event.preventDefault();
        adjustFPS(-5); // 每次降低5帧
      }
      // ] 键提高帧率 (TODO #30)
      else if (event.key === ']') {
        event.preventDefault();
        adjustFPS(5); // 每次提高5帧
      }
      // T 键切换时间系统 (TODO #17)
      else if (event.key === 't' || event.key === 'T') {
        event.preventDefault();
        toggleTimeSystem();
      }
      // , 键降低时间速度 (TODO #17)
      else if (event.key === ',') {
        event.preventDefault();
        adjustTimeSpeed(-0.2);
      }
      // . 键提高时间速度 (TODO #17)
      else if (event.key === '.') {
        event.preventDefault();
        adjustTimeSpeed(0.2);
      }
      // < 键向前调节时间 (TODO #17)
      else if (event.key === '<') {
        event.preventDefault();
        adjustTime(-0.05); // 向前1.2小时
      }
      // > 键向后调节时间 (TODO #17)
      else if (event.key === '>') {
        event.preventDefault();
        adjustTime(0.05); // 向后1.2小时
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [showControlsHelp, debugInfo]);

  // 渲染加载状态
  if (gameStatus === 'loading' || gameStatus === 'initializing') {
    return (
      <div className="game-container">
        {/* 游戏画布 - 在加载时也要渲染 */}
        <canvas
          ref={canvasRef}
          className="game-canvas"
          width={800}
          height={600}
          tabIndex={0}
          style={{
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            background: '#222' // 加载时显示深色背景
          }}
        />
        
        {/* 加载覆盖层 */}
        <div className="loading-screen" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white'
        }}>
          <div className="loading-content">
            <h1>MCv2 - 2D Minecraft</h1>
            <div className="loading-spinner"></div>
            <p>{gameStatus === 'loading' ? '正在加载...' : '正在初始化游戏引擎...'}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // 渲染错误状态
  if (gameStatus === 'error') {
    return (
      <div className="game-container">
        {/* 游戏画布 - 错误时也保留 */}
        <canvas
          ref={canvasRef}
          className="game-canvas"
          width={800}
          height={600}
          tabIndex={0}
          style={{
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            background: '#333'
          }}
        />
        
        {/* 错误覆盖层 */}
        <div className="error-screen" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white'
        }}>
          <div className="error-content">
            <h1>游戏启动失败</h1>
            <p>抱歉，游戏无法正常启动。请检查浏览器控制台获取详细错误信息。</p>
            <div style={{ margin: '20px 0', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
              <h3>可能的解决方案：</h3>
              <ul style={{ textAlign: 'left', marginTop: '10px' }}>
                <li>确保使用现代浏览器（支持ES6模块）</li>
                <li>检查浏览器控制台的错误信息</li>
                <li>尝试刷新页面重新加载</li>
                <li>确保JavaScript已启用</li>
                <li>检查网络连接</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => window.location.reload()}>重新加载</button>
              <button onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}>清除数据并重新加载</button>
            </div>
            <p style={{ marginTop: '20px', fontSize: '14px', opacity: '0.8' }}>
              如果问题持续存在，请打开浏览器开发者工具查看控制台错误信息。
            </p>
          </div>
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
        width={800}
        height={600}
        tabIndex={0}
        style={{
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
      />
      
      {/* 游戏UI */}
      <div className="game-ui">
        {/* 顶部状态栏 */}
        <div className="top-bar">
          <div className="game-title">
            <h2>MCv2 - 2D Minecraft</h2>
            <span className="version">v1.0.0</span>
          </div>
          
          {/* 游戏状态信息 - 右上角 (TODO #27) */}
          <div className="game-stats">
            <span>FPS: {gameStats.fps}</span>
            <span>方块: {gameStats.blocksRendered}</span>
            <span>位置: ({gameStats.playerPos.x}, {gameStats.playerPos.y})</span>
            <span style={{ color: gameStats.health <= 25 ? '#ff4757' : gameStats.health <= 50 ? '#ffa502' : '#2ed573' }}>
              ❤️ {Math.round(gameStats.health)}/{gameStats.maxHealth}
            </span>
            {gameStats.isFlying && (
              <span style={{ color: '#87CEEB', fontWeight: 'bold' }}>
                ✈️ 飞行: {gameStats.flySpeed}%
              </span>
            )}
            {/* 时间信息 (TODO #17) */}
            <span style={{ color: '#FFD700', fontWeight: 'bold' }}>
              🕰️ {gameStats.timeString} {gameStats.timePhase}
            </span>
          </div>
        </div>
        
        {/* 左下角控制区域 */}
        <div className="left-control-area">
          {/* 控制面板 - 移动到左下角，2排布局 */}
          <div className="control-panel">
            {/* 第一排: 3个主要功能按钮 */}
            <div className="control-panel-row1">
              <button onClick={toggleDebugInfo}>
                {debugInfo ? '隐藏调试信息' : '显示调试信息'}
              </button>
              <button onClick={saveGame}>保存游戏</button>
              <button onClick={regenerateWorld}>重新生成世界</button>
            </div>
            
            {/* 第二排: 配置和控制说明按钮 */}
            <div className="control-panel-row2">
              <button 
                onClick={toggleConfigPanel}
                className="config-panel-btn"
              >
                ⚙️ 游戏配置
              </button>
              
              {/* 控制说明按钮（始终显示，但改为切换按钮） */}
              <button 
                className="show-controls-btn"
                onClick={toggleControlsHelp}
                title={showControlsHelp ? '隐藏控制说明 (H键)' : '显示控制说明 (H键)'}
              >
                🎮 {showControlsHelp ? '隐藏控制' : '控制说明'}
              </button>
            </div>
          </div>
        </div>
        
        {/* 控制说明 */}
        {showControlsHelp && (
          <div className="controls-help">
            <div className="controls-help-header">
              <h3>控制说明:</h3>
              <button 
                className="controls-help-toggle"
                onClick={toggleControlsHelp}
                title="隐藏控制说明 (H键)"
              >
                ✖
              </button>
            </div>
            <ul>
              <li><strong>WASD / 方向键:</strong> 移动</li>
              <li><strong>空格键:</strong> 跳跃 (正常模式)</li>
              <li><strong>F键:</strong> 切换飞行模式</li>
              <li><strong>W/S:</strong> 上下飞行 (飞行模式)</li>
              <li><strong>+/-键:</strong> 调节飞行速度</li>
              <li><strong>ESC:</strong> 暂停/继续</li>
              <li><strong>F3:</strong> 切换调试信息</li>
              <li><strong>F2:</strong> 打开/关闭配置面板</li>
              <li><strong>H键:</strong> 显示/隐藏控制说明</li>
              <li><strong>T键:</strong> 切换时间系统开关</li>
              <li><strong>,/.键:</strong> 减慢/加快时间流逝速度</li>
              <li><strong>&lt;/&gt;键:</strong> 向前/向后调节时间</li>
              <li><strong>[/]:</strong> 降低/提高帧率</li>
            </ul>
            <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(135, 206, 235, 0.2)', borderRadius: '4px', border: '1px solid #87CEEB' }}>
              <strong style={{ color: '#87CEEB' }}>飞行模式:</strong>
              <br />在飞行模式下，玩家变为天空蓝色，可以全方向快速飞行，不受重力和地形碰撞影响。
              <br /><strong>速度调节:</strong> 使用+/-键可在100%-1000%之间调节飞行速度。
            </div>
          </div>
        )}

        {/* 调试控制台 */}
        <DebugConsole 
          gameEngine={gameEngineRef.current}
          isVisible={showDebugConsole}
          onToggleVisible={toggleDebugInfo}
          onSaveGame={saveGame}
        />
      </div>
    </div>
  );
}

export default App;
