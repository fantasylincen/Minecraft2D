/**
 * MCv2 游戏引擎核心模块
 * 负责游戏主循环、状态管理和各子系统协调
 */

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
      fps: 60
    };
    
    // 子系统
    this.systems = {
      terrainGenerator: null,
      player: null,
      camera: null,
      renderer: null,
      storageManager: null,
      inputHandler: null
    };
    
    // 游戏世界配置
    this.worldConfig = {
      WORLD_HEIGHT: 512,
      CHUNK_SIZE: 16,
      BLOCK_SIZE: 16
    };
    
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
      
      // 设置画布
      this.setupCanvas();
      
      // 初始化输入处理
      this.initializeInput();
      
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
    
    // 设置画布大小
    const resizeCanvas = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 设置渲染上下文属性
    this.ctx.imageSmoothingEnabled = false; // 像素风格，不使用抗锯齿
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
    
    console.log('⌨️  输入系统初始化完成');
  }
  
  /**
   * 处理按键按下
   */
  handleKeyDown(event) {
    // 阻止默认行为
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    
    // 特殊按键处理
    switch (event.code) {
      case 'Escape':
        this.togglePause();
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
  }
  
  /**
   * 渲染游戏画面
   */
  render() {
    // 清除画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.systems.renderer) {
      this.systems.renderer.render(this.ctx);
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
    this.ctx.fillText('MCv2 - 2D Minecraft', this.canvas.width / 2, this.canvas.height / 2 - 50);
    
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
}