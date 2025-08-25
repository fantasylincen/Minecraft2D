/**
 * 牛类
 * 继承自PassiveMob的被动生物
 */

import { PassiveMob } from './PassiveMob.js';

export class Cow extends PassiveMob {
  constructor(worldConfig, x = 0, y = 0) {
    super(worldConfig);
    
    // 设置初始位置
    this.position.x = x;
    this.position.y = y;
    
    // 牛特有属性
    this.passive.fleeDistance = 120;   // 逃跑触发距离
    this.passive.wanderSpeed = 35;     // 徘徊速度
    this.passive.fleeSpeed = 70;       // 逃跑速度
    this.passive.canGraze = true;      // 可以觅食
    this.passive.canFlee = true;       // 会逃跑
    this.passive.breedItem = 'wheat_item'; // 繁殖所需物品为小麦
    
    // 牛外观
    this.appearance.color = '#4B4B4B';  // 深灰色
    this.appearance.eyeColor = '#000000'; // 黑色眼睛
    
    // 牛尺寸
    this.size.width = 16;
    this.size.height = 20;
    
    // 牛生命值
    this.health.current = 15;
    this.health.max = 15;
    
    // 牛类型
    this.type = 'cow';
    
    console.log('🐮 Cow 初始化完成');
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
      const nearbyCows = this.entityManager.getEntitiesByType('cow');
      for (const cow of nearbyCows) {
        // 排除自己
        if (cow === this) continue;
        
        // 检查是否为成体且在恋爱模式
        if (!cow.passive.isBaby && cow.passive.loveMode) {
          const distance = this.getDistanceTo(cow);
          // 如果距离足够近（50像素内）
          if (distance <= 50) {
            this.mate = cow;
            // 尝试繁殖
            const baby = this.breed(cow);
            if (baby) {
              // 添加幼体到实体管理器
              this.entityManager.addEntity(baby);
              console.log('🐮 牛繁殖成功，产生了新幼体');
            }
            break;
          }
        }
      }
    }
  }
  
  /**
   * 创建牛幼体
   */
  createBaby() {
    const baby = new Cow(this.worldConfig, this.position.x, this.position.y);
    baby.passive.isBaby = true;
    baby.size.width = 8;
    baby.size.height = 10;
    baby.appearance.color = '#8B8B8B'; // 浅灰色
    return baby;
  }
  
  /**
   * 设置实体管理器引用
   */
  setEntityManager(entityManager) {
    this.entityManager = entityManager;
  }
  
  /**
   * 渲染牛
   */
  render(ctx, camera) {
    // 调用父类渲染
    super.render(ctx, camera);
    
    // 绘制牛特有的特征
    const screenPos = camera.worldToScreen(this.position.x, this.position.y);
    
    // 牛角
    ctx.fillStyle = '#8B4513'; // 棕色
    const hornSize = 2;
    
    // 左角
    ctx.fillRect(
      screenPos.x - 5,
      screenPos.y - this.size.height / 2 - 2,
      hornSize,
      hornSize * 2
    );
    
    // 右角
    ctx.fillRect(
      screenPos.x + 3,
      screenPos.y - this.size.height / 2 - 2,
      hornSize,
      hornSize * 2
    );
    
    // 牛鼻子
    ctx.fillStyle = '#000000'; // 黑色
    const noseSize = 1;
    ctx.fillRect(
      screenPos.x - noseSize,
      screenPos.y + 2,
      noseSize * 2,
      noseSize
    );
  }
}