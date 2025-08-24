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
   * 渲染天空背景 (TODO #17: 添加日出日落、太阳和月亮移动、星星显示)
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
    
    // 渲染星星 (只在夜晚显示) (TODO #17)
    if (timeOfDay < 0.25 || timeOfDay > 0.75) {
      this.renderStars();
    }
    
    // 渲染太阳 (白天和黄昏时显示) (TODO #17)
    if (timeOfDay >= 0.2 && timeOfDay <= 0.8) {
      this.renderSun();
    }
    
    // 渲染月亮 (夜晚和黄昏时显示) (TODO #17)
    if (timeOfDay < 0.3 || timeOfDay > 0.7) {
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
  
  /**
   * 渲染太阳 (TODO #17)
   * Author: Minecraft2D Development Team
   */
  renderSun() {
    const timeOfDay = this.environment.timeOfDay;
    
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
   * 计算光照级别 (TODO #17)
   * Author: Minecraft2D Development Team
   * @param {number} worldY - 世界 Y 坐标
   * @returns {number} 光照级别 (0-1)
   */
  calculateLightLevel(worldY) {
    const timeOfDay = this.environment.timeOfDay;
    
    // 基础环境光照 (根据时间计算)
    let ambientLight = 1.0; // 默认亮度
    
    if (timeOfDay < 0.2 || timeOfDay > 0.8) {
      // 夜晚：非常暗
      ambientLight = 0.3;
    } else if (timeOfDay < 0.3 || timeOfDay > 0.7) {
      // 黄昏/黎明：较暗
      if (timeOfDay < 0.3) {
        // 黎明渐亮
        ambientLight = 0.3 + (timeOfDay - 0.2) / 0.1 * 0.4; // 0.3 到 0.7
      } else {
        // 黄昏渐暗
        ambientLight = 0.7 - (timeOfDay - 0.7) / 0.1 * 0.4; // 0.7 到 0.3
      }
    } else {
      // 白天：明亮
      ambientLight = 0.7 + (1.0 - Math.abs(timeOfDay - 0.5) * 2) * 0.3; // 0.7 到 1.0
    }
    
    // 深度光照衰减 (地下更暗)
    const surfaceLevel = this.worldConfig.WORLD_HEIGHT * 0.7; // 假设地表附近
    const depthFactor = Math.max(0.1, Math.min(1.0, worldY / surfaceLevel));
    
    // 综合光照计算
    const finalLight = ambientLight * depthFactor;
    
    return Math.max(0.1, Math.min(1.0, finalLight)); // 限制在 0.1-1.0 范围
  }
  
  /**
   * 应用光照效果到颜色 (TODO #17)
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
    
    // 应用光照系数
    r = Math.floor(r * lightLevel);
    g = Math.floor(g * lightLevel);
    b = Math.floor(b * lightLevel);
    
    // 在夜晚添加轻微的蓝色色调
    if (lightLevel < 0.5) {
      const nightTint = (0.5 - lightLevel) * 0.3; // 最多 30% 的夜晚色调
      r = Math.floor(r * (1 - nightTint * 0.3));
      g = Math.floor(g * (1 - nightTint * 0.2));
      b = Math.floor(b * (1 + nightTint * 0.1)); // 轻微增加蓝色
    }
    
    // 确保颜色值在有效范围内
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    
    return `rgb(${r}, ${g}, ${b})`;
  }
}