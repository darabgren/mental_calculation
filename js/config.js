/**
 * 全局配置常量
 */
const CONFIG = {
  // 难度配置
  difficulties: {
    preschool: {
      name: '幼儿版',
      desc: '10以内',
      range: { min: 0, max: 10 },
      maxResult: 10,
      operations: ['add', 'sub', 'compare', 'fill'],
      allowNegative: false,
      allowDecimal: false
    },
    lower: {
      name: '低年级',
      desc: '20以内',
      range: { min: 0, max: 20 },
      maxResult: 20,
      operations: ['add', 'sub', 'mul', 'div', 'mixed', 'compare', 'fill'],
      allowNegative: false,
      allowDecimal: false,
      mulRange: [1, 9]
    },
    middle: {
      name: '中年级',
      desc: '100以内',
      range: { min: 0, max: 100 },
      maxResult: 100,
      operations: ['add', 'sub', 'mul', 'div', 'mixed', 'compare', 'fill'],
      allowNegative: false,
      allowDecimal: false,
      mulRange: [1, 9]
    },
    upper: {
      name: '高年级',
      desc: '混合·小数',
      range: { min: 0, max: 1000 },
      maxResult: 1000,
      operations: ['add', 'sub', 'mul', 'div', 'mixed', 'compare', 'fill'],
      allowNegative: true,
      allowDecimal: true,
      mulRange: [2, 12]
    }
  },

  // 运算类型
  operations: {
    add: { name: '加法', symbol: '+' },
    sub: { name: '减法', symbol: '−' },
    mul: { name: '乘法', symbol: '×' },
    div: { name: '除法', symbol: '÷' },
    mixed: { name: '混合运算', symbol: '?' },
    compare: { name: '比大小', symbol: '?' },
    fill: { name: '填空题', symbol: '?' }
  },

  // 模式配置
  modes: {
    practice: { name: '开始练习', icon: '📝', timeLimit: 0, questions: 20 },
    challenge: { name: '60秒挑战', icon: '⚡', timeLimit: 60, questions: 999 },
    level: { name: '闯关模式', icon: '🏔️', timeLimit: 0, questionsPerLevel: 10, passRate: 0.8 },
    survival: { name: '生存模式', icon: '❤️', timeLimit: 0, lives: 3, maxLives: 5 },
    combo: { name: '连击模式', icon: '🔥', timeLimit: 120, questions: 999 },
    pk: { name: '双人PK', icon: '⚔️', timeLimit: 0, questionsPerPlayer: 10 },
    daily: { name: '每日挑战', icon: '📅', timeLimit: 0, questions: 10 },
    review: { name: '错题复习', icon: '📖', timeLimit: 0, questions: 0 }
  },

  // 连击倍数配置
  comboMultipliers: [
    { min: 0, mult: 1, label: '' },
    { min: 3, mult: 1.5, label: '3 COMBO!' },
    { min: 5, mult: 2, label: '5 COMBO!' },
    { min: 10, mult: 3, label: '10 COMBO!!' },
    { min: 20, mult: 5, label: '20 COMBO!!!' },
    { min: 30, mult: 10, label: 'SUPER COMBO!!!!' }
  ],

  // 评语
  excellent: ['太厉害了！满分！🏆', '你是数学天才！🌟', '完美答卷！💯', '无人能挡！👑'],
  great: ['非常棒！继续加油！👍', '快满分了！真厉害！🌟', '表现很好！🎉'],
  good: ['还不错，再练练会更好！💪', '继续努力，你可以的！📚', '加油，快要成为高手了！🔥'],
  ok: ['多多练习，会进步的！🌱', '失败是成功之母！💪', '看看错题本，查漏补缺！📖']
};

// 每日挑战种子（基于日期）
CONFIG.getDailySeed = function() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};
