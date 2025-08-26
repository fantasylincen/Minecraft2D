/**
 * 熔炉界面组件
 */

import React, { useState, useEffect } from 'react';
import { inputManager } from '../input/InputManager.js'; // 新增导入
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

  // 当熔炉界面显示时，设置输入管理器的上下文
  useEffect(() => {
    // 设置输入管理器上下文为熔炉
    inputManager.setActiveContext('furnace');
    
    // 注册ESC键关闭熔炉
    const handleEscapeKey = (event) => {
      onClose?.();
    };
    
    inputManager.registerKeyHandler('Escape', handleEscapeKey, 'furnace', 10);
    
    // 清理函数
    return () => {
      // 恢复输入管理器上下文为游戏
      inputManager.setActiveContext('game');
      inputManager.unregisterKeyHandler('Escape', handleEscapeKey, false);
    };
  }, [onClose]);

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
    // 实现物品移动逻辑
    console.log(`点击槽位: ${source}, 索引: ${index}`, item);
    
    // 如果点击的是玩家背包中的物品
    if (source === 'player' && item) {
      // 检查物品类型以确定应该放在哪个槽位
      const itemDef = gameEngine?.systems?.player?.inventory?.getItemDefinition?.(item.itemId);
      
      if (itemDef) {
        // 如果是燃料
        if (['coal_item', 'wood_item', 'planks_item', 'sticks_item'].includes(item.itemId)) {
          // 放入燃料槽位
          const fuelSlot = furnace.getSlot(1);
          if (!fuelSlot.itemId || fuelSlot.itemId === item.itemId) {
            // 移动物品
            const playerSlot = playerInventory.getSlot(item.slotIndex >= 9 ? item.slotIndex - 9 : item.slotIndex, 
              item.slotIndex >= 9 ? 'main' : 'hotbar');
            if (playerSlot && playerSlot.itemId) {
              // 计算可以移动的数量
              const maxMove = Math.min(playerSlot.count, 64 - (fuelSlot.count || 0));
              if (maxMove > 0) {
                // 更新熔炉槽位
                if (!fuelSlot.itemId) {
                  fuelSlot.itemId = playerSlot.itemId;
                  fuelSlot.count = maxMove;
                } else {
                  fuelSlot.count += maxMove;
                }
                
                // 更新玩家背包
                playerSlot.count -= maxMove;
                if (playerSlot.count <= 0) {
                  playerSlot.itemId = null;
                  playerSlot.count = 0;
                }
                
                // 更新状态
                setFuelSlot(fuelSlot.itemId ? { ...fuelSlot } : null);
                const updatedPlayerItems = [...playerItems];
                const playerItemIndex = updatedPlayerItems.findIndex(i => i.slotIndex === item.slotIndex);
                if (playerItemIndex !== -1) {
                  if (playerSlot.count > 0) {
                    updatedPlayerItems[playerItemIndex] = { ...playerSlot, slotIndex: item.slotIndex };
                  } else {
                    updatedPlayerItems.splice(playerItemIndex, 1);
                  }
                  setPlayerItems(updatedPlayerItems);
                }
                
                console.log(`移动了 ${maxMove} 个 ${item.itemId} 到燃料槽位`);
              }
            }
          }
        } 
        // 如果是可熔炼的物品
        else if (['iron_ore_item', 'gold_ore_item', 'sand_item', 'clay_ball_item'].includes(item.itemId)) {
          // 放入输入槽位
          const inputSlot = furnace.getSlot(0);
          if (!inputSlot.itemId || inputSlot.itemId === item.itemId) {
            // 移动物品
            const playerSlot = playerInventory.getSlot(item.slotIndex >= 9 ? item.slotIndex - 9 : item.slotIndex, 
              item.slotIndex >= 9 ? 'main' : 'hotbar');
            if (playerSlot && playerSlot.itemId) {
              // 计算可以移动的数量
              const maxMove = Math.min(playerSlot.count, 64 - (inputSlot.count || 0));
              if (maxMove > 0) {
                // 更新熔炉槽位
                if (!inputSlot.itemId) {
                  inputSlot.itemId = playerSlot.itemId;
                  inputSlot.count = maxMove;
                } else {
                  inputSlot.count += maxMove;
                }
                
                // 更新玩家背包
                playerSlot.count -= maxMove;
                if (playerSlot.count <= 0) {
                  playerSlot.itemId = null;
                  playerSlot.count = 0;
                }
                
                // 更新状态
                setInputSlot(inputSlot.itemId ? { ...inputSlot } : null);
                const updatedPlayerItems = [...playerItems];
                const playerItemIndex = updatedPlayerItems.findIndex(i => i.slotIndex === item.slotIndex);
                if (playerItemIndex !== -1) {
                  if (playerSlot.count > 0) {
                    updatedPlayerItems[playerItemIndex] = { ...playerSlot, slotIndex: item.slotIndex };
                  } else {
                    updatedPlayerItems.splice(playerItemIndex, 1);
                  }
                  setPlayerItems(updatedPlayerItems);
                }
                
                console.log(`移动了 ${maxMove} 个 ${item.itemId} 到输入槽位`);
              }
            }
          }
        }
      }
    }
    // 如果点击的是熔炉槽位中的物品
    else if (['input', 'fuel', 'output'].includes(source) && item) {
      // 将物品移回玩家背包
      const emptySlotIndex = playerInventory.getFirstEmptySlot();
      if (emptySlotIndex !== -1) {
        // 获取对应的熔炉槽位
        let furnaceSlot;
        if (source === 'input') {
          furnaceSlot = furnace.getSlot(0);
        } else if (source === 'fuel') {
          furnaceSlot = furnace.getSlot(1);
        } else {
          furnaceSlot = furnace.getSlot(2);
        }
        
        if (furnaceSlot && furnaceSlot.itemId) {
          // 移动物品到玩家背包
          const playerSlot = playerInventory.getSlot(emptySlotIndex >= 9 ? emptySlotIndex - 9 : emptySlotIndex, 
            emptySlotIndex >= 9 ? 'main' : 'hotbar');
          if (playerSlot) {
            playerSlot.itemId = furnaceSlot.itemId;
            playerSlot.count = furnaceSlot.count;
            
            // 清空熔炉槽位
            furnaceSlot.itemId = null;
            furnaceSlot.count = 0;
            
            // 更新状态
            if (source === 'input') {
              setInputSlot(null);
            } else if (source === 'fuel') {
              setFuelSlot(null);
            } else {
              setOutputSlot(null);
            }
            
            // 更新玩家物品列表
            const updatedPlayerItems = [...playerItems];
            updatedPlayerItems.push({ ...playerSlot, slotIndex: emptySlotIndex });
            setPlayerItems(updatedPlayerItems);
            
            console.log(`将 ${furnaceSlot.count} 个 ${furnaceSlot.itemId} 移回玩家背包`);
          }
        }
      }
    }
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