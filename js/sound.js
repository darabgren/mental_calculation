/**
 * Web Audio API 音效系统
 */
const Sound = {
  ctx: null,
  enabled: true,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.enabled = false;
    }
    this.enabled = Storage.getSetting('sound') !== false;
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  setEnabled(val) {
    this.enabled = val;
    Storage.saveSetting('sound', val);
  },

  /**
   * 播放一个简单音调
   */
  playTone(freq, duration, type = 'sine', volume = 0.3) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  /**
   * 播放一组音调序列
   */
  playSequence(notes) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    notes.forEach(([freq, duration, delay, type = 'sine', vol = 0.3]) => {
      setTimeout(() => {
        this.playTone(freq, duration, type, vol);
      }, delay * 1000);
    });
  },

  // 答对音效 — 欢快上升
  correct() {
    this.playSequence([
      [523, 0.1, 0, 'sine', 0.25],
      [659, 0.1, 0.08, 'sine', 0.25],
      [784, 0.15, 0.16, 'sine', 0.25]
    ]);
  },

  // 答错音效 — 低沉
  wrong() {
    this.playTone(180, 0.3, 'square', 0.15);
    setTimeout(() => this.playTone(150, 0.3, 'square', 0.12), 150);
  },

  // 连击音效 — 逐级升高
  combo(level) {
    const baseFreq = 400 + level * 50;
    this.playSequence([
      [baseFreq, 0.1, 0, 'sine', 0.2],
      [baseFreq * 1.25, 0.1, 0.06, 'sine', 0.2],
      [baseFreq * 1.5, 0.12, 0.12, 'sine', 0.2],
      [baseFreq * 2, 0.2, 0.18, 'triangle', 0.25]
    ]);
  },

  // 开始游戏
  start() {
    this.playSequence([
      [262, 0.1, 0, 'sine', 0.2],
      [330, 0.1, 0.1, 'sine', 0.2],
      [392, 0.1, 0.2, 'sine', 0.2],
      [523, 0.2, 0.3, 'sine', 0.3]
    ]);
  },

  // 游戏结束
  gameOver() {
    this.playSequence([
      [440, 0.2, 0, 'sine', 0.25],
      [392, 0.2, 0.2, 'sine', 0.25],
      [349, 0.2, 0.4, 'sine', 0.2],
      [262, 0.5, 0.6, 'sine', 0.25]
    ]);
  },

  // 过关
  levelUp() {
    this.playSequence([
      [392, 0.1, 0, 'sine', 0.2],
      [523, 0.1, 0.08, 'sine', 0.2],
      [659, 0.1, 0.16, 'sine', 0.2],
      [784, 0.1, 0.24, 'sine', 0.25],
      [1047, 0.3, 0.32, 'triangle', 0.3]
    ]);
  },

  // 按钮点击
  click() {
    this.playTone(600, 0.05, 'sine', 0.1);
  },

  // 失去爱心
  loseHeart() {
    this.playTone(100, 0.4, 'sawtooth', 0.12);
  }
};
