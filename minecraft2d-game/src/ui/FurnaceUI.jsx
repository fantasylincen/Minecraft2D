/**
 * 熔炉界面组件
 */

import React, { useState, useEffect } from 'react';
import '../App.css';
import './InventoryUI.css';

const FurnaceUI = ({ 
  furnace, 
  playerInventory, 
  onClose,
  gameEngine 
}) => {
  const [inputSlot, setInputSlot] = useState(null);
  const [fuelSlot, setFuelSlot] = useState(null);
  const [outputSlot, setOutputSlot] = useState(null);
  const [playerItems, setPlayerItems] = useState([]);
  const [furnaceStatus, setFurnaceStatus] = useState({
    isBurning: false,
    burnTime: 0,
    totalBurnTime: 0,
    cookTime: 0,
    totalCookTime: 200
  });

  // 初始化玩家物品
  useEffect(() => {
    if (playerInventory) {
      const items = [];
      for (let i = 0; i < playerInventory.size; i++) {
        const slot = playerInventory.getSlot(i);
        if (slot && slot.itemId) {
          items.push({ ...slot, slotIndex: i });
        }
      }
      setPlayerItems(items);
    }
  }, [playerInventory]);

  // 初始化熔炉槽位
  useEffect(() => {
    if (furnace) {
      const input = furnace.getSlot(0);
      const fuel = furnace.getSlot(1);
      const output = furnace.getSlot(2);
      
      setInputSlot(input && input.itemId ? { ...input } : null);
      setFuelSlot(fuel && fuel.itemId ? { ...fuel } : null);
      setOutputSlot(output && output.itemId ? { ...output } : null);
      
      // 获取熔炉状态
      if (furnace.getStatus) {
        setFurnaceStatus(furnace.getStatus());
      }
    }
  }, [furnace]);

  // 定期更新熔炉状态
  useEffect(() => {
    if (!furnace) return;
    
    const interval = setInterval(() => {
      // 更新槽位
      const input = furnace.getSlot(0);
      const fuel = furnace.getSlot(1);
      const output = furnace.getSlot(2);
      
      setInputSlot(input && input.itemId ? { ...input } : null);
      setFuelSlot(fuel && fuel.itemId ? { ...fuel } : null);
      setOutputSlot(output && output.itemId ? { ...output } : null);
      
      // 更新状态
      if (furnace.getStatus) {
        setFurnaceStatus(furnace.getStatus());
      }
    }, 500); // 每500ms更新一次
    
    return () => clearInterval(interval);
  }, [furnace]);

  // 处理槽位点击
  const handleSlotClick = (item, source, index) => {
    // 这里应该实现物品移动逻辑
    console.log(`点击槽位: ${source}, 索引: ${index}`, item);
  };

  // 渲染物品图标
  const renderItemIcon = (itemId) => {
    // 简单的颜色映射，实际项目中应该使用真实的图标
    const colorMap = {
      'wood_item': '#8B4513',
      'coal_item': '#2F2F2F',
      'iron_ore_item': '#696969',
      'iron_item': '#C0C0C0',
      'gold_ore_item': '#FFD700',
      'gold_item': '#FFD700',
      'diamond_item': '#B9F2FF',
      'sand_item': '#F4A460',
      'glass_item': '#FFFFFF',
      'clay_ball_item': '#CD5C5C',
      'brick_item': '#8B4513',
      'furnace_item': '#696969'
    };
    
    return (
      <div 
        className="inventory-item-icon"
        style={{ backgroundColor: colorMap[itemId] || '#CCCCCC' }}
      >
        {itemId?.split('_')[0]?.charAt(0)?.toUpperCase() || '?'}
      </div>
    );
  };

  // 计算燃烧进度
  const getBurnProgress = () => {
    if (furnaceStatus.totalBurnTime <= 0) return 0;
    return (furnaceStatus.burnTime / furnaceStatus.totalBurnTime) * 100;
  };

  // 计算烹饪进度
  const getCookProgress = () => {
    if (furnaceStatus.totalCookTime <= 0) return 0;
    return (furnaceStatus.cookTime / furnaceStatus.totalCookTime) * 100;
  };

  return (
    <div className="inventory-ui furnace-ui">
      <div className="inventory-header">
        <h2>熔炉</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="furnace-content">
        {/* 输入槽位 */}
        <div className="furnace-input">
          <h3>输入</h3>
          <div 
            className="inventory-slot"
            onClick={() => handleSlotClick(inputSlot, 'input', 0)}
          >
            {inputSlot && (
              <>
                {renderItemIcon(inputSlot.itemId)}
                <span className="item-count">{inputSlot.count > 1 ? inputSlot.count : ''}</span>
              </>
            )}
          </div>
        </div>
        
        {/* 燃料槽位 */}
        <div className="furnace-fuel">
          <h3>燃料</h3>
          <div 
            className="inventory-slot"
            onClick={() => handleSlotClick(fuelSlot, 'fuel', 1)}
          >
            {fuelSlot && (
              <>
                {renderItemIcon(fuelSlot.itemId)}
                <span className="item-count">{fuelSlot.count > 1 ? fuelSlot.count : ''}</span>
              </>
            )}
          </div>
        </div>
        
        {/* 燃烧指示器 */}
        <div className="furnace-burn-indicator">
          <div 
            className="burn-progress"
            style={{ 
              height: `${getBurnProgress()}%`,
              backgroundColor: furnaceStatus.isBurning ? '#FF4500' : '#696969'
            }}
          />
        </div>
        
        {/* 烹饪进度条 */}
        <div className="furnace-cook-progress">
          <div 
            className="cook-progress-bar"
            style={{ width: `${getCookProgress()}%` }}
          />
        </div>
        
        {/* 输出槽位 */}
        <div className="furnace-output">
          <h3>输出</h3>
          <div 
            className="inventory-slot"
            onClick={() => handleSlotClick(outputSlot, 'output', 2)}
          >
            {outputSlot && (
              <>
                {renderItemIcon(outputSlot.itemId)}
                <span className="item-count">{outputSlot.count > 1 ? outputSlot.count : ''}</span>
              </>
            )}
          </div>
        </div>
        
        {/* 玩家背包 */}
        <div className="player-inventory">
          <h3>物品栏</h3>
          <div className="inventory-grid">
            {playerItems.map((item, index) => (
              <div
                key={index}
                className="inventory-slot"
                onClick={() => handleSlotClick(item, 'player', item.slotIndex)}
              >
                {item && (
                  <>
                    {renderItemIcon(item.itemId)}
                    <span className="item-count">{item.count > 1 ? item.count : ''}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FurnaceUI;