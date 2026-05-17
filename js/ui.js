/**
 * UI 辅助和动画系统
 */
const UI = {
  currentScreen: 'home',
  animationEnabled: true,
  feedbackTimeout: null,

  init() {
    this.animationEnabled = Storage.getSetting('animation') !== false;
  },

  setAnimation(enabled) {
    this.animationEnabled = enabled;
    Storage.saveSetting('animation', enabled);
  },

  /**
   * 切换屏幕
   */
  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(`screen-${name}`);
    if (el) {
      el.classList.add('active');
      this.currentScreen = name;
    }
  },

  /**
   * 答题反馈动画
   * @param {boolean} correct - 是否正确
   * @param {string|number} answer - 正确答案
   * @param {HTMLElement} container - 反馈容器
   */
  showFeedback(correct, answer, container) {
    if (!container) container = document.getElementById('feedback-pop');
    if (!container) return;

    if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);

    container.textContent = correct ? '✓' : `✗ ${answer}`;
    container.className = 'feedback-pop ' + (correct ? 'feedback-correct' : 'feedback-wrong');

    if (this.animationEnabled) {
      container.classList.add('feedback-show');

      if (correct) {
        this.spawnStars();
      } else {
        this.shakeElement(document.getElementById('question-text'));
      }
    }

    this.feedbackTimeout = setTimeout(() => {
      container.classList.remove('feedback-show');
    }, 600);
  },

  /**
   * COMBO 覆盖层动画
   */
  showCombo(level) {
    if (!this.animationEnabled) return;
    const overlay = document.getElementById('combo-overlay');
    const content = document.getElementById('combo-content');
    if (!overlay || !content) return;

    let label = `${level} COMBO`;
    let extraClass = '';

    if (level >= 30) {
      label = '🌟 SUPER COMBO!!';
      extraClass = 'combo-super';
    } else if (level >= 20) {
      label = `🔥 ${level} COMBO!!!`;
      extraClass = 'combo-mega';
    } else if (level >= 10) {
      label = `⚡ ${level} COMBO!!`;
      extraClass = 'combo-big';
    } else if (level >= 5) {
      label = `✨ ${level} COMBO!`;
      extraClass = 'combo-mid';
    }

    content.textContent = label;
    content.className = 'combo-content ' + extraClass;
    overlay.classList.add('combo-show');

    setTimeout(() => {
      overlay.classList.remove('combo-show');
    }, 1000);
  },

  /**
   * 星星爆发动画
   */
  spawnStars() {
    if (!this.animationEnabled) return;
    const container = document.getElementById('stars-container');
    if (!container) return;

    const colors = ['#FFD700', '#FF6B6B', '#4FC3F7', '#81C784', '#FFB74D', '#BA68C8'];
    const count = 12;

    for (let i = 0; i < count; i++) {
      const star = document.createElement('span');
      star.className = 'spawned-star';
      star.textContent = ['⭐', '✨', '🌟', '💫'][Math.floor(Math.random() * 4)];
      star.style.left = `${20 + Math.random() * 60}%`;
      star.style.top = `${30 + Math.random() * 20}%`;
      star.style.setProperty('--tx', `${(Math.random() - 0.5) * 200}px`);
      star.style.setProperty('--ty', `${-50 - Math.random() * 150}px`);
      star.style.setProperty('--rot', `${(Math.random() - 0.5) * 360}deg`);
      star.style.setProperty('--scale', `${0.5 + Math.random() * 1.5}`);
      star.style.animationDuration = `${0.6 + Math.random() * 0.6}s`;
      star.style.animationDelay = `${Math.random() * 0.15}s`;
      container.appendChild(star);

      setTimeout(() => star.remove(), 1500);
    }
  },

  /**
   * 元素抖动
   */
  shakeElement(el) {
    if (!el || !this.animationEnabled) return;
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 500);
  },

  /**
   * 更新进度条
   */
  updateProgress(current, total, barEl) {
    if (!barEl) barEl = document.getElementById('progress-bar');
    if (barEl) {
      barEl.style.width = total > 0 ? `${(current / total) * 100}%` : '0%';
    }
  },

  /**
   * 更新元素文本
   */
  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  },

  /**
   * 显示/隐藏元素
   */
  show(id, display = '') {
    const el = document.getElementById(id);
    if (el) el.style.display = display || '';
  },

  hide(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  },

  /**
   * 添加/移除 CSS class
   */
  addClass(id, cls) {
    const el = document.getElementById(id);
    if (el) el.classList.add(cls);
  },

  removeClass(id, cls) {
    const el = document.getElementById(id);
    if (el) el.classList.remove(cls);
  },

  /**
   * 生成带有动画的结算页星星
   */
  renderStars(accuracy, containerEl) {
    if (!containerEl) containerEl = document.getElementById('result-stars');
    if (!containerEl) return;

    let starCount = 0;
    if (accuracy >= 1) starCount = 3;
    else if (accuracy >= 0.8) starCount = 2;
    else if (accuracy >= 0.6) starCount = 1;

    const stars = containerEl.querySelectorAll('.star');
    stars.forEach((star, i) => {
      star.classList.remove('earned', 'animate');
      if (i < starCount) {
        star.classList.add('earned');
        setTimeout(() => star.classList.add('animate'), 200 + i * 300);
      }
    });
  },

  /**
   * 获取评语
   */
  getComment(accuracy) {
    const comments = CONFIG;
    if (accuracy >= 1) {
      return comments.excellent[Math.floor(Math.random() * comments.excellent.length)];
    } else if (accuracy >= 0.9) {
      return comments.great[Math.floor(Math.random() * comments.great.length)];
    } else if (accuracy >= 0.7) {
      return comments.good[Math.floor(Math.random() * comments.good.length)];
    } else {
      return comments.ok[Math.floor(Math.random() * comments.ok.length)];
    }
  },

  /**
   * 震动反馈
   */
  vibrate(pattern = 50) {
    if (Storage.getSetting('vibrate') !== false && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }
};
