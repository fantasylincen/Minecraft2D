/**
 * Minecraft2D 游戏引擎核心模块
 * 负责游戏主循环、状态管理和各子系统协调
 */

import { EntityManager } from '../entities/EntityManager.js';

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
    
    // 子系统
    this.systems = {
      terrainGenerator: null,
      player: null,
      camera: null,
      renderer: null,
      storageManager: null,
      inputHandler: null,
      entityManager: null      // 实体管理器
    };
    
    // 游戏世界配置
    this.worldConfig = {
      WORLD_HEIGHT: 512,
      CHUNK_SIZE: 16,
      BLOCK_SIZE: 16
    };
    
    // 实体管理器
    this.entityManager = new EntityManager(this.worldConfig);
    
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
      
      // 初始化输入处理
      this.initializeInput();
      console.log('✅ 输入系统初始化完成');
      
      console.log('✅ 游戏引擎初始化完成');
      return true;
    } catch (error) {
      console.error('❌ 游戏引擎初始化失败:', error);
      return false;
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
   * 初始化输入处理
   */
  initializeInput() {
    this.keys = {};
    
    // 键盘事件监听
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      this.handleKeyDown(e);
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.handleKeyUp(e);
    });
    
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
        if (this.systems.player) {
          // 设置放置控制状态
          this.systems.player.controls.place = true;
        }
      }
    });
    
    this.canvas.addEventListener('mouseup', (e) => {
      // 左键释放
      if (e.button === 0) { // 0表示左键
        if (this.systems.player) {
          // 重置放置控制状态
          this.systems.player.controls.place = false;
        }
      }
    });
    
    console.log('⌨️  输入系统初始化完成');
  }
  
  /**
   * 处理按键按下
   */
  handleKeyDown(event) {
    // 不再阻止任何按键的默认行为，让浏览器处理所有按键
    // 只处理特定的功能键
    
    // 特殊按键处理
    switch (event.code) {
      case 'Escape':
        this.togglePause();
        break;
      case 'KeyF':
        // F键用于切换飞行模式，在Player类中处理
        break;
      case 'Equal':
      case 'NumpadAdd':
        // +键用于提升飞行速度，在Player类中处理
        break;
      case 'Minus':
      case 'NumpadSubtract':
        // -键用于降低飞行速度，在Player类中处理
        break;
    }
  }
  
  /**
   * 处理按键释放
   */
  handleKeyUp(event) {
    // 暂时为空，后续可添加按键释放处理逻辑
  }
  
  /**
   * 注册子系统
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
    
    // 更新各个子系统
    if (this.systems.player) {
      this.systems.player.update(deltaTime, this.keys);
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
    
    // 同步时间到渲染器 (TODO #17)
    if (this.systems.renderer) {
      this.systems.renderer.setTimeOfDay(this.timeSystem.timeOfDay);
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
}