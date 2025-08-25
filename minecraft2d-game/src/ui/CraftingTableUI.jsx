/**
 * 制作台界面组件
 */

import React, { useState, useEffect, useCallback } from 'react';
import '../App.css';
import './InventoryUI.css';

const CraftingTableUI = ({ 
  craftingTable, 
  playerInventory, 
  onClose, 
  onCraft,
  gameEngine 
}) => {
  const [craftingGrid, setCraftingGrid] = useState(Array(9).fill(null));
  const [resultSlot, setResultSlot] = useState(null);
  const [playerItems, setPlayerItems] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragItem, setDragItem] = useState(null);

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

  // 初始化制作台网格
  useEffect(() => {
    if (craftingTable) {
      const grid = [];
      for (let i = 0; i < 9; i++) {
        const slot = craftingTable.getSlot(i);
        grid.push(slot && slot.itemId ? { ...slot, slotIndex: i } : null);
      }
      setCraftingGrid(grid);
    }
  }, [craftingTable]);

  // 处理槽位点击
  const handleSlotClick = useCallback((item, source, index) => {
    if (!item && !selectedSlot) return;

    // 如果没有选中物品且点击的是有物品的槽位，则选中该物品
    if (!selectedSlot && item) {
      setSelectedSlot({ item: { ...item }, source, index });
      return;
    }

    // 如果已选中物品
    if (selectedSlot) {
      // 点击空槽位或不同物品槽位
      if (!item || item.itemId !== selectedSlot.item.itemId) {
        // 移动物品
        if (source === 'crafting') {
          // 从制作台移动到玩家背包或其他制作台槽位
          if (selectedSlot.source === 'player') {
            // 从玩家背包移动到制作台
            const newGrid = [...craftingGrid];
            newGrid[index] = { 
              itemId: selectedSlot.item.itemId, 
              count: 1,
              durability: selectedSlot.item.durability
            };
            setCraftingGrid(newGrid);
            
            // 更新玩家背包
            if (playerInventory) {
              const newPlayerItems = [...playerItems];
              const playerSlotIndex = newPlayerItems.findIndex(
                item => item.slotIndex === selectedSlot.index
              );
              if (playerSlotIndex !== -1) {
                if (newPlayerItems[playerSlotIndex].count > 1) {
                  newPlayerItems[playerSlotIndex].count -= 1;
                } else {
                  newPlayerItems.splice(playerSlotIndex, 1);
                }
                setPlayerItems(newPlayerItems);
              }
            }
          } else if (selectedSlot.source === 'crafting') {
            // 在制作台内部移动
            const newGrid = [...craftingGrid];
            newGrid[index] = selectedSlot.item;
            newGrid[selectedSlot.index] = null;
            setCraftingGrid(newGrid);
          }
        } else if (source === 'player') {
          // 移动到玩家背包
          if (selectedSlot.source === 'crafting') {
            // 从制作台移动到玩家背包
            const newGrid = [...craftingGrid];
            newGrid[selectedSlot.index] = null;
            setCraftingGrid(newGrid);
            
            // 添加到玩家背包
            const newPlayerItems = [...playerItems];
            newPlayerItems.push({ 
              ...selectedSlot.item, 
              slotIndex: newPlayerItems.length 
            });
            setPlayerItems(newPlayerItems);
          }
        }
      }
      
      // 清除选中状态
      setSelectedSlot(null);
    }
  }, [selectedSlot, craftingGrid, playerItems, playerInventory]);

  // 处理拖拽开始
  const handleDragStart = (e, item, source, index) => {
    e.dataTransfer.setData('text/plain', '');
    setIsDragging(true);
    setDragItem({ item, source, index });
  };

  // 处理拖拽结束
  const handleDragEnd = () => {
    setIsDragging(false);
    setDragItem(null);
  };

  // 处理拖拽放置
  const handleDrop = (e, targetSource, targetIndex) => {
    e.preventDefault();
    if (!dragItem) return;

    const { item, source, index } = dragItem;

    // 移动物品逻辑
    if (targetSource === 'crafting') {
      if (source === 'player') {
        // 从玩家背包移动到制作台
        const newGrid = [...craftingGrid];
        newGrid[targetIndex] = { 
          itemId: item.itemId, 
          count: 1,
          durability: item.durability
        };
        setCraftingGrid(newGrid);
        
        // 更新玩家背包
        if (playerInventory) {
          const newPlayerItems = [...playerItems];
          const playerSlotIndex = newPlayerItems.findIndex(
            pItem => pItem.slotIndex === index
          );
          if (playerSlotIndex !== -1) {
            if (newPlayerItems[playerSlotIndex].count > 1) {
              newPlayerItems[playerSlotIndex].count -= 1;
            } else {
              newPlayerItems.splice(playerSlotIndex, 1);
            }
            setPlayerItems(newPlayerItems);
          }
        }
      } else if (source === 'crafting') {
        // 在制作台内部移动
        const newGrid = [...craftingGrid];
        newGrid[targetIndex] = item;
        newGrid[index] = null;
        setCraftingGrid(newGrid);
      }
    } else if (targetSource === 'player') {
      if (source === 'crafting') {
        // 从制作台移动到玩家背包
        const newGrid = [...craftingGrid];
        newGrid[index] = null;
        setCraftingGrid(newGrid);
        
        // 添加到玩家背包
        const newPlayerItems = [...playerItems];
        newPlayerItems.push({ 
          ...item, 
          slotIndex: newPlayerItems.length 
        });
        setPlayerItems(newPlayerItems);
      }
    }

    setIsDragging(false);
    setDragItem(null);
  };

  // 处理拖拽悬停
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // 处理合成
  const handleCraft = () => {
    // 这里应该实现实际的合成逻辑
    // 暂时只是示例
    console.log('执行合成操作');
    if (onCraft) {
      onCraft(craftingGrid);
    }
  };

  // 渲染物品图标
  const renderItemIcon = (itemId) => {
    // 简单的颜色映射，实际项目中应该使用真实的图标
    const colorMap = {
      'wood_item': '#8B4513',
      'stone_item': '#696969',
      'iron_item': '#C0C0C0',
      'gold_item': '#FFD700',
      'diamond_item': '#B9F2FF',
      'coal_item': '#2F2F2F',
      'crafting_table_item': '#8B4513'
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

  return (
    <div className="inventory-ui crafting-table-ui">
      <div className="inventory-header">
        <h2>制作台</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="crafting-content">
        {/* 制作网格 */}
        <div className="crafting-grid">
          <h3>制作网格</h3>
          <div className="grid-container">
            {craftingGrid.map((item, index) => (
              <div
                key={index}
                className={`inventory-slot ${selectedSlot && selectedSlot.index === index && selectedSlot.source === 'crafting' ? 'selected' : ''}`}
                onClick={() => handleSlotClick(item, 'crafting', index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'crafting', index)}
                draggable={!!item}
                onDragStart={(e) => item && handleDragStart(e, item, 'crafting', index)}
                onDragEnd={handleDragEnd}
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
        
        {/* 结果槽位 */}
        <div className="result-slot-container">
          <h3>结果</h3>
          <div 
            className="result-slot inventory-slot"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'result', 0)}
          >
            {resultSlot && (
              <>
                {renderItemIcon(resultSlot.itemId)}
                <span className="item-count">{resultSlot.count > 1 ? resultSlot.count : ''}</span>
              </>
            )}
          </div>
          <button className="craft-button" onClick={handleCraft}>
            合成
          </button>
        </div>
        
        {/* 玩家背包 */}
        <div className="player-inventory">
          <h3>物品栏</h3>
          <div className="inventory-grid">
            {playerItems.map((item, index) => (
              <div
                key={index}
                className={`inventory-slot ${selectedSlot && selectedSlot.index === item.slotIndex && selectedSlot.source === 'player' ? 'selected' : ''}`}
                onClick={() => handleSlotClick(item, 'player', item.slotIndex)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'player', item.slotIndex)}
                draggable={!!item}
                onDragStart={(e) => item && handleDragStart(e, item, 'player', item.slotIndex)}
                onDragEnd={handleDragEnd}
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

export default CraftingTableUI;