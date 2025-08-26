/**
 * 玩家挖掘系统
 * 负责处理玩家的方块挖掘逻辑
 */

import { blockConfig } from '../config/BlockConfig.js';
import { itemConfig } from '../config/ItemConfig.js';

export class PlayerMining {
  constructor(player) {
    this.player = player;
  }

  /**
   * 处理挖掘逻辑 (TODO #9)
   * Author: Minecraft2D Development Team
   */
  handleMining(deltaTime) {
    if (!this.player.terrainGenerator) return;
    
    const currentTime = performance.now();
    
    // 检查是否按住空格键进行挖掘
    if (this.player.controls.mine) {
      // 检查冷却时间
      if (currentTime - this.player.mining.lastMineTime >= this.player.mining.mineCooldown) {
        // 获取视线方向最近的方块
        const targetBlock = this.getTargetBlock();
        
        if (targetBlock && targetBlock.blockId !== blockConfig.getBlock('air').id) {
          // 检查方块是否可破坏
          const blockInfo = blockConfig.getBlock(targetBlock.blockId);
          if (blockInfo && blockInfo.breakable) {
            // 检查手持工具是否可以挖掘该方块
            if (this.canMineBlockWithHeldItem(targetBlock.blockId)) {
              // 开始或继续挖掘
              this.startOrContinueMining(targetBlock, deltaTime);
            } else {
              // 工具不匹配，重置挖掘进度
              this.resetMiningProgress();
            }
          } else {
            // 方块不可破坏，重置挖掘进度
            this.resetMiningProgress();
          }
        } else {
          // 没有目标方块，重置挖掘进度
          this.resetMiningProgress();
        }
        
        this.player.mining.lastMineTime = currentTime;
      }
    } else {
      // 没有按住挖掘键，重置挖掘进度
      this.resetMiningProgress();
    }
  }

  /**
   * 获取视线方向最近的方块 (修改 - 光线可以穿过流体，遇到固体障碍物中断)
   * Author: Minecraft2D Development Team
   */
  getTargetBlock() {
    if (!this.player.terrainGenerator) return null;
    
    // 玩家眼睛位置（屏幕中心）
    const eyeX = this.player.position.x;
    const eyeY = this.player.position.y + 2; // 眼睛稍微高一点
    
    // 使用玩家的朝向方向计算视线方向
    const directionX = this.player.facing.directionX;
    const directionY = this.player.facing.directionY;
    
    // 射线步进参数
    const stepSize = 0.5; // 步进大小
    const maxDistance = 5; // 最大挖掘距离（方块数）
    
    // 将玩家位置转换为方块坐标
    let currentX = eyeX;
    let currentY = eyeY;
    
    // 沿视线方向步进
    for (let i = 0; i < maxDistance / stepSize; i++) {
      currentX += directionX * stepSize;
      currentY += directionY * stepSize;
      
      // 转换为方块坐标
      const blockX = Math.floor(currentX / this.player.worldConfig.BLOCK_SIZE);
      const blockY = Math.floor(currentY / this.player.worldConfig.BLOCK_SIZE);
      
      // 获取方块
      const blockId = this.player.terrainGenerator.getBlock(blockX, blockY);
      
      // 检查是否为固体方块（不是空气且不是流体）
      if (blockId !== blockConfig.getBlock('air').id && !blockConfig.isFluid(blockId)) {
        return {
          x: blockX,
          y: blockY,
          blockId: blockId
        };
      }
      // 如果是流体，光线可以穿过，继续前进
    }
    
    return null; // 没有找到目标方块
  }

  /**
   * 检查手持物品是否可以挖掘指定方块
   */
  canMineBlockWithHeldItem(blockId) {
    const heldItem = this.player.getHeldItem();
    if (!heldItem || heldItem.isEmpty()) {
      return false; // 空手不能挖掘
    }
    
    const itemDef = heldItem.getItemDefinition();
    if (!itemDef || !itemDef.type.startsWith('tool_')) {
      return false; // 不是工具
    }
    
    // 获取方块类型
    const blockInfo = blockConfig.getBlock(blockId);
    if (!blockInfo) {
      return false;
    }
    
    // 检查工具是否可以挖掘这种方块类型
    return itemConfig.canToolMineBlock(heldItem.itemId, blockInfo.type);
  }

  /**
   * 开始或继续挖掘 (TODO #9)
   * Author: Minecraft2D Development Team
   */
  startOrContinueMining(targetBlock, deltaTime) {
    // 检查是否是同一个方块
    if (this.player.mining.targetBlock && 
        this.player.mining.targetBlock.x === targetBlock.x && 
        this.player.mining.targetBlock.y === targetBlock.y) {
      // 继续挖掘同一方块
      this.player.mining.isMining = true;
    } else {
      // 开始挖掘新方块
      this.player.mining.targetBlock = targetBlock;
      this.player.mining.miningProgress = 0;
      this.player.mining.miningTime = 0;
      this.player.mining.isMining = true;
    }
    
    // 计算挖掘速度（基于方块硬度和工具）
    const blockInfo = blockConfig.getBlock(targetBlock.blockId);
    const hardness = blockInfo ? blockInfo.hardness || 1.0 : 1.0;
    
    // 获取手持工具的挖掘速度加成
    let speedMultiplier = 1.0;
    const heldItem = this.player.getHeldItem();
    if (heldItem && !heldItem.isEmpty()) {
      const itemDef = heldItem.getItemDefinition();
      if (itemDef && itemDef.type.startsWith('tool_')) {
        // 工具提供挖掘速度加成
        speedMultiplier = 1.5; // 示例加成
      }
    }
    
    // 计算挖掘时间（硬度越高，需要的时间越长）
    const baseMiningTime = hardness * 1000; // 基础挖掘时间（毫秒）
    const actualMiningTime = baseMiningTime / speedMultiplier;
    
    // 更新挖掘进度
    this.player.mining.miningTime += deltaTime * 1000; // 转换为毫秒
    this.player.mining.miningProgress = Math.min(1.0, this.player.mining.miningTime / actualMiningTime);
    
    // 检查是否挖掘完成
    if (this.player.mining.miningProgress >= 1.0) {
      this.completeMining(targetBlock);
    }
  }

  /**
   * 完成挖掘 (TODO #9)
   * Author: Minecraft2D Development Team
   */
  completeMining(targetBlock) {
    if (!this.player.terrainGenerator) return;
    
    // 破坏方块
    this.player.terrainGenerator.setBlock(targetBlock.x, targetBlock.y, blockConfig.getBlock('air').id);
    
    // 获取方块掉落物
    const blockInfo = blockConfig.getBlock(targetBlock.blockId);
    if (blockInfo && blockInfo.drops) {
      // 添加掉落物到物品栏
      blockInfo.drops.forEach(dropId => {
        this.player.addItemToInventory(dropId, 1);
      });
    }
    
    // 消耗工具耐久度
    const toolDamaged = this.player.damageHeldItem(1);
    if (toolDamaged) {
      console.log('🔨 工具在挖掘过程中损坏!');
    }
    
    console.log(`⛏️ 挖掘完成: 破坏方块 (${targetBlock.x}, ${targetBlock.y})`);
    
    // 重置挖掘状态
    this.resetMiningProgress();
  }

  /**
   * 重置挖掘进度 (TODO #9)
   * Author: Minecraft2D Development Team
   */
  resetMiningProgress() {
    this.player.mining.targetBlock = null;
    this.player.mining.miningProgress = 0;
    this.player.mining.miningTime = 0;
    this.player.mining.isMining = false;
  }
}