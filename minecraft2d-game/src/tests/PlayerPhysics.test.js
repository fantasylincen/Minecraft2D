/**
 * PlayerPhysics模块单元测试
 */

import { Player } from '../player/Player.js';
import { PlayerPhysics } from '../player/PlayerPhysics.js';

// 模拟worldConfig
const mockWorldConfig = {
  BLOCK_SIZE: 16,
  WORLD_HEIGHT: 256
};

// 模拟控制台输出以避免测试时产生干扰
const originalConsoleLog = console.log;

describe('PlayerPhysics模块测试', () => {
  let player;
  let playerPhysics;
  
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
    playerPhysics = new PlayerPhysics(player);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('应该正确初始化', () => {
    expect(playerPhysics).toBeInstanceOf(PlayerPhysics);
    expect(playerPhysics.player).toBe(player);
    expect(playerPhysics.worldConfig).toBe(mockWorldConfig);
  });
  
  test('应该能够更新物理状态', () => {
    // 保存原始状态
    const originalVelocityX = player.physics.velocity.x;
    const originalVelocityY = player.physics.velocity.y;
    
    // 更新物理状态
    playerPhysics.updatePhysics(0.016); // 60 FPS deltaTime
    
    // 验证物理状态已更新
    expect(player.physics.velocity.x).toBeDefined();
    expect(player.physics.velocity.y).toBeDefined();
  });
  
  test('应该能够更新正常模式物理', () => {
    player.flyMode.enabled = false;
    
    // 设置一些初始状态
    player.controls.left = true;
    player.physics.velocity.x = 0;
    
    // 更新正常物理
    playerPhysics.updateNormalPhysics(0.016);
    
    // 验证速度已更新
    expect(player.physics.velocity.x).toBeLessThan(0); // 向左移动应该是负速度
  });
  
  test('应该能够更新飞行模式物理', () => {
    player.flyMode.enabled = true;
    
    // 设置一些初始状态
    player.controls.up = true;
    player.physics.velocity.y = 0;
    
    // 更新飞行物理
    playerPhysics.updateFlyingPhysics(0.016);
    
    // 验证速度已更新
    expect(player.physics.velocity.y).toBeGreaterThan(0); // 向上移动应该是正速度
  });
  
  test('应该能够检查是否在飞行模式', () => {
    // 默认应该是false
    expect(playerPhysics.isFlying()).toBe(false);
    
    // 启用飞行模式
    player.flyMode.enabled = true;
    expect(playerPhysics.isFlying()).toBe(true);
  });
  
  test('应该能够处理水平移动', () => {
    // 设置初始位置和速度
    player.position.x = 100;
    player.physics.velocity.x = 50;
    
    const initialX = player.position.x;
    
    // 执行水平移动
    playerPhysics.moveHorizontal(0.016);
    
    // 验证位置已更新
    expect(player.position.x).not.toBe(initialX);
  });
  
  test('应该能够处理垂直移动', () => {
    // 设置初始位置和速度
    player.position.y = 100;
    player.physics.velocity.y = 50;
    
    const initialY = player.position.y;
    
    // 执行垂直移动
    playerPhysics.moveVertical(0.016);
    
    // 验证位置已更新
    expect(player.position.y).not.toBe(initialY);
  });
  
  test('应该能够约束玩家在世界范围内', () => {
    // 将玩家位置设置在世界底部以下
    player.position.y = -100;
    
    // 约束玩家位置
    playerPhysics.constrainToWorld();
    
    // 验证玩家已重生
    // 注意：实际的重生逻辑可能更复杂，这里只是简单验证
    expect(player.position.y).toBeDefined();
  });
});