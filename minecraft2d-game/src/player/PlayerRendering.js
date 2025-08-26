/**
 * 玩家渲染系统
 * 负责处理玩家的渲染逻辑
 */

import { ItemType } from '../config/ItemConfig.js';

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
    
    // 保存原始的变换状态
    ctx.save();
    
    // 应用摄像机缩放
    ctx.scale(camera.zoom, camera.zoom);
    
    // 调整屏幕坐标以考虑缩放
    const adjustedScreenPos = {
      x: (screenPos.x - camera.canvas.width / 2) / camera.zoom + camera.canvas.width / 2,
      y: (screenPos.y - camera.canvas.height / 2) / camera.zoom + camera.canvas.height / 2
    };
    
    // 渲染玩家身体
    ctx.fillStyle = this.player.appearance.color;
    ctx.fillRect(
      adjustedScreenPos.x - this.player.size.width / 2,
      adjustedScreenPos.y - this.player.size.height / 2,
      this.player.size.width,
      this.player.size.height
    );
    
    // 渲染玩家眼睛
    ctx.fillStyle = this.player.appearance.eyeColor;
    const eyeSize = 2;
    const eyeOffsetY = 6;
    
    // 应用动画效果到眼睛位置
    let eyeScreenPos = { ...adjustedScreenPos };
    if (this.player.animationController) {
      const bodyOffsetX = this.player.animationController.getAnimationValue('bodyOffsetX') || 0;
      const bodyOffsetY = this.player.animationController.getAnimationValue('bodyOffsetY') || 0;
      eyeScreenPos.x += bodyOffsetX;
      eyeScreenPos.y += bodyOffsetY;
    }
    
    // 左眼
    ctx.fillRect(
      eyeScreenPos.x - 3,
      eyeScreenPos.y + eyeOffsetY,
      eyeSize,
      eyeSize
    );
    
    // 右眼
    ctx.fillRect(
      eyeScreenPos.x + 1,
      eyeScreenPos.y + eyeOffsetY,
      eyeSize,
      eyeSize
    );
    
    // 渲染玩家手中持有的物品
    this.renderHeldItem(ctx, adjustedScreenPos);
    
    // 调试模式下渲染朝向激光线条 (新增)
    if (this.player.showDebugInfo) {
      this.renderFacingLaser(ctx, adjustedScreenPos);
    }
    
    // 根据配置渲染玩家视线射线
    this.renderPlayerRay(ctx, adjustedScreenPos);
    
    // 渲染视线射线相交的第一个方块高亮
    this.renderTargetedBlockHighlight(ctx, camera);
    
    // 调试信息（可选）
    if (this.player.showDebugInfo) {
      this.renderDebugInfo(ctx, adjustedScreenPos);
    }
    
    // 恢复原始的变换状态
    ctx.restore();
  }

  /**
   * 渲染玩家朝向激光线条 (新增)
   * 调试模式下: 用一个从玩家身体中心发射一根宽度为2的亮蓝色激光线条指向玩家的朝向, 射线的长度为2个玩家的身高
   */
  renderFacingLaser(ctx, screenPos) {
    // 保存原始的变换状态
    ctx.save();
    
    // 设置激光线条样式
    ctx.strokeStyle = '#00FFFF'; // 亮蓝色
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // 计算激光线条的终点
    const laserLength = this.player.size.height * 2; // 2个玩家的身高
    const endX = screenPos.x + this.player.facing.directionX * laserLength;
    const endY = screenPos.y - this.player.facing.directionY * laserLength; // Y轴翻转修复
    
    // 绘制激光线条
    ctx.beginPath();
    ctx.moveTo(screenPos.x, screenPos.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // 绘制基准点（红色小圆点）
    ctx.fillStyle = '#FF0000'; // 红色
    const dotRadius = (2 + 1) / 2; // 直径比射线略宽1像素
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
  renderPlayerRay(ctx, screenPos) {
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
      
      // 计算射线终点（指定方块长度）
      // 注意：需要考虑Canvas坐标系Y轴向下而世界坐标系Y轴向上的差异
      const blockSize = (this.player && this.player.worldConfig && this.player.worldConfig.BLOCK_SIZE) || 16;
      const worldRayLength = rayLength * blockSize;
      const endX = screenPos.x + (this.player.facing ? this.player.facing.directionX : 1) * worldRayLength;
      const endY = screenPos.y - (this.player.facing ? this.player.facing.directionY : 0) * worldRayLength; // Y轴翻转修复
      
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
   * 渲染玩家手中持有的物品
   */
  renderHeldItem(ctx, screenPos) {
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
    
    // 设置渲染样式
    ctx.font = '10px Arial'; // 恢复为10px（原来20px的一半）
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 根据物品稀有度设置颜色
    const rarityColor = this.getItemRarityColor(itemDef.rarity);
    ctx.fillStyle = rarityColor;
    
    // 应用手臂动画
    let handX = screenPos.x + 10; // 右手位置
    let handY = screenPos.y - 5;  // 手的高度
    
    if (this.player.animationController) {
      const handOffsetX = this.player.animationController.getAnimationValue('handOffsetX') || 0;
      const handOffsetY = this.player.animationController.getAnimationValue('handOffsetY') || 0;
      handX += handOffsetX;
      handY += handOffsetY;
    }
    
    ctx.fillText(itemIcon, handX, handY);
    
    // 如果是工具类物品且有耐久度，渲染耐久度条
    if (heldItem.durability !== null && heldItem.durability !== undefined) {
      const maxDurability = itemDef.durability || itemDef.material?.durability || 100;
      const durabilityRatio = heldItem.durability / maxDurability;
      
      // 绘制耐久度条背景（恢复为原来的一半大小）
      const barWidth = 10; // 恢复为10（原来20的一半）
      const barHeight = 1.5; // 恢复为1.5（原来3的一半）
      const barX = handX - barWidth / 2;
      const barY = handY + 8; // 恢复为8（原来15的一半位置）
      
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
  renderDebugInfo(ctx, screenPos) {
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    
    const debugText = [
      `Pos: (${Math.round(this.player.position.x)}, ${Math.round(this.player.position.y)})`,
      `Vel: (${Math.round(this.player.physics.velocity.x)}, ${Math.round(this.player.physics.velocity.y)})`,
      `Ground: ${this.player.physics.onGround}`,
      `Jump: ${this.player.physics.canJump}`,
      `Flying: ${this.player.flyMode.enabled}`,
      `In Water: ${this.player.inWater.isSwimming}`,
      this.player.flyMode.enabled ? `Speed: ${this.player.getFlySpeedPercentage()}%` : ''
    ].filter(text => text !== ''); // 过滤空字符串
    
    debugText.forEach((text, index) => {
      ctx.fillText(text, screenPos.x + 20, screenPos.y - 30 + index * 14);
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