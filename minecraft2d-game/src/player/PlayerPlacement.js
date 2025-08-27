/**
 * 玩家方块放置系统
 * 负责处理玩家的方块放置逻辑
 */

import { blockConfig } from '../config/BlockConfig.js';
import { ItemType } from '../config/ItemConfig.js';

export class PlayerPlacement {
  constructor(player) {
    this.player = player;
  }

  /**
   * 处理放置方块逻辑 (新增 - 放置方块功能 - 基础实现)
   * Author: Minecraft2D Development Team
   */
  handleBlockPlacement(deltaTime) {
    if (!this.player.terrainGenerator) return;
    
    // 检查是否按下了放置键（右键）
    if (this.player.controls.place) {
      // 检查冷却时间，防止过快放置
      const currentTime = performance.now();
      if (currentTime - this.player.placement.lastPlaceTime >= this.player.placement.placeCooldown) {
        // 获取当前手持物品
        const heldItem = this.player.getHeldItem();
        
        // 检查手中是否有方块类物品
        if (heldItem && !heldItem.isEmpty()) {
          const itemDef = heldItem.getItemDefinition();
          if (itemDef && itemDef.type === ItemType.BLOCK) {
            // 获取放置位置（玩家前方一格）
            const placementPosition = this.getPlacementPosition();
            
            if (placementPosition) {
              // 检查放置位置是否合法
              if (this.isPlacementPositionValid(placementPosition)) {
                // 放置方块
                const blockId = itemDef.blockId;
                if (this.player.terrainGenerator.setBlock(placementPosition.x, placementPosition.y, blockId)) {
                  // 消耗物品
                  this.player.consumeHeldItem(1);
                  
                  // 添加放置音效 (新增 - 放置方块功能 - 交互优化)
                  this.playPlaceSound();
                  
                  // 添加放置成功提示 (新增 - 放置方块功能 - 交互优化)
                  console.log(`✅ 放置方块成功: ${itemDef.name} at (${placementPosition.x}, ${placementPosition.y})`);
                  
                  // 更新最后放置时间 (新增 - 多方块放置优化 - 基础实现)
                  this.player.placement.lastPlaceTime = currentTime;
                }
              } else {
                // 添加放置失败提示 (新增 - 放置方块功能 - 交互优化)
                console.log('❌ 放置位置不合法');
                this.showPlaceFailureMessage();
              }
            }
          } else {
            // 添加放置失败提示 (新增 - 放置方块功能 - 交互优化)
            console.log('❌ 手中物品不是方块类型');
            this.showPlaceFailureMessage();
          }
        } else {
          // 添加放置失败提示 (新增 - 放置方块功能 - 交互优化)
          console.log('❌ 手中没有可放置的方块');
          this.showPlaceFailureMessage();
        }
        
        // 更新最后放置时间 (移到这里以支持连续放置)
        this.player.placement.lastPlaceTime = currentTime;
      }
    }
  }

  /**
   * 获取放置位置 (修改 - 使用射线终点所在的区块作为预放置位置)
   * @returns {Object|null} 放置位置坐标
   */
  getPlacementPosition() {
    if (!this.player.terrainGenerator) return null;
    
    // 使用玩家的朝向方向计算视线方向
    const directionX = this.player.facing.directionX;
    const directionY = this.player.facing.directionY;
    
    // 计算射线起点（玩家眼睛位置）
    const eyeX = this.player.position.x;
    const eyeY = this.player.position.y + 2; // 眼睛稍微高一点
    
    // 射线最大距离（与挖掘距离保持一致）
    const maxDistance = 5 * this.player.worldConfig.BLOCK_SIZE;
    
    // 计算射线终点
    const endPoint = this.player.renderingModule.calculateRayEndPoint(
      eyeX,
      eyeY,
      directionX,
      directionY,
      maxDistance
    );
    
    // 计算射线长度
    const rayLength = Math.sqrt(
      Math.pow(endPoint.x - eyeX, 2) + Math.pow(endPoint.y - eyeY, 2)
    );
    
    // 如果射线长度大于最大长度减5像素，则不可放置
    if (rayLength > maxDistance - 5) {
      return null;
    }
    
    // 使用射线终点所在的区块作为放置位置
    const blockSize = this.player.worldConfig.BLOCK_SIZE;
    const placementX = Math.floor(endPoint.x / blockSize);
    const placementY = Math.floor(endPoint.y / blockSize);
    
    return { x: placementX, y: placementY };
  }

  /**
   * 检查放置位置是否合法 (新增)
   * @param {Object} position 放置位置
   * @returns {boolean} 是否合法
   */
  isPlacementPositionValid(position) {
    if (!this.player.terrainGenerator) return false;
    
    // 检查位置是否在世界范围内
    if (position.y < 0 || position.y >= this.player.worldConfig.WORLD_HEIGHT) {
      return false;
    }
    
    // 检查目标位置是否为空气方块
    const targetBlockId = this.player.terrainGenerator.getBlock(position.x, position.y);
    if (targetBlockId !== blockConfig.getBlock('air').id) {
      return false; // 目标位置已经有方块
    }
    
    // 检查放置位置是否与玩家碰撞
    // 简化检查：确保放置位置不在玩家占据的空间内
    const playerBlockX = Math.floor(this.player.position.x / this.player.worldConfig.BLOCK_SIZE);
    const playerBlockY = Math.floor(this.player.position.y / this.player.worldConfig.BLOCK_SIZE);
    
    if (position.x === playerBlockX && position.y === playerBlockY) {
      return false; // 不能在自己所在位置放置方块
    }
    
    // 检查放置位置是否在玩家身体范围内
    const playerLeft = Math.floor((this.player.position.x - this.player.size.width/2) / this.player.worldConfig.BLOCK_SIZE);
    const playerRight = Math.floor((this.player.position.x + this.player.size.width/2) / this.player.worldConfig.BLOCK_SIZE);
    const playerBottom = Math.floor((this.player.position.y - this.player.size.height/2) / this.player.worldConfig.BLOCK_SIZE);
    const playerTop = Math.floor((this.player.position.y + this.player.size.height/2) / this.player.worldConfig.BLOCK_SIZE);
    
    if (position.x >= playerLeft && position.x <= playerRight && 
        position.y >= playerBottom && position.y <= playerTop) {
      return false; // 放置位置与玩家身体重叠
    }
    
    return true;
  }

  /**
   * 消耗手持物品 (新增)
   * @param {number} count 消耗数量
   */
  consumeHeldItem(count = 1) {
    const heldItem = this.player.getHeldItem();
    if (heldItem && !heldItem.isEmpty()) {
      // 从物品栏移除物品
      const removed = heldItem.removeItem(count);
      if (heldItem.count <= 0) {
        // 如果物品用完了，清空槽位
        heldItem.clear();
      }
    }
  }

  /**
   * 播放放置音效 (新增 - 放置方块功能 - 交互优化)
   * Author: Minecraft2D Development Team
   */
  playPlaceSound() {
    // 简单的音效实现（使用Web Audio API）
    try {
      // 创建音频上下文
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // 创建振荡器
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // 连接节点
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // 设置音调和音量
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3音符
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      
      // 播放并快速停止
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
      
      console.log('🎵 播放放置音效');
    } catch (error) {
      // 如果Web Audio API不可用，使用控制台输出代替
      console.log('🎵 [音效] 方块放置');
    }
  }

  /**
   * 显示放置失败消息 (新增 - 放置方块功能 - 交互优化)
   * Author: Minecraft2D Development Team
   */
  showPlaceFailureMessage() {
    // 在实际游戏中，这里会显示一个短暂的提示消息
    // 目前使用控制台输出
    console.log('⚠️ 方块放置失败');
  }

  /**
   * 获取放置预览位置 (修改 - 使用射线终点所在的区块作为预放置位置)
   * @returns {Object|null} 预览位置坐标
   */
  getPlacementPreviewPosition() {
    if (!this.player.terrainGenerator) return null;
    
    // 使用玩家的朝向方向计算视线方向
    const directionX = this.player.facing.directionX;
    const directionY = this.player.facing.directionY;
    
    // 计算射线起点（玩家眼睛位置）
    const eyeX = this.player.position.x;
    const eyeY = this.player.position.y + 2; // 眼睛稍微高一点
    
    // 射线最大距离（与挖掘距离保持一致）
    const maxDistance = 5 * this.player.worldConfig.BLOCK_SIZE;
    
    // 计算射线终点
    const endPoint = this.player.renderingModule.calculateRayEndPoint(
      eyeX,
      eyeY,
      directionX,
      directionY,
      maxDistance
    );
    
    // 计算射线长度
    const rayLength = Math.sqrt(
      Math.pow(endPoint.x - eyeX, 2) + Math.pow(endPoint.y - eyeY, 2)
    );
    
    // 如果射线长度大于等于最大长度-1像素，则不显示预览框
    if (rayLength >= maxDistance - 1) {
      return null;
    }
    
    // 使用射线终点所在的区块作为预放置位置
    const blockSize = this.player.worldConfig.BLOCK_SIZE;
    const previewX = Math.floor(endPoint.x / blockSize);
    const previewY = Math.floor(endPoint.y / blockSize);
    
    return { x: previewX, y: previewY };
  }

  /**
   * 检查预览位置是否合法 (新增 - 方块放置预览 - 基础实现)
   * @param {Object} position 预览位置
   * @returns {boolean} 是否合法
   */
  isPlacementPreviewValid(position) {
    if (!this.player.terrainGenerator) return false;
    
    // 检查位置是否在世界范围内
    if (position.y < 0 || position.y >= this.player.worldConfig.WORLD_HEIGHT) {
      return false;
    }
    
    // 检查目标位置是否为空气方块
    const targetBlockId = this.player.terrainGenerator.getBlock(position.x, position.y);
    if (targetBlockId !== blockConfig.getBlock('air').id) {
      return false; // 目标位置已经有方块
    }
    
    // 检查预览位置是否与玩家碰撞（更严格的检查）
    // 计算玩家的边界框
    const playerLeft = this.player.position.x - this.player.size.width / 2;
    const playerRight = this.player.position.x + this.player.size.width / 2;
    const playerBottom = this.player.position.y - this.player.size.height / 2;
    const playerTop = this.player.position.y + this.player.size.height / 2;
    
    // 计算方块的边界框
    const blockSize = this.player.worldConfig.BLOCK_SIZE;
    const blockLeft = position.x * blockSize;
    const blockRight = (position.x + 1) * blockSize;
    const blockBottom = position.y * blockSize;
    const blockTop = (position.y + 1) * blockSize;
    
    // 检查两个矩形是否相交
    if (playerLeft < blockRight && playerRight > blockLeft && 
        playerBottom < blockTop && playerTop > blockBottom) {
      return false; // 预览位置与玩家身体重叠
    }
    
    return true;
  }

  /**
   * 测试放置方块功能 (新增 - 用于测试)
   * Author: Minecraft2D Development Team
   */
  testBlockPlacement() {
    console.log('🧪 测试放置方块功能');
    
    // 检查玩家是否持有方块物品
    const heldItem = this.player.getHeldItem();
    if (!heldItem || heldItem.isEmpty()) {
      console.log('⚠️ 玩家手中没有物品');
      return false;
    }
    
    const itemDef = heldItem.getItemDefinition();
    if (!itemDef || itemDef.type !== ItemType.BLOCK) {
      console.log('⚠️ 玩家手中物品不是方块类型');
      return false;
    }
    
    console.log(`✅ 玩家持有方块: ${itemDef.name} (ID: ${itemDef.blockId})`);
    
    // 获取放置位置
    const placementPos = this.getPlacementPosition();
    if (!placementPos) {
      console.log('⚠️ 无法确定放置位置');
      return false;
    }
    
    console.log(`📍 放置位置: (${placementPos.x}, ${placementPos.y})`);
    
    // 检查放置位置是否合法
    const isValid = this.isPlacementPositionValid(placementPos);
    console.log(`⚖️ 放置位置合法性: ${isValid ? '合法' : '非法'}`);
    
    if (isValid) {
      console.log('✅ 放置方块功能测试通过');
      return true;
    } else {
      console.log('❌ 放置方块功能测试失败');
      return false;
    }
  }
}