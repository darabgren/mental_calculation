/**
 * localStorage 数据管理
 */
const Storage = {
  KEYS: {
    records: 'mcalc_records',
    errors: 'mcalc_errors',
    highScores: 'mcalc_highscores',
    checkIn: 'mcalc_checkin',
    daily: 'mcalc_daily',
    settings: 'mcalc_settings'
  },

  // === 练习记录 ===
  saveRecord(record) {
    const records = this.getRecords();
    records.unshift({
      ...record,
      id: Date.now(),
      date: new Date().toISOString()
    });
    // 只保留最近50条
    if (records.length > 50) records.length = 50;
    localStorage.setItem(this.KEYS.records, JSON.stringify(records));
    // 更新最高分
    this.updateHighScore(record);
  },

  getRecords() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.records)) || [];
    } catch { return []; }
  },

  // === 错题本 ===
  saveError(error) {
    const errors = this.getErrors();
    // 避免重复完全相同的错题
    const exists = errors.some(e =>
      e.question === error.question && e.userAnswer === error.userAnswer
    );
    if (!exists) {
      errors.unshift({
        ...error,
        id: Date.now(),
        date: new Date().toISOString(),
        reviewCount: 0,
        mastered: false
      });
      if (errors.length > 200) errors.length = 200;
      localStorage.setItem(this.KEYS.errors, JSON.stringify(errors));
    }
  },

  getErrors() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.errors)) || [];
    } catch { return []; }
  },

  getUnmasteredErrors() {
    return this.getErrors().filter(e => !e.mastered);
  },

  markErrorReviewed(errorId) {
    const errors = this.getErrors();
    const err = errors.find(e => e.id === errorId);
    if (err) {
      err.reviewCount = (err.reviewCount || 0) + 1;
      if (err.reviewCount >= 3) err.mastered = true;
      localStorage.setItem(this.KEYS.errors, JSON.stringify(errors));
    }
  },

  clearErrors() {
    localStorage.setItem(this.KEYS.errors, JSON.stringify([]));
  },

  getErrorCount() {
    return this.getUnmasteredErrors().length;
  },

  // === 最高分 ===
  updateHighScore(record) {
    const scores = this.getHighScores();
    const key = `${record.mode}_${record.difficulty}_${record.operation}`;
    if (!scores[key] || record.score > scores[key].score) {
      scores[key] = {
        score: record.score,
        accuracy: record.accuracy,
        date: new Date().toISOString()
      };
    }
    localStorage.setItem(this.KEYS.highScores, JSON.stringify(scores));
  },

  getHighScores() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.highScores)) || {};
    } catch { return {}; }
  },

  getHighScore(mode, difficulty, operation) {
    const scores = this.getHighScores();
    return scores[`${mode}_${difficulty}_${operation}`] || null;
  },

  // === 打卡 ===
  checkIn() {
    const data = this.getCheckIn();
    const today = new Date().toDateString();
    if (data.lastDate === today) return data; // 已经打过卡

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (data.lastDate === yesterday) {
      data.streak += 1;
    } else if (data.lastDate !== today) {
      data.streak = 1;
    }
    data.lastDate = today;
    data.totalDays += 1;
    localStorage.setItem(this.KEYS.checkIn, JSON.stringify(data));
    return data;
  },

  getCheckIn() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.checkIn)) || {
        streak: 0, lastDate: '', totalDays: 0
      };
    } catch { return { streak: 0, lastDate: '', totalDays: 0 }; }
  },

  getStreak() {
    const data = this.getCheckIn();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (data.lastDate === today || data.lastDate === yesterday) {
      return data.streak;
    }
    return 0;
  },

  // === 每日挑战 ===
  saveDailyResult(seed, result) {
    const daily = this.getDaily();
    daily[seed] = result;
    localStorage.setItem(this.KEYS.daily, JSON.stringify(daily));
  },

  getDaily() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.daily)) || {};
    } catch { return {}; }
  },

  getDailyResult(seed) {
    return this.getDaily()[seed] || null;
  },

  // === 设置 ===
  saveSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    localStorage.setItem(this.KEYS.settings, JSON.stringify(settings));
  },

  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.settings)) || {
        sound: true,
        vibrate: true,
        animation: true
      };
    } catch { return { sound: true, vibrate: true, animation: true }; }
  },

  getSetting(key) {
    return this.getSettings()[key];
  },

  // === 全部清除 ===
  resetAll() {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};
