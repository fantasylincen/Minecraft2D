/**
 * 音频管理器
 * 负责游戏中的音效和背景音乐播放
 */

export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.soundEffects = new Map();
    this.ambientSounds = new Map();
    this.currentBiome = 'plains';
    this.ambientVolume = 0.3;
    this.effectsVolume = 0.5;
    
    // 当前播放的环境音效
    this.currentAmbientSource = null;
    this.currentAmbientBuffer = null;
    
    this.init();
  }
  
  /**
   * 初始化音频上下文
   */
  async init() {
    try {
      // 创建音频上下文
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // 创建主增益节点
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      
      // 初始化音效
      await this.loadSoundEffects();
      
      console.log('🎵 AudioManager 初始化完成');
    } catch (error) {
      console.warn('⚠️ 音频系统初始化失败:', error);
    }
  }
  
  /**
   * 加载音效文件
   */
  async loadSoundEffects() {
    // 这里可以加载实际的音频文件
    // 由于这是一个示例项目，我们使用生成的音效
    
    // 创建简单的音效生成器
    this.createSoundGenerators();
  }
  
  /**
   * 创建音效生成器
   */
  createSoundGenerators() {
    // 鸟叫声生成器
    this.soundEffects.set('birds-chirping', {
      generate: () => this.generateBirdSound(),
      duration: 2
    });
    
    // 风声生成器
    this.soundEffects.set('wind-blowing', {
      generate: () => this.generateWindSound(),
      duration: 5
    });
    
    // 青蛙叫声生成器
    this.soundEffects.set('frogs-croaking', {
      generate: () => this.generateFrogSound(),
      duration: 3
    });
    
    // 风雪声生成器
    this.soundEffects.set('wind-howling', {
      generate: () => this.generateWindHowlingSound(),
      duration: 4
    });
    
    // 山风声生成器
    this.soundEffects.set('wind-mountain', {
      generate: () => this.generateMountainWindSound(),
      duration: 6
    });
    
    // 海浪声生成器
    this.soundEffects.set('ocean-waves', {
      generate: () => this.generateOceanWavesSound(),
      duration: 8
    });
  }
  
  /**
   * 生成鸟叫声
   */
  generateBirdSound() {
    if (!this.audioContext) return null;
    
    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 2, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // 生成简单的鸟叫声
    for (let i = 0; i < data.length; i++) {
      const time = i / this.audioContext.sampleRate;
      // 多个频率叠加
      data[i] = Math.sin(2 * Math.PI * 880 * time) * Math.exp(-time * 2) +
                Math.sin(2 * Math.PI * 1760 * time) * Math.exp(-time * 3) +
                Math.sin(2 * Math.PI * 2640 * time) * Math.exp(-time * 4);
      // 添加随机性
      data[i] += (Math.random() - 0.5) * 0.1;
    }
    
    return buffer;
  }
  
  /**
   * 生成风声
   */
  generateWindSound() {
    if (!this.audioContext) return null;
    
    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 5, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // 生成风声
    for (let i = 0; i < data.length; i++) {
      const time = i / this.audioContext.sampleRate;
      // 低频噪声
      data[i] = (Math.random() - 0.5) * 2;
      // 低通滤波效果
      if (i > 0) {
        data[i] = data[i] * 0.1 + data[i-1] * 0.9;
      }
    }
    
    return buffer;
  }
  
  /**
   * 生成青蛙叫声
   */
  generateFrogSound() {
    if (!this.audioContext) return null;
    
    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 3, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // 生成青蛙叫声
    for (let i = 0; i < data.length; i++) {
      const time = i / this.audioContext.sampleRate;
      // 低频振荡
      const freq = 100 + Math.sin(time * 2) * 50;
      data[i] = Math.sin(2 * Math.PI * freq * time) * Math.exp(-time);
      // 添加谐波
      data[i] += Math.sin(2 * Math.PI * freq * 2 * time) * Math.exp(-time) * 0.5;
    }
    
    return buffer;
  }
  
  /**
   * 生成风雪声
   */
  generateWindHowlingSound() {
    if (!this.audioContext) return null;
    
    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 4, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // 生成风雪声
    for (let i = 0; i < data.length; i++) {
      const time = i / this.audioContext.sampleRate;
      // 白噪声
      let noise = (Math.random() - 0.5) * 2;
      // 调制噪声
      noise *= Math.sin(2 * Math.PI * 0.5 * time) * 0.5 + 0.5;
      data[i] = noise;
    }
    
    return buffer;
  }
  
  /**
   * 生成山风声
   */
  generateMountainWindSound() {
    if (!this.audioContext) return null;
    
    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 6, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // 生成山风声
    for (let i = 0; i < data.length; i++) {
      const time = i / this.audioContext.sampleRate;
      // 多层噪声
      const noise1 = (Math.random() - 0.5) * 2;
      const noise2 = (Math.random() - 0.5) * 2;
      // 不同频率的调制
      data[i] = noise1 * Math.sin(2 * Math.PI * 0.3 * time) +
                noise2 * Math.sin(2 * Math.PI * 0.7 * time) * 0.7;
    }
    
    return buffer;
  }
  
  /**
   * 生成海浪声
   */
  generateOceanWavesSound() {
    if (!this.audioContext) return null;
    
    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 8, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // 生成海浪声
    for (let i = 0; i < data.length; i++) {
      const time = i / this.audioContext.sampleRate;
      // 低频振荡模拟海浪
      const wave = Math.sin(2 * Math.PI * 0.1 * time);
      // 噪声调制
      const noise = (Math.random() - 0.5) * 2;
      data[i] = wave * noise * (Math.sin(2 * Math.PI * 0.05 * time) * 0.5 + 0.5);
    }
    
    return buffer;
  }
  
  /**
   * 播放音效
   * @param {string} soundName - 音效名称
   * @param {number} volume - 音量 (0-1)
   */
  playSoundEffect(soundName, volume = 1.0) {
    if (!this.audioContext || this.audioContext.state === 'suspended') return;
    
    const sound = this.soundEffects.get(soundName);
    if (!sound) {
      console.warn(`⚠️ 音效 "${soundName}" 未找到`);
      return;
    }
    
    try {
      const buffer = sound.generate();
      if (!buffer) return;
      
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = volume * this.effectsVolume;
      
      source.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      source.start();
    } catch (error) {
      console.warn(`⚠️ 播放音效 "${soundName}" 失败:`, error);
    }
  }
  
  /**
   * 设置当前生物群系
   * @param {string} biome - 生物群系类型
   */
  setCurrentBiome(biome) {
    if (this.currentBiome === biome) return;
    
    this.currentBiome = biome;
    this.updateAmbientSound();
  }
  
  /**
   * 更新环境音效
   */
  updateAmbientSound() {
    if (!this.audioContext) return;
    
    // 停止当前环境音效
    if (this.currentAmbientSource) {
      this.currentAmbientSource.stop();
      this.currentAmbientSource = null;
    }
    
    // 获取生物群系配置
    import('../world/biomes/BiomeTypes.js').then((biomeModule) => {
      const biomeConfig = biomeModule.getBiomeConfig(this.currentBiome);
      if (!biomeConfig || !biomeConfig.ambientSounds || biomeConfig.ambientSounds.length === 0) {
        return;
      }
      
      // 随机选择一个环境音效
      const soundName = biomeConfig.ambientSounds[Math.floor(Math.random() * biomeConfig.ambientSounds.length)];
      const sound = this.soundEffects.get(soundName);
      if (!sound) return;
      
      // 生成音效
      const buffer = sound.generate();
      if (!buffer) return;
      
      // 创建音源
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      source.loop = true; // 环境音效通常需要循环播放
      gainNode.gain.value = this.ambientVolume;
      
      source.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      // 播放音效
      source.start();
      
      // 保存引用
      this.currentAmbientSource = source;
      this.currentAmbientBuffer = buffer;
    }).catch((error) => {
      console.warn('⚠️ 加载生物群系配置失败:', error);
    });
  }
  
  /**
   * 设置环境音量
   * @param {number} volume - 音量 (0-1)
   */
  setAmbientVolume(volume) {
    this.ambientVolume = Math.max(0, Math.min(1, volume));
    // 更新当前环境音效的音量
    // 注意：在实际实现中，需要更新当前播放的音效的增益节点
  }
  
  /**
   * 设置音效音量
   * @param {number} volume - 音量 (0-1)
   */
  setEffectsVolume(volume) {
    this.effectsVolume = Math.max(0, Math.min(1, volume));
  }
  
  /**
   * 暂停音频
   */
  suspend() {
    if (this.audioContext && this.audioContext.state !== 'suspended') {
      this.audioContext.suspend();
    }
  }
  
  /**
   * 恢复音频
   */
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
  
  /**
   * 销毁音频管理器
   */
  destroy() {
    if (this.currentAmbientSource) {
      this.currentAmbientSource.stop();
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}