/**
 * 物品栏UI组件
 * 显示快捷栏和背包界面
 */

import React, { useState, useEffect, useRef } from 'react';
import { itemConfig, ItemRarity } from '../config/ItemConfig.js';
import './InventoryUI.css';

/**
 * 物品槽位组件
 */
export const ItemSlotComponent = ({ 
  slot, 
  index, 
  isSelected = false, 
  onClick, 
  onRightClick,
  onMouseEnter,
  onMouseLeave,
  className = '',
  showTooltip = true
}) => {
  const [showTooltipState, setShowTooltipState] = useState(false);
  const item = slot?.getItemDefinition();
  
  const handleMouseEnter = (e) => {
    if (showTooltip && !slot?.isEmpty()) {
      setShowTooltipState(true);
    }
    onMouseEnter?.(e, slot, index);
  };
  
  const handleMouseLeave = (e) => {
    setShowTooltipState(false);
    onMouseLeave?.(e, slot, index);
  };
  
  const handleClick = (e) => {
    onClick?.(e, slot, index);
  };
  
  const handleRightClick = (e) => {
    e.preventDefault();
    onRightClick?.(e, slot, index);
  };
  
  // 获取稀有度颜色
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case ItemRarity.COMMON: return '#ffffff';
      case ItemRarity.UNCOMMON: return '#55ff55';
      case ItemRarity.RARE: return '#5555ff';
      case ItemRarity.EPIC: return '#aa00aa';
      case ItemRarity.LEGENDARY: return '#ffaa00';
      default: return '#ffffff';
    }
  };
  
  // 获取物品图标（暂时使用文字代替）
  const getItemIcon = (item) => {
    if (!item) return '';
    
    // 简单的图标映射（后续可以用实际图片替换）
    const iconMap = {
      'block_dirt': '🟫',
      'block_stone': '⬜',
      'block_grass': '🟩',
      'block_sand': '🟨',
      'block_water': '🟦',
      'block_wood': '🟤',
      'block_leaves': '🍃',
      'block_iron_ore': '⚪',
      'block_gold_ore': '🟡',
      'block_diamond_ore': '💎',
      'pickaxe_wood': '⛏️',
      'pickaxe_stone': '🔨',
      'pickaxe_iron': '⚒️',
      'pickaxe_diamond': '💎⛏️',
      'iron_ingot': '🔗',
      'gold_ingot': '🥇',
      'diamond': '💎',
      'stick': '🪵',
      'apple': '🍎',
      'bread': '🍞'
    };
    
    return iconMap[item.id] || '❓';
  };
  
  return (
    <div 
      className={`item-slot ${isSelected ? 'selected' : ''} ${className}`}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {!slot?.isEmpty() && (
        <>
          <div className="item-icon" style={{ color: getRarityColor(item?.rarity) }}>
            {getItemIcon(item)}
          </div>
          <div className="item-count">
            {slot.count > 1 ? slot.count : ''}
          </div>
          {slot.durability !== null && slot.durability !== undefined && (
            <div className="durability-bar">
              <div 
                className="durability-fill"
                style={{ 
                  width: `${(slot.durability / (item?.durability || item?.material?.durability || 100)) * 100}%`
                }}
              />
            </div>
          )}
          
          {showTooltipState && showTooltip && (
            <div className="item-tooltip">
              <div className="tooltip-title" style={{ color: getRarityColor(item?.rarity) }}>
                {item?.name || slot.itemId}
              </div>
              {item?.description && (
                <div className="tooltip-description">
                  {item.description}
                </div>
              )}
              {slot.durability !== null && slot.durability !== undefined && (
                <div className="tooltip-durability">
                  耐久度: {slot.durability} / {item?.durability || item?.material?.durability || 0}
                </div>
              )}
              <div className="tooltip-rarity">
                稀有度: {item?.rarity || 'common'}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/**
 * 快捷栏组件
 */
export const HotbarComponent = ({ 
  inventory, 
  onSlotClick, 
  onSlotRightClick,
  className = '' 
}) => {
  if (!inventory) return null;
  
  return (
    <div className={`hotbar ${className}`}>
      {inventory.hotbar.map((slot, index) => (
        <ItemSlotComponent
          key={index}
          slot={slot}
          index={index}
          isSelected={inventory.selectedHotbarSlot === index}
          onClick={(e, slot, index) => onSlotClick?.(e, slot, index, 'hotbar')}
          onRightClick={(e, slot, index) => onSlotRightClick?.(e, slot, index, 'hotbar')}
          className="hotbar-slot"
        />
      ))}
      <div className="hotbar-selection-hint">
        使用数字键 1-9 选择物品
      </div>
    </div>
  );
};

/**
 * 完整背包界面组件
 */
export const InventoryComponent = ({ 
  inventory, 
  isVisible, 
  onClose,
  onSlotClick, 
  onSlotRightClick 
}) => {
  if (!isVisible || !inventory) return null;
  
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };
  
  return (
    <div className="inventory-overlay" onClick={handleOverlayClick}>
      <div className="inventory-panel">
        <div className="inventory-header">
          <h3>背包</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="inventory-content">
          {/* 主背包区域 */}
          <div className="main-inventory">
            <div className="inventory-label">背包</div>
            <div className="inventory-grid">
              {inventory.mainInventory.map((slot, index) => (
                <ItemSlotComponent
                  key={index}
                  slot={slot}
                  index={index}
                  onClick={(e, slot, index) => onSlotClick?.(e, slot, index, 'main')}
                  onRightClick={(e, slot, index) => onSlotRightClick?.(e, slot, index, 'main')}
                  className="inventory-slot"
                />
              ))}
            </div>
          </div>
          
          {/* 快捷栏区域 */}
          <div className="hotbar-in-inventory">
            <div className="inventory-label">快捷栏</div>
            <div className="hotbar-grid">
              {inventory.hotbar.map((slot, index) => (
                <ItemSlotComponent
                  key={index}
                  slot={slot}
                  index={index}
                  isSelected={inventory.selectedHotbarSlot === index}
                  onClick={(e, slot, index) => onSlotClick?.(e, slot, index, 'hotbar')}
                  onRightClick={(e, slot, index) => onSlotRightClick?.(e, slot, index, 'hotbar')}
                  className="hotbar-slot"
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="inventory-footer">
          <div className="inventory-stats">
            <span>空槽位: {inventory.getEmptySlotCount()}</span>
            <span>总槽位: {inventory.getAllSlots().length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 物品栏控制器组件
 * 管理物品栏的状态和交互
 */
export const InventoryController = ({ inventory, gameEngine }) => {
  const [isInventoryVisible, setIsInventoryVisible] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  
  // 监听键盘事件
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 数字键选择快捷栏
      if (e.code >= 'Digit1' && e.code <= 'Digit9') {
        const slotIndex = parseInt(e.code.slice(-1)) - 1;
        inventory?.setSelectedHotbarSlot(slotIndex);
      }
      
      // E键打开/关闭背包
      if (e.code === 'KeyE') {
        e.preventDefault();
        setIsInventoryVisible(!isInventoryVisible);
      }
      
      // ESC键关闭背包
      if (e.code === 'Escape') {
        setIsInventoryVisible(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inventory, isInventoryVisible]);
  
  // 处理槽位点击
  const handleSlotClick = (e, slot, index, type) => {
    console.log(`点击槽位: ${type}[${index}]`, slot);
    
    if (type === 'hotbar') {
      inventory?.setSelectedHotbarSlot(index);
    }
    
    // TODO: 实现更复杂的物品拖拽和交换逻辑
  };
  
  // 处理槽位右键点击
  const handleSlotRightClick = (e, slot, index, type) => {
    e.preventDefault();
    console.log(`右键点击槽位: ${type}[${index}]`, slot);
    
    // TODO: 实现快速移动、分割堆叠等功能
  };
  
  // 关闭背包
  const handleCloseInventory = () => {
    setIsInventoryVisible(false);
  };
  
  return (
    <>
      {/* 快捷栏 - 始终显示 */}
      <HotbarComponent
        inventory={inventory}
        onSlotClick={handleSlotClick}
        onSlotRightClick={handleSlotRightClick}
        className="game-hotbar"
      />
      
      {/* 完整背包界面 */}
      <InventoryComponent
        inventory={inventory}
        isVisible={isInventoryVisible}
        onClose={handleCloseInventory}
        onSlotClick={handleSlotClick}
        onSlotRightClick={handleSlotRightClick}
      />
    </>
  );
};