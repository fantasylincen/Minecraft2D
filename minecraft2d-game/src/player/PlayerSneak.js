/**
 * 玩家潜行模式系统
 * 负责处理玩家的潜行模式相关逻辑
 */

import { blockConfig } from '../config/BlockConfig.js';

export class PlayerSneak {
  constructor(player) {
    this.player = player;
    
    // 潜行模式配置
    this.sneakMode = {
      enabled: false,       // 是否启用潜行模式
      speedMultiplier: 0.3  // 潜行时的速度倍率 (30%)
    };
  }
  
  /**
   * 更新潜行模式状态
   */
  updateSneakMode() {
    // 检查是否启用潜行模式
    const isSneaking = this.player.controls.sneakLeft || this.player.controls.sneakRight;
    this.sneakMode.enabled = isSneaking;
  }
  
  /**
   * 获取潜行模式下的移动速度
   * @param {number} normalSpeed - 正常移动速度
   * @returns {number} 潜行模式下的移动速度
   */
  getSneakSpeed(normalSpeed) {
    return this.sneakMode.enabled ? 
      normalSpeed * this.sneakMode.speedMultiplier : 
      normalSpeed;
  }
  
  /**
   * 检查是否处于潜行模式
   * @returns {boolean} 是否处于潜行模式
   */
  isSneaking() {
    return this.sneakMode.enabled;
  }
  
  /**
   * 获取潜行模式配置
   * @returns {Object} 潜行模式配置对象
   */
  getSneakConfig() {
    return { ...this.sneakMode };
  }
  
  /**
   * 设置潜行模式启用状态
   * @param {boolean} enabled - 是否启用潜行模式
   */
  setSneakEnabled(enabled) {
    this.sneakMode.enabled = enabled;
  }
  
  /**
   * 检查是否即将掉落（潜行模式下检查脚下96%区域是否为固体）
   * @returns {boolean} 是否即将掉落
   */
  willFall() {
    // 只在潜行模式下检查
    if (!this.sneakMode.enabled) {
      return false;
    }
    
    // 如果没有地形生成器，无法检测
    if (!this.player.terrainGenerator) {
      return false;
    }
    
    const blockSize = this.player.worldConfig.BLOCK_SIZE;
    const epsilon = 0.01;
    
    // 计算玩家脚下的位置（96%的区域）
    const playerLeft = this.player.position.x - this.player.size.width / 2;
    const playerRight = this.player.position.x + this.player.size.width / 2;
    const playerBottom = this.player.position.y - this.player.size.height / 2;
    
    // 计算96%的区域（稍微缩小一点检测范围）
    const checkLeft = playerLeft + (this.player.size.width * 0.02);  // 左边向内缩进2%
    const checkRight = playerRight - (this.player.size.width * 0.02); // 右边向内缩进2%
    const checkBottom = playerBottom - epsilon; // 脚下稍微向下检测
    
    // 转换为方块坐标
    const leftBlock = Math.floor(checkLeft / blockSize);
    const rightBlock = Math.floor(checkRight / blockSize);
    const bottomBlock = Math.floor(checkBottom / blockSize);
    
    // 检查脚下96%的区域是否有固体方块
    for (let x = leftBlock; x <= rightBlock; x++) {
      const blockId = this.player.terrainGenerator.getBlock(x, bottomBlock);
      if (blockConfig.isSolid(blockId)) {
        // 如果有任何部分是固体，则不会掉落
        return false;
      }
    }
    
    // 如果脚下96%的区域都不是固体，则即将掉落
    return true;
  }
}