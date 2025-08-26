/**
 * 玩家渲染系统
 * 负责处理玩家的渲染逻辑
 */

import { ItemType } from '../config/ItemConfig.js';
import { blockConfig } from '../config/BlockConfig.js';

export class PlayerRendering {
  constructor(player) {
    this.player = player;
  }

  /**
   * 渲染玩家
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   * @param {Object} camera - 摄像机对象
   */
  render(ctx, camera) {
    if (!ctx || !camera) return;
    
    // 计算屏幕坐标
    const screenPos = camera.worldToScreen(this.player.position.x, this.player.position.y);
    
    // 计算缩放后的玩家尺寸
    const scaledWidth = this.player.size.width * camera.zoom;
    const scaledHeight = this.player.size.height * camera.zoom;
    
    // 保存原始的变换状态
    ctx.save();
    
    // 渲染玩家身体
    ctx.fillStyle = this.player.appearance.color;
    ctx.fillRect(
      screenPos.x - scaledWidth / 2,
      screenPos.y - scaledHeight / 2,
      scaledWidth,
      scaledHeight
    );
    
    // 渲染玩家眼睛
    ctx.fillStyle = this.player.appearance.eyeColor;
    const eyeSize = 2 * camera.zoom;
    const eyeOffsetY = 6 * camera.zoom;
    
    // 应用动画效果到眼睛位置
    let eyeScreenPos = { ...screenPos };
    if (this.player.animationController) {
      const bodyOffsetX = (this.player.animationController.getAnimationValue('bodyOffsetX') || 0) * camera.zoom;
      const bodyOffsetY = (this.player.animationController.getAnimationValue('bodyOffsetY') || 0) * camera.zoom;
      eyeScreenPos.x += bodyOffsetX;
      eyeScreenPos.y += bodyOffsetY;
    }
    
    // 左眼
    ctx.fillRect(
      eyeScreenPos.x - 3 * camera.zoom,
      eyeScreenPos.y + eyeOffsetY,
      eyeSize,
      eyeSize
    );
    
    // 右眼
    ctx.fillRect(
      eyeScreenPos.x + 1 * camera.zoom,
      eyeScreenPos.y + eyeOffsetY,
      eyeSize,
      eyeSize
    );
    
    // 渲染玩家手中持有的物品
    this.renderHeldItem(ctx, screenPos, camera.zoom);
    
    // 调试模式下渲染朝向激光线条 (新增)
    if (this.player.showDebugInfo) {
      this.renderFacingLaser(ctx, screenPos, camera.zoom);
    }
    
    // 根据配置渲染玩家视线射线
    this.renderPlayerViewRay(ctx, screenPos, camera);
    
    // 渲染视线射线相交的第一个方块高亮
    this.renderTargetedBlockHighlight(ctx, camera);
    
    // 调试信息（可选）
    if (this.player.showDebugInfo) {
      this.renderDebugInfo(ctx, screenPos, camera.zoom);
    }
    
    // 恢复原始的变换状态
    ctx.restore();
  }

  /**
   * 渲染玩家朝向激光线条 (新增)
   * 调试模式下: 用一个从玩家身体中心发射一根宽度为2的亮蓝色激光线条指向玩家的朝向, 射线的长度为2个玩家的身高
   */
  renderFacingLaser(ctx, screenPos, zoom = 1) {
    // 保存原始的变换状态
    ctx.save();
    
    // 根据缩放调整激光线条样式
    ctx.strokeStyle = '#00FFFF'; // 亮蓝色
    ctx.lineWidth = 2 * zoom;
    ctx.lineCap = 'round';
    
    // 计算激光线条的终点（根据缩放调整）
    const laserLength = this.player.size.height * 2 * zoom; // 2个玩家的身高
    const endX = screenPos.x + this.player.facing.directionX * laserLength;
    const endY = screenPos.y - this.player.facing.directionY * laserLength; // Y轴翻转修复
    
    // 绘制激光线条
    ctx.beginPath();
    ctx.moveTo(screenPos.x, screenPos.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // 绘制基准点（红色小圆点），根据缩放调整大小
    ctx.fillStyle = '#FF0000'; // 红色
    const dotRadius = (2 * zoom + 1) / 2; // 直径比 略宽1像素
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // 恢复原始的变换状态
    ctx.restore();
  }

  /**
   * 渲染玩家视线射线
   * 根据配置控制是否显示以及射线的样式
   */
  renderPlayerViewRay(ctx, screenPos, camera) {
    try {
      // 检查是否需要渲染视线射线
      // 使用更安全的方式访问gameConfig
      let showPlayerRay = false;
      
      // 尝试从player对象获取gameConfig
      if (this.player && this.player.gameConfig && typeof this.player.gameConfig.get === 'function') {
        showPlayerRay = this.player.gameConfig.get('developer', 'showPlayerRay') || false;
      } 
      // 如果player.gameConfig不可用，尝试从全局gameConfig获取
      else if (typeof window !== 'undefined' && window.gameConfig) {
        showPlayerRay = window.gameConfig.get('developer', 'showPlayerRay') || false;
      }
      
      // 如果配置未启用，则不渲染
      if (!showPlayerRay) {
        return;
      }
      
      // 获取配置参数，提供默认值
      let rayLength = 8;
      let rayColor = '#00FFFF';
      let rayWidth = 2;
      
      // 尝试从配置中获取参数
      try {
        if (this.player && this.player.gameConfig && typeof this.player.gameConfig.get === 'function') {
          rayLength = this.player.gameConfig.get('developer', 'playerRayLength') || rayLength;
          rayColor = this.player.gameConfig.get('developer', 'playerRayColor') || rayColor;
          rayWidth = this.player.gameConfig.get('developer', 'playerRayWidth') || rayWidth;
        } else if (typeof window !== 'undefined' && window.gameConfig && typeof window.gameConfig.get === 'function') {
          rayLength = window.gameConfig.get('developer', 'playerRayLength') || rayLength;
          rayColor = window.gameConfig.get('developer', 'playerRayColor') || rayColor;
          rayWidth = window.gameConfig.get('developer', 'playerRayWidth') || rayWidth;
        }
      } catch (configError) {
        console.warn('获取玩家射线配置时出错，使用默认值:', configError);
      }
      
      // 保存原始的变换状态
      ctx.save();
      
      // 设置射线样式
      ctx.strokeStyle = rayColor;
      ctx.lineWidth = rayWidth;
      ctx.lineCap = 'round';
      
      // 获取目标方块（用于障碍物检测）
      const targetBlock = this.player.getTargetBlock();
      
      // 计算射线终点
      let endX, endY;
      if (targetBlock) {
        // 如果有目标方块，射线延伸到目标方块位置
        const blockSize = this.player.worldConfig.BLOCK_SIZE;
        const targetWorldX = targetBlock.x * blockSize + blockSize / 2;
        const targetWorldY = targetBlock.y * blockSize + blockSize / 2;
        const targetScreenPos = camera.worldToScreen(targetWorldX, targetWorldY);
        endX = targetScreenPos.x;
        endY = targetScreenPos.y;
      } else {
        // 如果没有目标方块，则绘制一条固定长度的光线
        const directionX = this.player.facing.directionX;
        const directionY = this.player.facing.directionY;
        const maxDistance = rayLength * this.player.worldConfig.BLOCK_SIZE;
        
        // 计算实际的光线终点（考虑障碍物）
        const endPoint = this.calculateRayEndPoint(
          this.player.position.x,
          this.player.position.y + 2, // 眼睛稍微高一点
          directionX,
          directionY,
          maxDistance
        );
        const endPointScreen = camera.worldToScreen(endPoint.x, endPoint.y);
        endX = endPointScreen.x;
        endY = endPointScreen.y;
      }
      
      // 绘制射线
      ctx.beginPath();
      ctx.moveTo(screenPos.x, screenPos.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      // 绘制基准点（红色小圆点）
      ctx.fillStyle = '#FF0000'; // 红色
      const dotRadius = (rayWidth + 1) / 2; // 直径比射线略宽1像素
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // 恢复原始的变换状态
      ctx.restore();
    } catch (error) {
      console.warn('渲染玩家视线射线时出错:', error);
      // 确保即使出错也能恢复上下文
      try {
        ctx.restore();
      } catch (restoreError) {
        // 忽略恢复错误
      }
    }
  }
  
  /**
   * 计算射线的终点（考虑障碍物）
   * @param {number} startX 起点X坐标
   * @param {number} startY 起点Y坐标
   * @param {number} directionX 方向向量X
   * @param {number} directionY 方向向量Y
   * @param {number} maxDistance 最大距离
   * @returns {Object} 终点坐标
   */
  calculateRayEndPoint(startX, startY, directionX, directionY, maxDistance) {
    if (!this.player.terrainGenerator) {
      // 如果没有地形生成器，返回最大距离的终点
      return {
        x: startX + directionX * maxDistance,
        y: startY + directionY * maxDistance
      };
    }
    
    // 射线步进参数
    const stepSize = 0.5; // 步进大小
    const steps = maxDistance / stepSize;
    
    // 沿视线方向步进
    let currentX = startX;
    let currentY = startY;
    
    for (let i = 0; i < steps; i++) {
      currentX += directionX * stepSize;
      currentY += directionY * stepSize;
      
      // 转换为方块坐标
      const blockX = Math.floor(currentX / this.player.worldConfig.BLOCK_SIZE);
      const blockY = Math.floor(currentY / this.player.worldConfig.BLOCK_SIZE);
      
      // 获取方块
      const blockId = this.player.terrainGenerator.getBlock(blockX, blockY);
      
      // 检查是否为固体方块（不是空气且不是流体）
      if (blockId !== blockConfig.getBlock('air').id && !blockConfig.isFluid(blockId)) {
        // 遇到固体方块，将终点往回退2像素
        const retreatDistance = 2; // 往回退的距离（像素）
        const retreatedX = currentX - directionX * retreatDistance;
        const retreatedY = currentY - directionY * retreatDistance;
        return { x: retreatedX, y: retreatedY };
      }
    }
    
    // 没有遇到障碍物，返回最大距离的终点
    return {
      x: startX + directionX * maxDistance,
      y: startY + directionY * maxDistance
    };
  }

  /**
   * 渲染玩家手中持有的物品
   */
  renderHeldItem(ctx, screenPos, zoom = 1) {
    const heldItem = this.player.getHeldItem();
    if (!heldItem || heldItem.isEmpty()) {
      return; // 没有手持物品，不渲染
    }
    
    const itemDef = heldItem.getItemDefinition();
    if (!itemDef) {
      return; // 物品定义不存在
    }
    
    // 获取物品图标（使用与UI中相同的映射）
    const itemIcon = this.getItemIcon(itemDef);
    if (!itemIcon) {
      return; // 没有图标
    }
    
    // 保存原始的变换状态
    ctx.save();
    
    // 根据缩放调整字体大小
    const fontSize = 10 * zoom;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 根据物品稀有度设置颜色
    const rarityColor = this.getItemRarityColor(itemDef.rarity);
    ctx.fillStyle = rarityColor;
    
    // 应用手臂动画并根据缩放调整位置
    let handX = screenPos.x + 10 * zoom; // 右手位置
    let handY = screenPos.y - 5 * zoom;  // 手的高度
    
    if (this.player.animationController) {
      const handOffsetX = (this.player.animationController.getAnimationValue('handOffsetX') || 0) * zoom;
      const handOffsetY = (this.player.animationController.getAnimationValue('handOffsetY') || 0) * zoom;
      handX += handOffsetX;
      handY += handOffsetY;
    }
    
    ctx.fillText(itemIcon, handX, handY);
    
    // 如果是工具类物品且有耐久度，渲染耐久度条
    if (heldItem.durability !== null && heldItem.durability !== undefined) {
      const maxDurability = itemDef.durability || itemDef.material?.durability || 100;
      const durabilityRatio = heldItem.durability / maxDurability;
      
      // 根据缩放调整耐久度条大小和位置
      const barWidth = 10 * zoom;
      const barHeight = 1.5 * zoom;
      const barX = handX - barWidth / 2;
      const barY = handY + 8 * zoom;
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // 绘制耐久度条
      ctx.fillStyle = durabilityRatio > 0.3 ? '#55ff55' : '#ff5555'; // 绿色或红色
      ctx.fillRect(barX, barY, barWidth * durabilityRatio, barHeight);
    }
    
    // 恢复原始的变换状态
    ctx.restore();
  }

  /**
   * 获取物品图标（与UI中相同的映射）
   */
  getItemIcon(item) {
    if (!item) return '';
    
    // 简单的图标映射（与InventoryUI.jsx中一致）
    const iconMap = {
      'block_dirt': '🟫',
      'block_stone': '⬜',
      'block_grass': '🟩',
      'block_sand': '🟨',
      'block_water': '🟦',
      'block_wood': '🟤',
      'block_leaves': '🍃',
      'block_iron_ore': '⚪',
      'block_gold_ore': '🟡',
      'block_diamond_ore': '💎',
      'pickaxe_wood': '⛏️',
      'pickaxe_stone': '🔨',
      'pickaxe_iron': '⚒️',
      'pickaxe_diamond': '💎⛏️',
      'iron_ingot': '🔗',
      'gold_ingot': '🥇',
      'diamond': '💎',
      'stick': '🪵',
      'apple': '🍎',
      'bread': '🍞'
    };
    
    return iconMap[item.id] || '❓';
  }

  /**
   * 获取物品稀有度颜色（与UI中相同的映射）
   */
  getItemRarityColor(rarity) {
    const ItemRarity = {
      COMMON: 'common',
      UNCOMMON: 'uncommon',
      RARE: 'rare',
      EPIC: 'epic',
      LEGENDARY: 'legendary'
    };
    
    switch (rarity) {
      case ItemRarity.COMMON: return '#ffffff';
      case ItemRarity.UNCOMMON: return '#55ff55';
      case ItemRarity.RARE: return '#5555ff';
      case ItemRarity.EPIC: return '#aa00aa';
      case ItemRarity.LEGENDARY: return '#ffaa00';
      default: return '#ffffff';
    }
  }

  /**
   * 渲染调试信息
   */
  renderDebugInfo(ctx, screenPos, zoom = 1) {
    ctx.fillStyle = '#000';
    // 根据缩放调整字体大小
    const fontSize = 12 * zoom;
    ctx.font = `${fontSize}px Arial`;
    
    const debugText = [
      `Pos: (${Math.round(this.player.position.x)}, ${Math.round(this.player.position.y)})`,
      `Vel: (${Math.round(this.player.physics.velocity.x)}, ${Math.round(this.player.physics.velocity.y)})`,
      `Ground: ${this.player.physics.onGround}`,
      `Jump: ${this.player.physics.canJump}`,
      `Flying: ${this.player.flyMode.enabled}`,
      `In Water: ${this.player.inWater.isSwimming}`,
      this.player.flyMode.enabled ? `Speed: ${this.player.getFlySpeedPercentage()}%` : ''
    ].filter(text => text !== ''); // 过滤空字符串
    
    // 根据缩放调整文本位置
    const lineHeight = 14 * zoom;
    const xOffset = 20 * zoom;
    const yOffset = 30 * zoom;
    
    debugText.forEach((text, index) => {
      ctx.fillText(text, screenPos.x + xOffset, screenPos.y - yOffset + index * lineHeight);
    });
  }

  /**
   * 渲染放置预览 (新增 - 方块放置预览 - 基础实现)
   * @param {CanvasRenderingContext2D} ctx 渲染上下文
   * @param {Object} camera 摄像机对象
   */
  renderPlacementPreview(ctx, camera) {
    if (!ctx || !camera) return;
    
    // 获取当前手持物品
    const heldItem = this.player.getHeldItem();
    
    // 检查手中是否有方块类物品
    if (!heldItem || heldItem.isEmpty() || heldItem.getItemDefinition().type !== ItemType.BLOCK) {
      return;
    }
    
    // 获取预览位置
    const previewPosition = this.player.getPlacementPreviewPosition();
    if (!previewPosition) return;
    
    // 检查预览位置是否合法
    const isValid = this.player.isPlacementPreviewValid(previewPosition);
    
    // 计算屏幕坐标
    const blockSize = this.player.worldConfig.BLOCK_SIZE;
    const worldPosX = previewPosition.x * blockSize + blockSize / 2;
    const worldPosY = previewPosition.y * blockSize + blockSize / 2;
    
    // 检查是否在视野内
    if (!camera.isInView(worldPosX, worldPosY)) {
      return;
    }
    
    const screenPos = camera.worldToScreen(worldPosX, worldPosY);
    const screenSize = blockSize * camera.zoom;
    
    // 如果方块太小就不渲染
    if (screenSize < 1) return;
    
    // 保存当前上下文状态
    ctx.save();
    
    // 设置预览颜色（绿色表示可放置，红色表示不可放置）
    const baseColor = isValid ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
    
    // 添加预览方块的旋转动画 (新增 - 方块放置预览 - 视觉优化)
    const time = performance.now() / 1000; // 转换为秒
    const rotation = Math.sin(time * 2) * 0.1; // 轻微的旋转动画
    
    // 移动到方块中心并应用旋转
    ctx.translate(screenPos.x, screenPos.y);
    ctx.rotate(rotation);
    
    // 渲染半透明预览方块
    ctx.fillStyle = baseColor;
    ctx.fillRect(
      -screenSize / 2,
      -screenSize / 2,
      screenSize,
      screenSize
    );
    
    // 添加预览方块的边框效果 (新增 - 方块放置预览 - 视觉优化)
    ctx.strokeStyle = isValid ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = Math.max(1, screenSize * 0.1);
    ctx.strokeRect(
      -screenSize / 2,
      -screenSize / 2,
      screenSize,
      screenSize
    );
    
    // 恢复上下文状态
    ctx.restore();
  }

  /**
   * 渲染玩家视线射线相交的第一个方块高亮
   * @param {CanvasRenderingContext2D} ctx 渲染上下文
   * @param {Object} camera 摄像机对象
   */
  renderTargetedBlockHighlight(ctx, camera) {
    // 获取视线方向最近的方块
    const targetBlock = this.player.getTargetBlock();
    
    // 如果没有找到目标方块，直接返回
    if (!targetBlock || !camera) return;
    
    // 计算方块的世界坐标和屏幕坐标
    const blockSize = this.player.worldConfig.BLOCK_SIZE;
    const worldPosX = targetBlock.x * blockSize + blockSize / 2;
    const worldPosY = targetBlock.y * blockSize + blockSize / 2;
    
    // 检查是否在视野内
    if (!camera.isInView(worldPosX, worldPosY)) {
      return;
    }
    
    const screenPos = camera.worldToScreen(worldPosX, worldPosY);
    const screenSize = blockSize * camera.zoom;
    
    // 如果方块太小就不渲染
    if (screenSize < 1) return;
    
    // 保存当前上下文状态
    ctx.save();
    
    // 设置高亮样式
    ctx.strokeStyle = '#FF0000'; // 红色边框
    ctx.lineWidth = Math.max(2, screenSize * 0.1); // 边框宽度至少为2像素
    
    // 绘制高亮边框
    ctx.strokeRect(
      screenPos.x - screenSize / 2,
      screenPos.y - screenSize / 2,
      screenSize,
      screenSize
    );
    
    // 恢复上下文状态
    ctx.restore();
  }
}
