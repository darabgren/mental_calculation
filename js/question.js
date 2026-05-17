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
  genCompare(diff, difficulty) {
    const rng = this.getNumberGen(difficulty);
    // 生成两个不同运算的表达式
    const ops = ['add', 'sub', 'mul'];
    if (diff.operations.includes('div')) ops.push('div');

    // 随机选两个运算（可以相同）
    const op1 = ops[Math.floor(Math.random() * ops.length)];
    const op2 = ops[Math.floor(Math.random() * ops.length)];

    const genOne = (op) => {
      let a, b, result, disp;
      if (op === 'add') {
        a = rng(); b = rng();
        result = a + b;
        disp = `${a} + ${b}`;
      } else if (op === 'sub') {
        a = rng(); b = rng();
        if (a < b) [a, b] = [b, a];
        result = a - b;
        disp = `${a} − ${b}`;
      } else if (op === 'mul') {
        a = this.randInt(1, diff.mulRange ? diff.mulRange[1] : 9);
        b = this.randInt(1, diff.mulRange ? diff.mulRange[1] : 9);
        result = a * b;
        disp = `${a} × ${b}`;
      } else { // div
        b = this.randInt(2, 9);
        const q = this.randInt(2, 9);
        a = b * q;
        result = q;
        disp = `${a} ÷ ${b}`;
      }
      return { result, disp };
    };

    let e1 = genOne(op1);
    let e2 = genOne(op2);

    // 确保两边结果不同且差距合理
    let attempts = 0;
    while (e1.result === e2.result && attempts < 10) {
      e2 = genOne(ops[Math.floor(Math.random() * ops.length)]);
      attempts++;
    }

    const correctSymbol = e1.result > e2.result ? '>' : '<';

    return {
      display: `${e1.disp} ___ ${e2.disp}`,
      answer: correctSymbol,
      type: 'compare',
      result1: e1.result,
      result2: e2.result
    };
  },

  /**
   * 生成填空题
   */
  genFill(diff, difficulty) {
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
      case 'compare': return this.genCompare(diff, difficulty);
      case 'fill': return this.genFill(diff, difficulty);
      default: return this.genAdd(diff);
    }
  }
};
