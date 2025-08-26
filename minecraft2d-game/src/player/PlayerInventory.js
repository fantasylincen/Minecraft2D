/**
 * 玩家物品栏系统
 * 负责处理玩家的物品栏交互逻辑
 */

export class PlayerInventory {
  constructor(player) {
    this.player = player;
  }

  /**
   * 初始化起始物品
   * 现在填满整个物品栏和背包
   */
  initializeStartingItems() {
    // 填满玩家的物品栏和背包
    this.fillInventoryCompletely();
  }

  /**
   * 初始化起始物品
   */
  initializeStartingItems() {
    // 给玩家一些起始物品用于测试
    this.player.inventory.addItem('pickaxe_wood', 1);
    this.player.inventory.addItem('block_dirt', 64);
    this.player.inventory.addItem('block_stone', 32);
    this.player.inventory.addItem('block_grass', 16);
    this.player.inventory.addItem('apple', 10);
    this.player.inventory.addItem('bread', 5);
    
    console.log('🎒 玩家物品栏初始化完成');
    this.player.inventory.debugPrint();
  }

  /**
   * 获取当前手持物品
   */
  getHeldItem() {
    return this.player.inventory.getHeldItem();
  }

  /**
   * 设置选中的快捷栏槽位
   */
  setSelectedHotbarSlot(index) {
    this.player.inventory.setSelectedHotbarSlot(index);
  }

  /**
   * 获取物品栏系统
   */
  getInventory() {
    return this.player.inventory;
  }

  /**
   * 向物品栏添加物品
   */
  addItemToInventory(itemId, count = 1, durability = null) {
    const remaining = this.player.inventory.addItem(itemId, count, durability);
    if (remaining > 0) {
      console.log(`⚠️ 物品栏已满，无法添加 ${remaining} 个 ${itemId}`);
    }
    return remaining;
  }

  /**
   * 从物品栏移除物品
   */
  removeItemFromInventory(itemId, count = 1) {
    return this.player.inventory.removeItem(itemId, count);
  }

  /**
   * 检查物品栏中是否有指定物品
   */
  hasItemInInventory(itemId, count = 1) {
    return this.player.inventory.hasItem(itemId, count);
  }

  /**
   * 消耗手持物品的耐久度
   */
  damageHeldItem(damage = 1) {
    const heldItem = this.getHeldItem();
    if (heldItem && !heldItem.isEmpty() && heldItem.durability !== null) {
      heldItem.durability -= damage;
      
      // 如果耐久度用完，移除物品
      if (heldItem.durability <= 0) {
        heldItem.clear();
        console.log('🔨 工具损坏!');
        return true; // 工具损坏
      }
    }
    return false; // 工具没有损坏
  }

  /**
   * 填满玩家的物品栏和背包
   * 给玩家所有可用的物品，每个物品槽位都填满最大堆叠数
   */
  fillInventoryCompletely() {
    // 获取所有物品定义
    const allItems = this.player.itemConfig.getAllItems();
    
    // 遍历所有物品并添加到玩家物品栏
    for (const [itemId, itemDef] of allItems) {
      // 跳过容器类物品（箱子物品等）
      if (itemDef.type === this.player.ItemType.BLOCK && 
          (itemId === 'chest_item' || itemId === 'crafting_table_item' || itemId === 'furnace_item')) {
        // 只添加少量容器类物品
        this.player.inventory.addItem(itemId, 1, null);
        continue;
      }
      
      // 对于工具类物品，添加1个并设置最大耐久度
      if (itemDef.type && (itemDef.type.startsWith('tool_') || itemDef.type.startsWith('weapon_'))) {
        this.player.inventory.addItem(itemId, 1, itemDef.durability || itemDef.material?.durability);
      } 
      // 对于其他物品，尽可能填满（最多64个）
      else {
        const maxStack = itemDef.maxStack || 1;
        this.player.inventory.addItem(itemId, maxStack, null);
      }
    }
    
    console.log('🎒 玩家物品栏已完全填满');
    this.player.inventory.debugPrint();
  }
}