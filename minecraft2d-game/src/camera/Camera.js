/**
 * 摄像机系统
 * 负责视野管理、坐标转换和跟随玩家
 */

export class Camera {
  constructor(canvas, worldConfig) {
    this.canvas = canvas;
    this.worldConfig = worldConfig;
    
    // 摄像机位置（世界坐标）
    this.position = {
      x: 0,
      y: 200,
      targetX: 0,
      targetY: 200
    };
    
    // 摄像机属性
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.minZoom = 0.5;
    this.maxZoom = 3.0;
    
    // 跟随参数
    this.followSpeed = 5.0;     // 跟随速度
    this.zoomSpeed = 3.0;       // 缩放速度
    this.smoothing = true;      // 是否启用平滑跟随
    
    // 视野边界
    this.bounds = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    };
    
    // 跟随目标
    this.target = null;
    
    // 摄像机偏移
    this.offset = {
      x: 0,
      y: 0
    };
    
    console.log('📷 Camera 初始化完成');
  }
  
  /**
   * 设置跟随目标
   */
  setTarget(target) {
    this.target = target;
    if (target && target.getPosition) {
      const pos = target.getPosition();
      this.position.x = pos.x;
      this.position.y = pos.y;
      this.position.targetX = pos.x;
      this.position.targetY = pos.y;
    }
  }
  
  /**
   * 更新摄像机
   */
  update(deltaTime) {
    // 更新目标位置
    this.updateTargetPosition();
    
    // 平滑跟随
    if (this.smoothing) {
      this.smoothFollow(deltaTime);
    } else {
      this.instantFollow();
    }
    
    // 平滑缩放
    this.smoothZoom(deltaTime);
    
    // 更新视野边界
    this.updateViewBounds();
  }
  
  /**
   * 更新目标位置
   */
  updateTargetPosition() {
    if (this.target && this.target.getPosition) {
      const targetPos = this.target.getPosition();
      this.position.targetX = targetPos.x + this.offset.x;
      this.position.targetY = targetPos.y + this.offset.y;
    }
  }
  
  /**
   * 平滑跟随
   */
  smoothFollow(deltaTime) {
    const lerpFactor = Math.min(1, this.followSpeed * deltaTime);
    
    this.position.x += (this.position.targetX - this.position.x) * lerpFactor;
    this.position.y += (this.position.targetY - this.position.y) * lerpFactor;
  }
  
  /**
   * 瞬间跟随
   */
  instantFollow() {
    this.position.x = this.position.targetX;
    this.position.y = this.position.targetY;
  }
  
  /**
   * 平滑缩放
   */
  smoothZoom(deltaTime) {
    if (Math.abs(this.zoom - this.targetZoom) > 0.001) {
      const lerpFactor = Math.min(1, this.zoomSpeed * deltaTime);
      this.zoom += (this.targetZoom - this.zoom) * lerpFactor;
    }
  }
  
  /**
   * 更新视野边界
   */
  updateViewBounds() {
    const halfWidth = (this.canvas.width / 2) / this.zoom;
    const halfHeight = (this.canvas.height / 2) / this.zoom;
    
    this.bounds.left = this.position.x - halfWidth;
    this.bounds.right = this.position.x + halfWidth;
    this.bounds.bottom = this.position.y - halfHeight;
    this.bounds.top = this.position.y + halfHeight;
  }
  
  /**
   * 世界坐标转屏幕坐标
   */
  worldToScreen(worldX, worldY) {
    const screenX = (worldX - this.position.x) * this.zoom + this.canvas.width / 2;
    const screenY = (this.position.y - worldY) * this.zoom + this.canvas.height / 2;
    
    return { x: screenX, y: screenY };
  }
  
  /**
   * 屏幕坐标转世界坐标
   */
  screenToWorld(screenX, screenY) {
    const worldX = (screenX - this.canvas.width / 2) / this.zoom + this.position.x;
    const worldY = this.position.y - (screenY - this.canvas.height / 2) / this.zoom;
    
    return { x: worldX, y: worldY };
  }
  
  /**
   * 检查点是否在视野内
   */
  isInView(worldX, worldY, margin = 0) {
    return worldX >= this.bounds.left - margin &&
           worldX <= this.bounds.right + margin &&
           worldY >= this.bounds.bottom - margin &&
           worldY <= this.bounds.top + margin;
  }
  
  /**
   * 检查矩形是否在视野内
   */
  isRectInView(worldX, worldY, width, height, margin = 0) {
    const left = worldX - width / 2;
    const right = worldX + width / 2;
    const bottom = worldY - height / 2;
    const top = worldY + height / 2;
    
    return !(right < this.bounds.left - margin ||
             left > this.bounds.right + margin ||
             top < this.bounds.bottom - margin ||
             bottom > this.bounds.top + margin);
  }
  
  /**
   * 获取可见的方块范围
   */
  getVisibleBlockRange() {
    const blockSize = this.worldConfig.BLOCK_SIZE;
    
    return {
      minX: Math.floor(this.bounds.left / blockSize) - 1,
      maxX: Math.ceil(this.bounds.right / blockSize) + 1,
      minY: Math.floor(this.bounds.bottom / blockSize) - 1,
      maxY: Math.ceil(this.bounds.top / blockSize) + 1
    };
  }
  
  /**
   * 获取可见的区块范围
   */
  getVisibleChunkRange() {
    const chunkSize = this.worldConfig.CHUNK_SIZE * this.worldConfig.BLOCK_SIZE;
    
    return {
      minChunk: Math.floor(this.bounds.left / chunkSize) - 1,
      maxChunk: Math.ceil(this.bounds.right / chunkSize) + 1
    };
  }
  
  /**
   * 设置摄像机位置
   */
  setPosition(x, y, instant = false) {
    this.position.targetX = x + this.offset.x;
    this.position.targetY = y + this.offset.y;
    
    if (instant) {
      this.position.x = this.position.targetX;
      this.position.y = this.position.targetY;
    }
  }
  
  /**
   * 移动摄像机
   */
  move(deltaX, deltaY) {
    this.position.targetX += deltaX;
    this.position.targetY += deltaY;
  }
  
  /**
   * 设置缩放级别
   */
  setZoom(zoom, instant = false) {
    this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    
    if (instant) {
      this.zoom = this.targetZoom;
    }
  }
  
  /**
   * 缩放摄像机
   */
  zoomBy(factor) {
    this.setZoom(this.targetZoom * factor);
  }
  
  /**
   * 设置跟随偏移
   */
  setOffset(x, y) {
    this.offset.x = x;
    this.offset.y = y;
  }
  
  /**
   * 设置跟随速度
   */
  setFollowSpeed(speed) {
    this.followSpeed = Math.max(0, speed);
  }
  
  /**
   * 启用/禁用平滑跟随
   */
  setSmoothing(enabled) {
    this.smoothing = enabled;
  }
  
  /**
   * 震动效果
   */
  shake(intensity = 10, duration = 0.5) {
    const originalOffset = { ...this.offset };
    const startTime = Date.now();
    
    const shakeInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      
      if (elapsed >= duration) {
        this.offset = originalOffset;
        clearInterval(shakeInterval);
        return;
      }
      
      const progress = elapsed / duration;
      const currentIntensity = intensity * (1 - progress);
      
      this.offset.x = originalOffset.x + (Math.random() - 0.5) * currentIntensity;
      this.offset.y = originalOffset.y + (Math.random() - 0.5) * currentIntensity;
    }, 16); // 约60FPS
  }
  
  /**
   * 获取摄像机状态
   */
  getStatus() {
    return {
      position: { ...this.position },
      zoom: this.zoom,
      targetZoom: this.targetZoom,
      bounds: { ...this.bounds },
      followSpeed: this.followSpeed,
      smoothing: this.smoothing
    };
  }
  
  /**
   * 重置摄像机
   */
  reset() {
    this.position.x = 0;
    this.position.y = 200;
    this.position.targetX = 0;
    this.position.targetY = 200;
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.offset.x = 0;
    this.offset.y = 0;
  }
  
  /**
   * 聚焦到指定位置
   */
  focusOn(worldX, worldY, zoom = null, instant = false) {
    this.setPosition(worldX, worldY, instant);
    
    if (zoom !== null) {
      this.setZoom(zoom, instant);
    }
  }
  
  /**
   * 导出摄像机数据
   */
  exportData() {
    return {
      position: {
        x: this.position.x,
        y: this.position.y
      },
      zoom: this.zoom,
      offset: { ...this.offset },
      followSpeed: this.followSpeed,
      smoothing: this.smoothing
    };
  }
  
  /**
   * 导入摄像机数据
   */
  importData(data) {
    if (data.position) {
      this.position.x = data.position.x;
      this.position.y = data.position.y;
      this.position.targetX = data.position.x;
      this.position.targetY = data.position.y;
    }
    
    if (typeof data.zoom === 'number') {
      this.zoom = data.zoom;
      this.targetZoom = data.zoom;
    }
    
    if (data.offset) {
      this.offset = { ...data.offset };
    }
    
    if (typeof data.followSpeed === 'number') {
      this.followSpeed = data.followSpeed;
    }
    
    if (typeof data.smoothing === 'boolean') {
      this.smoothing = data.smoothing;
    }
  }
}