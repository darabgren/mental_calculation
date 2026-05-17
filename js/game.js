/**
 * 游戏引擎 — 管理所有 8 种游戏模式
 */
const Game = {
  state: {
    mode: 'practice',
    difficulty: 'preschool',
    operation: 'add',

    questions: [],
    currentIndex: 0,
    correctCount: 0,
    wrongCount: 0,

    timeLimit: 0,
    timeElapsed: 0,
    timerInterval: null,
    startTime: 0,

    score: 0,
    combo: 0,
    maxCombo: 0,
    basePoints: 10,
    comboMultiplier: 1,

    lives: 3,
    maxLives: 5,
    level: 1,
    levelQuestions: [],
    levelCorrect: 0,
    perLevelQuestions: 10,
    passRate: 0.8,

    player: 1,
    totalQuestions: 0,
    pkCorrect: [0, 0],
    pkWrong: [0, 0],
    pkCombo: [0, 0],
    pkMaxCombo: [0, 0],
    pkScore: [0, 0],

    running: false,
    finished: false,
    dailySeed: 0
  },

  currentInput: '',
  isCompareQuestion: false,
  compareOptions: [],

  /**
   * 初始化游戏
   */
  init(mode, difficulty, operation) {
    const s = this.state;
    s.mode = mode;
    s.difficulty = difficulty;
    s.operation = operation;

    s.currentIndex = 0;
    s.correctCount = 0;
    s.wrongCount = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.comboMultiplier = 1;
    s.timeElapsed = 0;
    s.running = false;
    s.finished = false;
    s.player = 1;
    s.pkCorrect = [0, 0];
    s.pkWrong = [0, 0];
    s.pkCombo = [0, 0];
    s.pkMaxCombo = [0, 0];
    s.pkScore = [0, 0];

    this.currentInput = '';
    this.isCompareQuestion = false;
    this.compareOptions = [];

    // 模式设置
    const modeCfg = CONFIG.modes[mode] || {};
    s.timeLimit = modeCfg.timeLimit || 0;
    s.lives = modeCfg.lives || 3;
    s.maxLives = modeCfg.maxLives || 5;
    s.level = 1;
    s.levelCorrect = 0;
    s.perLevelQuestions = modeCfg.questionsPerLevel || 10;
    s.passRate = modeCfg.passRate || 0.8;

    // 生成题目
    if (mode === 'review') {
      this.loadReviewQuestions();
    } else if (mode === 'daily') {
      s.dailySeed = CONFIG.getDailySeed();
      this.generateDailyQuestions(s.dailySeed);
    } else if (mode === 'level') {
      this.generateLevelQuestions();
      s.totalQuestions = 0; // 动态增加
    } else if (mode === 'challenge') {
      s.totalQuestions = 999;
      this.generateQuestions(999);
    } else if (mode === 'combo') {
      s.totalQuestions = 999;
      this.generateQuestions(999);
    } else if (mode === 'survival') {
      s.totalQuestions = 999;
      this.generateQuestions(999);
    } else if (mode === 'pk') {
      s.totalQuestions = modeCfg.questionsPerPlayer * 2;
      this.generateQuestions(s.totalQuestions);
    } else {
      // practice: use selected count
      s.totalQuestions = parseInt(document.querySelector('#count-group .chip.active')?.dataset?.count) || 20;
      this.generateQuestions(s.totalQuestions);
    }
  },

  /**
   * 生成题目列表
   */
  generateQuestions(count) {
    this.state.questions = [];
    for (let i = 0; i < count; i++) {
      this.state.questions.push(
        QuestionGenerator.generate(this.state.difficulty, this.state.operation)
      );
    }
  },

  /**
   * 生成闯关题目（动态难度递增）
   */
  generateLevelQuestions() {
    // 根据关卡调整难度
    const levels = ['preschool', 'preschool', 'lower', 'lower', 'middle', 'middle', 'upper', 'upper'];
    const diffIdx = Math.min(this.state.level - 1, levels.length - 1);
    const diff = levels[diffIdx];

    this.state.questions = [];
    for (let i = 0; i < this.state.perLevelQuestions; i++) {
      this.state.questions.push(QuestionGenerator.generate(diff, this.state.operation));
    }
  },

  /**
   * 生成每日挑战题目（基于日期种子）
   */
  generateDailyQuestions(seed) {
    // 使用简单伪随机保证同一天相同题目
    let s = seed;
    const seededRand = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };

    // 临时替换 Math.random
    const origRandom = Math.random;
    Math.random = seededRand;

    this.state.questions = [];
    for (let i = 0; i < 10; i++) {
      // 每天前5题加，后5题减
      const op = i < 5 ? 'add' : 'sub';
      this.state.questions.push(QuestionGenerator.generate('lower', op));
    }
    this.state.totalQuestions = 10;

    // 恢复
    Math.random = origRandom;
  },

  /**
   * 加载错题本中的题目
   */
  loadReviewQuestions() {
    const errors = Storage.getUnmasteredErrors();
    if (errors.length === 0) {
      this.state.questions = [];
      this.state.totalQuestions = 0;
      return;
    }
    // 转换为题目格式
    this.state.questions = errors.map(e => ({
      display: e.question,
      answer: e.answer,
      type: e.type || 'add',
      isReview: true,
      errorId: e.id
    }));
    this.state.totalQuestions = this.state.questions.length;
  },

  /**
   * 获取当前题目
   */
  getCurrentQuestion() {
    const s = this.state;
    if (s.currentIndex >= s.questions.length) return null;
    return s.questions[s.currentIndex];
  },

  /**
   * 获取当前题目（安全，可能重新生成）
   */
  getQuestionSafe() {
    const q = this.getCurrentQuestion();
    if (q) return q;
    // 如果是闯关模式，生成新一关
    if (this.state.mode === 'level') {
      this.generateLevelQuestions();
      this.state.currentIndex = 0;
      return this.getCurrentQuestion();
    }
    return null;
  },

  /**
   * 提交答案
   * @returns {{ correct: boolean, answer: *, points: number }}
   */
  submitAnswer(userAnswer) {
    const s = this.state;
    const q = this.getCurrentQuestion();
    if (!q) return null;

    let isCorrect = false;

    if (q.type === 'compare') {
      isCorrect = userAnswer === q.answer;
    } else {
      // 数值比较（支持小数）
      isCorrect = parseFloat(userAnswer) === parseFloat(q.answer);
    }

    // 连击
    if (isCorrect) {
      s.combo++;
      if (s.combo > s.maxCombo) s.maxCombo = s.combo;
      s.correctCount++;
      if (s.mode === 'level') s.levelCorrect++;
      if (s.mode === 'survival' && s.lives < s.maxLives) s.lives++;

      // PK 模式：记录当前玩家数据
      if (s.mode === 'pk') {
        const pIdx = s.player - 1;
        s.pkCorrect[pIdx]++;
        s.pkCombo[pIdx]++;
        if (s.pkCombo[pIdx] > s.pkMaxCombo[pIdx]) s.pkMaxCombo[pIdx] = s.pkCombo[pIdx];
        s.combo = s.pkCombo[pIdx];
        s.maxCombo = Math.max(s.maxCombo, s.pkCombo[pIdx]);
      }

      // 计算连击倍数（PK模式使用per-player combo）
      const effectiveCombo = s.mode === 'pk' ? s.pkCombo[s.player - 1] : s.combo;
      s.comboMultiplier = 1;
      for (let i = CONFIG.comboMultipliers.length - 1; i >= 0; i--) {
        if (effectiveCombo >= CONFIG.comboMultipliers[i].min) {
          s.comboMultiplier = CONFIG.comboMultipliers[i].mult;
          break;
        }
      }
      const points = Math.round(s.basePoints * s.comboMultiplier);
      s.score += points;

      // PK 模式：记录玩家分数
      if (s.mode === 'pk') {
        s.pkScore[s.player - 1] += points;
      }

      // 错题复习掌握度
      if (q.isReview && q.errorId) {
        Storage.markErrorReviewed(q.errorId);
      }
    } else {
      s.combo = 0;
      s.comboMultiplier = 1;
      s.wrongCount++;
      if (s.mode === 'survival') s.lives--;

      // PK 模式：记录当前玩家错误，重置连击
      if (s.mode === 'pk') {
        const pIdx = s.player - 1;
        s.pkWrong[pIdx]++;
        s.pkCombo[pIdx] = 0;
      }

      // 记录错题
      Storage.saveError({
        question: q.display,
        answer: q.answer,
        userAnswer: userAnswer,
        type: q.type,
        difficulty: s.difficulty,
        operation: s.operation
      });
    }

    return {
      correct: isCorrect,
      answer: q.answer,
      points: isCorrect ? Math.round(s.basePoints * s.comboMultiplier) : 0
    };
  },

  /**
   * 移动到下一题
   * @returns {{ finished: boolean, reason?: string }}
   */
  nextQuestion() {
    const s = this.state;
    s.currentIndex++;

    // 闯关模式：检查是否过当前关卡
    if (s.mode === 'level') {
      if (s.currentIndex >= s.perLevelQuestions) {
        const accuracy = s.levelCorrect / s.perLevelQuestions;
        if (accuracy >= s.passRate) {
          s.level++;
          s.levelCorrect = 0;
          s.currentIndex = 0;
          // 动态增加难度
          this.generateLevelQuestions();
          return { finished: false, levelUp: true, level: s.level };
        } else {
          return { finished: true, reason: `第${s.level}关未通过，正确率${Math.round(accuracy * 100)}%` };
        }
      }
    }

    // 生存模式：检查生命
    if (s.mode === 'survival' && s.lives <= 0) {
      return { finished: true, reason: '爱心耗尽！' };
    }

    // 其他模式：检查是否达到总数
    if (s.currentIndex >= s.totalQuestions) {
      return { finished: true };
    }

    return { finished: false };
  },

  /**
   * 启动计时器
   */
  startTimer(callback) {
    const s = this.state;
    s.startTime = Date.now();
    s.running = true;
    s.finished = false;

    clearInterval(s.timerInterval);
    s.timerInterval = setInterval(() => {
      s.timeElapsed = Math.floor((Date.now() - s.startTime) / 1000);

      // 时间到
      if (s.timeLimit > 0 && s.timeElapsed >= s.timeLimit) {
        s.running = false;
        s.finished = true;
        clearInterval(s.timerInterval);
        if (callback) callback('timeout');
        return;
      }

      if (callback) callback('tick');
    }, 200);
  },

  /**
   * 停止计时器
   */
  stopTimer() {
    const s = this.state;
    s.running = false;
    clearInterval(s.timerInterval);
    s.timeElapsed = Math.floor((Date.now() - s.startTime) / 1000);
  },

  /**
   * 获取剩余时间（秒）
   */
  getTimeRemaining() {
    const s = this.state;
    if (s.timeLimit <= 0) return Infinity;
    return Math.max(0, s.timeLimit - s.timeElapsed);
  },

  /**
   * 格式化时间
   */
  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  /**
   * 获取统计数据
   */
  getStats() {
    const s = this.state;
    const total = s.correctCount + s.wrongCount;
    return {
      mode: s.mode,
      difficulty: s.difficulty,
      operation: s.operation,
      score: s.score,
      correct: s.correctCount,
      wrong: s.wrongCount,
      total: total,
      accuracy: total > 0 ? s.correctCount / total : 0,
      timeElapsed: s.timeElapsed,
      maxCombo: s.maxCombo,
      level: s.level
    };
  },

  /**
   * 重置状态
   */
  reset() {
    clearInterval(this.state.timerInterval);
    this.state = {
      mode: 'practice',
      difficulty: 'preschool',
      operation: 'add',
      questions: [],
      currentIndex: 0,
      correctCount: 0,
      wrongCount: 0,
      timeLimit: 0,
      timeElapsed: 0,
      timerInterval: null,
      startTime: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      basePoints: 10,
      comboMultiplier: 1,
      lives: 3,
      maxLives: 5,
      level: 1,
      levelQuestions: [],
      levelCorrect: 0,
      perLevelQuestions: 10,
      passRate: 0.8,
      player: 1,
      totalQuestions: 0,
      pkCorrect: [0, 0],
      pkWrong: [0, 0],
      pkCombo: [0, 0],
      pkMaxCombo: [0, 0],
      pkScore: [0, 0],
      running: false,
      finished: false,
      dailySeed: 0
    };
    this.currentInput = '';
    this.isCompareQuestion = false;
    this.compareOptions = [];
  }
};
