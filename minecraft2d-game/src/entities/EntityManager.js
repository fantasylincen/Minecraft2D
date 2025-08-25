/**
 * 实体管理器
 * 负责管理游戏中的所有实体，包括生成、更新和渲染
 */

import { Zombie } from './Zombie.js';
import { Cow } from './Cow.js';
import { Pig } from './Pig.js';
import { Chicken } from './Chicken.js';

export class EntityManager {
  constructor(worldConfig) {
    this.worldConfig = worldConfig;
    this.entities = [];
    this.player = null;
    this.gameEngine = null; // 添加对游戏引擎的引用，用于获取季节信息
    
    // 怪物生成配置
    this.spawnConfig = {
      zombie: {
        enabled: true,
        spawnRate: 0.001,    // 生成概率
        maxCount: 20,        // 最大数量
        spawnDistance: 1000, // 生成距离玩家的范围 (像素)
        minDistance: 100     // 最小生成距离 (像素)
      },
      // 被动生物生成配置
      cow: {
        enabled: true,
        spawnRate: 0.0008,   // 生成概率
        maxCount: 15,        // 最大数量
        spawnDistance: 800,  // 生成距离玩家的范围 (像素)
        minDistance: 150     // 最小生成距离 (像素)
      },
      pig: {
        enabled: true,
        spawnRate: 0.0008,   // 生成概率
        maxCount: 15,        // 最大数量
        spawnDistance: 800,  // 生成距离玩家的范围 (像素)
        minDistance: 150     // 最小生成距离 (像素)
      },
      chicken: {
        enabled: true,
        spawnRate: 0.001,    // 生成概率
        maxCount: 20,        // 最大数量
        spawnDistance: 800,  // 生成距离玩家的范围 (像素)
        minDistance: 150     // 最小生成距离 (像素)
      }
    };
    
    console.log('🧩 EntityManager 初始化完成');
  }
  
  /**
   * 设置玩家引用
   */
  setPlayer(player) {
    this.player = player;
  }
  
  /**
   * 设置游戏引擎引用
   */
  setGameEngine(gameEngine) {
    this.gameEngine = gameEngine;
  }
  
  /**
   * 设置地形生成器引用
   */
  setTerrainGenerator(terrainGenerator) {
    this.terrainGenerator = terrainGenerator;
    
    // 为所有实体设置地形生成器
    this.entities.forEach(entity => {
      if (typeof entity.setTerrainGenerator === 'function') {
        entity.setTerrainGenerator(terrainGenerator);
      }
    });
  }
  
  /**
   * 添加实体
   */
  addEntity(entity) {
    this.entities.push(entity);
    
    // 为新实体设置地形生成器
    if (this.terrainGenerator && typeof entity.setTerrainGenerator === 'function') {
      entity.setTerrainGenerator(this.terrainGenerator);
    }
    
    // 为新实体设置游戏引擎引用（如果实体支持）
    if (this.gameEngine && typeof entity.setGameEngine === 'function') {
      entity.setGameEngine(this.gameEngine);
    }
    
    // 为新实体设置实体管理器引用（如果实体支持）
    if (typeof entity.setEntityManager === 'function') {
      entity.setEntityManager(this);
    }
    
    console.log(`➕ 添加实体: ${entity.type}, 总数: ${this.entities.length}`);
  }
  
  /**
   * 移除实体
   */
  removeEntity(entity) {
    const index = this.entities.indexOf(entity);
    if (index !== -1) {
      this.entities.splice(index, 1);
      console.log(`➖ 移除实体: ${entity.type}, 总数: ${this.entities.length}`);
      return true;
    }
    return false;
  }
  
  /**
   * 更新所有实体
   */
  update(deltaTime) {
    // 生成怪物
    this.spawnMobs();
    
    // 更新所有实体
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      
      // 更新实体
      if (typeof entity.update === 'function') {
        entity.update(deltaTime, this.player);
      }
      
      // 检查实体是否需要移除
      if (entity.health && entity.health.current <= 0) {
        this.removeEntity(entity);
      }
    }
  }
  
  /**
   * 渲染所有实体
   */
  render(ctx, camera) {
    // 渲染所有实体
    this.entities.forEach(entity => {
      if (typeof entity.render === 'function') {
        entity.render(ctx, camera);
      }
    });
  }
  
  /**
   * 生成怪物 - 考虑季节影响
   */
  spawnMobs() {
    if (!this.player || !this.gameEngine) return;
    
    const playerPos = this.player.getPosition();
    
    // 获取当前季节
    const currentSeason = this.gameEngine.getCurrentSeason();
    
    // 生成僵尸
    if (this.spawnConfig.zombie.enabled) {
      const zombieCount = this.entities.filter(e => e.type === 'zombie').length;
      
      // 检查是否达到最大数量
      if (zombieCount < this.spawnConfig.zombie.maxCount) {
        // 根据生成概率决定是否生成，并考虑季节影响
        let spawnRate = this.spawnConfig.zombie.spawnRate;
        
        // 根据季节调整生成率
        switch (currentSeason) {
          case 'spring':
            // 春季：生物活动增加
            spawnRate *= 1.2;
            break;
          case 'summer':
            // 夏季：生物活动最活跃
            spawnRate *= 1.5;
            break;
          case 'autumn':
            // 秋季：生物活动适中
            spawnRate *= 1.1;
            break;
          case 'winter':
            // 冬季：生物活动减少
            spawnRate *= 0.6;
            break;
        }
        
        if (Math.random() < spawnRate) {
          // 计算生成位置（在玩家附近但不要太近）
          const angle = Math.random() * Math.PI * 2;
          const minDist = this.spawnConfig.zombie.minDistance;
          const maxDist = this.spawnConfig.zombie.spawnDistance;
          const distance = minDist + Math.random() * (maxDist - minDist);
          
          const spawnX = playerPos.x + Math.cos(angle) * distance;
          const spawnY = playerPos.y + Math.sin(angle) * distance;
          
          // 创建僵尸
          const zombie = new Zombie(this.worldConfig, spawnX, spawnY);
          this.addEntity(zombie);
        }
      }
    }
    
    // 生成牛
    if (this.spawnConfig.cow.enabled) {
      const cowCount = this.entities.filter(e => e.type === 'cow').length;
      
      // 检查是否达到最大数量
      if (cowCount < this.spawnConfig.cow.maxCount) {
        // 根据生成概率决定是否生成，并考虑季节影响
        let spawnRate = this.spawnConfig.cow.spawnRate;
        
        // 根据季节调整生成率
        switch (currentSeason) {
          case 'spring':
            // 春季：生物活动增加
            spawnRate *= 1.3;
            break;
          case 'summer':
            // 夏季：生物活动最活跃
            spawnRate *= 1.5;
            break;
          case 'autumn':
            // 秋季：生物活动适中
            spawnRate *= 1.1;
            break;
          case 'winter':
            // 冬季：生物活动减少
            spawnRate *= 0.5;
            break;
        }
        
        if (Math.random() < spawnRate) {
          // 计算生成位置（在玩家附近但不要太近）
          const angle = Math.random() * Math.PI * 2;
          const minDist = this.spawnConfig.cow.minDistance;
          const maxDist = this.spawnConfig.cow.spawnDistance;
          const distance = minDist + Math.random() * (maxDist - minDist);
          
          const spawnX = playerPos.x + Math.cos(angle) * distance;
          const spawnY = playerPos.y + Math.sin(angle) * distance;
          
          // 创建牛
          const cow = new Cow(this.worldConfig, spawnX, spawnY);
          this.addEntity(cow);
        }
      }
    }
    
    // 生成猪
    if (this.spawnConfig.pig.enabled) {
      const pigCount = this.entities.filter(e => e.type === 'pig').length;
      
      // 检查是否达到最大数量
      if (pigCount < this.spawnConfig.pig.maxCount) {
        // 根据生成概率决定是否生成，并考虑季节影响
        let spawnRate = this.spawnConfig.pig.spawnRate;
        
        // 根据季节调整生成率
        switch (currentSeason) {
          case 'spring':
            // 春季：生物活动增加
            spawnRate *= 1.3;
            break;
          case 'summer':
            // 夏季：生物活动最活跃
            spawnRate *= 1.5;
            break;
          case 'autumn':
            // 秋季：生物活动适中
            spawnRate *= 1.1;
            break;
          case 'winter':
            // 冬季：生物活动减少
            spawnRate *= 0.5;
            break;
        }
        
        if (Math.random() < spawnRate) {
          // 计算生成位置（在玩家附近但不要太近）
          const angle = Math.random() * Math.PI * 2;
          const minDist = this.spawnConfig.pig.minDistance;
          const maxDist = this.spawnConfig.pig.spawnDistance;
          const distance = minDist + Math.random() * (maxDist - minDist);
          
          const spawnX = playerPos.x + Math.cos(angle) * distance;
          const spawnY = playerPos.y + Math.sin(angle) * distance;
          
          // 创建猪
          const pig = new Pig(this.worldConfig, spawnX, spawnY);
          this.addEntity(pig);
        }
      }
    }
    
    // 生成鸡
    if (this.spawnConfig.chicken.enabled) {
      const chickenCount = this.entities.filter(e => e.type === 'chicken').length;
      
      // 检查是否达到最大数量
      if (chickenCount < this.spawnConfig.chicken.maxCount) {
        // 根据生成概率决定是否生成，并考虑季节影响
        let spawnRate = this.spawnConfig.chicken.spawnRate;
        
        // 根据季节调整生成率
        switch (currentSeason) {
          case 'spring':
            // 春季：生物活动增加
            spawnRate *= 1.4;
            break;
          case 'summer':
            // 夏季：生物活动最活跃
            spawnRate *= 1.6;
            break;
          case 'autumn':
            // 秋季：生物活动适中
            spawnRate *= 1.2;
            break;
          case 'winter':
            // 冬季：生物活动减少
            spawnRate *= 0.4;
            break;
        }
        
        if (Math.random() < spawnRate) {
          // 计算生成位置（在玩家附近但不要太近）
          const angle = Math.random() * Math.PI * 2;
          const minDist = this.spawnConfig.chicken.minDistance;
          const maxDist = this.spawnConfig.chicken.spawnDistance;
          const distance = minDist + Math.random() * (maxDist - minDist);
          
          const spawnX = playerPos.x + Math.cos(angle) * distance;
          const spawnY = playerPos.y + Math.sin(angle) * distance;
          
          // 创建鸡
          const chicken = new Chicken(this.worldConfig, spawnX, spawnY);
          this.addEntity(chicken);
        }
      }
    }
  }
  
  /**
   * 获取所有实体
   */
  getEntities() {
    return [...this.entities];
  }
  
  /**
   * 根据类型获取实体
   */
  getEntitiesByType(type) {
    return this.entities.filter(entity => entity.type === type);
  }
  
  /**
   * 清除所有实体
   */
  clear() {
    this.entities = [];
    console.log('🧹 清除所有实体');
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    const stats = {
      total: this.entities.length,
      byType: {}
    };
    
    // 统计各类型实体数量
    this.entities.forEach(entity => {
      if (!stats.byType[entity.type]) {
        stats.byType[entity.type] = 0;
      }
      stats.byType[entity.type]++;
    });
    
    return stats;
  }
  
  /**
   * 喂食实体（用于触发繁殖）
   */
  feedEntity(entity, item) {
    // 检查实体是否为被动生物
    if (entity && entity.passive && entity.passive.breedItem) {
      // 检查物品是否为该生物的繁殖物品
      if (item && item.id === entity.passive.breedItem) {
        // 检查是否可以进入恋爱模式
        if (entity.canEnterLoveMode()) {
          // 进入恋爱模式
          entity.enterLoveMode();
          console.log(`💕 ${entity.type} 进入了恋爱模式`);
          return true;
        }
      }
    }
    return false;
  }
}