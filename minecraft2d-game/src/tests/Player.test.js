/**
 * Player模块单元测试
 */

import { Player } from '../player/Player.js';
import { PlayerPhysics } from '../player/PlayerPhysics.js';
import { PlayerMovement } from '../player/PlayerMovement.js';
import { PlayerHealth } from '../player/PlayerHealth.js';
import { PlayerMining } from '../player/PlayerMining.js';
import { PlayerPlacement } from '../player/PlayerPlacement.js';
import { PlayerRendering } from '../player/PlayerRendering.js';
import { PlayerInventory } from '../player/PlayerInventory.js';
import { PlayerInteraction } from '../player/PlayerInteraction.js';

// 模拟worldConfig
const mockWorldConfig = {
  BLOCK_SIZE: 16,
  WORLD_HEIGHT: 256
};

// 模拟控制台输出以避免测试时产生干扰
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

describe('Player模块测试', () => {
  let player;
  
  beforeAll(() => {
    // 禁用控制台输出
    console.log = jest.fn();
    console.warn = jest.fn();
  });
  
  afterAll(() => {
    // 恢复控制台输出
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
  });
  
  beforeEach(() => {
    player = new Player(mockWorldConfig);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Player主模块', () => {
    test('应该正确初始化', () => {
      expect(player).toBeInstanceOf(Player);
      expect(player.position).toBeDefined();
      expect(player.physics).toBeDefined();
      expect(player.health).toBeDefined();
      expect(player.inventory).toBeDefined();
    });
    
    test('应该正确初始化所有子模块', () => {
      expect(player.physicsModule).toBeInstanceOf(PlayerPhysics);
      expect(player.movementModule).toBeInstanceOf(PlayerMovement);
      expect(player.healthModule).toBeInstanceOf(PlayerHealth);
      expect(player.miningModule).toBeInstanceOf(PlayerMining);
      expect(player.placementModule).toBeInstanceOf(PlayerPlacement);
      expect(player.renderingModule).toBeInstanceOf(PlayerRendering);
      expect(player.inventoryModule).toBeInstanceOf(PlayerInventory);
      expect(player.interactionModule).toBeInstanceOf(PlayerInteraction);
    });
    
    test('应该能够获取玩家位置', () => {
      const position = player.getPosition();
      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
      expect(typeof position.x).toBe('number');
      expect(typeof position.y).toBe('number');
    });
    
    test('应该能够设置玩家位置', () => {
      const newX = 100;
      const newY = 200;
      player.setPosition(newX, newY);
      
      const position = player.getPosition();
      expect(position.x).toBe(newX);
      expect(position.y).toBe(newY);
    });
  });
  
  describe('PlayerMovement模块', () => {
    test('应该能够切换飞行模式', () => {
      const initialFlyingState = player.isFlying();
      player.toggleFlyMode();
      const newFlyingState = player.isFlying();
      
      expect(newFlyingState).not.toBe(initialFlyingState);
    });
    
    test('应该能够获取飞行速度百分比', () => {
      const speedPercentage = player.getFlySpeedPercentage();
      expect(typeof speedPercentage).toBe('number');
      expect(speedPercentage).toBeGreaterThanOrEqual(100);
      expect(speedPercentage).toBeLessThanOrEqual(1000);
    });
    
    test('应该能够重置飞行速度', () => {
      player.increaseFlySpeed();
      const increasedSpeed = player.getFlySpeedPercentage();
      player.resetFlySpeed();
      const resetSpeed = player.getFlySpeedPercentage();
      
      expect(increasedSpeed).toBeGreaterThan(100);
      expect(resetSpeed).toBe(100);
    });
  });
  
  describe('PlayerHealth模块', () => {
    test('应该能够处理受伤', () => {
      const initialHealth = player.health.current;
      const damage = 10;
      player.takeDamage(damage);
      const newHealth = player.health.current;
      
      expect(newHealth).toBe(initialHealth - damage);
    });
    
    test('应该能够处理治疗', () => {
      // 先受伤
      player.takeDamage(20);
      const damagedHealth = player.health.current;
      
      // 然后治疗
      const healAmount = 10;
      player.heal(healAmount);
      const healedHealth = player.health.current;
      
      expect(healedHealth).toBe(damagedHealth + healAmount);
    });
  });
  
  describe('PlayerInventory模块', () => {
    test('应该能够获取物品栏', () => {
      const inventory = player.getInventory();
      expect(inventory).toBeDefined();
      expect(typeof inventory.addItem).toBe('function');
      expect(typeof inventory.removeItem).toBe('function');
    });
    
    test('应该能够获取当前手持物品', () => {
      const heldItem = player.getHeldItem();
      expect(heldItem).toBeDefined();
    });
  });
  
  describe('PlayerMining模块', () => {
    test('应该能够获取目标方块', () => {
      const targetBlock = player.getTargetBlock();
      // 由于没有设置地形生成器，应该返回null
      expect(targetBlock).toBeNull();
    });
  });
  
  describe('PlayerPlacement模块', () => {
    test('应该能够获取放置预览位置', () => {
      const previewPosition = player.getPlacementPreviewPosition();
      expect(previewPosition).toBeNull(); // 没有地形生成器时返回null
    });
  });
});