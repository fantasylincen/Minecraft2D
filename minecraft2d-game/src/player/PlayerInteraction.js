/**
 * 玩家交互系统
 * 负责处理玩家与环境的交互，如容器交互等
 */

import { blockConfig } from '../config/BlockConfig.js';

export class PlayerInteraction {
  constructor(player) {
    this.player = player;
  }

  /**
   * 处理容器交互逻辑
   * 检查玩家是否面向容器方块并进行交互
   */
  handleContainerInteraction() {
    // 如果没有地形生成器或游戏引擎，无法处理容器交互
    if (!this.player.terrainGenerator || !this.player.gameEngine) {
      return;
    }
    
    // 获取玩家面向的方块
    const targetBlock = this.player.getTargetBlock();
    if (!targetBlock) {
      return;
    }
    
    // 检查该方块是否为容器方块
    const blockId = targetBlock.blockId;
    const blockInfo = blockConfig.getBlock(blockId);
    
    // 如果是容器方块类型
    if (blockInfo && blockInfo.special === 'container') {
      // 获取容器管理器
      const containerManager = this.player.gameEngine.systems.containerManager;
      if (!containerManager) {
        console.warn('容器管理器未初始化');
        return;
      }
      
      // 获取或创建容器实例
      let container = containerManager.getContainer(targetBlock.x, targetBlock.y);
      
      // 如果容器不存在，创建一个新的容器
      if (!container) {
        // 根据方块类型创建相应的容器
        if (blockId === blockConfig.getBlock('chest').id) {
          container = containerManager.createChest(targetBlock.x, targetBlock.y);
        } else if (blockId === blockConfig.getBlock('crafting_table').id) {
          container = containerManager.createCraftingTable(targetBlock.x, targetBlock.y);
        }
        
        if (container) {
          containerManager.addContainer(container);
        }
      }
      
      // 如果成功获取或创建了容器，打开它
      if (container) {
        // 触发容器打开事件，让UI层处理界面显示
        const event = new CustomEvent('openContainer', {
          detail: {
            container: container,
            playerInventory: this.player.inventory
          }
        });
        window.dispatchEvent(event);
      }
    }
  }
}