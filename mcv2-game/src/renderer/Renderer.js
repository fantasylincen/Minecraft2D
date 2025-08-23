/**
 * 渲染系统
 * 负责游戏画面的绘制、环境效果和渲染优化
 */

import { blockConfig } from '../config/BlockConfig.js';

export class Renderer {
  constructor(canvas, worldConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.worldConfig = worldConfig;
    
    // 渲染设置
    this.settings = {
      showGrid: false,
      showDebugInfo: false,
      enableParticles: true,
      enableLighting: false,
      renderDistance: 5, // 区块渲染距离
      showDebugConsole: false // 调试控制台显示状态
    };
    
    // 环境设置
    this.environment = {
      skyColor: '#87CEEB',      // 天空蓝
      cloudColor: '#FFFFFF',    // 白云颜色
      darkCloudColor: '#696969', // 乌云颜色
      timeOfDay: 0.5,           // 时间（0-1，0.5为正午）
      cloudOffset: 0,           // 云朵偏移
      cloudSpeed: 10,           // 云朵移动速度
    };
    
    // 性能统计
    this.stats = {
      frameCount: 0,
      lastFrameTime: 0,
      fps: 0,
      drawCalls: 0,
      blocksRendered: 0
    };
    
    // 游戏对象引用
    this.camera = null;
    this.terrainGenerator = null;
    this.player = null;
    
    console.log('🎨 Renderer 初始化完成');
  }
  
  /**
   * 设置游戏对象引用
   */
  setReferences(camera, terrainGenerator, player) {
    this.camera = camera;
    this.terrainGenerator = terrainGenerator;
    this.player = player;
  }
  
  /**
   * 主渲染函数
   */
  render(ctx) {
    const startTime = performance.now();
    
    // 重置统计
    this.stats.drawCalls = 0;
    this.stats.blocksRendered = 0;
    
    // 清除画布
    this.clearCanvas();
    
    // 渲染天空背景
    this.renderSky();
    
    // 渲染云朵
    this.renderClouds();
    
    // 渲染地形
    this.renderTerrain();
    
    // 渲染玩家
    if (this.player) {
      this.player.render(ctx, this.camera);
      this.stats.drawCalls++;
    }
    
    // 渲染网格（调试用）
    if (this.settings.showGrid) {
      this.renderGrid();
    }
    
    // 渲染调试信息
    if (this.settings.showDebugInfo) {
      this.renderDebugInfo();
    }
    
    // 更新性能统计
    this.updateStats(startTime);
  }
  
  /**
   * 清除画布
   */
  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  /**
   * 渲染天空背景
   */
  renderSky() {
    // 基础天空颜色
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    
    // 根据时间计算天空颜色
    const timeOfDay = this.environment.timeOfDay;
    let skyColor1, skyColor2;
    
    if (timeOfDay < 0.2 || timeOfDay > 0.8) {
      // 夜晚
      skyColor1 = '#191970'; // 午夜蓝
      skyColor2 = '#000080'; // 海军蓝
    } else if (timeOfDay < 0.3 || timeOfDay > 0.7) {
      // 黄昏/黎明
      skyColor1 = '#FF7F50'; // 珊瑚色
      skyColor2 = '#87CEEB'; // 天空蓝
    } else {
      // 白天
      skyColor1 = '#87CEEB'; // 天空蓝
      skyColor2 = '#98FB98'; // 浅绿色
    }
    
    gradient.addColorStop(0, skyColor1);
    gradient.addColorStop(1, skyColor2);
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.stats.drawCalls++;
  }
  
  /**
   * 渲染云朵
   */
  renderClouds() {
    if (!this.camera) return;
    
    // 云朵基础参数
    const baseCloudHeight = this.canvas.height * 0.15; // 基础云朵高度位置
    const cloudHeightVariation = this.canvas.height * 0.15; // 云朵高度变化范围
    const cloudSize = 60;
    const cloudSpacing = 200;
    
    // 更新云朵位置
    this.environment.cloudOffset += this.environment.cloudSpeed * 0.016; // 假设60FPS
    
    // 计算可见范围内的云朵
    const leftmostCloud = Math.floor((this.camera.bounds.left - this.environment.cloudOffset) / cloudSpacing);
    const rightmostCloud = Math.ceil((this.camera.bounds.right - this.environment.cloudOffset) / cloudSpacing);
    
    this.ctx.globalAlpha = 0.8;
    
    for (let i = leftmostCloud; i <= rightmostCloud; i++) {
      const cloudX = i * cloudSpacing + this.environment.cloudOffset;
      
      // 为每个云朵生成固定但随机的高度
      // 使用云朵索引作为种子，确保每个云朵的高度保持一致
      const heightSeed = this.simpleHash(i);
      const heightFactor = (heightSeed % 1000) / 1000; // 0-1之间的值
      
      // 使用平滑的高度分布，避免太极端的值
      const smoothHeightFactor = this.smoothStep(heightFactor);
      const cloudHeight = baseCloudHeight + (smoothHeightFactor * cloudHeightVariation);
      
      const screenPos = this.camera.worldToScreen(cloudX, this.canvas.height - cloudHeight);
      
      // 交替渲染白云和乌云，同时考虑高度影响云朵类型
      const isStormCloud = (i % 5 === 0) || (heightFactor < 0.3); // 低云更容易是乌云
      
      // 根据高度调整云朵大小和透明度
      const sizeFactor = 0.8 + (smoothHeightFactor * 0.4); // 高云稍大一些
      const adjustedSize = cloudSize * sizeFactor;
      
      this.renderCloud(
        screenPos.x, 
        screenPos.y, 
        adjustedSize, 
        isStormCloud ? this.environment.darkCloudColor : this.environment.cloudColor
      );
    }
    
    this.ctx.globalAlpha = 1.0;
  }
  
  /**
   * 简单哈希函数，用于生成固定但随机的值
   * @param {number} seed - 种子值
   * @returns {number} 哈希值
   */
  simpleHash(seed) {
    let hash = seed;
    hash = ((hash << 13) ^ hash) & 0x7fffffff;
    hash = (hash * (hash * hash * 15731 + 789221) + 1376312589) & 0x7fffffff;
    return hash;
  }
  
  /**
   * 平滑步长函数，用于创建更自然的分布
   * @param {number} t - 输入值 (0-1)
   * @returns {number} 平滑后的值 (0-1)
   */
  smoothStep(t) {
    return t * t * (3 - 2 * t);
  }
  
  /**
   * 渲染单个云朵
   */
  renderCloud(x, y, size, color) {
    this.ctx.fillStyle = color;
    
    // 简单的云朵形状（几个圆形组成）
    const circles = [
      { x: -size/2, y: 0, r: size/3 },
      { x: -size/4, y: -size/4, r: size/4 },
      { x: size/4, y: -size/4, r: size/4 },
      { x: size/2, y: 0, r: size/3 },
      { x: 0, y: -size/6, r: size/3 }
    ];
    
    this.ctx.beginPath();
    circles.forEach(circle => {
      this.ctx.arc(x + circle.x, y + circle.y, circle.r, 0, Math.PI * 2);
    });
    this.ctx.fill();
    
    this.stats.drawCalls++;
  }
  
  /**
   * 渲染地形
   */
  renderTerrain() {
    if (!this.camera || !this.terrainGenerator) return;
    
    const blockSize = this.worldConfig.BLOCK_SIZE;
    const visibleRange = this.camera.getVisibleBlockRange();
    
    // 限制渲染范围以提高性能
    const minY = Math.max(0, visibleRange.minY);
    const maxY = Math.min(this.worldConfig.WORLD_HEIGHT - 1, visibleRange.maxY);
    
    // 渲染可见的方块
    for (let y = minY; y <= maxY; y++) {
      for (let x = visibleRange.minX; x <= visibleRange.maxX; x++) {
        const blockId = this.terrainGenerator.getBlock(x, y);
        
        if (blockId !== blockConfig.getBlock('air').id) {
          this.renderBlock(x, y, blockId);
          this.stats.blocksRendered++;
        }
      }
    }
  }
  
  /**
   * 渲染单个方块
   */
  renderBlock(worldX, worldY, blockId) {
    const blockSize = this.worldConfig.BLOCK_SIZE;
    const worldPosX = worldX * blockSize + blockSize / 2;
    const worldPosY = worldY * blockSize + blockSize / 2;
    
    // 检查是否在视野内
    if (!this.camera.isInView(worldPosX, worldPosY)) {
      return;
    }
    
    const screenPos = this.camera.worldToScreen(worldPosX, worldPosY);
    const screenSize = blockSize * this.camera.zoom;
    
    // 如果方块太小就不渲染
    if (screenSize < 1) return;
    
    // 获取方块信息
    const block = blockConfig.getBlock(blockId);
    if (!block) return;
    
    // 设置方块颜色
    this.ctx.fillStyle = block.color;
    
    // 渲染方块
    this.ctx.fillRect(
      screenPos.x - screenSize / 2,
      screenPos.y - screenSize / 2,
      screenSize,
      screenSize
    );
    
    // 添加方块边框（提高可视性）
    if (screenSize > 4) {
      this.ctx.strokeStyle = this.darkenColor(block.color, 0.3);
      this.ctx.lineWidth = Math.max(1, screenSize * 0.05);
      this.ctx.strokeRect(
        screenPos.x - screenSize / 2,
        screenPos.y - screenSize / 2,
        screenSize,
        screenSize
      );
    }
    
    this.stats.drawCalls++;
  }
  
  /**
   * 渲染网格（调试用）
   */
  renderGrid() {
    if (!this.camera) return;
    
    const blockSize = this.worldConfig.BLOCK_SIZE;
    const visibleRange = this.camera.getVisibleBlockRange();
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    
    // 垂直线
    for (let x = visibleRange.minX; x <= visibleRange.maxX; x++) {
      const worldX = x * blockSize;
      const screenPos = this.camera.worldToScreen(worldX, 0);
      
      this.ctx.beginPath();
      this.ctx.moveTo(screenPos.x, 0);
      this.ctx.lineTo(screenPos.x, this.canvas.height);
      this.ctx.stroke();
    }
    
    // 水平线
    for (let y = visibleRange.minY; y <= visibleRange.maxY; y++) {
      const worldY = y * blockSize;
      const screenPos = this.camera.worldToScreen(0, worldY);
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, screenPos.y);
      this.ctx.lineTo(this.canvas.width, screenPos.y);
      this.ctx.stroke();
    }
  }
  
  /**
   * 渲染调试信息
   */
  renderDebugInfo() {
    const padding = 10;
    const lineHeight = 16;
    let y = padding;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(padding - 5, padding - 5, 250, 150);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '12px monospace';
    
    const debugInfo = [
      `FPS: ${this.stats.fps}`,
      `Draw Calls: ${this.stats.drawCalls}`,
      `Blocks Rendered: ${this.stats.blocksRendered}`,
      `Camera: (${Math.round(this.camera?.position.x || 0)}, ${Math.round(this.camera?.position.y || 0)})`,
      `Zoom: ${(this.camera?.zoom || 1).toFixed(2)}`,
      `Player: (${Math.round(this.player?.position.x || 0)}, ${Math.round(this.player?.position.y || 0)})`,
      `On Ground: ${this.player?.physics.onGround || false}`,
      `Time: ${(this.environment.timeOfDay * 24).toFixed(1)}h`
    ];
    
    debugInfo.forEach(text => {
      this.ctx.fillText(text, padding, y);
      y += lineHeight;
    });
  }
  
  /**
   * 更新性能统计
   * Author: MCv2 Development Team  
   * 修复FPS显示异常和0帧问题 (TODO #29)
   */
  updateStats(startTime) {
    const frameTime = performance.now() - startTime;
    const currentTime = performance.now();
    
    this.stats.frameCount++;
    
    // 初始化lastFrameTime，防止初始化时间为0的问题
    if (this.stats.lastFrameTime === 0) {
      this.stats.lastFrameTime = currentTime;
      this.stats.fps = 60; // 设置初始默认FPS
      return;
    }
    
    // 每秒更新一次FPS，添加稳定性检查
    const timeDiff = currentTime - this.stats.lastFrameTime;
    if (timeDiff >= 1000) {
      // 防止除零错误和负值，确保合理的FPS范围
      if (timeDiff > 0 && this.stats.frameCount > 0) {
        const calculatedFPS = Math.round((this.stats.frameCount * 1000) / timeDiff);
        // 限制FPS在合理范围内 (1-1000)
        this.stats.fps = Math.max(1, Math.min(1000, calculatedFPS));
      } else {
        // 如果计算异常，保持之前的FPS值或设为默认值
        this.stats.fps = Math.max(1, this.stats.fps || 60);
      }
      
      this.stats.frameCount = 0;
      this.stats.lastFrameTime = currentTime;
    }
  }
  
  /**
   * 颜色变暗工具函数
   */
  darkenColor(color, factor) {
    // 简单的颜色变暗算法
    if (color.startsWith('#')) {
      const r = parseInt(color.substr(1, 2), 16);
      const g = parseInt(color.substr(3, 2), 16);
      const b = parseInt(color.substr(5, 2), 16);
      
      const newR = Math.floor(r * (1 - factor));
      const newG = Math.floor(g * (1 - factor));
      const newB = Math.floor(b * (1 - factor));
      
      return `rgb(${newR}, ${newG}, ${newB})`;
    }
    return color;
  }
  
  /**
   * 设置时间
   */
  setTimeOfDay(time) {
    this.environment.timeOfDay = Math.max(0, Math.min(1, time));
  }
  
  /**
   * 切换调试信息
   */
  toggleDebugInfo() {
    this.settings.showDebugInfo = !this.settings.showDebugInfo;
  }
  
  /**
   * 切换网格显示
   */
  toggleGrid() {
    this.settings.showGrid = !this.settings.showGrid;
  }
  
  /**
   * Toggle debug console visibility
   * Author: MCv2 Development Team
   */
  toggleDebugConsole() {
    this.settings.showDebugConsole = !this.settings.showDebugConsole;
  }
  
  /**
   * Set debug console visibility
   * Author: MCv2 Development Team
   * @param {boolean} visible - Whether the console should be visible
   */
  setDebugConsoleVisible(visible) {
    this.settings.showDebugConsole = visible;
  }
  
  /**
   * Get debug console visibility state
   * Author: MCv2 Development Team
   * @returns {boolean} Whether the debug console is visible
   */
  isDebugConsoleVisible() {
    return this.settings.showDebugConsole;
  }
  
  /**
   * Get extended renderer statistics
   * Author: MCv2 Development Team
   * @returns {Object} Extended statistics object
   */
  getExtendedStats() {
    return {
      ...this.stats,
      settings: { ...this.settings },
      memory: {
        estimated: this.estimateMemoryUsage(),
        canvasSize: `${this.canvas.width}x${this.canvas.height}`
      }
    };
  }
  
  /**
   * Estimate memory usage (rough calculation)
   * Author: MCv2 Development Team
   * @returns {string} Estimated memory usage in MB
   */
  estimateMemoryUsage() {
    try {
      const canvasMemory = (this.canvas.width * this.canvas.height * 4) / (1024 * 1024); // 4 bytes per pixel
      return `~${canvasMemory.toFixed(2)}MB`;
    } catch (error) {
      return 'Unknown';
    }
  }
  
  /**
   * 获取渲染统计
   */
  getStats() {
    return { ...this.stats };
  }
  
  /**
   * 重置统计
   */
  resetStats() {
    this.stats.frameCount = 0;
    this.stats.fps = 0;
    this.stats.drawCalls = 0;
    this.stats.blocksRendered = 0;
  }
}