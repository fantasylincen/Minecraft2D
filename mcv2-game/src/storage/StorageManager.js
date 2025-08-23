/**
 * 存储管理器
 * 负责游戏数据的持久化保存和加载
 */

export class StorageManager {
  constructor() {
    this.storagePrefix = 'mcv2_';
    this.compression = true;
    
    // 支持的存储类型
    this.storageTypes = {
      PLAYER_DATA: 'player_data',
      WORLD_DATA: 'world_data',
      GAME_SETTINGS: 'game_settings',
      CHUNK_DATA: 'chunk_data'
    };
    
    console.log('💾 StorageManager 初始化完成');
  }
  
  /**
   * 保存玩家数据
   */
  savePlayerData(playerData) {
    try {
      const data = {
        ...playerData,
        savedAt: new Date().toISOString(),
        version: '1.0.0'
      };
      
      this.setItem(this.storageTypes.PLAYER_DATA, data);
      console.log('✅ 玩家数据保存成功');
      return true;
    } catch (error) {
      console.error('❌ 玩家数据保存失败:', error);
      return false;
    }
  }
  
  /**
   * 加载玩家数据
   */
  loadPlayerData() {
    try {
      const data = this.getItem(this.storageTypes.PLAYER_DATA);
      if (data) {
        console.log('✅ 玩家数据加载成功');
        return data;
      } else {
        console.log('ℹ️  未找到玩家数据，使用默认设置');
        return null;
      }
    } catch (error) {
      console.error('❌ 玩家数据加载失败:', error);
      return null;
    }
  }
  
  /**
   * 保存世界数据
   */
  saveWorldData(worldData) {
    try {
      const data = {
        seed: worldData.seed,
        terrainParams: worldData.terrainParams,
        savedAt: new Date().toISOString(),
        version: '1.0.0'
      };
      
      this.setItem(this.storageTypes.WORLD_DATA, data);
      console.log('✅ 世界数据保存成功');
      return true;
    } catch (error) {
      console.error('❌ 世界数据保存失败:', error);
      return false;
    }
  }
  
  /**
   * 加载世界数据
   */
  loadWorldData() {
    try {
      const data = this.getItem(this.storageTypes.WORLD_DATA);
      if (data) {
        console.log('✅ 世界数据加载成功');
        return data;
      } else {
        console.log('ℹ️  未找到世界数据，将生成新世界');
        return null;
      }
    } catch (error) {
      console.error('❌ 世界数据加载失败:', error);
      return null;
    }
  }
  
  /**
   * 保存区块数据
   */
  saveChunkData(chunkX, chunkData) {
    try {
      const key = `${this.storageTypes.CHUNK_DATA}_${chunkX}`;
      const data = {
        chunkX: chunkX,
        data: chunkData,
        savedAt: new Date().toISOString(),
        version: '1.0.0'
      };
      
      this.setItem(key, data);
      console.log(`✅ 区块 ${chunkX} 数据保存成功`);
      return true;
    } catch (error) {
      console.error(`❌ 区块 ${chunkX} 数据保存失败:`, error);
      return false;
    }
  }
  
  /**
   * 加载区块数据
   */
  loadChunkData(chunkX) {
    try {
      const key = `${this.storageTypes.CHUNK_DATA}_${chunkX}`;
      const data = this.getItem(key);
      
      if (data && data.data) {
        console.log(`✅ 区块 ${chunkX} 数据加载成功`);
        return data.data;
      } else {
        return null;
      }
    } catch (error) {
      console.error(`❌ 区块 ${chunkX} 数据加载失败:`, error);
      return null;
    }
  }
  
  /**
   * 保存游戏设置
   */
  saveGameSettings(settings) {
    try {
      const data = {
        ...settings,
        savedAt: new Date().toISOString(),
        version: '1.0.0'
      };
      
      this.setItem(this.storageTypes.GAME_SETTINGS, data);
      console.log('✅ 游戏设置保存成功');
      return true;
    } catch (error) {
      console.error('❌ 游戏设置保存失败:', error);
      return false;
    }
  }
  
  /**
   * 加载游戏设置
   */
  loadGameSettings() {
    try {
      const data = this.getItem(this.storageTypes.GAME_SETTINGS);
      if (data) {
        console.log('✅ 游戏设置加载成功');
        return data;
      } else {
        console.log('ℹ️  未找到游戏设置，使用默认设置');
        return this.getDefaultSettings();
      }
    } catch (error) {
      console.error('❌ 游戏设置加载失败:', error);
      return this.getDefaultSettings();
    }
  }
  
  /**
   * 获取默认游戏设置
   */
  getDefaultSettings() {
    return {
      volume: 0.5,
      showDebugInfo: false,
      showGrid: false,
      enableParticles: true,
      enableAutoSave: true,
      autoSaveInterval: 60000, // 1分钟
      renderDistance: 5
    };
  }
  
  /**
   * 保存完整游戏状态
   */
  saveGameState(gameState) {
    try {
      const saveData = {
        player: gameState.player,
        world: gameState.world,
        camera: gameState.camera,
        settings: gameState.settings,
        savedAt: new Date().toISOString(),
        version: '1.0.0'
      };
      
      // 分别保存各个组件的数据
      const success = [
        this.savePlayerData(saveData.player),
        this.saveWorldData(saveData.world),
        this.saveGameSettings(saveData.settings)
      ].every(result => result);
      
      if (success) {
        console.log('🎉 游戏状态保存完成');
        this.showSaveNotification('游戏已保存');
      }
      
      return success;
    } catch (error) {
      console.error('❌ 游戏状态保存失败:', error);
      this.showSaveNotification('保存失败', true);
      return false;
    }
  }
  
  /**
   * 加载完整游戏状态
   */
  loadGameState() {
    try {
      const gameState = {
        player: this.loadPlayerData(),
        world: this.loadWorldData(),
        settings: this.loadGameSettings()
      };
      
      console.log('🎉 游戏状态加载完成');
      return gameState;
    } catch (error) {
      console.error('❌ 游戏状态加载失败:', error);
      return null;
    }
  }
  
  /**
   * 基础存储方法 - 设置项目
   */
  setItem(key, value) {
    try {
      const fullKey = this.storagePrefix + key;
      let dataToStore = JSON.stringify(value);
      
      // 简单的压缩（只是示例，实际项目中可以使用专业的压缩库）
      if (this.compression && dataToStore.length > 1000) {
        dataToStore = this.compress(dataToStore);
      }
      
      localStorage.setItem(fullKey, dataToStore);
      return true;
    } catch (error) {
      // 处理存储空间不足的情况
      if (error.name === 'QuotaExceededError') {
        console.warn('⚠️  存储空间不足，尝试清理旧数据');
        this.cleanupOldData();
        
        // 重试一次
        try {
          localStorage.setItem(this.storagePrefix + key, JSON.stringify(value));
          return true;
        } catch (retryError) {
          console.error('❌ 重试后仍然存储失败:', retryError);
          throw retryError;
        }
      }
      throw error;
    }
  }
  
  /**
   * 基础存储方法 - 获取项目
   */
  getItem(key) {
    try {
      const fullKey = this.storagePrefix + key;
      const data = localStorage.getItem(fullKey);
      
      if (data === null) {
        return null;
      }
      
      // 尝试解压缩
      let parsedData;
      try {
        parsedData = this.decompress(data);
      } catch (decompressError) {
        // 如果解压缩失败，尝试直接解析（可能不是压缩数据）
        parsedData = data;
      }
      
      return JSON.parse(parsedData);
    } catch (error) {
      console.error(`❌ 读取存储项目失败 (${key}):`, error);
      return null;
    }
  }
  
  /**
   * 删除存储项目
   */
  removeItem(key) {
    try {
      const fullKey = this.storagePrefix + key;
      localStorage.removeItem(fullKey);
      console.log(`🗑️  删除存储项目: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ 删除存储项目失败 (${key}):`, error);
      return false;
    }
  }
  
  /**
   * 清空所有游戏数据
   */
  clearAllData() {
    try {
      const keys = Object.keys(localStorage);
      const gameKeys = keys.filter(key => key.startsWith(this.storagePrefix));
      
      gameKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log(`🗑️  清空所有游戏数据 (${gameKeys.length} 项)`);
      return true;
    } catch (error) {
      console.error('❌ 清空数据失败:', error);
      return false;
    }
  }
  
  /**
   * 获取存储使用情况
   */
  getStorageInfo() {
    let totalSize = 0;
    let gameDataSize = 0;
    let itemCount = 0;
    
    try {
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size;
        totalSize += size;
        
        if (key.startsWith(this.storagePrefix)) {
          gameDataSize += size;
          itemCount++;
        }
      });
      
      return {
        totalSize: totalSize,
        gameDataSize: gameDataSize,
        itemCount: itemCount,
        maxSize: 5 * 1024 * 1024, // 假设5MB限制
        usage: (totalSize / (5 * 1024 * 1024)) * 100
      };
    } catch (error) {
      console.error('❌ 获取存储信息失败:', error);
      return null;
    }
  }
  
  /**
   * 清理旧数据
   */
  cleanupOldData() {
    try {
      const keys = Object.keys(localStorage);
      const gameKeys = keys.filter(key => key.startsWith(this.storagePrefix));
      
      // 按时间排序，删除最旧的数据
      const keyData = gameKeys.map(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          return {
            key: key,
            savedAt: new Date(data.savedAt || 0).getTime()
          };
        } catch {
          return {
            key: key,
            savedAt: 0
          };
        }
      });
      
      keyData.sort((a, b) => a.savedAt - b.savedAt);
      
      // 删除最旧的25%数据
      const toDelete = Math.ceil(keyData.length * 0.25);
      for (let i = 0; i < toDelete; i++) {
        localStorage.removeItem(keyData[i].key);
      }
      
      console.log(`🧹 清理了 ${toDelete} 项旧数据`);
    } catch (error) {
      console.error('❌ 清理旧数据失败:', error);
    }
  }
  
  /**
   * 简单压缩（示例实现）
   */
  compress(data) {
    // 这里只是示例，实际项目中建议使用专业压缩库
    return data;
  }
  
  /**
   * 简单解压缩（示例实现）
   */
  decompress(data) {
    // 这里只是示例，实际项目中建议使用专业压缩库
    return data;
  }
  
  /**
   * 显示保存通知
   */
  showSaveNotification(message, isError = false) {
    // 简单的通知显示，后续可以改为更好的UI组件
    console.log(isError ? `❌ ${message}` : `✅ ${message}`);
  }
  
  /**
   * 自动保存功能
   */
  startAutoSave(saveCallback, interval = 60000) {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    this.autoSaveInterval = setInterval(() => {
      console.log('🔄 执行自动保存...');
      saveCallback();
    }, interval);
    
    console.log(`⏰ 自动保存已启动 (间隔: ${interval/1000}秒)`);
  }
  
  /**
   * 停止自动保存
   */
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('⏹️  自动保存已停止');
    }
  }
  
  /**
   * 检查浏览器存储支持
   */
  isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      console.warn('⚠️  localStorage 不可用:', error);
      return false;
    }
  }
}