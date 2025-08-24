/**
 * 生物群系类型定义和配置
 * 定义游戏中所有生物群系的类型、属性和生成规则
 */

// 生物群系类型枚举
export const BIOME_TYPES = {
  OCEAN: 'ocean',
  PLAINS: 'plains', 
  FOREST: 'forest',
  DESERT: 'desert',
  MOUNTAINS: 'mountains',
  SWAMP: 'swamp',
  TUNDRA: 'tundra'
};

// 生物群系配置
export const BIOME_CONFIG = {
  [BIOME_TYPES.OCEAN]: {
    name: '海洋',
    temperature: 0.5,
    humidity: 0.9,
    elevation: -0.3,
    color: '#0066CC',
    blocks: {
      surface: 'water',
      subsurface: 'sand',
      deep: 'stone'
    },
    heightModifiers: {
      continental: 0.3,
      regional: 0.2,
      local: 0.1
    },
    ores: {
      coal: { frequency: 0.03, threshold: 0.8 },
      iron: { frequency: 0.02, threshold: 0.85 }
    }
  },
  
  [BIOME_TYPES.PLAINS]: {
    name: '平原',
    temperature: 0.6,
    humidity: 0.4,
    elevation: 0.0,
    color: '#90EE90',
    blocks: {
      surface: 'grass',
      subsurface: 'dirt',
      deep: 'stone'
    },
    heightModifiers: {
      continental: 0.8,  // 从0.5增加到0.8
      regional: 0.6,     // 从0.3增加到0.6
      local: 0.4         // 从0.2增加到0.4
    },
    vegetation: {
      trees: 0.05,
      grass: 0.4,
      flowers: 0.1
    },
    ores: {
      coal: { frequency: 0.08, threshold: 0.6 },
      iron: { frequency: 0.06, threshold: 0.7 },
      gold: { frequency: 0.02, threshold: 0.85 }
    }
  },
  
  [BIOME_TYPES.FOREST]: {
    name: '森林',
    temperature: 0.7,
    humidity: 0.8,
    elevation: 0.1,
    color: '#228B22',
    blocks: {
      surface: 'grass',
      subsurface: 'dirt',
      deep: 'stone'
    },
    heightModifiers: {
      continental: 0.7,
      regional: 0.5,
      local: 0.4
    },
    vegetation: {
      trees: 0.3,
      grass: 0.6,
      flowers: 0.15
    },
    ores: {
      coal: { frequency: 0.1, threshold: 0.65 },
      iron: { frequency: 0.08, threshold: 0.75 },
      gold: { frequency: 0.03, threshold: 0.8 }
    }
  },
  
  [BIOME_TYPES.DESERT]: {
    name: '沙漠',
    temperature: 0.9,
    humidity: 0.1,
    elevation: 0.2,
    color: '#F4A460',
    blocks: {
      surface: 'sand',
      subsurface: 'sand',
      deep: 'stone'
    },
    heightModifiers: {
      continental: 0.6,
      regional: 0.4,
      local: 0.3
    },
    vegetation: {
      trees: 0.01,
      grass: 0.05,
      flowers: 0.02
    },
    ores: {
      coal: { frequency: 0.04, threshold: 0.75 },
      iron: { frequency: 0.05, threshold: 0.8 },
      gold: { frequency: 0.04, threshold: 0.75 },
      diamond: { frequency: 0.015, threshold: 0.9 }
    }
  },
  
  [BIOME_TYPES.MOUNTAINS]: {
    name: '山地',
    temperature: 0.3,
    humidity: 0.6,
    elevation: 0.6,
    color: '#696969',
    blocks: {
      surface: 'stone',
      subsurface: 'stone',
      deep: 'stone'
    },
    heightModifiers: {
      continental: 1.2,
      regional: 1.0,
      local: 0.8
    },
    vegetation: {
      trees: 0.1,
      grass: 0.2,
      flowers: 0.05
    },
    ores: {
      coal: { frequency: 0.12, threshold: 0.55 },
      iron: { frequency: 0.1, threshold: 0.6 },
      gold: { frequency: 0.06, threshold: 0.7 },
      diamond: { frequency: 0.025, threshold: 0.85 }
    }
  },
  
  [BIOME_TYPES.SWAMP]: {
    name: '沼泽',
    temperature: 0.8,
    humidity: 0.9,
    elevation: -0.1,
    color: '#2F4F2F',
    blocks: {
      surface: 'grass',
      subsurface: 'dirt',
      deep: 'stone'
    },
    heightModifiers: {
      continental: 0.4,
      regional: 0.25,
      local: 0.15
    },
    vegetation: {
      trees: 0.25,
      grass: 0.8,
      flowers: 0.05
    },
    ores: {
      coal: { frequency: 0.06, threshold: 0.7 },
      iron: { frequency: 0.04, threshold: 0.8 }
    }
  },
  
  [BIOME_TYPES.TUNDRA]: {
    name: '苔原',
    temperature: 0.1,
    humidity: 0.3,
    elevation: 0.3,
    color: '#E0E0E0',
    blocks: {
      surface: 'grass',
      subsurface: 'dirt',
      deep: 'stone'
    },
    heightModifiers: {
      continental: 0.8,
      regional: 0.6,
      local: 0.4
    },
    vegetation: {
      trees: 0.02,
      grass: 0.1,
      flowers: 0.01
    },
    ores: {
      coal: { frequency: 0.05, threshold: 0.75 },
      iron: { frequency: 0.07, threshold: 0.7 },
      gold: { frequency: 0.03, threshold: 0.8 }
    }
  }
};

/**
 * 根据环境参数确定生物群系类型
 * @param {number} temperature - 温度 (-1 到 1)
 * @param {number} humidity - 湿度 (-1 到 1)
 * @param {number} elevation - 海拔 (-1 到 1)
 * @returns {string} 生物群系类型
 */
export function determineBiome(temperature, humidity, elevation) {
  // 海洋 - 低海拔
  if (elevation < -0.2) {
    return BIOME_TYPES.OCEAN;
  }
  
  // 苔原 - 极低温度
  if (temperature < -0.3) {
    return BIOME_TYPES.TUNDRA;
  }
  
  // 沙漠 - 低湿度，高温度
  if (humidity < -0.3 && temperature > 0.2) {
    return BIOME_TYPES.DESERT;
  }
  
  // 山地 - 高海拔
  if (elevation > 0.4) {
    return BIOME_TYPES.MOUNTAINS;
  }
  
  // 森林 - 高湿度，适中温度
  if (humidity > 0.3 && temperature > 0.0 && temperature < 0.8) {
    return BIOME_TYPES.FOREST;
  }
  
  // 沼泽 - 极高湿度，低海拔
  if (humidity > 0.6 && elevation < 0.1 && temperature > 0.5) {
    return BIOME_TYPES.SWAMP;
  }
  
  // 默认平原
  return BIOME_TYPES.PLAINS;
}

/**
 * 获取生物群系配置
 * @param {string} biomeType - 生物群系类型
 * @returns {Object} 生物群系配置
 */
export function getBiomeConfig(biomeType) {
  return BIOME_CONFIG[biomeType] || BIOME_CONFIG[BIOME_TYPES.PLAINS];
}

/**
 * 获取所有生物群系类型
 * @returns {string[]} 生物群系类型数组
 */
export function getAllBiomeTypes() {
  return Object.values(BIOME_TYPES);
}

/**
 * 检查是否为有效的生物群系类型
 * @param {string} biomeType - 生物群系类型
 * @returns {boolean} 是否有效
 */
export function isValidBiomeType(biomeType) {
  return Object.values(BIOME_TYPES).includes(biomeType);
}