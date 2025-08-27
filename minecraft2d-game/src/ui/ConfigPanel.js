/**
 * 游戏配置管理界面
 * 提供可视化的参数调整功能
 */

import { gameConfig } from '../config/GameConfig.js';

export class ConfigPanel {
  constructor(containerId = 'config-panel', gameEngine = null) {
    this.containerId = containerId;
    this.gameEngine = gameEngine; // 添加游戏引擎引用
    this.isVisible = false;
    this.updateCallbacks = new Map();
    
    this.createPanel();
    this.setupEventListeners();
    
    console.log('⚙️ ConfigPanel 配置管理界面初始化完成');
  }
  
  /**
   * 创建配置面板
   */
  createPanel() {
    try {
      // 创建主容器
      const existingPanel = document.getElementById(this.containerId);
      if (existingPanel) {
        existingPanel.remove();
      }
      
      console.log('📋 开始创建配置面板...');
      
      // 检查gameConfig是否可用
      if (!gameConfig) {
        console.error('❌ gameConfig未定义');
        return;
      }
      
      const categories = gameConfig.getCategories();
      console.log('📋 获取到配置类别:', categories);
      
      if (!categories || categories.length === 0) {
        console.error('❌ 未找到配置类别');
        return;
      }
      
      const panel = document.createElement('div');
      panel.id = this.containerId;
      panel.className = 'config-panel';
      
      // 生成标签页和内容
      const tabHeaders = this.generateTabHeaders();
      const configContent = this.generateConfigContent();
      
      console.log('📋 标签页HTML长度:', tabHeaders.length);
      console.log('📋 内容HTML长度:', configContent.length);
      
      // 创建面板HTML结构
      panel.innerHTML = `
        <div class="config-panel-header">
          <h2>🎮 游戏配置管理</h2>
          <div class="config-panel-controls">
            <button id="config-export-btn" class="config-btn config-btn-secondary">📤 导出配置</button>
            <button id="config-import-btn" class="config-btn config-btn-secondary">📥 导入配置</button>
            <button id="config-reset-btn" class="config-btn config-btn-warning">🔄 重置默认</button>
            <button id="config-close-btn" class="config-btn config-btn-close">✖</button>
          </div>
        </div>
        <div class="config-panel-body">
          <div class="config-tabs">
            ${tabHeaders}
          </div>
          <div class="config-content">
            ${configContent}
          </div>
        </div>
        <input type="file" id="config-file-input" accept=".json" style="display: none;">
      `;
      
      // 添加样式
      this.addStyles();
      
      // 添加到页面
      document.body.appendChild(panel);
      
      console.log('✅ 配置面板HTML创建完成');
      
      // 稍微延迟一下再显示默认标签页，确保DOM元素已经添加完成
      setTimeout(() => {
        this.showTab('cave');
      }, 10);
      
    } catch (error) {
      console.error('❌ 创建配置面板失败:', error);
      console.error('错误堆栈:', error.stack);
    }
  }
  
  /**
   * 生成标签页头部
   */
  generateTabHeaders() {
    try {
      const categories = gameConfig.getCategories();
      console.log('📂 生成标签页头部:', categories);
      
      if (!categories || categories.length === 0) {
        console.warn('⚠️ 没有配置类别');
        return '<div class="no-config">⚠️ 未找到配置类别</div>';
      }
      
      return categories.map(category => {
        const config = gameConfig.getConfig(category);
        if (!config) {
          console.warn(`⚠️ 配置类别 ${category} 不存在`);
          return '';
        }
        
        return `
          <button class="config-tab" data-category="${category}">
            ${this.getCategoryIcon(category)} ${config.displayName || category}
          </button>
        `;
      }).join('');
    } catch (error) {
      console.error('❌ 生成标签页头部失败:', error);
      return '<div class="error-message">❌ 生成标签页失败</div>';
    }
  }
  
  /**
   * 获取类别图标
   */
  getCategoryIcon(category) {
    const icons = {
      cave: '🕳️',
      terrain: '⛰️', 
      ore: '⛏️',
      vegetation: '🌿',
      performance: '⚡',
      developer: '💻'
    };
    return icons[category] || '⚙️';
  }
  
  /**
   * 生成配置内容
   */
  generateConfigContent() {
    try {
      const categories = gameConfig.getCategories();
      console.log('📄 生成配置内容:', categories);
      
      if (!categories || categories.length === 0) {
        console.warn('⚠️ 没有配置类别数据');
        return '<div class="no-config">⚠️ 未找到配置数据</div>';
      }
      
      const contentParts = [];
      
      categories.forEach(category => {
        try {
          const config = gameConfig.getConfig(category);
          console.log(`📄 处理配置类别 ${category}:`, config ? '存在' : '不存在');
          
          if (!config) {
            console.warn(`⚠️ 配置类别 ${category} 不存在`);
            contentParts.push(`
              <div class="config-tab-content" data-category="${category}" style="display: none;">
                <h3>${this.getCategoryIcon(category)} ${category}</h3>
                <div class="error-message">⚠️ 配置不存在</div>
              </div>
            `);
            return;
          }
          
          if (!config.settings) {
            console.warn(`⚠️ 配置类别 ${category} 没有settings`);
            contentParts.push(`
              <div class="config-tab-content" data-category="${category}" style="display: none;">
                <h3>${this.getCategoryIcon(category)} ${config.displayName || category}</h3>
                <div class="no-settings">⚠️ 该类别没有配置项</div>
              </div>
            `);
            return;
          }
          
          const settingKeys = Object.keys(config.settings);
          console.log(`📄 处理配置类别 ${category}, 设置数量:`, settingKeys.length);
          console.log(`📄 设置键名:`, settingKeys);
          
          if (settingKeys.length === 0) {
            console.warn(`⚠️ 配置类别 ${category} 没有设置项`);
            contentParts.push(`
              <div class="config-tab-content" data-category="${category}" style="display: none;">
                <h3>${this.getCategoryIcon(category)} ${config.displayName || category}</h3>
                <div class="no-settings">⚠️ 没有可配置的项目</div>
              </div>
            `);
            return;
          }
          
          // 为开发者选项添加特殊功能
          let specialContent = '';
          if (category === 'developer') {
            specialContent = `
              <div class="config-setting-group">
                <h4>🎮 游戏控制</h4>
                <div class="config-setting-item">
                  <button id="save-game-btn" class="config-btn config-btn-primary">💾 保存游戏</button>
                </div>
                <div class="config-setting-item">
                  <button id="regenerate-world-btn" class="config-btn config-btn-warning">🌍 重新生成世界</button>
                </div>
                <div class="config-setting-item">
                  <button id="toggle-debug-info-btn" class="config-btn config-btn-secondary">🔍 切换调试信息</button>
                </div>
                <div class="config-setting-item">
                  <button id="show-error-log-btn" class="config-btn config-btn-secondary">📝 显示错误日志</button>
                </div>
              </div>
              <div class="config-setting-group">
                <h4>📦 给玩家添加方块</h4>
                <div class="config-setting-item">
                  <label>方块类型:</label>
                  <select id="add-block-type" class="config-input">
                    <option value="block_dirt">泥土</option>
                    <option value="block_stone">石头</option>
                    <option value="block_grass">草方块</option>
                    <option value="block_sand">沙子</option>
                    <option value="block_wood">木头</option>
                    <option value="block_leaves">树叶</option>
                    <option value="block_iron_ore">铁矿石</option>
                    <option value="block_gold_ore">金矿石</option>
                    <option value="block_diamond_ore">钻石矿石</option>
                  </select>
                </div>
                <div class="config-setting-item">
                  <label>数量:</label>
                  <input type="number" id="add-block-quantity" class="config-input" value="64" min="1" max="64">
                </div>
                <div class="config-setting-item">
                  <button id="add-block-btn" class="config-btn config-btn-primary">添加方块到玩家物品栏</button>
                </div>
              </div>
            `;
          }
          
          const settingsHtml = settingKeys.map(key => {
            const setting = config.settings[key];
            return this.generateSettingItem(category, key, setting);
          }).join('');
          
          contentParts.push(`
            <div class="config-tab-content" data-category="${category}" style="display: none;">
              <h3>${this.getCategoryIcon(category)} ${config.displayName || category}</h3>
              ${specialContent}
              <div class="config-setting-group">
                <h4>设置项</h4>
                ${settingsHtml}
              </div>
            </div>
          `);
        } catch (error) {
          console.error(`❌ 生成配置类别 ${category} 内容失败:`, error);
          contentParts.push(`
            <div class="config-tab-content" data-category="${category}" style="display: none;">
              <h3>${this.getCategoryIcon(category)} ${category}</h3>
              <div class="error-message">❌ 生成内容失败: ${error.message}</div>
            </div>
          `);
        }
      });
      
      return contentParts.join('');
    } catch (error) {
      console.error('❌ 生成配置内容失败:', error);
      return '<div class="error-message">❌ 生成配置内容失败</div>';
    }
  }
  
  /**
   * 生成设置项HTML
   */
  generateSettingsHTML(category, settings) {
    try {
      if (!settings) {
        console.warn(`⚠️ 类别 ${category} 没有settings对象`);
        return '<div class="no-settings">⚠️ 没有配置项</div>';
      }
      
      const settingsEntries = Object.entries(settings);
      console.log(`🔧 生成设置项 ${category}:`, settingsEntries.length, '个项目');
      
      if (settingsEntries.length === 0) {
        return '<div class="no-settings">⚠️ 没有可配置的项目</div>';
      }
      
      const settingHTMLParts = [];
      
      settingsEntries.forEach(([key, setting]) => {
        try {
          if (!setting) {
            console.warn(`⚠️ 设置项 ${category}.${key} 为空`);
            settingHTMLParts.push(`<div class="error-setting">❌ 设置项 ${key} 数据为空</div>`);
            return;
          }
          
          const inputId = `config-${category}-${key}`;
          const currentValue = setting.value;
          
          console.log(`🔧 处理设置项 ${category}.${key}:`, {
            value: currentValue,
            displayName: setting.displayName,
            description: setting.description,
            min: setting.min,
            max: setting.max
          });
          
          // 验证必要属性
          if (setting.value === undefined) {
            console.warn(`⚠️ 设置项 ${category}.${key} 缺少value属性`);
            settingHTMLParts.push(`<div class="error-setting">❌ 设置项 ${key} 缺少数值</div>`);
            return;
          }
          
          const settingHTML = `
            <div class="config-setting-item">
              <div class="config-setting-header">
                <label for="${inputId}" class="config-setting-label">
                  ${setting.displayName || key}
                </label>
                <span class="config-setting-value" id="${inputId}-value">
                  ${this.formatValue(currentValue, setting.unit)}
                </span>
              </div>
              <div class="config-setting-description">
                ${setting.description || '无描述'}
              </div>
              <div class="config-setting-control">
                ${this.generateInputControl(inputId, category, key, setting)}
              </div>
            </div>
          `;
          
          settingHTMLParts.push(settingHTML);
          
        } catch (settingError) {
          console.error(`❌ 处理设置项 ${category}.${key} 失败:`, settingError);
          settingHTMLParts.push(`<div class="error-setting">❌ 设置项 ${key} 处理失败: ${settingError.message}</div>`);
        }
      });
      
      const finalHTML = settingHTMLParts.join('');
      console.log(`🔧 生成的设置 HTML 长度 (${category}):`, finalHTML.length);
      
      if (finalHTML.length === 0) {
        return '<div class="error-message">❌ 无法生成设置项</div>';
      }
      
      // 为地形算法相关的配置类别添加重新生成地图按钮 (TODO #15)
      let regenerateButton = '';
      if (category === 'terrain' || category === 'cave') {
        regenerateButton = `
          <div class="config-terrain-actions">
            <button 
              id="config-regenerate-${category}" 
              class="config-regenerate-btn"
              data-category="${category}"
              type="button"
            >
              🌍 重新生成地图
            </button>
            <div class="config-regenerate-note">
              💡 修改地形参数后，点击此按钮应用新设置
            </div>
          </div>
        `;
      }
      
      return finalHTML + regenerateButton;
      
    } catch (error) {
      console.error(`❌ 生成设置项HTML失败 (${category}):`, error);
      return '<div class="error-message">❌ 生成设置项失败</div>';
    }
  }
  
  /**
   * 生成单个设置项HTML
   */
  generateSettingItem(category, key, setting) {
    try {
      if (!setting) {
        console.warn(`⚠️ 设置项 ${category}.${key} 为空`);
        return `<div class="error-setting">❌ 设置项 ${key} 数据为空</div>`;
      }
      
      const inputId = `config-${category}-${key}`;
      const currentValue = setting.value;
      
      // 验证必要属性
      if (setting.value === undefined) {
        console.warn(`⚠️ 设置项 ${category}.${key} 缺少value属性`);
        return `<div class="error-setting">❌ 设置项 ${key} 缺少数值</div>`;
      }
      
      return `
        <div class="config-setting-item">
          <div class="config-setting-header">
            <label for="${inputId}" class="config-setting-label">
              ${setting.displayName || key}
            </label>
            <span class="config-setting-value" id="${inputId}-value">
              ${this.formatValue(currentValue, setting.unit)}
            </span>
          </div>
          <div class="config-setting-description">
            ${setting.description || '无描述'}
          </div>
          <div class="config-setting-control">
            ${this.generateInputControl(inputId, category, key, setting)}
          </div>
        </div>
      `;
    } catch (error) {
      console.error(`❌ 生成设置项 ${category}.${key} 失败:`, error);
      return `<div class="error-setting">❌ 设置项 ${key} 生成失败: ${error.message}</div>`;
    }
  }
  
  /**
   * 生成输入控件
   */
  generateInputControl(inputId, category, key, setting) {
    // 确保正确识别布尔值类型
    if (typeof setting.value === 'boolean' || 
        (typeof setting.value === 'string' && (setting.value === 'true' || setting.value === 'false'))) {
      // 如果是字符串形式的布尔值，转换为实际布尔值
      const boolValue = typeof setting.value === 'boolean' ? setting.value : setting.value === 'true';
      return `
        <label class="config-switch">
          <input 
            type="checkbox" 
            id="${inputId}" 
            class="config-checkbox"
            data-category="${category}"
            data-key="${key}"
            ${boolValue ? 'checked' : ''}
          >
          <span class="config-slider-switch"></span>
        </label>
      `;
    }
    
    // 数值使用滑块控件
    if (typeof setting.value === 'number') {
      return `
        <input 
          type="range" 
          id="${inputId}" 
          class="config-slider"
          data-category="${category}"
          data-key="${key}"
          min="${setting.min}" 
          max="${setting.max}" 
          step="${setting.step || 0.01}" 
          value="${setting.value}"
        >
        <div class="config-slider-track">
          <span class="config-slider-min">${setting.min}</span>
          <span class="config-slider-max">${setting.max}</span>
        </div>
      `;
    }
    
    // 其他类型使用文本输入框
    return `
      <input 
        type="text" 
        id="${inputId}" 
        class="config-input"
        data-category="${category}"
        data-key="${key}"
        value="${setting.value}"
      >
    `;
  }
  
  /**
   * 格式化值显示
   */
  formatValue(value, unit = '') {
    if (typeof value === 'number') {
      const formatted = value % 1 === 0 ? value.toString() : value.toFixed(3);
      return `${formatted}${unit}`;
    }
    return value.toString();
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    document.addEventListener('click', this.handleClick.bind(this));
    document.addEventListener('input', this.handleInput.bind(this));
    document.addEventListener('change', this.handleChange.bind(this));
    
    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F2' && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape' && this.isVisible) {
        e.preventDefault();
        this.hide();
      }
    });
  }
  
  /**
   * 处理点击事件
   */
  handleClick(event) {
    const target = event.target;
    
    if (target.id === 'config-close-btn') {
      this.hide();
    } else if (target.classList.contains('config-tab')) {
      const category = target.dataset.category;
      this.showTab(category);
    } else if (target.id === 'config-export-btn') {
      this.exportConfig();
    } else if (target.id === 'config-import-btn') {
      this.importConfig();
    } else if (target.id === 'config-reset-btn') {
      this.resetConfig();
    } else if (target.classList.contains('config-regenerate-btn')) {
      // 处理重新生成地图按钮 (TODO #15)
      this.handleRegenerateWorld(target.dataset.category);
    } else if (target.id === 'add-block-btn') {
      // 处理添加方块到玩家物品栏按钮
      this.handleAddBlockToPlayer();
    } else if (target.id === 'save-game-btn') {
      // 处理保存游戏按钮
      this.handleSaveGame();
    } else if (target.id === 'regenerate-world-btn') {
      // 处理重新生成世界按钮
      this.handleRegenerateWorld();
    } else if (target.id === 'toggle-debug-info-btn') {
      // 处理切换调试信息按钮
      this.handleToggleDebugInfo();
    } else if (target.id === 'show-error-log-btn') {
      // 处理显示错误日志按钮
      this.handleShowErrorLog();
    }
  }

  /**
   * 处理添加方块到玩家物品栏
   */
  handleAddBlockToPlayer() {
    try {
      // 获取选择的方块类型和数量
      const blockTypeSelect = document.getElementById('add-block-type');
      const quantityInput = document.getElementById('add-block-quantity');
      
      if (!blockTypeSelect || !quantityInput) {
        console.error('❌ 未找到添加方块的界面元素');
        this.showNotification('❌ 界面元素缺失', 'error');
        return;
      }
      
      const blockType = blockTypeSelect.value;
      const quantity = parseInt(quantityInput.value) || 64;
      
      // 验证数量
      if (quantity < 1 || quantity > 64) {
        this.showNotification('❌ 数量必须在1-64之间', 'error');
        return;
      }
      
      // 获取游戏引擎实例
      const gameEngine = window.gameEngine || this.gameEngine;
      
      if (!gameEngine || !gameEngine.systems || !gameEngine.systems.player) {
        console.error('❌ 游戏引擎或玩家系统不可用');
        this.showNotification('❌ 游戏引擎不可用', 'error');
        return;
      }
      
      const player = gameEngine.systems.player;
      
      // 向玩家物品栏添加方块
      const remaining = player.inventory.addItem(blockType, quantity);
      
      if (remaining === 0) {
        this.showNotification(`✅ 成功添加 ${quantity} 个 ${this.getBlockDisplayName(blockType)}`, 'success');
      } else {
        const added = quantity - remaining;
        this.showNotification(`✅ 添加了 ${added} 个 ${this.getBlockDisplayName(blockType)}，${remaining} 个无法添加`, 'info');
      }
      
      console.log(`📦 添加方块到玩家物品栏: ${blockType} x${quantity}`);
      
    } catch (error) {
      console.error('❌ 添加方块到玩家物品栏失败:', error);
      this.showNotification(`❌ 添加失败: ${error.message}`, 'error');
    }
  }
  
  /**
   * 处理保存游戏
   */
  handleSaveGame() {
    try {
      // 获取游戏引擎实例
      const gameEngine = window.gameEngine || this.gameEngine;
      
      if (!gameEngine) {
        console.error('❌ 游戏引擎不可用');
        this.showNotification('❌ 游戏引擎不可用', 'error');
        return;
      }
      
      // 调用保存游戏函数
      const { storageManager, player, terrainGenerator, camera, renderer } = gameEngine.systems;
      if (storageManager) {
        // 保存游戏数据
        const gameState = {
          player: player.exportData(),
          world: {
            seed: terrainGenerator.seed,
            terrainParams: terrainGenerator.terrainParams
          },
          camera: camera.exportData(),
          settings: {
            showDebugInfo: renderer.settings.showDebugInfo,
            showGrid: renderer.settings.showGrid,
            enableParticles: renderer.settings.enableParticles
          }
        };
        
        storageManager.saveGameState(gameState);
        this.showNotification('✅ 游戏已保存！', 'success');
        console.log('💾 游戏已保存');
      } else {
        this.showNotification('❌ 存储管理器不可用', 'error');
      }
    } catch (error) {
      console.error('❌ 保存游戏失败:', error);
      this.showNotification(`❌ 保存失败: ${error.message}`, 'error');
    }
  }

  /**
   * 处理重新生成世界
   */
  handleRegenerateWorld() {
    try {
      // 获取游戏引擎实例
      const gameEngine = window.gameEngine || this.gameEngine;
      
      if (!gameEngine) {
        console.error('❌ 游戏引擎不可用');
        this.showNotification('❌ 游戏引擎不可用', 'error');
        return;
      }
      
      const { terrainGenerator, player } = gameEngine.systems;
      if (terrainGenerator && player) {
        // 重新生成世界
        terrainGenerator.regenerate();
        player.respawn();
        this.showNotification('✅ 世界已重新生成', 'success');
        console.log('🌍 世界已重新生成');
      } else {
        this.showNotification('❌ 世界生成器或玩家不可用', 'error');
      }
    } catch (error) {
      console.error('❌ 重新生成世界失败:', error);
      this.showNotification(`❌ 重新生成失败: ${error.message}`, 'error');
    }
  }

  /**
   * 处理切换调试信息
   */
  handleToggleDebugInfo() {
    try {
      // 获取游戏引擎实例
      const gameEngine = window.gameEngine || this.gameEngine;
      
      if (!gameEngine) {
        console.error('❌ 游戏引擎不可用');
        this.showNotification('❌ 游戏引擎不可用', 'error');
        return;
      }
      
      const renderer = gameEngine.systems.renderer;
      if (renderer) {
        // 切换调试信息显示
        renderer.toggleDebugInfo();
        this.showNotification('✅ 调试信息已切换', 'success');
        console.log('🔍 调试信息已切换');
      } else {
        this.showNotification('❌ 渲染器不可用', 'error');
      }
    } catch (error) {
      console.error('❌ 切换调试信息失败:', error);
      this.showNotification(`❌ 切换失败: ${error.message}`, 'error');
    }
  }

  /**
   * 处理显示错误日志
   */
  handleShowErrorLog() {
    try {
      // 触发显示错误日志事件
      const event = new CustomEvent('showErrorLog');
      window.dispatchEvent(event);
      this.showNotification('✅ 错误日志面板已打开', 'success');
      console.log('📝 错误日志面板已打开');
    } catch (error) {
      console.error('❌ 显示错误日志失败:', error);
      this.showNotification(`❌ 显示失败: ${error.message}`, 'error');
    }
  }
  
  /**
   * 获取方块显示名称
   */
  getBlockDisplayName(blockType) {
    const blockNames = {
      'block_dirt': '泥土',
      'block_stone': '石头',
      'block_grass': '草方块',
      'block_sand': '沙子',
      'block_wood': '木头',
      'block_leaves': '树叶',
      'block_iron_ore': '铁矿石',
      'block_gold_ore': '金矿石',
      'block_diamond_ore': '钻石矿石'
    };
    
    return blockNames[blockType] || blockType;
  }
  
  /**
   * 处理输入事件
   */
  handleInput(event) {
    const target = event.target;
    
    // 处理滑块和文本输入框
    if (target.classList.contains('config-slider') || target.classList.contains('config-input')) {
      const category = target.dataset.category;
      const key = target.dataset.key;
      let value = target.value;
      
      // 转换数值类型
      if (target.type === 'range') {
        value = parseFloat(value);
      }
      
      // 更新配置
      gameConfig.set(category, key, value);
      
      // 更新显示
      this.updateValueDisplay(target.id, value, category, key);
      
      // 触发回调
      this.notifyUpdate(category, key, value);
    }
    
    // 处理复选框（开关控件）
    if (target.classList.contains('config-checkbox')) {
      const category = target.dataset.category;
      const key = target.dataset.key;
      const value = target.checked;
      
      // 更新配置
      gameConfig.set(category, key, value);
      
      // 更新显示
      this.updateValueDisplay(target.id, value, category, key);
      
      // 触发回调
      this.notifyUpdate(category, key, value);
    }
  }
  
  /**
   * 处理文件选择
   */
  handleChange(event) {
    if (event.target.id === 'config-file-input') {
      const file = event.target.files[0];
      if (file) {
        this.loadConfigFile(file);
      }
    }
  }
  
  /**
   * 更新值显示
   */
  updateValueDisplay(inputId, value, category, key) {
    const valueDisplay = document.getElementById(`${inputId}-value`);
    if (valueDisplay) {
      const config = gameConfig.getConfig(category);
      const setting = config.settings[key];
      
      // 如果是布尔值，显示是/否而不是true/false
      if (typeof value === 'boolean') {
        valueDisplay.textContent = value ? '是' : '否';
      } else {
        valueDisplay.textContent = this.formatValue(value, setting.unit);
      }
    }
    
    // 如果是复选框，更新其选中状态
    const checkbox = document.getElementById(inputId);
    if (checkbox && checkbox.type === 'checkbox') {
      checkbox.checked = value === true || value === 'true';
    }
  }
  
  /**
   * 显示指定标签页
   */
  showTab(category) {
    console.log(`📂 切换到标签页: ${category}`);
    
    // 确保面板存在
    const panel = document.getElementById(this.containerId);
    if (!panel) {
      console.error('❌ 配置面板不存在');
      return;
    }
    
    // 隐藏所有标签页内容
    const allContents = panel.querySelectorAll('.config-tab-content');
    console.log(`📂 找到 ${allContents.length} 个标签页内容`);
    allContents.forEach(content => {
      content.style.display = 'none';
    });
    
    // 移除所有标签页的激活状态
    const allTabs = panel.querySelectorAll('.config-tab');
    console.log(`📂 找到 ${allTabs.length} 个标签按钮`);
    allTabs.forEach(tab => {
      tab.classList.remove('active');
    });
    
    // 显示目标标签页内容
    const targetContent = panel.querySelector(`.config-tab-content[data-category="${category}"]`);
    console.log(`📂 查找目标内容 .config-tab-content[data-category="${category}"]`, targetContent);
    
    if (targetContent) {
      targetContent.style.display = 'block';
      console.log(`✅ 显示标签页内容: ${category}`);
      
      // 检查内容是否有配置项
      const settingsDiv = targetContent.querySelector('.config-settings');
      if (settingsDiv) {
        const settingItems = settingsDiv.querySelectorAll('.config-setting-item');
        console.log(`📂 标签页 ${category} 有 ${settingItems.length} 个配置项`);
        if (settingItems.length === 0) {
          console.warn(`⚠️ 标签页 ${category} 没有配置项，HTML内容:`, settingsDiv.innerHTML.substring(0, 200));
        }
      } else {
        console.warn(`⚠️ 标签页 ${category} 没有.config-settings元素`);
        console.log('标签页内容HTML:', targetContent.innerHTML.substring(0, 500));
      }
    } else {
      console.warn(`⚠️ 未找到标签页内容: ${category}`);
      // 列出所有可用的标签页
      const allContentTabs = panel.querySelectorAll('.config-tab-content');
      console.log('可用的标签页:', Array.from(allContentTabs).map(tab => tab.dataset.category));
    }
    
    // 激活对应的标签按钮
    const targetTab = panel.querySelector(`.config-tab[data-category="${category}"]`);
    if (targetTab) {
      targetTab.classList.add('active');
      console.log(`✅ 激活标签按钮: ${category}`);
    } else {
      console.warn(`⚠️ 未找到标签按钮: ${category}`);
      // 列出所有可用的标签按钮
      const allTabButtons = panel.querySelectorAll('.config-tab');
      console.log('可用的标签按钮:', Array.from(allTabButtons).map(tab => tab.dataset.category));
    }
  }
  
  /**
   * 导出配置
   */
  exportConfig() {
    const configData = gameConfig.exportConfig();
    const blob = new Blob([configData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `minecraft2d-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    this.showNotification('📤 配置已导出', 'success');
  }
  
  /**
   * 导入配置
   */
  importConfig() {
    document.getElementById('config-file-input').click();
  }
  
  /**
   * 加载配置文件
   */
  loadConfigFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const success = gameConfig.importConfig(e.target.result);
        if (success) {
          this.refreshPanel();
          this.showNotification('📥 配置已导入', 'success');
        } else {
          this.showNotification('❌ 导入失败，文件格式错误', 'error');
        }
      } catch (error) {
        this.showNotification('❌ 导入失败：' + error.message, 'error');
      }
    };
    reader.readAsText(file);
  }
  
  /**
   * 重置配置
   */
  resetConfig() {
    if (confirm('确定要重置所有配置到默认值吗？')) {
      gameConfig.resetToDefault();
      this.refreshPanel();
      this.showNotification('🔄 配置已重置', 'success');
    }
  }
  
  /**
   * 处理重新生成世界 (TODO #15)
   */
  handleRegenerateWorld(category) {
    try {
      // 获取游戏引擎实例
      const gameEngine = window.gameEngine || this.gameEngine;
      
      if (!gameEngine) {
        console.error('❌ 游戏引擎不可用');
        this.showNotification('❌ 游戏引擎不可用', 'error');
        return;
      }
      
      const { terrainGenerator, player } = gameEngine.systems || {};
      
      if (!terrainGenerator) {
        console.error('❌ 地形生成器不可用');
        this.showNotification('❌ 地形生成器不可用', 'error');
        return;
      }
      
      // 显示确认对话框
      const categoryName = category === 'terrain' ? '地形' : '洞穴';
      if (!confirm(`确定要重新生成地图吗？\n\n这将应用新的${categoryName}配置并重新创建世界。`)) {
        return;
      }
      
      console.log(`🌍 开始重新生成世界 (类别: ${category})`);
      
      // 重新生成世界
      terrainGenerator.regenerate();
      
      // 重置玩家位置
      if (player) {
        player.respawn();
        console.log('🚀 玩家位置已重置');
      }
      
      console.log('✅ 世界重新生成完成');
      this.showNotification(`🌍 ${categoryName}配置已应用，世界已重新生成`, 'success');
      
    } catch (error) {
      console.error('❌ 重新生成世界失败:', error);
      this.showNotification(`❌ 重新生成失败: ${error.message}`, 'error');
    }
  }
  
  /**
   * 刷新面板
   */
  refreshPanel() {
    const currentTab = document.querySelector('.config-tab.active')?.dataset.category || 'cave';
    this.createPanel();
    this.showTab(currentTab);
  }
  
  /**
   * 显示通知
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `config-notification config-notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 自动消失
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
  
  /**
   * 添加更新回调
   */
  onUpdate(category, key, callback) {
    const callbackKey = `${category}.${key}`;
    if (!this.updateCallbacks.has(callbackKey)) {
      this.updateCallbacks.set(callbackKey, []);
    }
    this.updateCallbacks.get(callbackKey).push(callback);
  }
  
  /**
   * 通知更新
   */
  notifyUpdate(category, key, value) {
    const callbackKey = `${category}.${key}`;
    const callbacks = this.updateCallbacks.get(callbackKey);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(value, category, key);
        } catch (error) {
          console.error('配置更新回调错误:', error);
        }
      });
    }
  }
  
  /**
   * 显示面板
   */
  show() {
    const panel = document.getElementById(this.containerId);
    if (panel) {
      panel.style.display = 'block';
      this.isVisible = true;
    }
  }
  
  /**
   * 隐藏面板
   */
  hide() {
    const panel = document.getElementById(this.containerId);
    if (panel) {
      panel.style.display = 'none';
      this.isVisible = false;
    }
  }
  
  /**
   * 切换面板显示
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  /**
   * 添加样式
   */
  addStyles() {
    if (document.getElementById('config-panel-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'config-panel-styles';
    style.textContent = `
      .config-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 800px;
        max-width: 90vw;
        height: 600px;
        max-height: 90vh;
        background: #2a2a2a;
        border: 2px solid #444;
        border-radius: 8px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        color: #fff;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        display: none;
      }
      
      .config-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: #333;
        border-bottom: 1px solid #444;
        border-radius: 6px 6px 0 0;
      }
      
      .config-panel-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .config-panel-controls {
        display: flex;
        gap: 8px;
      }
      
      .config-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s;
      }
      
      .config-btn-secondary {
        background: #555;
        color: #fff;
      }
      
      .config-btn-secondary:hover {
        background: #666;
      }
      
      .config-btn-warning {
        background: #ff6b35;
        color: #fff;
      }
      
      .config-btn-warning:hover {
        background: #ff5722;
      }
      
      .config-btn-close {
        background: #e53e3e;
        color: #fff;
      }
      
      .config-btn-close:hover {
        background: #c53030;
      }
      
      .config-panel-body {
        display: flex;
        height: calc(100% - 70px);
      }
      
      .config-tabs {
        width: 200px;
        background: #333;
        border-right: 1px solid #444;
        padding: 0;
        overflow-y: auto;
      }
      
      .config-tab {
        display: block;
        width: 100%;
        padding: 12px 16px;
        border: none;
        background: transparent;
        color: #ccc;
        text-align: left;
        cursor: pointer;
        font-size: 13px;
        border-bottom: 1px solid #444;
        transition: all 0.2s;
      }
      
      .config-tab:hover {
        background: #444;
        color: #fff;
      }
      
      .config-tab.active {
        background: #4a90e2;
        color: #fff;
      }
      
      .config-content {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
      }
      
      .config-tab-content h3 {
        margin: 0 0 20px 0;
        font-size: 16px;
        color: #4a90e2;
      }
      
      .config-setting-item {
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #444;
      }
      
      .config-setting-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .config-setting-label {
        font-weight: 500;
        font-size: 14px;
      }
      
      .config-setting-value {
        color: #4a90e2;
        font-weight: 600;
        font-size: 14px;
        font-family: 'Courier New', monospace;
      }
      
      .config-setting-description {
        color: #aaa;
        font-size: 12px;
        margin-bottom: 12px;
        line-height: 1.4;
      }
      
      .config-setting-control {
        position: relative;
      }
      
      .config-slider {
        width: 100%;
        height: 6px;
        background: #444;
        outline: none;
        border-radius: 3px;
        -webkit-appearance: none;
      }
      
      .config-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: #4a90e2;
        border-radius: 50%;
        cursor: pointer;
      }
      
      .config-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: #4a90e2;
        border-radius: 50%;
        cursor: pointer;
        border: none;
      }
      
      .config-slider-track {
        display: flex;
        justify-content: space-between;
        margin-top: 4px;
        font-size: 10px;
        color: #666;
      }
      
      .config-input {
        width: 100%;
        padding: 8px 12px;
        background: #444;
        border: 1px solid #555;
        border-radius: 4px;
        color: #fff;
        font-size: 14px;
      }
      
      .config-input:focus {
        outline: none;
        border-color: #4a90e2;
      }
      
      .config-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        font-weight: 500;
        z-index: 10001;
        animation: slideIn 0.3s ease;
      }
      
      .config-notification-success {
        background: #48bb78;
        color: white;
      }
      
      .config-notification-error {
        background: #e53e3e;
        color: white;
      }
      
      .config-notification-info {
        background: #4a90e2;
        color: white;
      }
      
      .no-config, .no-settings, .error-message, .error-setting {
        padding: 20px;
        text-align: center;
        border-radius: 6px;
        margin: 10px 0;
        font-weight: 500;
      }
      
      .no-config, .no-settings {
        background: rgba(255, 193, 7, 0.1);
        border: 1px solid #ffc107;
        color: #ffc107;
      }
      
      .error-message, .error-setting {
        background: rgba(220, 53, 69, 0.1);
        border: 1px solid #dc3545;
        color: #dc3545;
      }
      
      .config-debug {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 10px;
        border-radius: 4px;
        font-size: 12px;
        font-family: monospace;
        max-width: 300px;
        z-index: 10002;
      }
      
      /* 重新生成地图按钮样式 (TODO #15) */
      .config-terrain-actions {
        margin-top: 24px;
        padding: 16px;
        background: rgba(76, 144, 226, 0.1);
        border: 1px solid rgba(76, 144, 226, 0.3);
        border-radius: 8px;
      }
      
      .config-regenerate-btn {
        background: linear-gradient(45deg, #4a90e2, #357abd);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.3s ease;
        width: 100%;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-shadow: 0 2px 8px rgba(76, 144, 226, 0.3);
      }
      
      .config-regenerate-btn:hover {
        background: linear-gradient(45deg, #357abd, #2a5a99);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(76, 144, 226, 0.4);
      }
      
      .config-regenerate-btn:active {
        transform: translateY(0);
        box-shadow: 0 2px 6px rgba(76, 144, 226, 0.3);
      }
      
      .config-regenerate-note {
        font-size: 12px;
        color: #888;
        text-align: center;
        line-height: 1.4;
        margin-top: 4px;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
}
