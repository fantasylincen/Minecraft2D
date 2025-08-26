/**
 * PlayerMovement模块单元测试
 */

import { Player } from '../player/Player.js';
import { PlayerMovement } from '../player/PlayerMovement.js';

// 模拟worldConfig
const mockWorldConfig = {
  BLOCK_SIZE: 16,
  WORLD_HEIGHT: 256
};

// 模拟控制台输出以避免测试时产生干扰
const originalConsoleLog = console.log;

describe('PlayerMovement模块测试', () => {
  let player;
  let playerMovement;
  
  beforeAll(() => {
    // 禁用控制台输出
    console.log = jest.fn();
  });
  
  afterAll(() => {
    // 恢复控制台输出
    console.log = originalConsoleLog;
  });
  
  beforeEach(() => {
    player = new Player(mockWorldConfig);
    playerMovement = new PlayerMovement(player);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('应该正确初始化', () => {
    expect(playerMovement).toBeInstanceOf(PlayerMovement);
    expect(playerMovement.player).toBe(player);
  });
  
  test('应该能够提升飞行速度', () => {
    const initialSpeed = player.flyMode.speedMultiplier;
    playerMovement.increaseFlySpeed();
    const newSpeed = player.flyMode.speedMultiplier;
    
    expect(newSpeed).toBeGreaterThan(initialSpeed);
  });
  
  test('应该能够降低飞行速度', () => {
    // 先提升速度
    player.flyMode.speedMultiplier = 2.0;
    const initialSpeed = player.flyMode.speedMultiplier;
    playerMovement.decreaseFlySpeed();
    const newSpeed = player.flyMode.speedMultiplier;
    
    expect(newSpeed).toBeLessThan(initialSpeed);
  });
  
  test('应该能够设置飞行速度倍率', () => {
    const newMultiplier = 5.0;
    playerMovement.setFlySpeedMultiplier(newMultiplier);
    const actualMultiplier = player.flyMode.speedMultiplier;
    
    expect(actualMultiplier).toBe(newMultiplier);
  });
  
  test('应该能够获取飞行速度倍率', () => {
    player.flyMode.speedMultiplier = 3.0;
    const multiplier = playerMovement.getFlySpeedMultiplier();
    
    expect(multiplier).toBe(3.0);
  });
  
  test('应该能够获取飞行速度百分比', () => {
    player.flyMode.speedMultiplier = 2.5;
    const percentage = playerMovement.getFlySpeedPercentage();
    
    expect(percentage).toBe(250);
  });
  
  test('应该能够重置飞行速度', () => {
    player.flyMode.speedMultiplier = 5.0;
    playerMovement.resetFlySpeed();
    const resetSpeed = player.flyMode.speedMultiplier;
    
    expect(resetSpeed).toBe(1.0);
  });
  
  test('应该能够切换飞行模式', () => {
    const initialFlyingState = player.flyMode.enabled;
    playerMovement.toggleFlyMode();
    const newFlyingState = player.flyMode.enabled;
    
    expect(newFlyingState).not.toBe(initialFlyingState);
  });
  
  test('应该能够检查是否在飞行模式', () => {
    // 默认应该是false
    expect(playerMovement.isFlying()).toBe(false);
    
    // 启用飞行模式
    player.flyMode.enabled = true;
    expect(playerMovement.isFlying()).toBe(true);
  });
  
  test('应该能够禁用飞行模式', () => {
    player.flyMode.enabled = true;
    playerMovement.disableFlyMode();
    
    expect(player.flyMode.enabled).toBe(false);
  });
  
  test('应该能够启用飞行模式', () => {
    player.flyMode.enabled = false;
    playerMovement.enableFlyMode();
    
    expect(player.flyMode.enabled).toBe(true);
  });
  
  test('应该能够更新玩家朝向', () => {
    const initialAngle = player.facing.angle;
    const initialDirectionX = player.facing.directionX;
    const initialDirectionY = player.facing.directionY;
    
    // 设置鼠标位置
    player.mousePosition.x = 100;
    player.mousePosition.y = 50;
    
    // 更新朝向
    playerMovement.updateFacing();
    
    // 验证朝向已更新
    expect(player.facing.angle).not.toBe(initialAngle);
    expect(player.facing.directionX).not.toBe(initialDirectionX);
    expect(player.facing.directionY).not.toBe(initialDirectionY);
  });
  
  test('应该能够获取玩家朝向信息', () => {
    const facing = playerMovement.getFacing();
    
    expect(facing).toHaveProperty('angle');
    expect(facing).toHaveProperty('directionX');
    expect(facing).toHaveProperty('directionY');
    expect(typeof facing.angle).toBe('number');
    expect(typeof facing.directionX).toBe('number');
    expect(typeof facing.directionY).toBe('number');
  });
});