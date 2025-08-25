/**
 * 猪类
 * 继承自PassiveMob的被动生物
 */

import { PassiveMob } from './PassiveMob.js';

export class Pig extends PassiveMob {
  constructor(worldConfig, x = 0, y = 0) {
    super(worldConfig);
    
    // 设置初始位置
    this.position.x = x;
    this.position.y = y;
    
    // 猪特有属性
    this.passive.fleeDistance = 100;   // 逃跑触发距离
    this.passive.wanderSpeed = 45;     // 徘徊速度
    this.passive.fleeSpeed = 85;       // 逃跑速度
    this.passive.canGraze = true;      // 可以觅食
    this.passive.canFlee = true;       // 会逃跑
    this.passive.breedItem = 'carrot_item'; // 繁殖所需物品为胡萝卜
    
    // 猪外观
    this.appearance.color = '#FFA07A';  // 浅鲑鱼色
    this.appearance.eyeColor = '#000000'; // 黑色眼睛
    
    // 猪尺寸
    this.size.width = 14;
    this.size.height = 18;
    
    // 猪生命值
    this.health.current = 10;
    this.health.max = 10;
    
    // 猪类型
    this.type = 'pig';
    
    console.log('🐷 Pig 初始化完成');
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
      const nearbyPigs = this.entityManager.getEntitiesByType('pig');
      for (const pig of nearbyPigs) {
        // 排除自己
        if (pig === this) continue;
        
        // 检查是否为成体且在恋爱模式
        if (!pig.passive.isBaby && pig.passive.loveMode) {
          const distance = this.getDistanceTo(pig);
          // 如果距离足够近（50像素内）
          if (distance <= 50) {
            this.mate = pig;
            // 尝试繁殖
            const baby = this.breed(pig);
            if (baby) {
              // 添加幼体到实体管理器
              this.entityManager.addEntity(baby);
              console.log('🐷 猪繁殖成功，产生了新幼体');
            }
            break;
          }
        }
      }
    }
  }
  
  /**
   * 创建猪幼体
   */
  createBaby() {
    const baby = new Pig(this.worldConfig, this.position.x, this.position.y);
    baby.passive.isBaby = true;
    baby.size.width = 7;
    baby.size.height = 9;
    baby.appearance.color = '#FFB6C1'; // 浅粉色
    return baby;
  }
  
  /**
   * 设置实体管理器引用
   */
  setEntityManager(entityManager) {
    this.entityManager = entityManager;
  }
  
  /**
   * 渲染猪
   */
  render(ctx, camera) {
    // 调用父类渲染
    super.render(ctx, camera);
    
    // 绘制猪特有的特征
    const screenPos = camera.worldToScreen(this.position.x, this.position.y);
    
    // 猪鼻子
    ctx.fillStyle = '#FF6347'; // 番茄红
    const noseWidth = 4;
    const noseHeight = 3;
    ctx.fillRect(
      screenPos.x - noseWidth / 2,
      screenPos.y - 2,
      noseWidth,
      noseHeight
    );
    
    // 鼻孔
    ctx.fillStyle = '#000000'; // 黑色
    const nostrilSize = 1;
    ctx.fillRect(
      screenPos.x - 2,
      screenPos.y - 1,
      nostrilSize,
      nostrilSize
    );
    ctx.fillRect(
      screenPos.x + 1,
      screenPos.y - 1,
      nostrilSize,
      nostrilSize
    );
  }
}