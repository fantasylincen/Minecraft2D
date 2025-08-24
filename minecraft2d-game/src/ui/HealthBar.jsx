/**
 * 血条组件
 * 显示玩家的生命值和饥饿值
 */

import React, { useState, useEffect } from 'react';
import './HealthBar.css';

/**
 * 血条和饥饿条组件
 */
export const HealthBar = ({ player, gameEngine }) => {
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [hunger, setHunger] = useState(20);
  const [maxHunger, setMaxHunger] = useState(20);
  
  // 监听玩家状态更新
  useEffect(() => {
    const updateStatus = () => {
      if (player) {
        const status = player.getStatus();
        setHealth(status.health || 0);
        setMaxHealth(status.maxHealth || 100);
        setHunger(status.hunger || 0);
        setMaxHunger(status.maxHunger || 20);
      }
    };
    
    // 初始更新
    updateStatus();
    
    // 定时更新状态（每100ms）
    const interval = setInterval(updateStatus, 100);
    
    return () => clearInterval(interval);
  }, [player]);
  
  // 计算血量百分比
  const healthPercentage = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  
  // 计算饥饿值百分比
  const hungerPercentage = Math.max(0, Math.min(100, (hunger / maxHunger) * 100));
  
  // 根据血量确定颜色
  const getHealthColor = (percentage) => {
    if (percentage > 70) return '#4CAF50'; // 绿色
    if (percentage > 30) return '#FFC107'; // 黄色
    return '#F44336'; // 红色
  };
  
  // 根据饥饿值确定颜色
  const getHungerColor = (percentage) => {
    if (percentage > 70) return '#8BC34A'; // 绿色
    if (percentage > 30) return '#FFC107'; // 黄色
    return '#F44336'; // 红色
  };
  
  const healthColor = getHealthColor(healthPercentage);
  const hungerColor = getHungerColor(hungerPercentage);
  
  return (
    <div className="health-bar-container">
      {/* 生命值和饥饿值条 - 左右结构 */}
      <div className="status-bars">
        {/* 生命值条 */}
        <div className="health-bar">
          <div className="health-bar-label">❤️</div>
          <div className="health-bar-background">
            <div 
              className="health-bar-fill"
              style={{
                width: `${healthPercentage}%`,
                backgroundColor: healthColor
              }}
            />
          </div>
          <div className="health-bar-text">
            {Math.round(health)}/{maxHealth}
          </div>
        </div>
        
        {/* 饥饿值条 */}
        <div className="hunger-bar">
          <div className="hunger-bar-label">🍖</div>
          <div className="hunger-bar-background">
            <div 
              className="hunger-bar-fill"
              style={{
                width: `${hungerPercentage}%`,
                backgroundColor: hungerColor
              }}
            />
          </div>
          <div className="hunger-bar-text">
            {Math.round(hunger)}/{maxHunger}
          </div>
        </div>
      </div>
    </div>
  );
};