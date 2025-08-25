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
      showDebugConsole: false, // 调试控制台显示状态
      eternalDay: false // 永久白日模式 (新增)
    };
    
    // 环境设置
    this.environment = {
      skyColor: '#87CEEB',      // 天空蓝
      cloudColor: '#FFFFFF',    // 白云颜色
      darkCloudColor: '#696969', // 乌云颜色
      timeOfDay: 0.5,           // 时间（0-1，0.5为正午）
      cloudOffset: 0,           // 云朵偏移
      cloudSpeed: 10,           // 云朵移动速度
      currentBiome: 'plains',   // 当前生物群系 (新增)
      biomeEffects: {           // 生物群系特效 (新增)
        heatHaze: false,        // 热浪效果 (沙漠)
        fog: false,             // 雾效果 (沼泽)
        snow: false,            // 雪花效果 (苔原)
        birdSounds: false       // 鸟叫声 (森林)
      },
      weather: {                // 天气效果 (新增)
        type: 'clear',          // 天气类型 (clear, rain, snow)
        intensity: 0            // 天气强度 (0-1)
      },
      season: 'spring'          // 当前季节 (新增)
    };
    
    // 性能统计
    this.stats = {
      frameCount: 0,
      lastFrameTime: 0,
      fps: 0,
      drawCalls: 0,
      blocksRendered: 0,
      lastBlocksRendered: 0 // 上一次完整统计周期的方块数量
    };
    
    // 游戏对象引用
    this.camera = null;
    this.terrainGenerator = null;
    this.player = null;
    
    // 粒子系统 (新增)
    this.particles = [];
    
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
    
    // 渲染生物群系环境效果
    this.renderBiomeEffects();
    
    // 渲染天气效果
    this.renderWeather();
    
    // 渲染季节效果
    this.renderSeasonEffects();
    
    // 渲染地形
    this.renderTerrain();
    
    // 渲染玩家
    if (this.player) {
      this.player.render(ctx, this.camera);
      this.stats.drawCalls++;
    }
    
    // 渲染玩家放置预览 (新增 - 方块放置预览 - 基础实现)
    if (this.player) {
      this.player.renderPlacementPreview(this.ctx, this.camera);
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
   * 渲染天空背景 (TODO #17: 添加日出日落、太阳和月亮移动、星星显示)
   */
  renderSky() {
    // 基础天空颜色
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    
    // 根据时间计算天空颜色
    const timeOfDay = this.settings.eternalDay ? 0.5 : this.environment.timeOfDay; // 永久白日模式下始终为正午
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
    
    // 渲染星星 (只在夜晚显示) (TODO #17)
    // 永久白日模式下不显示星星
    if (!this.settings.eternalDay && (timeOfDay < 0.25 || timeOfDay > 0.75)) {
      this.renderStars();
    }
    
    // 渲染太阳 (白天和黄昏时显示) (TODO #17)
    // 永久白日模式下始终显示太阳
    if (this.settings.eternalDay || (timeOfDay >= 0.2 && timeOfDay <= 0.8)) {
      this.renderSun();
    }
    
    // 渲染月亮 (夜晚和黄昏时显示) (TODO #17)
    // 永久白日模式下不显示月亮
    if (!this.settings.eternalDay && (timeOfDay < 0.3 || timeOfDay > 0.7)) {
      this.renderMoon();
    }
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
   * 渲染单个方块 (TODO #17: 添加环境光照变化)
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
    
    // 计算光照级别 (TODO #17)
    const lightLevel = this.calculateLightLevel(worldY);
    
    // 应用光照效果到方块颜色
    const litColor = this.applyLighting(block.color, lightLevel);
    
    // 设置方块颜色
    this.ctx.fillStyle = litColor;
    
    // 渲染方块
    this.ctx.fillRect(
      screenPos.x - screenSize / 2,
      screenPos.y - screenSize / 2,
      screenSize,
      screenSize
    );
    
    // 添加方块边框（提高可视性）
    if (screenSize > 4) {
      this.ctx.strokeStyle = this.darkenColor(litColor, 0.3);
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
   * Author: Minecraft2D Development Team  
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
    
    // 每2秒更新一次FPS，显示2秒内的平均值 (TODO #32)
    const timeDiff = currentTime - this.stats.lastFrameTime;
    if (timeDiff >= 2000) { // 修改为2秒间隔
      // 防止除零错误和负值，确保合理的FPS范围
      if (timeDiff > 0 && this.stats.frameCount > 0) {
        // 计算2秒内的平均FPS (TODO #32)
        const calculatedFPS = Math.round((this.stats.frameCount * 1000) / timeDiff);
        // 限制FPS在合理范围内 (1-1000)
        this.stats.fps = Math.max(1, Math.min(1000, calculatedFPS));
      } else {
        // 如果计算异常，保持之前的FPS值或设为默认值
        this.stats.fps = Math.max(1, this.stats.fps || 60);
      }
      
      // 保存当前渲染的方块数量
      this.stats.lastBlocksRendered = this.stats.blocksRendered;
      
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
    // 如果启用了永久白日模式，时间始终为正午
    if (this.settings.eternalDay) {
      time = 0.5; // 正午时间
    }
    
    const oldTime = this.environment.timeOfDay;
    this.environment.timeOfDay = Math.max(0, Math.min(1, time));
    // 添加日志以便调试
    if (Math.abs(oldTime - this.environment.timeOfDay) > 0.01) {
      console.log(`_renderer: 时间更新为 ${this.environment.timeOfDay.toFixed(3)} (${(this.environment.timeOfDay * 24).toFixed(1)}h)`);
    }
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
   * Author: Minecraft2D Development Team
   */
  toggleDebugConsole() {
    this.settings.showDebugConsole = !this.settings.showDebugConsole;
  }
  
  /**
   * Set debug console visibility
   * Author: Minecraft2D Development Team
   * @param {boolean} visible - Whether the console should be visible
   */
  setDebugConsoleVisible(visible) {
    this.settings.showDebugConsole = visible;
  }
  
  /**
   * Get debug console visibility state
   * Author: Minecraft2D Development Team
   * @returns {boolean} Whether the debug console is visible
   */
  isDebugConsoleVisible() {
    return this.settings.showDebugConsole;
  }
  
  /**
   * Get extended renderer statistics
   * Author: Minecraft2D Development Team
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
   * Author: Minecraft2D Development Team
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
    return { 
      ...this.stats,
      // 返回上一次完整统计周期的方块数量，避免中间值的跳动
      blocksRendered: this.stats.lastBlocksRendered !== undefined ? this.stats.lastBlocksRendered : this.stats.blocksRendered
    };
  }
  
  /**
   * 重置统计
   */
  resetStats() {
    this.stats.frameCount = 0;
    this.stats.fps = 0;
    this.stats.drawCalls = 0;
    this.stats.blocksRendered = 0;
    this.stats.lastBlocksRendered = 0;
  }
  
  /**
   * 切换永久白日模式
   * @param {boolean} enabled - 是否启用永久白日模式
   */
  setEternalDay(enabled) {
    const wasEternalDay = this.settings.eternalDay;
    this.settings.eternalDay = enabled;
    
    // 如果启用了永久白日模式，将时间设置为正午
    if (enabled) {
      this.environment.timeOfDay = 0.5;
      console.log('☀️ 永久白日模式已启用，时间跳转到12:00');
    }
    
    // 如果状态发生了变化，强制重新渲染天空
    if (wasEternalDay !== enabled) {
      // 触发重绘以更新天空、太阳和月亮的状态
      if (this.canvas && this.ctx) {
        // 这里我们不直接调用render方法，而是通过设置一个标志
        // 让下一帧渲染时更新天空状态
        console.log(`☀️ 永久白日模式状态变更: ${wasEternalDay} -> ${enabled}`);
      }
    }
    
    console.log(`☀️ 永久白日模式: ${enabled ? '启用' : '禁用'}`);
  }
  
  /**
   * 获取永久白日模式状态
   * @returns {boolean} 是否启用了永久白日模式
   */
  isEternalDay() {
    return this.settings.eternalDay;
  }
  
  /**
   * 渲染太阳 (TODO #17)
   * Author: Minecraft2D Development Team
   */
  renderSun() {
    // 在永久白日模式下，太阳始终固定在正午位置
    const timeOfDay = this.settings.eternalDay ? 0.5 : this.environment.timeOfDay;
    
    // 计算太阳位置 (从东南到西南的弧线运动)
    const sunAngle = (timeOfDay - 0.25) * Math.PI; // -PI/4 到 3PI/4
    const sunRadius = Math.min(this.canvas.width, this.canvas.height) * 0.4;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height * 0.8; // 地平线位置
    
    const sunX = centerX + Math.cos(sunAngle) * sunRadius;
    const sunY = centerY - Math.sin(sunAngle) * sunRadius;
    
    // 只在太阳在地平线上方时渲染
    if (sunY < centerY) {
      const sunSize = 30;
      
      // 渲染太阳光晕
      const sunGlow = this.ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunSize * 2);
      sunGlow.addColorStop(0, 'rgba(255, 255, 0, 0.3)');
      sunGlow.addColorStop(0.5, 'rgba(255, 255, 0, 0.1)');
      sunGlow.addColorStop(1, 'rgba(255, 255, 0, 0)');
      
      this.ctx.fillStyle = sunGlow;
      this.ctx.fillRect(sunX - sunSize * 2, sunY - sunSize * 2, sunSize * 4, sunSize * 4);
      
      // 渲染太阳本体
      this.ctx.fillStyle = '#FFD700'; // 金色
      this.ctx.beginPath();
      this.ctx.arc(sunX, sunY, sunSize, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 渲染太阳光芒
      this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
      this.ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const rayAngle = (i / 8) * Math.PI * 2;
        const rayStartX = sunX + Math.cos(rayAngle) * (sunSize + 5);
        const rayStartY = sunY + Math.sin(rayAngle) * (sunSize + 5);
        const rayEndX = sunX + Math.cos(rayAngle) * (sunSize + 15);
        const rayEndY = sunY + Math.sin(rayAngle) * (sunSize + 15);
        
        this.ctx.beginPath();
        this.ctx.moveTo(rayStartX, rayStartY);
        this.ctx.lineTo(rayEndX, rayEndY);
        this.ctx.stroke();
      }
      
      this.stats.drawCalls += 3; // 光晕、太阳、光芒
    }
  }
  
  /**
   * 渲染月亮 (TODO #17)
   * Author: Minecraft2D Development Team
   */
  renderMoon() {
    // 在永久白日模式下，月亮不显示
    if (this.settings.eternalDay) {
      return;
    }
    
    const timeOfDay = this.environment.timeOfDay;
    
    // 计算月亮位置 (与太阳相反的运动轨迹)
    const moonAngle = (timeOfDay + 0.5) * Math.PI; // 与太阳相对
    const moonRadius = Math.min(this.canvas.width, this.canvas.height) * 0.35;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height * 0.8;
    
    const moonX = centerX + Math.cos(moonAngle) * moonRadius;
    const moonY = centerY - Math.sin(moonAngle) * moonRadius;
    
    // 只在月亮在地平线上方时渲染
    if (moonY < centerY) {
      const moonSize = 20;
      
      // 渲染月亮光晕 (较微弱)
      const moonGlow = this.ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonSize * 1.5);
      moonGlow.addColorStop(0, 'rgba(220, 220, 255, 0.2)');
      moonGlow.addColorStop(1, 'rgba(220, 220, 255, 0)');
      
      this.ctx.fillStyle = moonGlow;
      this.ctx.fillRect(moonX - moonSize * 1.5, moonY - moonSize * 1.5, moonSize * 3, moonSize * 3);
      
      // 渲染月亮本体
      this.ctx.fillStyle = '#F0F8FF'; // 淡蓝白色
      this.ctx.beginPath();
      this.ctx.arc(moonX, moonY, moonSize, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 渲染月亮表面的暗影 (模拟月相)
      this.ctx.fillStyle = 'rgba(180, 180, 180, 0.3)';
      this.ctx.beginPath();
      this.ctx.arc(moonX - moonSize * 0.3, moonY - moonSize * 0.2, moonSize * 0.3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(moonX + moonSize * 0.2, moonY + moonSize * 0.3, moonSize * 0.2, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.stats.drawCalls += 3; // 光晕、月亮、阴影
    }
  }
  
  /**
   * 渲染星星 (TODO #17)
   * Author: Minecraft2D Development Team
   */
  renderStars() {
    // 在永久白日模式下，星星不显示
    if (this.settings.eternalDay) {
      return;
    }
    
    const timeOfDay = this.environment.timeOfDay;
    
    // 计算星星亮度 (夜晚更亮)
    let starAlpha = 0;
    if (timeOfDay < 0.1 || timeOfDay > 0.9) {
      starAlpha = 0.8; // 深夜
    } else if (timeOfDay < 0.25 || timeOfDay > 0.75) {
      starAlpha = Math.min(0.8, Math.max(0, (0.25 - Math.abs(timeOfDay - 0.5)) * 4)); // 渐变
    }
    
    if (starAlpha > 0) {
      // 生成固定的星星位置 (使用伪随机数生成器)
      const starCount = 50;
      const stars = [];
      
      for (let i = 0; i < starCount; i++) {
        const seed = i * 12345; // 使用固定种子
        const x = (this.simpleHash(seed) % this.canvas.width);
        const y = (this.simpleHash(seed + 1) % (this.canvas.height * 0.6)); // 只在上半部显示
        const size = 1 + (this.simpleHash(seed + 2) % 3); // 1-3像素大小
        const brightness = 0.5 + ((this.simpleHash(seed + 3) % 500) / 1000); // 0.5-1.0亮度
      
        stars.push({ x, y, size, brightness });
      }
      
      // 渲染星星
      stars.forEach(star => {
        const alpha = starAlpha * star.brightness;
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.fillRect(star.x, star.y, star.size, star.size);
      
        // 为一些星星添加闪烁效果
        if (star.brightness > 0.8 && Math.random() > 0.7) {
          this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
          this.ctx.fillRect(star.x - 1, star.y, 3, 1); // 水平十字
          this.ctx.fillRect(star.x, star.y - 1, 1, 3); // 垂直十字
        }
      });
      
      this.stats.drawCalls += starCount;
    }
  }
  
  /**
   * 渲染生物群系环境效果
   */
  renderBiomeEffects() {
    // 根据当前生物群系渲染特殊效果
    if (this.environment.biomeEffects.heatHaze) {
      this.renderHeatHaze();
    }
    
    if (this.environment.biomeEffects.fog) {
      this.renderFog();
    }
    
    if (this.environment.biomeEffects.snow) {
      this.renderSnow();
    }
    
    // 更新粒子系统
    this.updateParticles();
    this.renderParticles();
  }
  
  /**
   * 渲染热浪效果 (沙漠)
   */
  renderHeatHaze() {
    // 简单的热浪效果实现
    // 这里可以添加更复杂的热浪效果，比如使用Canvas的变形功能
    // 目前实现一个简单的透明度变化效果
    const time = Date.now() / 1000;
    const alpha = 0.1 + Math.sin(time * 2) * 0.05;
    
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = '#FFA500'; // 橙色
    this.ctx.fillRect(0, this.canvas.height * 0.7, this.canvas.width, this.canvas.height * 0.3);
    this.ctx.globalAlpha = 1.0;
    this.stats.drawCalls++;
  }
  
  /**
   * 渲染雾效果 (沼泽)
   */
  renderFog() {
    // 渐变雾效果
    const gradient = this.ctx.createLinearGradient(0, this.canvas.height * 0.3, 0, this.canvas.height);
    gradient.addColorStop(0, 'rgba(47, 79, 47, 0)'); // 透明
    gradient.addColorStop(1, 'rgba(47, 79, 47, 0.4)'); // 半透明绿色
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, this.canvas.height * 0.3, this.canvas.width, this.canvas.height * 0.7);
    this.stats.drawCalls++;
  }
  
  /**
   * 渲染雪效果 (苔原)
   */
  renderSnow() {
    // 简单的雪花效果
    // 这里可以实现更复杂的雪花粒子系统
    for (let i = 0; i < 50; i++) {
      const x = (Math.random() * this.canvas.width + this.environment.cloudOffset * 0.1) % this.canvas.width;
      const y = (Math.random() * this.canvas.height) % this.canvas.height;
      const size = Math.random() * 3 + 1;
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.stats.drawCalls++;
  }
  
  /**
   * 更新粒子系统
   */
  updateParticles() {
    // 更新现有粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 1;
      
      // 移除生命周期结束的粒子
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    
    // 添加新粒子（根据当前生物群系）
    if (this.environment.biomeEffects.heatHaze && Math.random() < 0.3) {
      this.addHeatParticle();
    }
    
    if (this.environment.biomeEffects.snow && Math.random() < 0.5) {
      this.addSnowParticle();
    }
  }
  
  /**
   * 添加热浪粒子
   */
  addHeatParticle() {
    const particle = {
      x: Math.random() * this.canvas.width,
      y: this.canvas.height * 0.8 + Math.random() * this.canvas.height * 0.2,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 2,
      life: 30 + Math.random() * 30,
      size: Math.random() * 2 + 1,
      color: 'rgba(255, 165, 0, 0.3)'
    };
    this.particles.push(particle);
  }
  
  /**
   * 添加雪花粒子
   */
  addSnowParticle() {
    const particle = {
      x: Math.random() * this.canvas.width,
      y: 0,
      vx: (Math.random() - 0.5) * 1,
      vy: Math.random() * 2 + 1,
      life: 100 + Math.random() * 100,
      size: Math.random() * 3 + 1,
      color: '#FFFFFF'
    };
    this.particles.push(particle);
  }
  
  /**
   * 渲染粒子
   */
  renderParticles() {
    this.particles.forEach(particle => {
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    if (this.particles.length > 0) {
      this.stats.drawCalls++;
    }
  }
  
  /**
   * 设置当前生物群系
   * @param {string} biome - 生物群系类型
   */
  setCurrentBiome(biome) {
    this.environment.currentBiome = biome;
    
    // 根据生物群系设置特效
    this.environment.biomeEffects.heatHaze = biome === 'desert';
    this.environment.biomeEffects.fog = biome === 'swamp';
    this.environment.biomeEffects.snow = biome === 'tundra';
    this.environment.biomeEffects.birdSounds = biome === 'forest';
  }
  
  /**
   * 设置季节
   * @param {string} season - 季节名称
   */
  setSeason(season) {
    this.environment.season = season;
  }
  
  /**
   * 渲染季节效果
   */
  renderSeasonEffects() {
    switch (this.environment.season) {
      case 'spring':
        this.renderSpringEffects();
        break;
      case 'summer':
        this.renderSummerEffects();
        break;
      case 'autumn':
        this.renderAutumnEffects();
        break;
      case 'winter':
        this.renderWinterEffects();
        break;
    }
  }
  
  /**
   * 渲染春季效果
   */
  renderSpringEffects() {
    // 春季可以添加花朵飘落效果或者更绿的色调
    // 这里可以实现更复杂的春季效果
  }
  
  /**
   * 渲染夏季效果
   */
  renderSummerEffects() {
    // 夏季可以添加热浪效果或者更亮的色调
    // 这里可以实现更复杂的夏季效果
  }
  
  /**
   * 渲染秋季效果
   */
  renderAutumnEffects() {
    // 秋季可以添加落叶效果或者橙色色调
    // 这里可以实现更复杂的秋季效果
  }
  
  /**
   * 渲染冬季效果
   */
  renderWinterEffects() {
    // 冬季可以添加雪花效果或者蓝色色调
    // 这里可以实现更复杂的冬季效果
  }
  
  /**
   * 计算光照级别 (TODO #17, #29)
   * Author: Minecraft2D Development Team
   * @param {number} worldY - 世界 Y 坐标
   * @returns {number} 光照级别 (0-1)
   */
  calculateLightLevel(worldY) {
    // 如果启用了永久白日模式，始终返回最大光照
    if (this.settings.eternalDay) {
      // 深度光照衰减 (地下更暗)
      const surfaceLevel = this.worldConfig.WORLD_HEIGHT * 0.7; // 假设地表附近
      const depthFactor = Math.max(0.1, Math.min(1.0, worldY / surfaceLevel));
      
      // 永久白日模式下始终使用最大光照
      const finalLight = 1.0 * depthFactor;
      
      // 确保最低亮度，避免完全黑暗
      return Math.max(0.5, Math.min(1.0, finalLight)); // 提高最低亮度到0.5以确保明亮
    }
    
    const timeOfDay = this.environment.timeOfDay;
    
    // 基础环境光照 (根据时间计算)
    let ambientLight = 1.0;
    
    // 更真实的光照模型
    if (timeOfDay >= 0.25 && timeOfDay <= 0.75) {
      // 白天时段 (6:00-18:00)
      if (timeOfDay >= 0.45 && timeOfDay <= 0.55) {
        // 正午时段 (10:48-13:12) 光照最强
        ambientLight = 1.0;
      } else if (timeOfDay >= 0.35 && timeOfDay <= 0.65) {
        // 上午/下午时段 (8:24-15:36) 光照较强
        ambientLight = 0.9;
      } else {
        // 早晨/傍晚时段 (6:00-8:24, 15:36-18:00) 光照中等
        ambientLight = 0.7;
      }
    } else {
      // 夜晚时段
      if (timeOfDay < 0.1 || timeOfDay > 0.9) {
        // 深夜 (0:00-2:24, 21:36-24:00) 最暗
        ambientLight = 0.15;
      } else if (timeOfDay < 0.2 || timeOfDay > 0.8) {
        // 黎明/黄昏 (2:24-6:00, 18:00-21:36) 较暗
        ambientLight = 0.3;
      } else {
        // 过渡时段
        ambientLight = 0.2;
      }
    }
    
    // 深度光照衰减 (地下更暗)
    const surfaceLevel = this.worldConfig.WORLD_HEIGHT * 0.7; // 假设地表附近
    const depthFactor = Math.max(0.1, Math.min(1.0, worldY / surfaceLevel));
    
    // 综合光照计算
    const finalLight = ambientLight * depthFactor;
    
    // 确保最低亮度，避免完全黑暗
    return Math.max(0.15, Math.min(1.0, finalLight));
  }
  
  /**
   * 应用光照效果到颜色 (TODO #17, #29)
   * Author: Minecraft2D Development Team
   * @param {string} color - 原始颜色
   * @param {number} lightLevel - 光照级别 (0-1)
   * @returns {string} 应用光照后的颜色
   */
  applyLighting(color, lightLevel) {
    // 解析颜色
    let r, g, b;
    
    if (color.startsWith('#')) {
      // 十六进制颜色
      r = parseInt(color.substr(1, 2), 16);
      g = parseInt(color.substr(3, 2), 16);
      b = parseInt(color.substr(5, 2), 16);
    } else if (color.startsWith('rgb(')) {
      // RGB 颜色
      const values = color.match(/\d+/g);
      r = parseInt(values[0]);
      g = parseInt(values[1]);
      b = parseInt(values[2]);
    } else {
      // 默认颜色（灰色）
      r = g = b = 128;
    }
    
    // 应用光照系数，但确保不会过暗
    const adjustedLightLevel = Math.max(0.5, lightLevel); // 确保最低亮度为0.5以保持明亮
    r = Math.floor(r * adjustedLightLevel);
    g = Math.floor(g * adjustedLightLevel);
    b = Math.floor(b * adjustedLightLevel);
    
    // 如果启用了永久白日模式，不应用时间相关的色调调整
    if (!this.settings.eternalDay) {
      // 根据时间添加色调调整
      const timeOfDay = this.environment.timeOfDay;
      if (timeOfDay >= 0.25 && timeOfDay <= 0.75) {
        // 白天时段 - 添加轻微的暖色调
        let dayIntensity = 0;
        if (timeOfDay >= 0.45 && timeOfDay <= 0.55) {
          // 正午时段
          dayIntensity = 0.15;
        } else if (timeOfDay >= 0.35 && timeOfDay <= 0.65) {
          // 上午/下午时段
          dayIntensity = 0.1;
        } else {
          // 早晨/傍晚时段
          dayIntensity = 0.05;
        }
        
        if (dayIntensity > 0) {
          r = Math.floor(r * (1 + dayIntensity)); // 增加红色
          g = Math.floor(g * (1 + dayIntensity * 0.5)); // 轻微增加绿色
          b = Math.floor(b * (1 - dayIntensity * 0.2)); // 轻微减少蓝色
        }
      } else {
        // 夜晚时段 - 添加蓝色色调模拟月光
        let nightIntensity = 0;
        if (timeOfDay < 0.1 || timeOfDay > 0.9) {
          // 深夜，最暗
          nightIntensity = 0.2;
        } else if (timeOfDay < 0.2 || timeOfDay > 0.8) {
          // 黎明/黄昏，较暗
          nightIntensity = 0.1;
        } else {
          // 过渡时段
          nightIntensity = 0.05;
        }
        
        if (nightIntensity > 0) {
          r = Math.floor(r * (1 - nightIntensity * 0.1)); // 轻微减少红色
          g = Math.floor(g * (1 - nightIntensity * 0.05)); // 轻微减少绿色
          b = Math.floor(b * (1 + nightIntensity * 0.2)); // 增加蓝色
        }
      }
    }
    
    // 确保颜色值在有效范围内
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  /**
   * 设置天气
   * @param {string} type - 天气类型
   * @param {number} intensity - 天气强度
   */
  setWeather(type, intensity) {
    this.environment.weather.type = type;
    this.environment.weather.intensity = intensity;
  }
  
  /**
   * 渲染天气效果
   */
  renderWeather() {
    switch (this.environment.weather.type) {
      case 'rain':
        this.renderRain();
        break;
      case 'snow':
        this.renderSnowWeather();
        break;
      case 'storm':
        this.renderStorm();
        break;
      // clear天气不需要特殊渲染
    }
  }
  
  /**
   * 渲染雨天效果
   */
  renderRain() {
    if (this.environment.weather.intensity <= 0) return;
    
    const rainCount = Math.floor(200 * this.environment.weather.intensity);
    const rainAlpha = 0.6 * this.environment.weather.intensity;
    
    this.ctx.strokeStyle = `rgba(100, 100, 255, ${rainAlpha})`;
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i < rainCount; i++) {
      const x = (Math.random() * this.canvas.width + this.environment.cloudOffset * 0.5) % this.canvas.width;
      const y = Math.random() * this.canvas.height;
      const length = 10 + Math.random() * 10;
      const speed = 5 + Math.random() * 5;
      
      // 雨滴效果
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x - 2, y + length);
      this.ctx.stroke();
    }
    
    this.stats.drawCalls++;
  }
  
  /**
   * 渲染雪天效果
   */
  renderSnowWeather() {
    if (this.environment.weather.intensity <= 0) return;
    
    const snowCount = Math.floor(150 * this.environment.weather.intensity);
    const snowAlpha = 0.8 * this.environment.weather.intensity;
    
    this.ctx.fillStyle = `rgba(255, 255, 255, ${snowAlpha})`;
    
    for (let i = 0; i < snowCount; i++) {
      const x = (Math.random() * this.canvas.width + this.environment.cloudOffset * 0.2) % this.canvas.width;
      const y = Math.random() * this.canvas.height;
      const size = 1 + Math.random() * 3;
      
      // 雪花效果
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.stats.drawCalls++;
  }
  
  /**
   * 渲染暴风雨效果
   */
  renderStorm() {
    if (this.environment.weather.intensity <= 0) return;
    
    // 渲染雨天效果
    this.renderRain();
    
    // 渲染闪电效果
    if (Math.random() < 0.01 * this.environment.weather.intensity) {
      this.renderLightning();
    }
  }
  
  /**
   * 渲染闪电效果
   */
  renderLightning() {
    // 简单的闪电效果
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    // 闪电位置
    const startX = Math.random() * this.canvas.width;
    let currentX = startX;
    let currentY = 0;
    
    // 绘制闪电路径
    this.ctx.beginPath();
    this.ctx.moveTo(currentX, currentY);
    
    while (currentY < this.canvas.height) {
      currentX += (Math.random() - 0.5) * 100;
      currentY += 20 + Math.random() * 30;
      this.ctx.lineTo(currentX, currentY);
    }
    
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.stats.drawCalls++;
  }
}