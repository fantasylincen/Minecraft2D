import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './engine/GameEngine.js';
import { Player } from './player/Player.js';
import { Camera } from './camera/Camera.js';
import { Renderer } from './renderer/Renderer.js';
import { TerrainGenerator } from './world/TerrainGenerator.js';
import { StorageManager } from './storage/StorageManager.js';
import { HealthBar } from './ui/HealthBar.jsx';
import { InventoryController } from './ui/InventoryUI.jsx';
import CraftingTableUI from './ui/CraftingTableUI.jsx';
import FurnaceUI from './ui/FurnaceUI.jsx';
import { ErrorLogViewer } from './ui/ErrorLogViewer.jsx';
import DebugConsole from './ui/DebugConsole.jsx';
import { GameConfig, gameConfig } from './config/GameConfig.js';
import { ConfigPanel } from './ui/ConfigPanel.js';
import errorLogger from './utils/ErrorLogger.js';
import { inputManager } from './input/InputManager.js'; // 新增导入
import './ui/UIAnimations.css';

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
  const [showControlsHelp, setShowControlsHelp] = useState(false);
  const [showErrorLog, setShowErrorLog] = useState(false);
  // 添加制作台界面显示状态
  const [showCraftingTable, setShowCraftingTable] = useState(false);
  // 添加当前制作台引用
  const [currentCraftingTable, setCurrentCraftingTable] = useState(null);
  // 添加熔炉界面显示状态 (新增)
  const [showFurnace, setShowFurnace] = useState(false);
  // 添加当前熔炉引用 (新增)
  const [currentFurnace, setCurrentFurnace] = useState(null);
  // 添加玩家背包引用
  const [playerInventory, setPlayerInventory] = useState(null);
  // 添加状态来控制各个界面元素的显示，默认全部显示
  const [uiVisibility, setUiVisibility] = useState({
    controlsHelp: true,
    debugConsole: true,
    configPanel: true,
    errorLog: true,
    inventory: true,
    healthBar: true,
    topBar: true
  });
  // 添加主题状态管理
  const [uiTheme, setUiTheme] = useState({
    theme: 'default',
    primaryColor: '#4CAF50',
    backgroundColor: 'rgba(0,0,0,0.7)',
    textColor: '#ffffff',
    borderColor: 'rgba(255,255,255,0.3)'
  });
  // 添加UI动画控制状态
  const [uiAnimations, setUiAnimations] = useState({
    topBar: 'slideInBottom',
    controlPanel: 'slideInLeft',
    debugConsole: 'slideInRight',
    healthBar: 'fadeIn',
    inventory: 'fadeIn'
  });
  const [showUiControlPanel, setShowUiControlPanel] = useState(false);
  
  // UI动画控制函数
  const triggerUiAnimation = (element, animation) => {
    setUiAnimations(prev => ({
      ...prev,
      [element]: animation
    }));
    
    // 动画结束后重置状态
    if (animation === 'fadeOut') {
      setTimeout(() => {
        setUiAnimations(prev => ({
          ...prev,
          [element]: 'fadeIn'
        }));
      }, 300);
    }
  };
  
  // 切换UI元素显示/隐藏时触发动画
  const toggleUiElement = (element) => {
    setUiVisibility(prev => {
      const newVisibility = { ...prev, [element]: !prev[element] };
      
      // 触发动画
      if (newVisibility[element]) {
        triggerUiAnimation(element, 'fadeIn');
      } else {
        triggerUiAnimation(element, 'fadeOut');
      }
      
      return newVisibility;
    });
  };
  
  useEffect(() => {
    let mounted = true;
    
    // 初始化错误日志记录器
    errorLogger.init();
    
    // 添加制作台界面打开事件监听器
    const handleOpenCraftingTable = (event) => {
      const { craftingTable, playerInventory } = event.detail;
      setCurrentCraftingTable(craftingTable);
      setPlayerInventory(playerInventory);
      setShowCraftingTable(true);
      
      // 设置输入管理器上下文为制作台
      inputManager.setActiveContext('crafting');
    };
    
    // 添加熔炉界面打开事件监听器 (新增)
    const handleOpenFurnace = (event) => {
      const { furnace, playerInventory } = event.detail;
      setCurrentFurnace(furnace);
      setPlayerInventory(playerInventory);
      setShowFurnace(true);
      
      // 设置输入管理器上下文为熔炉
      inputManager.setActiveContext('furnace');
    };
    
    // 添加显示错误日志事件监听器
    const handleShowErrorLog = () => {
      setShowErrorLog(true);
    };
    
    window.addEventListener('openCraftingTable', handleOpenCraftingTable);
    window.addEventListener('openFurnace', handleOpenFurnace); // 新增
    window.addEventListener('showErrorLog', handleShowErrorLog);
    
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
      window.removeEventListener('openCraftingTable', handleOpenCraftingTable);
      window.removeEventListener('openFurnace', handleOpenFurnace); // 新增
      window.removeEventListener('showErrorLog', handleShowErrorLog);
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

      console.log('🎮 开始初始化Minecraft2D游戏...');
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
      
      // 设置状态更新定时器 (提高频率以获得更稳定的时间显示)
      const statsInterval = setInterval(() => {
        updateGameStats(gameEngine, renderer, player);
      }, 2000); // 改为2秒更新一次，与Renderer.js中的FPS计算频率一致
      
      // 启动自动保存
      console.log('启动自动保存...');
      storageManager.startAutoSave(() => {
        saveGameData(storageManager, player, terrainGenerator, camera, renderer);
      }, 30000); // 30秒自动保存
      
      // 初始化配置面板
      console.log('初始化配置面板...');
      const configPanel = new ConfigPanel('config-panel', gameEngine); // 传入游戏引擎实例
      configPanel.gameConfig = gameConfig;
      configPanelRef.current = configPanel;
      
      // 为配置面板提供游戏引擎访问权限 (TODO #15)
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
      
      // 添加时间系统配置变更回调
      configPanel.onUpdate('time', 'eternalDay', (value) => {
        if (gameEngine) {
          gameEngine.setEternalDay(value);
          console.log(`☀️ 永久白日模式${value ? '启用' : '禁用'}`);
        }
      });
      
      configPanel.onUpdate('time', 'timeSpeed', (value) => {
        if (gameEngine) {
          gameEngine.setTimeSpeed(value);
          console.log(`⏱️ 时间速度更新为: ${value}x`);
        }
      });
      
      configPanel.onUpdate('time', 'dayDuration', (value) => {
        if (gameEngine) {
          gameEngine.setDayDuration(value);
          console.log(`🌅 一天时长更新为: ${value}秒`);
        }
      });
      
      // 添加UI主题配置变更回调
      configPanel.onUpdate('uiTheme', 'theme', (value) => {
        updateUiTheme({ theme: value });
        console.log(`🎨 UI主题更新为: ${value}`);
      });
      
      configPanel.onUpdate('uiTheme', 'primaryColor', (value) => {
        updateUiTheme({ primaryColor: value });
        console.log(`🎨 主色调更新为: ${value}`);
      });
      
      configPanel.onUpdate('uiTheme', 'backgroundColor', (value) => {
        updateUiTheme({ backgroundColor: value });
        console.log(`🎨 背景颜色更新为: ${value}`);
      });
      
      configPanel.onUpdate('uiTheme', 'textColor', (value) => {
        updateUiTheme({ textColor: value });
        console.log(`🎨 文字颜色更新为: ${value}`);
      });
      
      configPanel.onUpdate('uiTheme', 'borderColor', (value) => {
        updateUiTheme({ borderColor: value });
        console.log(`🎨 边框颜色更新为: ${value}`);
      });
      
      console.log('✅ 配置面板初始化完成');
      
      setGameStatus('running');
      console.log('🎉 Minecraft2D游戏启动成功！');
      
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
   * 更新UI主题
   */
  const updateUiTheme = (newTheme) => {
    setUiTheme(prevTheme => {
      const updatedTheme = { ...prevTheme, ...newTheme };
      
      // 应用主题到CSS变量
      const root = document.documentElement;
      root.style.setProperty('--ui-primary-color', updatedTheme.primaryColor);
      root.style.setProperty('--ui-background-color', updatedTheme.backgroundColor);
      root.style.setProperty('--ui-text-color', updatedTheme.textColor);
      root.style.setProperty('--ui-border-color', updatedTheme.borderColor);
      
      // 如果是预设主题，应用预设颜色
      if (updatedTheme.theme !== 'default') {
        applyPresetTheme(updatedTheme.theme);
      }
      
      return updatedTheme;
    });
  };
  
  /**
   * 应用预设主题
   */
  const applyPresetTheme = (theme) => {
    const root = document.documentElement;
    
    // 预设主题颜色
    const themes = {
      dark: {
        primary: '#4CAF50',
        background: 'rgba(0,0,0,0.7)',
        text: '#ffffff',
        border: 'rgba(255,255,255,0.3)'
      },
      light: {
        primary: '#4CAF50',
        background: 'rgba(255,255,255,0.7)',
        text: '#000000',
        border: 'rgba(0,0,0,0.3)'
      },
      green: {
        primary: '#4CAF50',
        background: 'rgba(25, 100, 25, 0.7)',
        text: '#ffffff',
        border: 'rgba(100, 200, 100, 0.5)'
      },
      blue: {
        primary: '#2196F3',
        background: 'rgba(25, 25, 100, 0.7)',
        text: '#ffffff',
        border: 'rgba(100, 100, 200, 0.5)'
      },
      purple: {
        primary: '#9C27B0',
        background: 'rgba(75, 25, 100, 0.7)',
        text: '#ffffff',
        border: 'rgba(150, 100, 200, 0.5)'
      }
    };
    
    if (themes[theme]) {
      root.style.setProperty('--ui-primary-color', themes[theme].primary);
      root.style.setProperty('--ui-background-color', themes[theme].background);
      root.style.setProperty('--ui-text-color', themes[theme].text);
      root.style.setProperty('--ui-border-color', themes[theme].border);
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
      
      // 获取天气信息
      const weatherInfo = gameEngine.getWeatherInfo();
      
      // 获取季节信息
      const seasonInfo = gameEngine.getSeasonInfo();
      
      // 获取实体统计信息
      let entityStats = { total: 0, byType: {} };
      if (gameEngine.entityManager) {
        entityStats = gameEngine.entityManager.getStats();
      }
      
      setGameStats(prevStats => ({
        ...prevStats,
        fps: stats.fps,
        blocksRendered: stats.blocksRendered,
        playerPos: {
          x: Math.floor(playerPos.x / blockSize), // 转换为方块索引坐标，无小数
          y: Math.floor(playerPos.y / blockSize)  // 转换为方块索引坐标，无小数
        },
        isFlying: playerStatus.isFlying,
        flySpeed: playerStatus.flySpeed || 100,
        health: playerStatus.health || 100,      // 生命值 (TODO #18)
        maxHealth: playerStatus.maxHealth || 100, // 最大生命值
        hunger: playerStatus.hunger || 20,       // 饥饿值
        maxHunger: playerStatus.maxHunger || 20, // 最大饥饿值
        // 时间信息 (TODO #17)
        timeString: timeInfo.timeString,
        timePhase: timeInfo.phase,
        timeOfDay: timeInfo.timeOfDay,
        // 天气信息
        weather: weatherInfo.currentWeather,
        weatherIntensity: weatherInfo.weatherIntensity,
        // 季节信息
        season: seasonInfo.currentSeason,
        dayOfYear: Math.floor(seasonInfo.dayOfYear),
        // 实体信息
        entities: entityStats.total,
        entitiesByType: entityStats.byType
      }));
    }
  };
  
  /**
   * 切换调试信息和调试控制台
   * Author: Minecraft2D Development Team
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
   * Author: Minecraft2D Development Team
   */
  const adjustFPS = (delta) => {
    if (gameEngineRef.current) {
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
   * Author: Minecraft2D Development Team
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
   * Author: Minecraft2D Development Team
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
   * Author: Minecraft2D Development Team
   */
  const toggleTimeSystem = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.toggleTimeSystem();
    }
  };
  
  /**
   * 切换天气系统状态
   */
  const toggleWeatherSystem = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.toggleWeatherSystem();
    }
  };
  
  /**
   * 切换季节系统状态
   */
  const toggleSeasonSystem = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.toggleSeasonSystem();
    }
  };
  
  /**
   * 切换错误日志查看器显示
   */
  const toggleErrorLog = () => {
    setShowErrorLog(!showErrorLog);
  };
  
  // 键盘事件监听，处理H键切换控制说明、F3键切换调试信息和帧率调节键
  useEffect(() => {
    // 注册UI控制按键处理函数
    const registerUIKeyHandlers = () => {
      // H键切换控制说明
      inputManager.registerKeyHandler('KeyH', (event) => {
        event.preventDefault();
        toggleControlsHelp();
      }, 'ui', 0);
      
      // F1键切换界面控制面板
      inputManager.registerKeyHandler('F1', (event) => {
        event.preventDefault();
        setShowUiControlPanel(!showUiControlPanel);
      }, 'ui', 0);
      
      // F3键切换调试信息和调试控制台
      inputManager.registerKeyHandler('F3', (event) => {
        event.preventDefault();
        toggleDebugInfo();
      }, 'ui', 0);
      
      // [ 键降低帧率 (TODO #30)
      inputManager.registerKeyHandler('BracketLeft', (event) => {
        event.preventDefault();
        adjustFPS(-5); // 每次降低5帧
      }, 'ui', 0);
      
      // ] 键提高帧率 (TODO #30)
      inputManager.registerKeyHandler('BracketRight', (event) => {
        event.preventDefault();
        adjustFPS(5); // 每次提高5帧
      }, 'ui', 0);
      
      // T 键切换时间系统 (TODO #17)
      inputManager.registerKeyHandler('KeyT', (event) => {
        event.preventDefault();
        toggleTimeSystem();
      }, 'ui', 0);
      
      // W 键切换天气系统
      inputManager.registerKeyHandler('KeyW', (event) => {
        event.preventDefault();
        toggleWeatherSystem();
      }, 'ui', 0);
      
      // S 键切换季节系统
      inputManager.registerKeyHandler('KeyS', (event) => {
        event.preventDefault();
        toggleSeasonSystem();
      }, 'ui', 0);
      
      // , 键降低时间速度 (TODO #17)
      inputManager.registerKeyHandler('Comma', (event) => {
        event.preventDefault();
        adjustTimeSpeed(-0.2);
      }, 'ui', 0);
      
      // . 键提高时间速度 (TODO #17)
      inputManager.registerKeyHandler('Period', (event) => {
        event.preventDefault();
        adjustTimeSpeed(0.2);
      }, 'ui', 0);
      
      // < 键向前调节时间 (TODO #17)
      inputManager.registerKeyHandler('ShiftLeft', (event) => {
        // 需要检查是否同时按下了逗号键
        if (inputManager.isKeyPressed('Comma')) {
          event.preventDefault();
          adjustTime(-0.05); // 向前1.2小时
        }
      }, 'ui', 0);
      
      // > 键向后调节时间 (TODO #17)
      inputManager.registerKeyHandler('ShiftRight', (event) => {
        // 需要检查是否同时按下了句号键
        if (inputManager.isKeyPressed('Period')) {
          event.preventDefault();
          adjustTime(0.05); // 向后1.2小时
        }
      }, 'ui', 0);
    };
    
    registerUIKeyHandlers();
    
    // 清理函数
    return () => {
      // 这里可以添加清理逻辑，但目前inputManager没有提供注销所有处理器的方法
    };
  }, [showControlsHelp, debugInfo, showUiControlPanel]);
  
  // 添加错误日志记录功能
  useEffect(() => {
    // 客户端错误处理
    const handleError = (event) => {
      const errorInfo = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      // 记录到控制台
      console.error('客户端错误:', errorInfo);
      
      // 发送到服务器记录（如果需要的话）
      // 这里我们只是记录到本地文件的思路，实际实现需要后端支持
      logClientError(errorInfo);
    };
    
    // Promise拒绝处理
    const handleUnhandledRejection = (event) => {
      const errorInfo = {
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack || '',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      console.error('未处理的Promise拒绝:', errorInfo);
      logClientError(errorInfo);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  // 初始化错误日志记录器
  useEffect(() => {
    errorLogger.init();
  }, []);
  
  // 记录客户端错误到日志文件
  const logClientError = async (errorInfo) => {
    try {
      // 在实际应用中，这里会发送到后端API来记录错误
      // 由于这是一个纯前端应用，我们只能在控制台记录
      // 并提供一个下载错误日志的功能
      
      // 构建日志内容
      const logEntry = `[${errorInfo.timestamp}] ${errorInfo.message} at ${errorInfo.filename}:${errorInfo.lineno}:${errorInfo.colno}\n`;
      
      // 这里只是示例，实际记录需要后端支持
      console.log('错误已记录到日志:', logEntry);
    } catch (logError) {
      console.error('记录错误日志时发生异常:', logError);
    }
  };
  
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
            <h1>Minecraft2D - 2D Minecraft</h1>
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

  // 恢复默认界面设置
  const resetUiVisibility = () => {
    setUiVisibility({
      controlsHelp: true,
      debugConsole: true,
      configPanel: true,
      errorLog: true,
      inventory: true,
      healthBar: true,
      topBar: true
    });
    setShowUiControlPanel(false);
    setShowControlsHelp(false);
    setShowErrorLog(false);
    setShowDebugConsole(false);
  };

  // 切换界面控制面板显示
  const toggleUiControlPanel = () => {
    setShowUiControlPanel(!showUiControlPanel);
  };

  // 关闭制作台界面
  const closeCraftingTable = () => {
    setShowCraftingTable(false);
    setCurrentCraftingTable(null);
    setPlayerInventory(null);
    
    // 关闭制作台容器
    if (currentCraftingTable && currentCraftingTable.close) {
      currentCraftingTable.close();
    }
    
    // 恢复输入管理器上下文为游戏
    inputManager.setActiveContext('game');
  };

  // 关闭熔炉界面 (新增)
  const closeFurnace = () => {
    setShowFurnace(false);
    setCurrentFurnace(null);
    setPlayerInventory(null);
    
    // 关闭熔炉容器
    if (currentFurnace && currentFurnace.close) {
      currentFurnace.close();
    }
    
    // 恢复输入管理器上下文为游戏
    inputManager.setActiveContext('game');
  };

  // 处理制作操作
  const handleCraft = (craftingGrid) => {
    console.log('执行制作操作:', craftingGrid);
    // 这里应该实现实际的合成逻辑
    // 暂时只是示例
  };

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
        {/* 制作台界面 */}
        {showCraftingTable && currentCraftingTable && playerInventory && (
          <CraftingTableUI
            craftingTable={currentCraftingTable}
            playerInventory={playerInventory}
            onClose={closeCraftingTable}
            onCraft={handleCraft}
            gameEngine={gameEngineRef.current}
          />
        )}
        
        {/* 熔炉界面 (新增) */}
        {showFurnace && currentFurnace && playerInventory && (
          <FurnaceUI
            furnace={currentFurnace}
            playerInventory={playerInventory}
            onClose={closeFurnace}
            gameEngine={gameEngineRef.current}
          />
        )}
        
        {/* 物品栏界面 - 确保始终显示 */}
        <InventoryController 
          inventory={gameEngineRef.current?.systems?.player?.inventory}
          gameEngine={gameEngineRef.current}
        />
        
        {/* 血条显示 - 物品栏上方 */}
        {uiVisibility.healthBar && (
          <HealthBar className={uiAnimations.healthBar} 
            player={gameEngineRef.current?.systems?.player} 
            gameEngine={gameEngineRef.current} 
          />
        )}
        
        {/* 顶部状态栏 */}
        {uiVisibility.topBar && (
          <div className={`top-bar ${uiAnimations.topBar}`}>
            <div className="game-title">
              <h2>Minecraft2D - 2D Minecraft</h2>
              <span className="version">v1.0.0</span>
            </div>
            
            {/* 游戏状态信息 - 右上角 (TODO #27) */}
            <div className="game-stats">
              <span>FPS: {gameStats.fps}</span>
              <span>方块: {gameStats.blocksRendered}</span>
              <span>位置: ({gameStats.playerPos.x}, {gameStats.playerPos.y})</span>
              {gameStats.isFlying && (
                <span style={{ color: '#87CEEB', fontWeight: 'bold' }}>
                  ✈️ 飞行: {gameStats.flySpeed}%
                </span>
              )}
              {/* 时间信息 (TODO #17) */}
              <span style={{ color: '#FFD700', fontWeight: 'bold' }}>
                🕰️ {gameStats.timeString} {gameStats.timePhase}
              </span>
              {/* 季节信息 */}
              {gameStats.season && (
                <span style={{ color: '#90EE90', fontWeight: 'bold' }}>
                  {gameStats.season === 'spring' ? '🌸' : 
                   gameStats.season === 'summer' ? '☀️' : 
                   gameStats.season === 'autumn' ? '🍂' : '❄️'} 
                  {gameStats.season === 'spring' ? '春季' : 
                   gameStats.season === 'summer' ? '夏季' : 
                   gameStats.season === 'autumn' ? '秋季' : '冬季'} 
                  (第{gameStats.dayOfYear}天)
                </span>
              )}
              {/* 天气信息 */}
              {gameStats.weather && gameStats.weather !== 'clear' && (
                <span style={{ color: '#87CEEB', fontWeight: 'bold' }}>
                  {gameStats.weather === 'rain' ? '🌧️' : gameStats.weather === 'snow' ? '❄️' : '⛈️'} 
                  {gameStats.weather === 'rain' ? '雨天' : gameStats.weather === 'snow' ? '雪天' : '暴风雨'} 
                  ({Math.round(gameStats.weatherIntensity * 100)}%)
                </span>
              )}
              {/* 实体信息 */}
              <span>
                👹 实体: {gameStats.entities}
              </span>
            </div>
          </div>
        )}
        
        {/* 左下角控制区域 */}
        {uiVisibility.configPanel && (
          <div className={`left-control-area ${uiAnimations.controlPanel}`}>
            {/* 控制面板 - 简化为仅包含游戏配置按钮 */}
            <div className="control-panel">
              {/* 简化为单排布局，仅包含游戏配置按钮 */}
              <div className="control-panel-row1">
                <button 
                  onClick={toggleConfigPanel}
                  className="config-panel-btn ui-button-hover ui-button-active"
                >
                  ⚙️ 游戏配置
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 界面控制面板 */}
        {showUiControlPanel && (
          <div className={`ui-control-panel ${uiAnimations.controlPanel}`}>
            <div className="ui-control-panel-header">
              <h3>界面元素控制</h3>
              <button 
                className="ui-control-panel-close ui-button-hover ui-button-active"
                onClick={toggleUiControlPanel}
                title="关闭控制面板"
              >
                ✖
              </button>
            </div>
            <div className="ui-control-panel-content">
              <div className="ui-control-item">
                <label>
                  <input
                    type="checkbox"
                    checked={uiVisibility.controlsHelp}
                    onChange={(e) => setUiVisibility(prev => ({
                      ...prev,
                      controlsHelp: e.target.checked
                    }))}
                  />
                  控制说明面板
                </label>
              </div>
              <div className="ui-control-item">
                <label>
                  <input
                    type="checkbox"
                    checked={uiVisibility.debugConsole}
                    onChange={(e) => setUiVisibility(prev => ({
                      ...prev,
                      debugConsole: e.target.checked
                    }))}
                  />
                  调试控制台
                </label>
              </div>
              <div className="ui-control-item">
                <label>
                  <input
                    type="checkbox"
                    checked={uiVisibility.configPanel}
                    onChange={(e) => setUiVisibility(prev => ({
                      ...prev,
                      configPanel: e.target.checked
                    }))}
                  />
                  左下角控制按钮面板
                </label>
              </div>
              <div className="ui-control-item">
                <label>
                  <input
                    type="checkbox"
                    checked={uiVisibility.errorLog}
                    onChange={(e) => setUiVisibility(prev => ({
                      ...prev,
                      errorLog: e.target.checked
                    }))}
                  />
                  错误日志面板
                </label>
              </div>
              <div className="ui-control-item">
                <label>
                  <input
                    type="checkbox"
                    checked={uiVisibility.inventory}
                    onChange={(e) => setUiVisibility(prev => ({
                      ...prev,
                      inventory: e.target.checked
                    }))}
                  />
                  物品栏界面
                </label>
              </div>
              <div className="ui-control-item">
                <label>
                  <input
                    type="checkbox"
                    checked={uiVisibility.healthBar}
                    onChange={(e) => setUiVisibility(prev => ({
                      ...prev,
                      healthBar: e.target.checked
                    }))}
                  />
                  血条显示
                </label>
              </div>
              <div className="ui-control-item">
                <label>
                  <input
                    type="checkbox"
                    checked={uiVisibility.topBar}
                    onChange={(e) => setUiVisibility(prev => ({
                      ...prev,
                      topBar: e.target.checked
                    }))}
                  />
                  顶部状态栏 (FPS, 时间等)
                </label>
              </div>
              <div className="ui-control-item">
                <button 
                  onClick={() => setUiVisibility({
                    controlsHelp: true,
                    debugConsole: true,
                    configPanel: true,
                    errorLog: true,
                    inventory: true,
                    healthBar: true,
                    topBar: true
                  })}
                  className="ui-button-hover ui-button-active"
                >
                  显示所有界面元素
                </button>
              </div>
              <div className="ui-control-item">
                <button 
                  onClick={resetUiVisibility}
                  className="ui-button-hover ui-button-active"
                >
                  恢复默认设置
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 控制说明面板 */}
        {showControlsHelp && uiVisibility.controlsHelp && (
          <div className={`controls-help-panel ${uiAnimations.controlPanel}`}>
            <div className="controls-help-header">
              <h3>控制说明:</h3>
              <button 
                className="controls-help-toggle ui-button-hover ui-button-active"
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
              <li><strong>Z键:</strong> 向左潜行</li>
              <li><strong>C键:</strong> 向右潜行</li>
              <li><strong>ESC:</strong> 暂停/继续</li>
              <li><strong>F3:</strong> 切换调试信息</li>
              <li><strong>F2:</strong> 打开/关闭配置面板</li>
              <li><strong>H键:</strong> 显示/隐藏控制说明</li>
              <li><strong>T键:</strong> 切换时间系统开关</li>
              <li><strong>W键:</strong> 切换天气系统开关</li>
              <li><strong>S键:</strong> 切换季节系统开关</li>
              <li><strong>,/.键:</strong> 减慢/加快时间流逝速度</li>
              <li><strong>&lt;/&gt;键:</strong> 向前/向后调节时间</li>
              <li><strong>[/]:</strong> 降低/提高帧率</li>
            </ul>
            <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(135, 206, 235, 0.2)', borderRadius: '4px', border: '1px solid #87CEEB' }}>
              <strong style={{ color: '#87CEEB' }}>飞行模式:</strong>
              <br />在飞行模式下，玩家变为天空蓝色，可以全方向快速飞行，不受重力和地形碰撞影响。
              <br /><strong>速度调节:</strong> 使用+/-键可在100%-1000%之间调节飞行速度。
            </div>
            <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(135, 206, 235, 0.2)', borderRadius: '4px', border: '1px solid #87CEEB' }}>
              <strong style={{ color: '#87CEEB' }}>潜行模式:</strong>
              <br />在潜行模式下，玩家移动速度降低到30%，身体变小，可以更隐蔽地移动。
              <br /><strong>控制:</strong> 使用Z键向左潜行，C键向右潜行。
            </div>
          </div>
        )}
        
        {/* 错误日志面板 */}
        {showErrorLog && (
          <ErrorLogViewer onClose={() => setShowErrorLog(false)} />
        )}
        
        {/* 配置面板 */}
        {configPanelRef.current && (
          <div id="config-panel-container"></div>
        )}
        
        {/* 调试控制台 - 使用条件渲染和动画类 */}
        {showDebugConsole && uiVisibility.debugConsole && (
          <DebugConsole 
            className={uiAnimations.debugConsole}
            gameEngine={gameEngineRef.current}
          />
        )}
      </div>
    </div>
  );
}

export default App;