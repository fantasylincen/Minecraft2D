/**
 * 玩家音频控制器
 * 负责管理玩家相关的音频效果
 */

export class PlayerAudioController {
  /**
   * 构造函数
   * @param {Player} player - 玩家实例
   * @param {AudioManager} audioManager - 音频管理器
   */
  constructor(player, audioManager) {
    this.player = player;
    this.audioManager = audioManager;
    
    // 音效状态
    this.footstepTimer = 0;
    this.footstepInterval = 0.5; // 步伐声间隔（秒）
    this.lastOnGround = false;
    this.isSwimming = false;
    
    // 音效配置
    this.sounds = {
      footstep: 'footstep_grass',     // 步伐声
      footstep_stone: 'footstep_stone', // 石头步伐声
      footstep_water: 'footstep_water', // 水中步伐声
      jump: 'player_jump',            // 跳跃声
      land: 'player_land',            // 着陆声
      swim: 'player_swim',            // 游泳声
      hurt: 'player_hurt',            // 受伤声
      death: 'player_death'           // 死亡声
    };
    
    console.log('🎵 PlayerAudioController 玩家音频控制器初始化完成');
  }
  
  /**
   * 更新音频控制器
   * @param {number} deltaTime - 时间增量（秒）
   */
  update(deltaTime) {
    if (!this.player || !this.audioManager) return;
    
    // 检查玩家状态变化并播放相应音效
    this.checkFootsteps(deltaTime);
    this.checkJumpLand();
    this.checkSwimming();
  }
  
  /**
   * 检查步伐声
   * @param {number} deltaTime - 时间增量（秒）
   */
  checkFootsteps(deltaTime) {
    // 只有在地面上且移动时才播放步伐声
    if (this.player.physics.onGround && 
        (Math.abs(this.player.physics.velocity.x) > 0.1)) {
      
      this.footstepTimer += deltaTime;
      
      // 达到步伐间隔时播放步伐声
      if (this.footstepTimer >= this.footstepInterval) {
        this.playFootstepSound();
        this.footstepTimer = 0;
      }
    } else {
      // 重置计时器
      this.footstepTimer = 0;
    }
  }
  
  /**
   * 播放步伐声
   */
  playFootstepSound() {
    // 根据玩家所处环境选择不同的步伐声
    let soundName = this.sounds.footstep;
    
    if (this.player.inWater.isSwimming) {
      soundName = this.sounds.footstep_water;
    } else {
      // TODO: 根据脚下方块类型选择不同的步伐声
      // 例如：在石头上播放footstep_stone
    }
    
    // 播放音效（带随机音调变化）
    const pitch = 0.9 + Math.random() * 0.2; // 0.9-1.1的音调变化
    this.audioManager.playSound(soundName, { pitch: pitch });
  }
  
  /**
   * 检查跳跃和着陆
   */
  checkJumpLand() {
    const currentOnGround = this.player.physics.onGround;
    
    // 从空中着陆
    if (currentOnGround && !this.lastOnGround && 
        Math.abs(this.player.physics.velocity.y) > 1) {
      this.playLandSound();
    }
    
    // 跳跃
    if (!currentOnGround && this.lastOnGround && 
        this.player.physics.velocity.y < -5) {
      this.playJumpSound();
    }
    
    this.lastOnGround = currentOnGround;
  }
  
  /**
   * 检查游泳状态
   */
  checkSwimming() {
    const currentSwimming = this.player.inWater.isSwimming;
    
    // 进入水中开始游泳
    if (currentSwimming && !this.isSwimming) {
      this.playSwimSound();
    }
    
    this.isSwimming = currentSwimming;
  }
  
  /**
   * 播放跳跃音效
   */
  playJumpSound() {
    this.audioManager.playSound(this.sounds.jump);
  }
  
  /**
   * 播放着陆音效
   */
  playLandSound() {
    // 根据着陆速度调整音量
    const velocity = Math.abs(this.player.physics.velocity.y);
    const volume = Math.min(0.3 + (velocity / 20), 1.0);
    
    this.audioManager.playSound(this.sounds.land, { volume: volume });
  }
  
  /**
   * 播放游泳音效
   */
  playSwimSound() {
    this.audioManager.playSound(this.sounds.swim);
  }
  
  /**
   * 播放受伤音效
   */
  playHurtSound() {
    this.audioManager.playSound(this.sounds.hurt);
  }
  
  /**
   * 播放死亡音效
   */
  playDeathSound() {
    this.audioManager.playSound(this.sounds.death);
  }
  
  /**
   * 播放破坏方块音效
   * @param {string} blockType - 方块类型
   */
  playBlockBreakSound(blockType) {
    // 根据方块类型播放不同的破坏音效
    const soundName = `block_break_${blockType}` || 'block_break_generic';
    this.audioManager.playSound(soundName);
  }
  
  /**
   * 播放放置方块音效
   * @param {string} blockType - 方块类型
   */
  playBlockPlaceSound(blockType) {
    // 根据方块类型播放不同的放置音效
    const soundName = `block_place_${blockType}` || 'block_place_generic';
    this.audioManager.playSound(soundName);
  }
  
  /**
   * 设置玩家引用
   * @param {Player} player - 玩家实例
   */
  setPlayer(player) {
    this.player = player;
  }
  
  /**
   * 设置音频管理器引用
   * @param {AudioManager} audioManager - 音频管理器
   */
  setAudioManager(audioManager) {
    this.audioManager = audioManager;
  }
}