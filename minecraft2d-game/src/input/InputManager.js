/**
 * 统一按键管理器
 * 解决系统中的按键冲突问题，提供统一的按键处理机制
 */

export class InputManager {
  constructor() {
    // 存储所有按键状态
    this.keys = {};
    
    // 存储按键处理函数映射
    this.keyHandlers = new Map();
    this.keyReleaseHandlers = new Map(); // 新增：存储按键释放处理函数
    
    // 存储按键优先级映射
    this.keyPriorities = new Map();
    
    // 当前激活的上下文（用于确定哪个系统应该处理按键）
    this.activeContext = 'game'; // 默认为游戏上下文
    
    // 上下文优先级映射
    this.contextPriorities = {
      'inventory': 100,    // 物品栏优先级最高
      'crafting': 90,      // 制作台优先级次之
      'furnace': 90,       // 熔炉优先级次之
      'chat': 80,          // 聊天优先级中等
      'game': 50,          // 游戏默认优先级
      'ui': 40             // UI控制优先级较低
    };
    
    // 初始化事件监听器
    this.initializeEventListeners();
    
    console.log('⌨️ InputManager 初始化完成');
  }
  
  /**
   * 初始化事件监听器
   */
  initializeEventListeners() {
    // 监听按键按下事件
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      this.handleKeyDown(e);
    });
    
    // 监听按键释放事件
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.handleKeyUp(e);
    });
  }
  
  /**
   * 注册按键处理函数
   * @param {string} key - 按键代码（如 'KeyE', 'Digit1' 等）
   * @param {Function} handler - 处理函数
   * @param {string} context - 上下文名称
   * @param {number} priority - 优先级（数字越大优先级越高）
   * @param {boolean} isReleaseHandler - 是否为释放处理函数
   */
  registerKeyHandler(key, handler, context = 'game', priority = 0, isReleaseHandler = false) {
    const handlerMap = isReleaseHandler ? this.keyReleaseHandlers : this.keyHandlers;
    
    if (!handlerMap.has(key)) {
      handlerMap.set(key, []);
    }
    
    // 添加处理函数到列表
    handlerMap.get(key).push({
      handler,
      context,
      priority
    });
    
    // 更新按键优先级映射（仅对按下处理函数）
    if (!isReleaseHandler) {
      this.updateKeyPriority(key);
    }
  }
  
  /**
   * 更新按键优先级映射
   * @param {string} key - 按键代码
   */
  updateKeyPriority(key) {
    const handlers = this.keyHandlers.get(key) || [];
    if (handlers.length === 0) {
      this.keyPriorities.delete(key);
      return;
    }
    
    // 找到最高优先级的上下文
    let maxPriority = -Infinity;
    let highestContext = 'game';
    
    handlers.forEach(handler => {
      const contextPriority = this.contextPriorities[handler.context] || 0;
      const totalPriority = contextPriority + handler.priority;
      
      if (totalPriority > maxPriority) {
        maxPriority = totalPriority;
        highestContext = handler.context;
      }
    });
    
    this.keyPriorities.set(key, highestContext);
  }
  
  /**
   * 移除按键处理函数
   * @param {string} key - 按键代码
   * @param {Function} handler - 要移除的处理函数
   * @param {boolean} isReleaseHandler - 是否为释放处理函数
   */
  unregisterKeyHandler(key, handler, isReleaseHandler = false) {
    const handlerMap = isReleaseHandler ? this.keyReleaseHandlers : this.keyHandlers;
    
    if (!handlerMap.has(key)) {
      return;
    }
    
    const handlers = handlerMap.get(key);
    const index = handlers.findIndex(h => h.handler === handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
      
      // 如果没有处理函数了，移除映射
      if (handlers.length === 0) {
        handlerMap.delete(key);
      } else if (!isReleaseHandler) {
        // 更新优先级映射（仅对按下处理函数）
        this.updateKeyPriority(key);
      }
    }
  }
  
  /**
   * 设置当前激活的上下文
   * @param {string} context - 上下文名称
   */
  setActiveContext(context) {
    this.activeContext = context;
  }
  
  /**
   * 获取当前激活的上下文
   * @returns {string} 当前上下文名称
   */
  getActiveContext() {
    return this.activeContext;
  }
  
  /**
   * 处理按键按下事件
   * @param {KeyboardEvent} event - 键盘事件
   */
  handleKeyDown(event) {
    const key = event.code;
    
    // 获取应该处理此按键的上下文
    const targetContext = this.keyPriorities.get(key) || 'game';
    
    // 如果当前上下文优先级不够高，不处理此按键
    const currentPriority = this.contextPriorities[this.activeContext] || 0;
    const targetPriority = this.contextPriorities[targetContext] || 0;
    
    // 只有在当前上下文优先级低于目标上下文时，才阻止默认行为并处理
    if (targetPriority > currentPriority) {
      event.preventDefault();
      
      // 执行对应的处理函数
      this.executeKeyHandlers(key, event, targetContext, false);
    }
    // 如果当前上下文优先级足够高或相等，让当前上下文处理
    else if (targetPriority <= currentPriority) {
      // 执行对应的处理函数
      this.executeKeyHandlers(key, event, this.activeContext, false);
    }
  }
  
  /**
   * 处理按键释放事件
   * @param {KeyboardEvent} event - 键盘事件
   */
  handleKeyUp(event) {
    const key = event.code;
    
    // 获取应该处理此按键的上下文
    const targetContext = this.keyPriorities.get(key) || 'game';
    
    // 如果当前上下文优先级不够高，不处理此按键
    const currentPriority = this.contextPriorities[this.activeContext] || 0;
    const targetPriority = this.contextPriorities[targetContext] || 0;
    
    // 如果当前上下文优先级低于目标上下文，则在目标上下文中处理释放事件
    if (targetPriority > currentPriority) {
      // 执行对应的释放处理函数
      this.executeKeyHandlers(key, event, targetContext, true);
    } else {
      // 否则在当前上下文中处理释放事件
      this.executeKeyHandlers(key, event, this.activeContext, true);
    }
  }
  
  /**
   * 执行按键处理函数
   * @param {string} key - 按键代码
   * @param {KeyboardEvent} event - 键盘事件
   * @param {string} context - 目标上下文
   * @param {boolean} isRelease - 是否为释放事件
   */
  executeKeyHandlers(key, event, context, isRelease) {
    const handlerMap = isRelease ? this.keyReleaseHandlers : this.keyHandlers;
    const handlers = handlerMap.get(key);
    if (!handlers) return;
    
    // 找到匹配上下文的处理函数
    const matchingHandlers = handlers.filter(h => h.context === context);
    
    // 按优先级排序并执行
    matchingHandlers
      .sort((a, b) => b.priority - a.priority)
      .forEach(handlerObj => {
        try {
          handlerObj.handler(event);
        } catch (error) {
          console.error(`执行按键处理函数时出错: ${error.message}`, error);
        }
      });
  }
  
  /**
   * 检查某个按键是否被按下
   * @param {string} key - 按键代码
   * @returns {boolean} 是否被按下
   */
  isKeyPressed(key) {
    return !!this.keys[key];
  }
  
  /**
   * 获取所有按键状态
   * @returns {Object} 按键状态对象
   */
  getAllKeys() {
    return { ...this.keys };
  }
  
  /**
   * 重置所有按键状态
   */
  resetKeys() {
    Object.keys(this.keys).forEach(key => {
      this.keys[key] = false;
    });
  }
}

// 创建全局实例
export const inputManager = new InputManager();