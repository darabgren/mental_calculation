/**
 * 题目生成引擎
 */

const QuestionGenerator = {
  /**
   * 随机整数 [min, max]
   */
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * 随机小数 [min, max)，保留1位
   */
  randDecimal(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(1));
  },

  /**
   * 根据难度获取数字生成函数
   */
  getNumberGen(difficulty) {
    const diff = CONFIG.difficulties[difficulty];
    return function() {
      if (diff.allowDecimal && Math.random() < 0.2) {
        return this.randDecimal(diff.range.min, diff.range.max);
      }
      return this.randInt(diff.range.min, diff.range.max);
    }.bind(this);
  },

  /**
   * 生成加法题
   */
  genAdd(diff) {
    const max = diff.maxResult;
    let a, b;
    if (max <= 10) {
      a = this.randInt(0, max);
      b = this.randInt(0, max - a);
    } else if (max <= 20) {
      a = this.randInt(0, max);
      b = this.randInt(0, max - a);
    } else {
      a = this.randInt(0, max);
      b = this.randInt(0, max - a);
    }
    return {
      display: `${a} + ${b} = ?`,
      answer: a + b,
      type: 'add',
      a, b
    };
  },

  /**
   * 生成减法题
   */
  genSub(diff) {
    const max = diff.maxResult;
    let a, b;
    if (max <= 10) {
      a = this.randInt(0, max);
      b = this.randInt(0, a); // ensure a >= b
    } else if (max <= 20) {
      a = this.randInt(0, max);
      b = this.randInt(0, a);
    } else {
      a = this.randInt(0, max);
      b = this.randInt(0, a);
    }
    // 偶尔出结果为负数的题（高年级）
    if (diff.allowNegative && Math.random() < 0.15) {
      b = this.randInt(a, diff.range.max);
    }
    return {
      display: `${a} − ${b} = ?`,
      answer: a - b,
      type: 'sub',
      a, b
    };
  },

  /**
   * 生成乘法题
   */
  genMul(diff) {
    const [minM, maxM] = diff.mulRange || [1, 9];
    let a = this.randInt(minM, maxM);
    let b = this.randInt(minM, maxM);
    // 高年级可以是一两位数乘一位数
    if (diff.maxResult >= 200) {
      if (Math.random() < 0.3) {
        a = this.randInt(10, 99);
        b = this.randInt(2, 9);
      }
    }
    return {
      display: `${a} × ${b} = ?`,
      answer: a * b,
      type: 'mul',
      a, b
    };
  },

  /**
   * 生成除法题（保证整除）
   */
  genDiv(diff) {
    const [minM, maxM] = diff.mulRange || [1, 9];
    let b = this.randInt(minM, maxM);
    let q = this.randInt(minM, maxM);
    let a = b * q;
    // 高年级
    if (diff.maxResult >= 200 && Math.random() < 0.3) {
      b = this.randInt(2, 9);
      q = this.randInt(3, 20);
      a = b * q;
    }
    return {
      display: `${a} ÷ ${b} = ?`,
      answer: q,
      type: 'div',
      a, b
    };
  },

  /**
   * 生成比大小题
   */
  genCompare(diff) {
    const rng = this.getNumberGen(difficulty);
    // 生成两个表达式
    const ops = ['add', 'sub', 'mul'];
    if (diff.operations.includes('div')) ops.push('div');
    const op1 = ops[Math.floor(Math.random() * (Math.min(ops.length, 2)))];
    const op2 = ops[Math.floor(Math.random() * (Math.min(ops.length, 2)))];

    let result1, result2, disp1, disp2;
    if (op1 === 'add') {
      let a = rng(), b_ = rng();
      result1 = a + b_;
      disp1 = `${a}+${b_}`;
    } else if (op1 === 'sub') {
      let a = rng(), b_ = rng();
      if (a < b_) [a, b_] = [b_, a];
      result1 = a - b_;
      disp1 = `${a}−${b_}`;
    } else {
      let a = this.randInt(1, 9), b_ = this.randInt(1, 9);
      result1 = a * b_;
      disp1 = `${a}×${b_}`;
    }
    if (op2 === 'add') {
      let a = rng(), b_ = rng();
      result2 = a + b_;
      disp2 = `${a}+${b_}`;
    } else if (op2 === 'sub') {
      let a = rng(), b_ = rng();
      if (a < b_) [a, b_] = [b_, a];
      result2 = a - b_;
      disp2 = `${a}−${b_}`;
    } else {
      let a = this.randInt(1, 9), b_ = this.randInt(1, 9);
      result2 = a * b_;
      disp2 = `${a}×${b_}`;
    }

    // 确保两个结果不同
    if (result1 === result2) {
      result2 += this.randInt(1, 5);
    }

    const symbols = ['>', '<'];
    const correctSymbol = result1 > result2 ? '>' : '<';

    return {
      display: `${disp1} ___ ${disp2}`,
      question: `请选择正确的符号：`,
      extras: { symbols, correctSymbol },
      answer: correctSymbol,
      type: 'compare',
      result1, result2
    };
  },

  /**
   * 生成填空题
   */
  genFill(diff) {
    const rng = this.getNumberGen(difficulty);
    const ops = diff.operations.filter(o => o !== 'fill' && o !== 'compare' && o !== 'mixed');
    if (ops.length === 0) ops.push('add');
    const op = ops[Math.floor(Math.random() * ops.length)];

    // 随机决定隐藏哪个数
    const hidePosition = Math.random() < 0.5 ? 'left' : 'right';

    if (op === 'add') {
      let total = this.randInt(3, diff.maxResult);
      let known = this.randInt(1, total - 1);
      let hidden = total - known;
      let a, b;
      if (hidePosition === 'left') {
        a = hidden;
        b = known;
      } else {
        a = known;
        b = hidden;
      }
      return {
        display: hidePosition === 'left'
          ? `? + ${b} = ${a + b}`
          : `${a} + ? = ${a + b}`,
        answer: hidden,
        type: 'fill'
      };
    }
    if (op === 'sub') {
      let total = this.randInt(3, diff.maxResult);
      let part = this.randInt(1, total);
      if (hidePosition === 'left') {
        return {
          display: `? − ${part} = ${total - part}`,
          answer: total,
          type: 'fill'
        };
      } else {
        return {
          display: `${total} − ? = ${total - part}`,
          answer: part,
          type: 'fill'
        };
      }
    }
    if (op === 'mul') {
      let a = this.randInt(2, 9);
      let b = this.randInt(2, 9);
      let product = a * b;
      if (hidePosition === 'left') {
        return {
          display: `? × ${b} = ${product}`,
          answer: a,
          type: 'fill'
        };
      } else {
        return {
          display: `${a} × ? = ${product}`,
          answer: b,
          type: 'fill'
        };
      }
    }
    if (op === 'div') {
      let b = this.randInt(2, 9);
      let q = this.randInt(2, 9);
      let a = b * q;
      if (hidePosition === 'left') {
        return {
          display: `? ÷ ${b} = ${q}`,
          answer: a,
          type: 'fill'
        };
      } else {
        return {
          display: `${a} ÷ ? = ${q}`,
          answer: b,
          type: 'fill'
        };
      }
    }
    // fallback
    return this.genAdd(diff);
  },

  /**
   * 主生成函数
   * @param {string} difficulty - preschool | lower | middle | upper
   * @param {string} operation  - add | sub | mul | div | mixed | compare | fill
   * @returns {object} { display, answer, type, ... }
   */
  generate(difficulty, operation) {
    const diff = CONFIG.difficulties[difficulty];
    if (!diff) throw new Error(`Unknown difficulty: ${difficulty}`);

    // 如果不是混合运算，直接生成对应类型
    let op = operation;
    if (op === 'mixed') {
      const availOps = diff.operations.filter(o =>
        o !== 'mixed' && o !== 'compare' && o !== 'fill'
      );
      if (availOps.length === 0) availOps.push('add', 'sub', 'mul', 'div');
      op = availOps[Math.floor(Math.random() * availOps.length)];
    }

    switch (op) {
      case 'add': return this.genAdd(diff);
      case 'sub': return this.genSub(diff);
      case 'mul': return this.genMul(diff);
      case 'div': return this.genDiv(diff);
      case 'compare': return this.genCompare(diff);
      case 'fill': return this.genFill(diff);
      default: return this.genAdd(diff);
    }
  }
};
