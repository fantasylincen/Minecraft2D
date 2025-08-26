/**
 * 玩家健康系统
 * 负责处理玩家的生命值、饥饿值和相关系统
 */

export class PlayerHealth {
  constructor(player) {
    this.player = player;
  }

  /**
   * 更新健康系统 (TODO #18)
   */
  updateHealth(deltaTime) {
    const currentTime = performance.now();
    
    // 更新饥饿值系统
    this.updateHunger(deltaTime);
    
    // 自然回血（在没有受伤一段时间后，且饥饿值足够）
    if (this.player.health.current < this.player.health.max && 
        currentTime - this.player.health.lastDamageTime > this.player.health.regenDelay &&
        this.player.hunger.current >= 18) { // 需要足够的饥饿值才能回血
      
      const regenAmount = this.player.health.regenRate * deltaTime;
      this.player.health.current = Math.min(this.player.health.max, this.player.health.current + regenAmount);
    }
    
    // 检查是否因饥饿而掉血
    this.checkStarvation();
    
    // 检查是否死亡
    if (this.player.health.current <= 0) {
      this.handleDeath();
    }
  }

  /**
   * 更新饥饿值系统
   * @param {number} deltaTime 时间增量
   */
  updateHunger(deltaTime) {
    const currentTime = performance.now();
    
    // 增加疲劳度（基于活动）
    this.increaseExhaustion(deltaTime);
    
    // 当疲劳度达到4时，减少饱和度或饥饿值
    if (this.player.hunger.exhaustion >= 4) {
      this.player.hunger.exhaustion -= 4;
      
      if (this.player.hunger.saturation > 0) {
        this.player.hunger.saturation = Math.max(0, this.player.hunger.saturation - 1);
      } else if (this.player.hunger.current > 0) {
        this.player.hunger.current = Math.max(0, this.player.hunger.current - 1);
      }
    }
  }

  /**
   * 增加疲劳度
   * @param {number} deltaTime 时间增量
   */
  increaseExhaustion(deltaTime) {
    let exhaustionIncrease = 0;
    
    // 基础消耗
    exhaustionIncrease += 0.01 * deltaTime;
    
    // 移动消耗
    if (Math.abs(this.player.physics.velocity.x) > 0.1) {
      exhaustionIncrease += 0.01 * deltaTime;
    }
    
    // 跳跃消耗
    if (this.player.controls.jump && !this.player.physics.onGround) {
      exhaustionIncrease += 0.05;
    }
    
    // 游泳消耗
    if (this.player.inWater.isSwimming) {
      exhaustionIncrease += 0.015 * deltaTime;
    }
    
    // 飞行消耗
    if (this.player.flyMode.enabled) {
      exhaustionIncrease += 0.01 * deltaTime * this.player.flyMode.speedMultiplier;
    }
    
    this.player.hunger.exhaustion += exhaustionIncrease;
  }

  /**
   * 检查是否因饥饿而掉血
   */
  checkStarvation() {
    // 当饥饿值为0时，每4秒掉1点血
    if (this.player.hunger.current === 0) {
      const currentTime = performance.now();
      if (!this.player.hunger.lastStarveTime || currentTime - this.player.hunger.lastStarveTime > 4000) {
        this.player.takeDamage(1, 'starvation');
        this.player.hunger.lastStarveTime = currentTime;
      }
    }
  }

  /**
   * 受伤处理
   */
  takeDamage(amount, type = 'unknown') {
    const currentTime = performance.now();
    
    // 检查无敌时间
    if (currentTime - this.player.health.lastDamageTime < this.player.health.invulnerabilityTime) {
      return false; // 在无敌时间内，不受伤害
    }
    
    // 应用伤害
    const actualDamage = Math.min(amount, this.player.health.current);
    this.player.health.current -= actualDamage;
    this.player.health.lastDamageTime = currentTime;
    
    console.log(`💔 玩家受伤: ${actualDamage} (类型: ${type}), 剩余生命: ${this.player.health.current}/${this.player.health.max}`);
    
    return true;
  }

  /**
   * 治疗处理
   */
  heal(amount) {
    const oldHealth = this.player.health.current;
    this.player.health.current = Math.min(this.player.health.max, this.player.health.current + amount);
    const actualHeal = this.player.health.current - oldHealth;
    
    if (actualHeal > 0) {
      console.log(`❤️ 玩家治疗: +${actualHeal}, 当前生命: ${this.player.health.current}/${this.player.health.max}`);
    }
    
    return actualHeal;
  }

  /**
   * 死亡处理
   */
  handleDeath() {
    console.log('💀 玩家死亡!');
    
    // 重置生命值
    this.player.health.current = this.player.health.max;
    this.player.health.lastDamageTime = 0;
    
    // 重生
    this.player.respawn();
  }

  /**
   * 吃食物
   * @param {string} foodItemId 食物物品ID
   * @returns {boolean} 是否成功吃下食物
   */
  eatFood(foodItemId) {
    const foodItem = this.player.itemConfig.getItem(foodItemId);
    if (!foodItem || foodItem.type !== this.player.ItemType.FOOD) {
      return false;
    }
    
    // 检查是否能吃下食物（饥饿值未满）
    if (this.player.hunger.current >= this.player.hunger.max) {
      return false;
    }
    
    // 增加饥饿值和饱和度
    this.player.hunger.current = Math.min(this.player.hunger.max, this.player.hunger.current + (foodItem.foodValue || 0));
    this.player.hunger.saturation = Math.min(this.player.hunger.current, this.player.hunger.saturation + (foodItem.saturation || 0));
    
    // 记录进食时间
    this.player.hunger.lastFoodTime = performance.now();
    
    console.log(`🍎 吃了 ${foodItem.name}，饥饿值: ${this.player.hunger.current}/${this.player.hunger.max}, 饱和度: ${this.player.hunger.saturation}`);
    
    return true;
  }

  /**
   * 从物品栏消耗食物
   * @param {string} foodItemId 食物物品ID
   * @returns {boolean} 是否成功消耗食物
   */
  consumeFoodFromInventory(foodItemId) {
    // 检查物品栏中是否有该食物
    if (!this.player.inventory.hasItem(foodItemId, 1)) {
      return false;
    }
    
    // 消耗食物
    this.player.inventory.removeItem(foodItemId, 1);
    
    // 吃下食物
    return this.eatFood(foodItemId);
  }
}