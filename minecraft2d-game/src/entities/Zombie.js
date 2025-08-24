/**
 * 僵尸类
 * 继承自Mob的僵尸怪物
 */

import { Mob } from './Mob.js';

export class Zombie extends Mob {
  constructor(worldConfig, x = 0, y = 0) {
    super(worldConfig);
    
    // 设置初始位置
    this.position.x = x;
    this.position.y = y;
    
    // 僵尸特有属性
    this.mob.aggroRange = 80;      // 激活范围
    this.mob.attackRange = 25;     // 攻击范围
    this.mob.attackDamage = 3;     // 攻击伤害
    this.mob.attackCooldown = 1500; // 攻击冷却时间
    this.mob.wanderSpeed = 40;     // 徘徊速度
    this.mob.chaseSpeed = 60;      // 追击速度
    this.mob.canSwim = false;      // 不能在水中移动
    
    // 僵尸外观
    this.appearance.color = '#556B2F'; // 深橄榄绿
    this.appearance.eyeColor = '#FF0000'; // 红色眼睛
    
    // 僵尸生命值
    this.health.current = 20;
    this.health.max = 20;
    
    // 怪物类型
    this.type = 'zombie';
    
    console.log('🧟 Zombie 初始化完成');
  }
  
  /**
   * 更新僵尸状态
   */
  update(deltaTime, player) {
    // 检查是否在水中（僵尸不能在水中移动）
    if (this.isInWater() && !this.mob.canSwim) {
      // 在水中时移动速度减慢
      this.physics.velocity.x *= 0.5;
    }
    
    // 调用父类更新
    super.update(deltaTime, player);
  }
  
  /**
   * 检查僵尸是否在水中
   */
  isInWater() {
    if (!this.terrainGenerator) return false;
    
    const blockSize = this.worldConfig.BLOCK_SIZE;
    const epsilon = 0.01;
    
    // 计算僵尸中心位置
    const centerX = this.position.x;
    const centerY = this.position.y;
    
    // 转换为中心方块坐标
    const centerBlockX = Math.floor(centerX / blockSize);
    const centerBlockY = Math.floor(centerY / blockSize);
    
    // 检查中心位置是否在水中
    const centerBlockId = this.terrainGenerator.getBlock(centerBlockX, centerBlockY);
    if (blockConfig.isFluid(centerBlockId)) {
      return true;
    }
    
    // 检查僵尸身体其他部分是否在水中
    const left = this.position.x - this.size.width / 2 + epsilon;
    const right = this.position.x + this.size.width / 2 - epsilon;
    const top = this.position.y + this.size.height / 2 - epsilon;
    const bottom = this.position.y - this.size.height / 2 + epsilon;
    
    const leftBlock = Math.floor(left / blockSize);
    const rightBlock = Math.floor(right / blockSize);
    const topBlock = Math.floor(top / blockSize);
    const bottomBlock = Math.floor(bottom / blockSize);
    
    // 检查僵尸周围的方块是否为水
    for (let x = leftBlock; x <= rightBlock; x++) {
      for (let y = bottomBlock; y <= topBlock; y++) {
        const blockId = this.terrainGenerator.getBlock(x, y);
        if (blockConfig.isFluid(blockId)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * 渲染僵尸
   */
  render(ctx, camera) {
    // 调用父类渲染
    super.render(ctx, camera);
    
    // 可以添加僵尸特有的渲染效果
  }
}