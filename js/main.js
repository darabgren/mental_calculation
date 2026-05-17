/**
 * 主入口 — 事件绑定、页面导航、游戏流程控制
 */
(function() {
  'use strict';

  // ==================== 初始化 ====================
  function init() {
    Sound.init();
    UI.init();
    initHomePage();
    initNavigation();
    initSetupScreen();
    initQuizScreen();
    initPKQuizScreen();
    initResultScreen();
    initPKResultScreen();
    initErrorBook();
    initSettings();
    initNumpad();
    initPKNumpad();
    updateStreakDisplay();
  }

  // ==================== 首页 ====================
  function initHomePage() {
    // 模式选择按钮
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        Sound.click();
        const mode = this.dataset.mode;

        if (mode === 'review') {
          // 错题复习直接开始，不需要设置
          const errors = Storage.getUnmasteredErrors();
          if (errors.length === 0) {
            alert('🎉 暂无错题！继续加油哦！');
            return;
          }
          Game.init('review', 'lower', 'mixed');
          startQuiz();
          return;
        }

        if (mode === 'pk') {
          showScreen('pk-ready');
          return;
        }

        // 其他模式：显示设置页
        document.getElementById('setup-title').textContent =
          CONFIG.modes[mode].name || '开始练习';
        document.getElementById('screen-setup').dataset.mode = mode;

        // 根据模式调整设置项显示
        const countSection = document.getElementById('count-section');
        if (mode === 'challenge' || mode === 'combo' || mode === 'survival') {
          countSection.style.display = 'none';
        } else {
          countSection.style.display = '';
        }
        // 闯关模式只在第一关显示数量，简化处理
        if (mode === 'level') {
          countSection.style.display = 'none';
        }

        showScreen('setup');
      });
    });

    // 设置按钮
    document.getElementById('btn-settings').addEventListener('click', () => {
      Sound.click();
      showScreen('settings');
    });

    // 错题本按钮
    document.getElementById('btn-errorbook').addEventListener('click', () => {
      Sound.click();
      showErrorBook();
    });
  }

  // ==================== 导航 ====================
  function initNavigation() {
    // 返回按钮
    document.querySelectorAll('.back-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        Sound.click();
        const target = this.dataset.target;
        showScreen(target);
      });
    });

    // 退出答题按钮
    document.getElementById('btn-quit').addEventListener('click', () => {
      if (confirm('确定要退出当前练习吗？')) {
        Game.stopTimer();
        showScreen('home');
      }
    });
  }

  function showScreen(name) {
    UI.showScreen(name);
    if (name === 'home') updateStreakDisplay();
  }

  // ==================== 设置页（模式配置） ====================
  function initSetupScreen() {
    // Chip 选择
    document.querySelectorAll('.chip-group').forEach(group => {
      group.addEventListener('click', function(e) {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        Sound.click();
        this.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });

    // 开始答题按钮
    document.getElementById('btn-start-game').addEventListener('click', () => {
      Sound.start();
      const setupEl = document.getElementById('screen-setup');
      const mode = setupEl.dataset.mode || 'practice';
      const difficulty = document.querySelector('#difficulty-group .chip.active')?.dataset?.diff || 'preschool';
      const operation = document.querySelector('#operation-group .chip.active')?.dataset?.op || 'add';

      Game.init(mode, difficulty, operation);
      startQuiz();
    });

    // PK 开始按钮
    document.getElementById('btn-start-pk').addEventListener('click', () => {
      Sound.start();
      const difficulty = document.querySelector('#pk-difficulty-group .chip.active')?.dataset?.diff || 'preschool';
      Game.init('pk', difficulty, 'mixed');
      startPKQuiz();
    });
  }

  // ==================== 答题页 ====================
  function initQuizScreen() {
    const numpad = document.getElementById('numpad');
    if (numpad) {
      numpad.addEventListener('click', function(e) {
        const btn = e.target.closest('.numpad-btn');
        if (!btn) return;
        handleNumpadKey(btn.dataset.key);
      });
    }

    // 物理键盘支持
    document.addEventListener('keydown', function(e) {
      if (UI.currentScreen !== 'quiz') return;
      if (e.key >= '0' && e.key <= '9') {
        handleNumpadKey(e.key);
      } else if (e.key === 'Backspace') {
        handleNumpadKey('back');
      } else if (e.key === 'Enter') {
        handleNumpadKey('ok');
      } else if (e.key === '-' || e.key === '−') {
        handleNumpadKey('-');
      } else if (e.key === '.') {
        handleNumpadKey('.');
      } else if (e.key === '>') {
        handleNumpadKey('>');
      } else if (e.key === '<') {
        handleNumpadKey('<');
      }
    });
  }

  function handleNumpadKey(key) {
    Sound.click();

    if (key === 'back') {
      Game.currentInput = Game.currentInput.slice(0, -1);
    } else if (key === 'ok') {
      submitCurrentAnswer();
      return;
    } else if (Game.isCompareQuestion) {
      Game.currentInput = key;
    } else {
      // 限制输入长度
      if (Game.currentInput.length >= 8) return;
      // 允许负号仅在开头
      if (key === '-' || key === '−') {
        if (Game.currentInput.length === 0 || Game.currentInput === '-') {
          Game.currentInput = Game.currentInput === '-' ? '' : '-';
        }
        updateAnswerDisplay();
        return;
      }
      // 小数点
      if (key === '.' && Game.currentInput.includes('.')) return;
      Game.currentInput += key;
    }

    updateAnswerDisplay();
  }

  function updateAnswerDisplay() {
    const display = document.getElementById('answer-value');
    const cursor = document.getElementById('answer-cursor');
    if (display) {
      display.textContent = Game.currentInput || '';
    }
    if (cursor) {
      cursor.style.display = Game.currentInput ? 'none' : 'inline';
    }
  }

  function submitCurrentAnswer() {
    if (!Game.currentInput && Game.currentInput !== '0') return;
    if (Game.state.finished) return;

    const result = Game.submitAnswer(Game.currentInput);
    if (!result) return;

    Sound[result.correct ? 'correct' : 'wrong']();
    UI.vibrate(result.correct ? 30 : [50, 50, 50]);

    // 反馈动画
    UI.showFeedback(
      result.correct,
      result.answer,
      document.getElementById('feedback-pop')
    );

    // 连击动画
    if (result.correct && Game.state.combo >= 3) {
      setTimeout(() => {
        Sound.combo(Game.state.combo);
        UI.showCombo(Game.state.combo);
      }, 400);
    }

    // 更新 UI
    updateQuizUI(result);

    // 延迟移动到下一题
    setTimeout(() => {
      Game.currentInput = '';
      updateAnswerDisplay();

      const next = Game.nextQuestion();
      if (next.finished) {
        endQuiz(next.reason);
      } else {
        if (next.levelUp) {
          Sound.levelUp();
          showLevelUpToast(next.level);
        }
        showCurrentQuestion();
        updateQuizUI();
        updateAnswerDisplay();
      }
    }, 700);
  }

  function startQuiz() {
    Game.currentInput = '';
    UI.hide('result-wrong-section');
    document.getElementById('feedback-pop').classList.remove('feedback-show');

    if (Game.state.mode === 'review' && Game.state.totalQuestions === 0) {
      alert('🎉 没有待复习的错题！');
      showScreen('home');
      return;
    }

    showScreen('quiz');

    // 设置 UI
    const s = Game.state;
    document.getElementById('quiz-hearts').style.display = s.mode === 'survival' ? '' : 'none';
    document.getElementById('quiz-combo').style.display = '';

    if (s.mode === 'survival') {
      updateHeartsDisplay();
    }

    // 初始化显示
    UI.updateProgress(0, 0, document.getElementById('progress-bar'));

    showCurrentQuestion();
    updateQuizUI();
    updateAnswerDisplay();

    // 启动计时器
    Game.startTimer(function(event) {
      if (event === 'tick') {
        updateTimerDisplay();
      } else if (event === 'timeout') {
        endQuiz('时间到！');
      }
    });

    updateTimerDisplay();
  }

  function showCurrentQuestion() {
    const q = Game.getQuestionSafe();
    if (!q) return;

    const qText = document.getElementById('question-text');
    if (qText) {
      qText.textContent = q.display;

      // 比大小特殊处理
      if (q.type === 'compare') {
        Game.isCompareQuestion = true;
        Game.compareOptions = q.extras?.symbols || ['>', '<'];
      } else {
        Game.isCompareQuestion = false;
        Game.compareOptions = [];
      }
    }
  }

  function updateQuizUI(result) {
    const s = Game.state;
    const q = Game.getCurrentQuestion();

    // 进度
    if (s.mode === 'level') {
      UI.setText('quiz-progress', `${s.levelCorrect}/${s.perLevelQuestions} (第${s.level}关)`);
    } else if (s.mode === 'survival' || s.mode === 'challenge' || s.mode === 'combo') {
      UI.setText('quiz-progress', `已答 ${s.correctCount + s.wrongCount} 题`);
    } else {
      UI.setText('quiz-progress', `${s.currentIndex + 1}/${s.totalQuestions}`);
    }

    // 分数
    UI.setText('quiz-score-small', `${s.score}分`);

    // 连击
    if (s.combo >= 3) {
      UI.setText('quiz-combo', `🔥 ${s.combo}连击 x${s.comboMultiplier}`);
      UI.show('quiz-combo');
    } else {
      UI.hide('quiz-combo');
    }

    // 生存模式爱心
    if (s.mode === 'survival') {
      updateHeartsDisplay();
    }

    // 进度条
    updateProgressBar();
  }

  function updateHeartsDisplay() {
    const s = Game.state;
    const heartsEl = document.getElementById('quiz-hearts');
    if (!heartsEl) return;
    let html = '';
    for (let i = 0; i < s.maxLives; i++) {
      html += i < s.lives ? '❤️' : '🖤';
    }
    heartsEl.textContent = html;
  }

  function updateProgressBar() {
    const s = Game.state;
    let percent = 0;
    if (s.mode === 'level') {
      percent = (s.currentIndex / s.perLevelQuestions) * 100;
    } else if (s.totalQuestions > 0 && s.totalQuestions < 999) {
      percent = ((s.correctCount + s.wrongCount) / s.totalQuestions) * 100;
    } else {
      // 无限模式不显示或显示已答题进度
      percent = 0;
    }
    UI.updateProgress(0, 0);
    document.getElementById('progress-bar').style.width = percent + '%';
  }

  function updateTimerDisplay() {
    const s = Game.state;
    const remaining = Game.getTimeRemaining();
    if (remaining === Infinity) {
      // 正计时
      UI.setText('quiz-timer', '⏱ ' + Game.formatTime(s.timeElapsed));
    } else {
      // 倒计时
      UI.setText('quiz-timer', '⏱ ' + Game.formatTime(remaining));
      // 最后10秒闪烁
      const timerEl = document.getElementById('quiz-timer');
      if (timerEl && remaining <= 10) {
        timerEl.style.color = remaining % 2 === 0 ? '#F44336' : '#FF9800';
      }
    }
  }

  function showLevelUpToast(level) {
    // 简单弹窗提示
    const toast = document.createElement('div');
    toast.className = 'level-up-toast';
    toast.innerHTML = `<span>🎉</span> 进入第 <strong>${level}</strong> 关！`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  // ==================== PK 答题 ====================
  function startPKQuiz() {
    Game.currentInput = '';
    showScreen('pk-quiz');
    showPKQuestion();
    updatePKUI();
    updatePKAnswerDisplay();
  }

  function initPKQuizScreen() {
    const numpad = document.getElementById('pk-numpad');
    if (numpad) {
      numpad.addEventListener('click', function(e) {
        const btn = e.target.closest('.numpad-btn');
        if (!btn) return;
        handlePKNumpadKey(btn.dataset.key);
      });
    }
  }

  function handlePKNumpadKey(key) {
    Sound.click();
    if (key === 'back') {
      Game.currentInput = Game.currentInput.slice(0, -1);
    } else if (key === 'ok') {
      submitPKAnswer();
      return;
    } else if (key === '-' || key === '−') {
      if (Game.currentInput.length === 0 || Game.currentInput === '-') {
        Game.currentInput = Game.currentInput === '-' ? '' : '-';
      }
      updatePKAnswerDisplay();
      return;
    } else if (key === '.' && Game.currentInput.includes('.')) {
      return;
    } else if (Game.currentInput.length < 8) {
      Game.currentInput += key;
    }
    updatePKAnswerDisplay();
  }

  function updatePKAnswerDisplay() {
    const display = document.getElementById('pk-answer-value');
    if (display) display.textContent = Game.currentInput || '';
  }

  function submitPKAnswer() {
    if (!Game.currentInput && Game.currentInput !== '0') return;
    if (Game.state.finished) return;

    const result = Game.submitAnswer(Game.currentInput);
    if (!result) return;

    Sound[result.correct ? 'correct' : 'wrong']();
    UI.vibrate(result.correct ? 30 : [50, 50, 50]);

    // 显示反馈
    UI.showFeedback(
      result.correct,
      result.answer,
      document.getElementById('pk-feedback-pop')
    );

    if (result.correct && Game.state.combo >= 5) {
      setTimeout(() => UI.showCombo(Game.state.combo), 400);
    }

    updatePKUI();

    // 延迟切换
    setTimeout(() => {
      Game.currentInput = '';
      updatePKAnswerDisplay();

      // 切换玩家
      Game.state.player = Game.state.player === 1 ? 2 : 1;

      const next = Game.nextQuestion();
      if (next.finished) {
        endPKQuiz();
      } else {
        showPKQuestion();
        updatePKUI();
        updatePKAnswerDisplay();
      }
    }, 700);
  }

  function showPKQuestion() {
    const q = Game.getCurrentQuestion();
    if (!q) return;
    document.getElementById('pk-question-text').textContent = q.display;
    Game.isCompareQuestion = false;

    // 更新当前玩家指示器
    const indicator = document.getElementById('pk-current-player');
    if (indicator) {
      if (Game.state.player === 1) {
        indicator.innerHTML = '<span class="pk-avatar-small">🦊</span><span>玩家一 答题中</span>';
        indicator.style.background = '#FFE0B2';
      } else {
        indicator.innerHTML = '<span class="pk-avatar-small">🐻</span><span>玩家二 答题中</span>';
        indicator.style.background = '#BBDEFB';
      }
    }
  }

  function updatePKUI() {
    const s = Game.state;
    document.getElementById('pk-score-p1').textContent = s.pkScore[0];
    document.getElementById('pk-score-p2').textContent = s.pkScore[1];
  }

  function endPKQuiz() {
    Game.stopTimer();
    const s = Game.state;
    showScreen('pk-result');

    // 使用 per-player 统计数据
    const p1Correct = s.pkCorrect[0];
    const p2Correct = s.pkCorrect[1];
    const p1Wrong = s.pkWrong[0];
    const p2Wrong = s.pkWrong[1];
    const p1Total = p1Correct + p1Wrong;
    const p2Total = p2Correct + p2Wrong;
    const p1Score = s.pkScore[0];
    const p2Score = s.pkScore[1];

    document.getElementById('pk-result-score-p1').textContent = `${p1Score}分 (对${p1Correct}/共${p1Total})`;
    document.getElementById('pk-result-score-p2').textContent = `${p2Score}分 (对${p2Correct}/共${p2Total})`;

    const winnerBanner = document.getElementById('pk-winner-banner');
    if (p1Correct > p2Correct) {
      winnerBanner.textContent = '🦊 玩家一 获胜！🏆';
      winnerBanner.className = 'pk-winner-banner winner-p1';
    } else if (p2Correct > p1Correct) {
      winnerBanner.textContent = '🐻 玩家二 获胜！🏆';
      winnerBanner.className = 'pk-winner-banner winner-p2';
    } else {
      winnerBanner.textContent = '🤝 平局！都很厉害！';
      winnerBanner.className = 'pk-winner-banner winner-draw';
    }

    Sound.gameOver();
  }

  // PK 结算页按钮
  function initPKResultScreen() {
    document.getElementById('btn-pk-retry').addEventListener('click', () => {
      Sound.start();
      const difficulty = document.querySelector('#pk-difficulty-group .chip.active')?.dataset?.diff || 'preschool';
      Game.init('pk', difficulty, 'mixed');
      startPKQuiz();
    });
    document.getElementById('btn-pk-home').addEventListener('click', () => showScreen('home'));
  }

  // ==================== 结算页 ====================
  function endQuiz(reason) {
    Game.stopTimer();
    const stats = Game.getStats();
    Sound.gameOver();

    // 保存记录
    Storage.saveRecord({
      mode: stats.mode,
      difficulty: stats.difficulty,
      operation: stats.operation,
      score: stats.score,
      correct: stats.correct,
      wrong: stats.wrong,
      total: stats.total,
      accuracy: stats.accuracy,
      timeElapsed: stats.timeElapsed,
      maxCombo: stats.maxCombo,
      level: stats.level
    });

    // 打卡
    Storage.checkIn();

    // 显示结算
    showScreen('result');
    showResult(stats, reason);
  }

  function initResultScreen() {
    document.getElementById('btn-retry').addEventListener('click', () => {
      Sound.start();
      const mode = Game.state.mode;
      const diff = Game.state.difficulty;
      const op = Game.state.operation;
      Game.init(mode, diff, op);
      startQuiz();
    });

    document.getElementById('btn-result-home').addEventListener('click', () => {
      showScreen('home');
    });
  }

  function showResult(stats, reason) {
    // 图标和标题
    const accuracy = stats.accuracy;
    let icon, title;
    if (accuracy >= 1) {
      icon = '🏆';
      title = '完美！满分！';
    } else if (accuracy >= 0.9) {
      icon = '🎉';
      title = '太棒了！';
    } else if (accuracy >= 0.7) {
      icon = '👍';
      title = '不错哦！';
    } else {
      icon = '💪';
      title = '继续加油！';
    }

    document.getElementById('result-icon').textContent = icon;
    document.getElementById('result-title').textContent =
      reason ? `${title} (${reason})` : title;

    // 分数
    document.getElementById('result-score').textContent = stats.score;

    // 统计
    document.getElementById('result-stats').innerHTML = `
      <div class="stat-item">
        <span class="stat-value">✅ ${stats.correct}</span>
        <span class="stat-label">答对</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">❌ ${stats.wrong}</span>
        <span class="stat-label">答错</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${Math.round(accuracy * 100)}%</span>
        <span class="stat-label">正确率</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">⏱ ${Game.formatTime(stats.timeElapsed)}</span>
        <span class="stat-label">用时</span>
      </div>
      ${stats.maxCombo >= 3 ? `
      <div class="stat-item">
        <span class="stat-value">🔥 ${stats.maxCombo}</span>
        <span class="stat-label">最高连击</span>
      </div>
      ` : ''}
      ${stats.level > 1 ? `
      <div class="stat-item">
        <span class="stat-value">🏔️ 第${stats.level}关</span>
        <span class="stat-label">闯关进度</span>
      </div>
      ` : ''}
    `;

    // 星星
    UI.renderStars(accuracy);

    // 错题回顾
    const wrongSection = document.getElementById('result-wrong-section');
    const wrongList = document.getElementById('wrong-list');
    if (stats.wrong > 0) {
      wrongSection.style.display = '';
      // 获取最近的错题
      const errors = Storage.getErrors().slice(0, stats.wrong);
      wrongList.innerHTML = errors.map(e =>
        `<div class="wrong-item">
          <span class="wrong-question">${e.question}</span>
          <span class="wrong-info">
            <span class="wrong-user">你的答案: <strong>${e.userAnswer}</strong></span>
            <span class="wrong-answer">正确答案: <strong>${e.answer}</strong></span>
          </span>
        </div>`
      ).join('');
    } else {
      wrongSection.style.display = 'none';
    }
  }

  // ==================== 错题本 ====================
  function showErrorBook() {
    const errors = Storage.getUnmasteredErrors();
    document.getElementById('errorbook-stats').textContent =
      `共 ${errors.length} 道未掌握的错题`;

    const listEl = document.getElementById('errorbook-list');
    const actionsEl = document.getElementById('errorbook-actions');

    if (errors.length === 0) {
      listEl.innerHTML = '<p class="empty-hint">🎉 暂无错题，继续加油！</p>';
      actionsEl.style.display = 'none';
    } else {
      listEl.innerHTML = errors.slice(0, 50).map(e =>
        `<div class="wrong-item">
          <span class="wrong-question">${e.question}</span>
          <span class="wrong-info">
            <span class="wrong-user">你的答案: <strong>${e.userAnswer}</strong></span>
            <span class="wrong-answer">正确答案: <strong>${e.answer}</strong></span>
          </span>
          <span class="wrong-meta">复习次数: ${e.reviewCount || 0}/3</span>
        </div>`
      ).join('');
      actionsEl.style.display = '';
    }

    showScreen('errorbook');
  }

  function initErrorBook() {
    document.getElementById('btn-review-errors').addEventListener('click', () => {
      Sound.start();
      const errors = Storage.getUnmasteredErrors();
      if (errors.length === 0) {
        alert('🎉 没有需要复习的错题！');
        return;
      }
      Game.init('review', 'lower', 'mixed');
      startQuiz();
    });

    document.getElementById('btn-clear-errors').addEventListener('click', () => {
      if (confirm('确定要清空所有错题记录吗？')) {
        Storage.clearErrors();
        showErrorBook();
      }
    });
  }

  // ==================== 设置页 ====================
  function initSettings() {
    // 加载设置状态
    const settings = Storage.getSettings();
    document.getElementById('setting-sound').checked = settings.sound !== false;
    document.getElementById('setting-vibrate').checked = settings.vibrate !== false;
    document.getElementById('setting-animation').checked = settings.animation !== false;

    // 绑定事件
    document.getElementById('setting-sound').addEventListener('change', function() {
      Sound.setEnabled(this.checked);
    });

    document.getElementById('setting-vibrate').addEventListener('change', function() {
      Storage.saveSetting('vibrate', this.checked);
    });

    document.getElementById('setting-animation').addEventListener('change', function() {
      UI.setAnimation(this.checked);
    });

    document.getElementById('btn-reset-all').addEventListener('click', () => {
      if (confirm('确定要清除所有数据吗？包括成绩记录、错题本、打卡记录等。此操作不可撤销！')) {
        Storage.resetAll();
        alert('所有数据已清除。');
        showScreen('home');
        updateStreakDisplay();
        showErrorBook();
      }
    });
  }

  // ==================== 数字键盘初始化 ====================
  function initNumpad() {
    // Already handled in initQuizScreen
  }

  function initPKNumpad() {
    // Already handled in initPKQuizScreen
  }

  // ==================== 辅助功能 ====================
  function updateStreakDisplay() {
    const streak = Storage.getStreak();
    document.getElementById('streak-days').textContent = streak;
    if (streak > 0) {
      document.getElementById('home-streak').style.display = '';
    } else {
      document.getElementById('home-streak').style.display = 'none';
    }
  }

  // ==================== 启动应用 ====================
  document.addEventListener('DOMContentLoaded', init);

  // 处理触摸设备上的音频上下文解锁
  document.addEventListener('touchstart', function() {
    Sound.resume();
  }, { once: true });

  document.addEventListener('click', function() {
    Sound.resume();
  }, { once: true });

})();
