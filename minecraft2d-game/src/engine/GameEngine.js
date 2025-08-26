/**
 * Minecraft2D 游戏引擎核心模块
 * 负责游戏主循环、状态管理和各子系统协调
 */

import { EntityManager } from '../entities/EntityManager.js';
import { AudioManager } from '../audio/AudioManager.js';
import { PlayerAudioController } from '../audio/PlayerAudioController.js';
import { FarmingSystem } from '../world/FarmingSystem.js';
import { ContainerManager } from '../blocks/ContainerManager.js';
import { inputManager } from '../input/InputManager.js'; // 新增导入

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // 游戏状态
    this.gameState = {
      isRunning: false,
      isPaused: false,
      deltaTime: 0,
      lastFrameTime: 0,
      fps: 60,
      targetFPS: 60,           // 目标帧率 (TODO #23)
      frameInterval: 1000 / 60, // 帧间隔 (ms)
      lastRender: 0            // 上次渲染时间
    };
    
    // 时间系统 (TODO #17)
    this.timeSystem = {
      timeOfDay: 0.5,          // 当前时间 (0-1，0.5为正午)
      timeSpeed: 1.0,          // 时间流逝速度 (1.0为正常速度)
      dayDuration: 120,        // 一天的持续时间（秒）
      realTimeElapsed: 0,      // 真实时间经过（秒）
      enabled: true,           // 时间系统是否启用
      eternalDay: false        // 永久白日模式 (新增)
    };
    
    // 季节系统 (新增)
    this.seasonSystem = {
      currentSeason: 'spring', // 当前季节 (spring, summer, autumn, winter)
      dayOfYear: 0,            // 一年中的第几天 (0-364)
      seasonDuration: 91,      // 每个季节的天数 (大约)
      seasonEnabled: true      // 季节系统是否启用
    };
    
    // 天气系统 (新增)
    this.weatherSystem = {
      currentWeather: 'clear', // 当前天气 (clear, rain, snow, storm)
      targetWeather: 'clear',  // 目标天气 (用于平滑过渡)
      weatherIntensity: 0,     // 当前天气强度 (0-1)
      targetIntensity: 0,      // 目标天气强度 (0-1)
      weatherDuration: 0,      // 当前天气持续时间
      weatherChangeTimer: 0,   // 天气变化计时器
      maxWeatherDuration: 300, // 最大天气持续时间（秒）
      minWeatherDuration: 60,  // 最小天气持续时间（秒）
      weatherEnabled: true,    // 天气系统是否启用
      transitionSpeed: 0.1     // 天气过渡速度
    };
    
    // 子系统
    this.systems = {
      terrainGenerator: null,
      player: null,
      camera: null,
      renderer: null,
      storageManager: null,
      inputHandler: null,
      entityManager: null,     // 实体管理器
      audioManager: null       // 音频管理器 (新增)
    };
    
    // 游戏世界配置
    this.worldConfig = {
      WORLD_HEIGHT: 512,
      CHUNK_SIZE: 16,
      BLOCK_SIZE: 16
    };
    
    // 实体管理器
    this.entityManager = new EntityManager(this.worldConfig);
    
    // 音频管理器 (新增)
    this.audioManager = new AudioManager();
    
    // 农作物系统 (新增)
    this.farmingSystem = new FarmingSystem();
    
    // 容器管理器 (新增)
    this.containerManager = new ContainerManager();
    
    // 玩家音频控制器 (新增)
    this.playerAudioController = null;
    
    // 绑定方法
    this.gameLoop = this.gameLoop.bind(this);
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
    
    console.log('🎮 GameEngine 初始化完成');
  }
  
  /**
   * 初始化游戏引擎
   */
  async initialize() {
    try {
      console.log('🚀 开始初始化游戏引擎...');
      
      // 检查Canvas元素
      if (!this.canvas) {
        throw new Error('没有提供Canvas元素');
      }
      
      // 检查浏览器支持
      if (typeof window === 'undefined') {
        throw new Error('需要浏览器环境');
      }
      
      if (typeof requestAnimationFrame === 'undefined') {
        throw new Error('浏览器不支持requestAnimationFrame');
      }
      
      console.log('✅ 浏览器环境检查通过');
      
      // 设置画布
      this.setupCanvas();
      console.log('✅ 画布设置完成');
      
      // 初始化输入处理（使用新的输入管理器）
      this.initializeInput();
      console.log('✅ 输入系统初始化完成');
      
      // 初始化音频系统
      this.initializeAudio();
      console.log('✅ 音频系统初始化完成');
      
      console.log('✅ 游戏引擎初始化完成');
      return true;
    } catch (error) {
      console.error('❌ 游戏引擎初始化失败:', error);
      return false;
    }
  }
  
  /**
   * 初始化输入处理（使用新的输入管理器）
   */
  initializeInput() {
    // 注册游戏相关的按键处理函数
    this.registerGameKeyHandlers();
    
    // 鼠标事件监听 (新增 - 放置方块功能 - 基础实现)
    this.canvas.addEventListener('contextmenu', (e) => {
      // 阻止右键菜单显示
      e.preventDefault();
    });
    
    this.canvas.addEventListener('mousedown', (e) => {
      // 右键点击触发放置方块
      if (e.button === 2) { // 2表示右键
        if (this.systems.player) {
          // 设置放置控制状态
          this.systems.player.controls.place = true;
        }
      }
    });
    
    this.canvas.addEventListener('mouseup', (e) => {
      // 右键释放
      if (e.button === 2) { // 2表示右键
        if (this.systems.player) {
          // 重置放置控制状态
          this.systems.player.controls.place = false;
        }
      }
    });
    
    // 添加鼠标离开画布时也重置放置控制状态 (新增 - 多方块放置优化 - 基础实现)
    this.canvas.addEventListener('mouseleave', () => {
      if (this.systems.player) {
        // 重置放置控制状态
        this.systems.player.controls.place = false;
      }
    });
    
    // 添加鼠标位置跟踪
    this.mousePosition = { x: 0, y: 0 };
    
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePosition.x = e.clientX - rect.left;
      this.mousePosition.y = e.clientY - rect.top;
      
      // 将鼠标位置传递给玩家
      if (this.systems.player && this.systems.camera) {
        const worldPos = this.systems.camera.screenToWorld(this.mousePosition.x, this.mousePosition.y);
        this.systems.player.setMousePosition(worldPos.x, worldPos.y);
      }
    });
    
    this.canvas.addEventListener('mousedown', (e) => {
      // 左键点击触发光线追踪
      if (e.button === 0) { // 0表示左键
        // 移除放置方块的逻辑，改为使用V键放置
        // 光线追踪逻辑可以保留用于其他用途
      }
    });
    
    this.canvas.addEventListener('mouseup', (e) => {
      // 左键释放
      if (e.button === 0) { // 0表示左键
        // 移除放置方块的逻辑
      }
    });
    
    console.log('⌨️  输入系统初始化完成');
  }
  
  /**
   * 注册游戏相关的按键处理函数
   */
  registerGameKeyHandlers() {
    // ESC键切换暂停
    inputManager.registerKeyHandler('Escape', (event) => {
      this.togglePause();
    }, 'game', 0);
    
    // F键切换飞行模式
    inputManager.registerKeyHandler('KeyF', (event) => {
      if (this.systems.player) {
        this.systems.player.toggleFlyMode();
      }
    }, 'game', 0);
    
    // V键放置方块
    inputManager.registerKeyHandler('KeyV', (event) => {
      if (this.systems.player) {
        // 设置放置控制状态
        this.systems.player.controls.place = true;
      }
    }, 'game', 0);
    
    // V键释放时重置放置状态
    inputManager.registerKeyHandler('KeyV', (event) => {
      if (this.systems.player) {
        // 重置放置控制状态
        this.systems.player.controls.place = false;
      }
    }, 'game', 0, true); // 第五个参数true表示这是释放处理函数
    
    // +键提升飞行速度
    inputManager.registerKeyHandler('Equal', (event) => {
      if (this.systems.player && this.systems.player.isFlying()) {
        this.systems.player.increaseFlySpeed();
      }
    }, 'game', 0);
    
    inputManager.registerKeyHandler('NumpadAdd', (event) => {
      if (this.systems.player && this.systems.player.isFlying()) {
        this.systems.player.increaseFlySpeed();
      }
    }, 'game', 0);
    
    // -键降低飞行速度
    inputManager.registerKeyHandler('Minus', (event) => {
      if (this.systems.player && this.systems.player.isFlying()) {
        this.systems.player.decreaseFlySpeed();
      }
    }, 'game', 0);
    
    inputManager.registerKeyHandler('NumpadSubtract', (event) => {
      if (this.systems.player && this.systems.player.isFlying()) {
        this.systems.player.decreaseFlySpeed();
      }
    }, 'game', 0);
  }
  
  /**
   * 处理按键按下（保留用于特殊处理）
   */
  handleKeyDown(event) {
    // 不再需要在这里处理按键，因为使用了新的输入管理器
  }
  
  /**
   * 处理按键释放（保留用于特殊处理）
   */
  handleKeyUp(event) {
    // 暂时为空，后续可添加按键释放处理逻辑
  }
  
  /**
   * 初始化音频系统
   */
  initializeAudio() {
    // 音频管理器已经在构造函数中初始化
    // 玩家音频控制器将在设置玩家时初始化
  }
  
  /**
   * 设置玩家
   * @param {Player} player - 玩家实例
   */
  setPlayer(player) {
    this.systems.player = player;
    
    // 设置玩家引用
    if (player) {
      player.setGameEngine(this);
      
      // 创建玩家音频控制器
      if (this.audioManager) {
        this.playerAudioController = new PlayerAudioController(player, this.audioManager);
        player.setAudioController(this.playerAudioController);
      }
    }
  }
  
  /**
   * 设置画布
   */
  setupCanvas() {
    if (!this.canvas) {
      throw new Error('Canvas element is required');
    }
    
    // 检查Canvas支持
    if (!this.canvas.getContext) {
      throw new Error('浏览器不支持Canvas');
    }
    
    // 检查2D上下文
    const testCtx = this.canvas.getContext('2d');
    if (!testCtx) {
      throw new Error('无法获取Canvas 2D上下文');
    }
    
    console.log('Canvas信息:', {
      tagName: this.canvas.tagName,
      width: this.canvas.width,
      height: this.canvas.height,
      offsetWidth: this.canvas.offsetWidth,
      offsetHeight: this.canvas.offsetHeight
    });
    
    // 设置画布大小
    const resizeCanvas = () => {
      try {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        console.log('画布大小设置为:', this.canvas.width, 'x', this.canvas.height);
      } catch (error) {
        console.error('设置画布大小失败:', error);
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 设置渲染上下文属性
    this.ctx.imageSmoothingEnabled = false; // 像素风格，不使用抗锯齿
    
    console.log('✅ 画布设置完成');
  }
  
  /**
   * 注册子系统
   * @param {string} name - 子系统名称
   * @param {Object} system - 子系统实例
   */
  registerSystem(name, system) {
    if (this.systems.hasOwnProperty(name)) {
      this.systems[name] = system;
      console.log(`📦 注册子系统: ${name}`);
      
      // 特殊处理：当注册玩家时，设置实体管理器的玩家引用
      if (name === 'player' && this.entityManager) {
        this.entityManager.setPlayer(system);
      }
      
      // 特殊处理：当注册地形生成器时，设置实体管理器的地形生成器引用
      if (name === 'terrainGenerator' && this.entityManager) {
        this.entityManager.setTerrainGenerator(system);
      }
      
      // 特殊处理：当注册实体管理器时，设置游戏引擎引用
      if (name === 'entityManager') {
        system.setGameEngine(this);
      }
      
      // 特殊处理：当注册地形生成器时，将季节系统传递给它
      if (name === 'terrainGenerator' && this.seasonSystem) {
        system.setSeasonSystem(this.seasonSystem);
      }
      
      // 特殊处理：将季节系统传递给农作物系统
      if (this.seasonSystem && this.farmingSystem) {
        this.farmingSystem.setSeasonSystem(this.seasonSystem);
      }
      
      // 特殊处理：当注册地形生成器时，将容器管理器传递给它
      if (name === 'terrainGenerator' && this.containerManager) {
        system.setContainerManager(this.containerManager);
      }
    } else {
      console.warn(`⚠️  未知的子系统: ${name}`);
    }
  }
  
  /**
   * 启动游戏
   */
  start() {
    if (this.gameState.isRunning) {
      console.warn('⚠️  游戏已在运行中');
      return;
    }
    
    console.log('🎮 启动游戏循环...');
    this.gameState.isRunning = true;
    this.gameState.lastFrameTime = performance.now();
    requestAnimationFrame(this.gameLoop);
  }
  
  /**
   * 停止游戏
   */
  stop() {
    console.log('⏹️  停止游戏循环');
    this.gameState.isRunning = false;
  }
  
  /**
   * 切换暂停状态
   */
  togglePause() {
    this.gameState.isPaused = !this.gameState.isPaused;
    console.log(this.gameState.isPaused ? '⏸️  游戏暂停' : '▶️  游戏继续');
  }
  
  /**
   * 游戏主循环
   */
  gameLoop(currentTime) {
    if (!this.gameState.isRunning) return;
    
    // 帧率限制 (TODO #23)
    const timeSinceLastRender = currentTime - this.gameState.lastRender;
    if (timeSinceLastRender < this.gameState.frameInterval) {
      requestAnimationFrame(this.gameLoop);
      return;
    }
    
    this.gameState.lastRender = currentTime;
    
    // 计算时间差
    this.gameState.deltaTime = (currentTime - this.gameState.lastFrameTime) / 1000;
    this.gameState.lastFrameTime = currentTime;
    
    // 限制最大时间步长，避免大卡顿
    if (this.gameState.deltaTime > 0.1) {
      this.gameState.deltaTime = 0.1;
    }
    
    if (!this.gameState.isPaused) {
      // 更新游戏逻辑
      this.update(this.gameState.deltaTime);
    }
    
    // 渲染游戏画面
    this.render();
    
    // 请求下一帧
    requestAnimationFrame(this.gameLoop);
  }
  
  /**
   * 更新游戏逻辑
   */
  update(deltaTime) {
    // 更新时间系统 (TODO #17)
    this.updateTimeSystem(deltaTime);
    
    // 更新季节系统
    this.updateSeasonSystem(deltaTime);
    
    // 更新天气系统
    this.updateWeatherSystem(deltaTime);
    
    // 更新农作物系统
    if (this.farmingSystem) {
      this.farmingSystem.update(deltaTime * 1000); // 转换为毫秒
    }
    
    // 更新各个子系统
    if (this.systems.player) {
      this.systems.player.update(deltaTime, inputManager.getAllKeys());
    }
    
    if (this.systems.camera) {
      this.systems.camera.update(deltaTime);
    }
    
    if (this.systems.terrainGenerator) {
      this.systems.terrainGenerator.update(deltaTime);
    }
    
    // 更新实体管理器
    if (this.entityManager) {
      this.entityManager.update(deltaTime);
    }
    
    // 更新生物群系环境效果
    this.updateBiomeEffects();
    
    // 更新音频管理器
    if (this.audioManager) {
      // 音频管理器的更新逻辑可以在这里添加
    }
    
    // 同步时间到渲染器 (TODO #17)
    if (this.systems.renderer) {
      this.systems.renderer.setTimeOfDay(this.timeSystem.timeOfDay);
    }
  }
  
  /**
   * 更新季节系统
   */
  updateSeasonSystem(deltaTime) {
    if (!this.seasonSystem.seasonEnabled) return;
    
    // 根据时间系统更新一年中的天数
    this.seasonSystem.dayOfYear += (deltaTime * this.timeSystem.timeSpeed) / this.timeSystem.dayDuration;
    
    // 循环天数 (0-364)
    this.seasonSystem.dayOfYear = this.seasonSystem.dayOfYear % 365;
    
    // 根据一年中的天数计算当前季节
    this.seasonSystem.currentSeason = this.calculateSeason(this.seasonSystem.dayOfYear);
    
    // 同步季节到渲染器
    if (this.systems.renderer) {
      this.systems.renderer.setSeason(this.seasonSystem.currentSeason);
    }
  }
  
  /**
   * 计算当前季节
   * @param {number} dayOfYear - 一年中的第几天 (0-364)
   * @returns {string} 季节名称
   */
  calculateSeason(dayOfYear) {
    if (dayOfYear < 80 || dayOfYear >= 355) {
      return 'winter'; // 冬季 (第0-80天和第355-364天)
    } else if (dayOfYear < 172) {
      return 'spring'; // 春季 (第80-172天)
    } else if (dayOfYear < 266) {
      return 'summer'; // 夏季 (第172-266天)
    } else {
      return 'autumn'; // 秋季 (第266-355天)
    }
  }
  
  /**
   * 更新天气系统
   */
  updateWeatherSystem(deltaTime) {
    if (!this.weatherSystem.weatherEnabled) return;
    
    // 更新天气持续时间
    this.weatherSystem.weatherDuration += deltaTime;
    this.weatherSystem.weatherChangeTimer += deltaTime;
    
    // 检查是否需要改变天气
    if (this.weatherSystem.weatherChangeTimer >= 30) { // 每30秒检查一次天气变化
      this.checkWeatherChange();
      this.weatherSystem.weatherChangeTimer = 0;
    }
    
    // 更新天气强度和平滑过渡
    this.updateWeatherTransition(deltaTime);
    
    // 根据时间系统更新天气强度
    this.updateWeatherIntensity();
    
    // 同步天气到渲染器
    if (this.systems.renderer) {
      this.systems.renderer.setWeather(
        this.weatherSystem.currentWeather, 
        this.weatherSystem.weatherIntensity
      );
    }
  }
  
  /**
   * 更新天气过渡
   */
  updateWeatherTransition(deltaTime) {
    // 平滑过渡到目标强度
    if (this.weatherSystem.weatherIntensity < this.weatherSystem.targetIntensity) {
      this.weatherSystem.weatherIntensity = Math.min(
        this.weatherSystem.weatherIntensity + this.weatherSystem.transitionSpeed * deltaTime,
        this.weatherSystem.targetIntensity
      );
    } else if (this.weatherSystem.weatherIntensity > this.weatherSystem.targetIntensity) {
      this.weatherSystem.weatherIntensity = Math.max(
        this.weatherSystem.weatherIntensity - this.weatherSystem.transitionSpeed * deltaTime,
        this.weatherSystem.targetIntensity
      );
    }
    
    // 检查是否需要切换到目标天气
    if (Math.abs(this.weatherSystem.weatherIntensity - this.weatherSystem.targetIntensity) < 0.01 && 
        this.weatherSystem.currentWeather !== this.weatherSystem.targetWeather) {
      this.weatherSystem.currentWeather = this.weatherSystem.targetWeather;
    }
  }
  
  /**
   * 检查天气变化
   */
  checkWeatherChange() {
    // 根据当前时间和季节决定天气变化概率
    const timePhase = this.getTimePhase();
    const timeOfDay = this.timeSystem.timeOfDay;
    
    // 基础天气变化概率
    let changeProbability = 0.1;
    
    // 根据时间阶段调整概率
    if (timePhase === '夜晚') {
      changeProbability *= 1.5; // 夜晚更容易变化
    }
    
    // 根据当前天气调整概率
    if (this.weatherSystem.currentWeather !== 'clear') {
      changeProbability *= 0.7; // 已经在下雨或下雪时，变化概率降低
    }
    
    // 随机决定是否改变天气
    if (Math.random() < changeProbability) {
      this.changeWeather();
    }
  }
  
  /**
   * 改变天气
   */
  changeWeather() {
    // 重置天气持续时间
    this.weatherSystem.weatherDuration = 0;
    
    // 根据当前季节和温度决定天气类型
    const season = this.getCurrentSeason();
    const temperature = this.getCurrentTemperature();
    
    // 天气类型权重
    let weatherWeights = {
      clear: 0.6,
      rain: 0.3,
      snow: 0.1
    };
    
    // 根据季节调整权重
    switch (season) {
      case 'winter':
        weatherWeights.clear = 0.5;
        weatherWeights.rain = 0.2;
        weatherWeights.snow = 0.3;
        break;
      case 'summer':
        weatherWeights.clear = 0.7;
        weatherWeights.rain = 0.25;
        weatherWeights.snow = 0.05;
        break;
      case 'spring':
      case 'autumn':
        weatherWeights.clear = 0.55;
        weatherWeights.rain = 0.35;
        weatherWeights.snow = 0.1;
        break;
    }
    
    // 根据温度调整权重
    if (temperature < 0) {
      // 寒冷时更可能下雪
      weatherWeights.snow += 0.2;
      weatherWeights.rain -= 0.1;
      weatherWeights.clear -= 0.1;
    } else if (temperature > 25) {
      // 炎热时更可能是晴天
      weatherWeights.clear += 0.1;
      weatherWeights.rain -= 0.05;
      weatherWeights.snow -= 0.05;
    }
    
    // 标准化权重
    const totalWeight = weatherWeights.clear + weatherWeights.rain + weatherWeights.snow;
    weatherWeights.clear /= totalWeight;
    weatherWeights.rain /= totalWeight;
    weatherWeights.snow /= totalWeight;
    
    // 根据权重选择天气
    const rand = Math.random();
    let newWeather;
    if (rand < weatherWeights.clear) {
      newWeather = 'clear';
    } else if (rand < weatherWeights.clear + weatherWeights.rain) {
      newWeather = 'rain';
    } else {
      newWeather = 'snow';
    }
    
    // 设置目标天气和强度
    this.weatherSystem.targetWeather = newWeather;
    this.weatherSystem.targetIntensity = newWeather === 'clear' ? 0 : 0.7 + Math.random() * 0.3;
    
    console.log(`🌤️ 天气将变化为: ${newWeather}`);
  }
  
  /**
   * 更新天气强度
   */
  updateWeatherIntensity() {
    // 根据天气持续时间和时间阶段计算强度
    const timeInWeather = this.weatherSystem.weatherDuration;
    const maxDuration = this.weatherSystem.maxWeatherDuration;
    
    // 简单的强度曲线：开始时逐渐增强，结束前逐渐减弱
    if (timeInWeather < 30) {
      // 前30秒逐渐增强
      this.weatherSystem.weatherIntensity = timeInWeather / 30;
    } else if (timeInWeather > maxDuration - 30) {
      // 最后30秒逐渐减弱
      this.weatherSystem.weatherIntensity = (maxDuration - timeInWeather) / 30;
    } else {
      // 中间时段保持较高强度
      this.weatherSystem.weatherIntensity = Math.min(1.0, 0.7 + Math.random() * 0.3);
    }
  }
  
  /**
   * 获取当前季节
   */
  getCurrentSeason() {
    // 简单的季节计算：根据时间系统的时间
    const dayOfYear = (this.timeSystem.timeOfDay * 365) % 365;
    
    if (dayOfYear < 80 || dayOfYear >= 355) {
      return 'winter'; // 冬季
    } else if (dayOfYear < 172) {
      return 'spring'; // 春季
    } else if (dayOfYear < 266) {
      return 'summer'; // 夏季
    } else {
      return 'autumn'; // 秋季
    }
  }
  
  /**
   * 获取当前温度
   */
  getCurrentTemperature() {
    // 简单的温度计算：根据季节和时间
    const season = this.getCurrentSeason();
    const timePhase = this.getTimePhase();
    
    let baseTemp = 20; // 基础温度
    
    // 根据季节调整基础温度
    switch (season) {
      case 'winter':
        baseTemp = 0;
        break;
      case 'spring':
        baseTemp = 15;
        break;
      case 'summer':
        baseTemp = 30;
        break;
      case 'autumn':
        baseTemp = 10;
        break;
    }
    
    // 根据时间调整温度
    if (timePhase === '夜晚') {
      baseTemp -= 5;
    } else if (timePhase === '黎明' || timePhase === '黄昏') {
      baseTemp -= 2;
    }
    
    // 添加随机变化
    return baseTemp + (Math.random() * 10 - 5);
  }
  
  /**
   * 更新生物群系环境效果
   */
  updateBiomeEffects() {
    // 检查玩家当前位置的生物群系
    if (this.systems.player && this.systems.terrainGenerator && this.systems.renderer) {
      const playerPos = this.systems.player.getPosition();
      const worldX = Math.floor(playerPos.x / this.worldConfig.BLOCK_SIZE);
      
      // 获取当前位置的生物群系
      const biome = this.systems.terrainGenerator.worldGenerator.biomeGenerator.generateBiome(worldX, 0);
      
      // 更新渲染器中的生物群系
      this.systems.renderer.setCurrentBiome(biome);
      
      // 更新音频管理器中的生物群系
      if (this.audioManager) {
        this.audioManager.setCurrentBiome(biome);
      }
    }
  }
  
  /**
   * 渲染游戏画面
   */
  render() {
    // 清除画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.systems.renderer) {
      this.systems.renderer.render(this.ctx);
      
      // 渲染实体
      if (this.entityManager && this.systems.camera) {
        this.entityManager.render(this.ctx, this.systems.camera);
      }
    } else {
      // 如果还没有渲染器，显示基础信息
      this.renderBasicInfo();
    }
  }
  
  /**
   * 渲染基础信息
   */
  renderBasicInfo() {
    this.ctx.fillStyle = '#87CEEB'; // 天空蓝
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 显示游戏标题
    this.ctx.fillStyle = '#000';
    this.ctx.font = '32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Minecraft2D - 2D Minecraft', this.canvas.width / 2, this.canvas.height / 2 - 50);
    
    // 显示状态信息
    this.ctx.font = '16px Arial';
    const statusText = this.gameState.isPaused ? '游戏暂停 (按ESC继续)' : '游戏运行中';
    this.ctx.fillText(statusText, this.canvas.width / 2, this.canvas.height / 2 + 20);
    
    // 显示帧率
    const fps = Math.round(1 / this.gameState.deltaTime);
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`FPS: ${fps}`, 10, 30);
  }
  
  /**
   * 获取当前按键状态
   */
  isKeyPressed(keyCode) {
    return !!this.keys[keyCode];
  }
  
  /**
   * 获取世界配置
   */
  getWorldConfig() {
    return { ...this.worldConfig };
  }
  
  /**
   * 设置目标帧率 (TODO #23)
   */
  setTargetFPS(fps) {
    this.gameState.targetFPS = Math.max(30, Math.min(120, fps));
    this.gameState.frameInterval = 1000 / this.gameState.targetFPS;
    console.log(`🎮 目标帧率设置为: ${this.gameState.targetFPS} FPS`);
  }
  
  /**
   * 销毁游戏引擎
   */
  destroy() {
    console.log('🗑️  销毁游戏引擎');
    this.stop();
    
    // 清理事件监听器
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    
    // 清理子系统
    Object.values(this.systems).forEach(system => {
      if (system && typeof system.destroy === 'function') {
        system.destroy();
      }
    });
  }
  
  /**
   * 更新时间系统 (TODO #17)
   * Author: Minecraft2D Development Team
   */
  updateTimeSystem(deltaTime) {
    // 如果启用了永久白日模式，不更新时间
    if (this.timeSystem.eternalDay) return;
    
    if (!this.timeSystem.enabled) return;
    
    // 累计真实时间
    this.timeSystem.realTimeElapsed += deltaTime;
    
    // 计算时间增量 (根据时间速度和一天的持续时间)
    const timeIncrement = (deltaTime * this.timeSystem.timeSpeed) / this.timeSystem.dayDuration;
    
    // 更新当前时间
    this.timeSystem.timeOfDay += timeIncrement;
    
    // 循环时间 (0-1 范围)
    if (this.timeSystem.timeOfDay >= 1.0) {
      this.timeSystem.timeOfDay -= 1.0;
    } else if (this.timeSystem.timeOfDay < 0) {
      this.timeSystem.timeOfDay += 1.0;
    }
  }
  
  /**
   * 设置时间 (TODO #17)
   * @param {number} time - 时间值 (0-1)
   */
  setTimeOfDay(time) {
    // 如果启用了永久白日模式，不设置时间
    if (this.timeSystem.eternalDay) return;
    
    this.timeSystem.timeOfDay = Math.max(0, Math.min(1, time));
    console.log(`🕰️ 时间设置为: ${(this.timeSystem.timeOfDay * 24).toFixed(1)}时`);
  }
  
  /**
   * 设置时间速度 (TODO #17)
   * @param {number} speed - 时间速度倍数
   */
  setTimeSpeed(speed) {
    this.timeSystem.timeSpeed = Math.max(0, Math.min(10, speed));
    console.log(`⏱️ 时间速度设置为: ${this.timeSystem.timeSpeed}x`);
  }
  
  /**
   * 设置一天的持续时间 (TODO #17)
   * @param {number} duration - 持续时间（秒）
   */
  setDayDuration(duration) {
    this.timeSystem.dayDuration = Math.max(10, Math.min(3600, duration));
    console.log(`🌅 一天持续时间设置为: ${this.timeSystem.dayDuration}秒`);
  }
  
  /**
   * 切换时间系统状态 (TODO #17)
   */
  toggleTimeSystem() {
    this.timeSystem.enabled = !this.timeSystem.enabled;
    console.log(`🕰️ 时间系统: ${this.timeSystem.enabled ? '启用' : '禁用'}`);
  }
  
  /**
   * 获取时间系统信息 (TODO #17)
   */
  getTimeInfo() {
    const hours = Math.floor(this.timeSystem.timeOfDay * 24);
    const minutes = Math.floor((this.timeSystem.timeOfDay * 24 * 60) % 60);
    
    return {
      timeOfDay: this.timeSystem.timeOfDay,
      hours,
      minutes,
      timeString: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      timeSpeed: this.timeSystem.timeSpeed,
      dayDuration: this.timeSystem.dayDuration,
      enabled: this.timeSystem.enabled,
      phase: this.getTimePhase()
    };
  }
  
  /**
   * 获取时间阶段 (TODO #17)
   */
  getTimePhase() {
    const time = this.timeSystem.timeOfDay;
    
    if (time < 0.25) {
      return '夜晚';
    } else if (time < 0.3) {
      return '黎明';
    } else if (time < 0.7) {
      return '白天';
    } else if (time < 0.8) {
      return '黄昏';
    } else {
      return '夜晚';
    }
  }
  
  /**
   * 设置永久白日模式
   * @param {boolean} enabled - 是否启用永久白日模式
   */
  setEternalDay(enabled) {
    const wasEternalDay = this.timeSystem.eternalDay;
    this.timeSystem.eternalDay = enabled;
    
    // 如果启用了永久白日模式，将时间设置为正午并停止时间流逝
    if (enabled) {
      this.timeSystem.timeOfDay = 0.5; // 正午时间
      this.timeSystem.enabled = false; // 停止时间流逝
    
      // 立即同步时间到渲染器
      if (this.systems.renderer) {
        this.systems.renderer.setTimeOfDay(0.5);
      }
    
      console.log('☀️ 永久白日模式已启用，时间跳转到12:00');
    } else {
      // 如果是从永久白日模式切换到正常模式，恢复时间流逝
      if (wasEternalDay) {
        this.timeSystem.enabled = true;
        console.log('☀️ 永久白日模式已禁用，时间系统恢复正常');
      }
    }
    
    // 同步到渲染器
    if (this.systems.renderer) {
      this.systems.renderer.setEternalDay(enabled);
    }
    
    console.log(`☀️ 永久白日模式: ${enabled ? '启用' : '禁用'}`);
  }
  
  /**
   * 获取永久白日模式状态
   * @returns {boolean} 是否启用了永久白日模式
   */
  isEternalDay() {
    return this.timeSystem.eternalDay || false;
  }
  
  /**
   * 设置天气
   * @param {string} weather - 天气类型 (clear, rain, snow)
   */
  setWeather(weather) {
    this.weatherSystem.currentWeather = weather;
    this.weatherSystem.weatherDuration = 0;
    console.log(`🌤️ 天气设置为: ${weather}`);
  }
  
  /**
   * 切换天气系统状态
   */
  toggleWeatherSystem() {
    this.weatherSystem.weatherEnabled = !this.weatherSystem.weatherEnabled;
    console.log(`🌤️ 天气系统: ${this.weatherSystem.weatherEnabled ? '启用' : '禁用'}`);
  }
  
  /**
   * 获取天气信息
   */
  getWeatherInfo() {
    return {
      currentWeather: this.weatherSystem.currentWeather,
      weatherIntensity: this.weatherSystem.weatherIntensity,
      weatherDuration: this.weatherSystem.weatherDuration,
      weatherEnabled: this.weatherSystem.weatherEnabled
    };
  }
  
  /**
   * 切换季节系统状态
   */
  toggleSeasonSystem() {
    this.seasonSystem.seasonEnabled = !this.seasonSystem.seasonEnabled;
    console.log(`🌸 季节系统: ${this.seasonSystem.seasonEnabled ? '启用' : '禁用'}`);
  }
  
  /**
   * 获取季节信息
   */
  getSeasonInfo() {
    return {
      currentSeason: this.seasonSystem.currentSeason,
      dayOfYear: this.seasonSystem.dayOfYear,
      seasonEnabled: this.seasonSystem.seasonEnabled
    };
  }
}
