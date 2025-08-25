/**
 * 鸡类
 * 继承自PassiveMob的被动生物
 */

import { PassiveMob } from './PassiveMob.js';

export class Chicken extends PassiveMob {
  constructor(worldConfig, x = 0, y = 0) {
    super(worldConfig);
    
    // 设置初始位置
    this.position.x = x;
    this.position.y = y;
    
    // 鸡特有属性
    this.passive.fleeDistance = 80;    // 逃跑触发距离
    this.passive.wanderSpeed = 50;     // 徘徊速度
    this.passive.fleeSpeed = 100;      // 逃跑速度
    this.passive.canGraze = true;      // 可以觅食
    this.passive.canFlee = true;       // 会逃跑
    this.passive.canJump = true;       // 可以跳跃
    this.passive.breedItem = 'wheat_seeds_item'; // 繁殖所需物品为小麦种子
    
    // 鸡外观
    this.appearance.color = '#FFFF00'; // 黄色
    this.appearance.eyeColor = '#000000'; // 黑色眼睛
    
    // 鸡尺寸
    this.size.width = 10;
    this.size.height = 12;
    
    // 鸡生命值
    this.health.current = 5;
    this.health.max = 5;
    
    // 鸡类型
    this.type = 'chicken';
    
    // 鸡特有属性
    this.chicken = {
      jumpCooldown: 0,      // 跳跃冷却时间
      lastJumpTime: 0,      // 上次跳跃时间
      jumpForce: 150        // 跳跃力度
    };
    
    console.log('🐔 Chicken 初始化完成');
  }
  
  /**
   * 更新鸡状态
   */
  update(deltaTime, player) {
    // 调用父类更新
    super.update(deltaTime, player);
    
    // 更新跳跃行为
    this.updateJumping(deltaTime);
  }
  
  /**
   * 更新跳跃行为
   */
  updateJumping(deltaTime) {
    const currentTime = performance.now();
    
    // 检查跳跃冷却时间
    if (currentTime - this.chicken.lastJumpTime < this.chicken.jumpCooldown) {
      return;
    }
    
    // 随机决定是否跳跃
    if (Math.random() < 0.02) {
      this.jump();
    }
  }
  
  /**
   * 跳跃
   */
  jump() {
    if (this.physics.onGround) {
      this.physics.velocity.y = this.chicken.jumpForce;
      this.physics.onGround = false;
      this.chicken.lastJumpTime = performance.now();
      this.chicken.jumpCooldown = 2000 + Math.random() * 3000; // 2-5秒冷却时间
    }
  }
  
  /**
   * 寻找配偶
   */
  lookForMate() {
    // 如果已经有配偶，直接返回
    if (this.mate) {
      return;
    }
    
    // 查找附近的同类
    if (this.entityManager) {
      const nearbyChickens = this.entityManager.getEntitiesByType('chicken');
      for (const chicken of nearbyChickens) {
        // 排除自己
        if (chicken === this) continue;
        
        // 检查是否为成体且在恋爱模式
        if (!chicken.passive.isBaby && chicken.passive.loveMode) {
          const distance = this.getDistanceTo(chicken);
          // 如果距离足够近（50像素内）
          if (distance <= 50) {
            this.mate = chicken;
            // 尝试繁殖
            const baby = this.breed(chicken);
            if (baby) {
              // 添加幼体到实体管理器
              this.entityManager.addEntity(baby);
              console.log('🐔 鸡繁殖成功，产生了新幼体');
            }
            break;
          }
        }
      }
    }
  }
  
  /**
   * 创建鸡幼体
   */
  createBaby() {
    const baby = new Chicken(this.worldConfig, this.position.x, this.position.y);
    baby.passive.isBaby = true;
    baby.size.width = 5;
    baby.size.height = 6;
    baby.appearance.color = '#FFD700'; // 金色
    return baby;
  }
  
  /**
   * 设置实体管理器引用
   */
  setEntityManager(entityManager) {
    this.entityManager = entityManager;
  }
  
  /**
   * 渲染鸡
   */
  render(ctx, camera) {
    // 调用父类渲染
    super.render(ctx, camera);
    
    // 绘制鸡特有的特征
    const screenPos = camera.worldToScreen(this.position.x, this.position.y);
    
    // 鸡冠
    ctx.fillStyle = '#FF0000'; // 红色
    const combWidth = 6;
    const combHeight = 3;
    ctx.fillRect(
      screenPos.x - combWidth / 2,
      screenPos.y - this.size.height / 2 - 2,
      combWidth,
      combHeight
    );
    
    // 鸡喙
    ctx.fillStyle = '#FFA500'; // 橙色
    const beakWidth = 3;
    const beakHeight = 2;
    ctx.fillRect(
      screenPos.x - beakWidth / 2,
      screenPos.y,
      beakWidth,
      beakHeight
    );
  }
}