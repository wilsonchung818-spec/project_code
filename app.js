(function () {
  'use strict';

  const APP_VERSION = '1.0.4';
  const STORAGE_KEY = 'ba-speaking-trainer:v1';
  const view = document.querySelector('#app-view');
  const toast = document.querySelector('#toast');
  const importInput = document.querySelector('#import-input');
  const installButton = document.querySelector('#install-button');
  const offlinePill = document.querySelector('#offline-pill');
  const utils = window.BAUtils;

  let lessonData = null;
  let state = loadState();
  let currentView = new URLSearchParams(location.search).get('view') || 'today';
  let selectedLessonDay = null;
  let deferredInstallPrompt = null;
  let session = null;
  let tickHandle = null;
  let lastTick = 0;

  function loadState() {
    try {
      return utils.migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    } catch (error) {
      return utils.defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getLesson(day) {
    return lessonData.lessons.find(lesson => lesson.day === Number(day));
  }

  function getSentences(lesson) {
    return lesson.sections.flatMap(section => section.sentences);
  }

  function getProgress(day) {
    const key = String(day);
    if (!state.progress[key]) {
      state.progress[key] = {
        practiced: [],
        speakingSeconds: 0,
        reviewPoints: 0,
        realWorkHits: 0,
        trainingSeconds: 0,
        score: 0
      };
    }
    return state.progress[key];
  }

  function completedEntries() {
    return Object.entries(state.progress)
      .map(([day, item]) => ({ day: Number(day), ...item }))
      .filter(item => item.score >= utils.COMPLETION_SCORE && item.completedDate)
      .sort((a, b) => b.completedDate.localeCompare(a.completedDate) || b.day - a.day);
  }

  function lessonDayForToday() {
    const today = utils.localDateKey();
    const completedToday = completedEntries().filter(item => item.completedDate === today);
    if (completedToday.length) return Math.max(...completedToday.map(item => item.day));
    const firstIncomplete = lessonData.lessons.find(lesson => (state.progress[String(lesson.day)]?.score || 0) < utils.COMPLETION_SCORE);
    return firstIncomplete ? firstIncomplete.day : lessonData.lessons.length;
  }

  function isCompletedToday(day) {
    const item = state.progress[String(day)];
    return Boolean(item && item.score >= utils.COMPLETION_SCORE && item.completedDate === utils.localDateKey());
  }

  function formatDuration(seconds, compact = false) {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    if (hours) return compact ? `${hours}h ${minutes}m` : `${hours}h ${minutes}m`;
    if (minutes) return compact ? `${minutes}m` : `${minutes}m ${String(secs).padStart(2, '0')}s`;
    return `${secs}s`;
  }

  function timerText(seconds) {
    const minutes = Math.floor(seconds / 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }

  function setView(name, options = {}) {
    stopTicking();
    if (name !== 'training') session = null;
    currentView = name;
    selectedLessonDay = options.day || null;
    syncNavigation();
    const url = new URL(location.href);
    url.searchParams.set('view', ['today', 'progress', 'library', 'settings'].includes(name) ? name : 'today');
    history.replaceState(null, '', url);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function syncNavigation() {
    const activeView = currentView === 'review' ? 'library' : currentView === 'training' ? 'today' : currentView;
    document.querySelectorAll('.nav-item').forEach(button => {
      const active = button.dataset.nav === activeView;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }

  function render() {
    if (!lessonData) return;
    syncNavigation();
    const renderers = {
      today: renderToday,
      progress: renderProgress,
      library: renderLibrary,
      settings: renderSettings,
      review: renderLessonReview,
      training: renderTraining
    };
    (renderers[currentView] || renderToday)();
  }

  function logicMarkup(items) {
    return `<ul class="logic-flow">${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  }

  function renderToday() {
    const day = lessonDayForToday();
    const lesson = getLesson(day);
    const item = state.progress[String(day)] || {};
    const streak = utils.calculateStreak(state.progress);
    const doneToday = isCompletedToday(day);
    const sentenceCount = getSentences(lesson).length;
    view.innerHTML = `
      <section class="today-intro">
        <p class="eyebrow">Day ${String(day).padStart(2, '0')} · ${escapeHtml(lesson.scenario)}</p>
        <h1 class="topic">${escapeHtml(lesson.topic)}</h1>
        <p class="scenario">${doneToday ? 'Today’s session is complete. Your next lesson opens tomorrow.' : 'A focused practice for your next meeting.'}</p>
        <p class="streak-line"><span class="flame" aria-hidden="true">◆</span> ${streak} Day Streak</p>
      </section>
      <section class="score-stage">
        <div class="score-layout">
          <div class="score-ring" style="--score:${item.score || 0}" aria-label="Today’s score ${item.score || 0} out of 100">
            <div class="score-value"><strong>${item.score || 0}</strong><span>out of 100</span></div>
          </div>
          <div class="score-copy">
            <p class="eyebrow">Today’s score</p>
            <h2>${doneToday ? 'Strong session.' : 'Ready when you are.'}</h2>
            <p>${doneToday ? `${formatDuration(item.trainingSeconds)} of focused training logged.` : `${sentenceCount} expressions · ${lesson.speakingChallenge.targetSeconds}s speaking target`}</p>
            <button class="primary-button is-light" type="button" data-action="${doneToday ? 'show-result' : 'start-training'}">${doneToday ? 'View Result' : item.practiced?.length ? 'Continue Training' : 'Start Training'}</button>
          </div>
        </div>
      </section>
      <div class="section-heading"><h2>Speaking logic</h2><span>10–15 min</span></div>
      ${logicMarkup(lesson.speakingLogic)}
      <div class="session-meta"><span>${sentenceCount} core sentences</span><span>${escapeHtml(lesson.level || 'Senior workplace')}</span></div>
    `;
  }

  function startTraining() {
    const day = lessonDayForToday();
    const lesson = getLesson(day);
    const progress = getProgress(day);
    const sentences = getSentences(lesson);
    const firstIncomplete = sentences.findIndex(sentence => !progress.practiced.includes(sentence.id));
    session = {
      day,
      phase: firstIncomplete === -1 ? 'challenge' : 'practice',
      sentenceIndex: Math.max(0, firstIncomplete),
      active: true,
      speakingRunning: false,
      speakingSeconds: progress.speakingSeconds || 0,
      reviewPrompts: [],
      reviewAnswers: []
    };
    currentView = 'training';
    renderTraining();
    startTicking();
  }

  function startTicking() {
    stopTicking();
    lastTick = Date.now();
    tickHandle = setInterval(tick, 250);
  }

  function stopTicking() {
    clearInterval(tickHandle);
    tickHandle = null;
  }

  function tick() {
    if (!session || !session.active || document.hidden) {
      lastTick = Date.now();
      return;
    }
    const now = Date.now();
    if (now - lastTick < 1000) return;
    const seconds = Math.min(2, Math.floor((now - lastTick) / 1000));
    lastTick += seconds * 1000;
    const progress = getProgress(session.day);
    const todayKey = utils.localDateKey();
    progress.trainingSeconds = (progress.trainingSeconds || 0) + seconds;
    state.stats.totalTrainingSeconds = (state.stats.totalTrainingSeconds || 0) + seconds;
    state.stats.trainingByDate[todayKey] = (state.stats.trainingByDate[todayKey] || 0) + seconds;
    if (session.speakingRunning) {
      session.speakingSeconds += seconds;
      progress.speakingSeconds = Math.max(progress.speakingSeconds || 0, session.speakingSeconds);
    }
    saveState();
    updateLiveTimers(progress);
  }

  function updateLiveTimers(progress) {
    const sessionClock = document.querySelector('#session-clock');
    if (sessionClock) sessionClock.textContent = formatDuration(progress.trainingSeconds);
    const challengeClock = document.querySelector('#challenge-clock');
    if (challengeClock) challengeClock.textContent = timerText(session.speakingSeconds);
    const orbit = document.querySelector('.challenge-orbit');
    if (orbit) orbit.style.setProperty('--timer-progress', `${Math.min(100, session.speakingSeconds / getLesson(session.day).speakingChallenge.targetSeconds * 100)}%`);
    const finishButton = document.querySelector('[data-action="stop-speaking"]');
    if (finishButton && session.speakingSeconds > 0) finishButton.disabled = false;
  }

  function renderTraining() {
    if (!session) return setView('today');
    const lesson = getLesson(session.day);
    const progress = getProgress(session.day);
    if (session.phase === 'practice') renderPractice(lesson, progress);
    if (session.phase === 'challenge') renderChallenge(lesson, progress);
    if (session.phase === 'review') renderRecallReview(lesson, progress);
    if (session.phase === 'realwork') renderRealWork(lesson, progress);
    if (session.phase === 'complete') renderCompletion(lesson, progress);
  }

  function trainingHeader(lesson, current, total, label = 'Sentence practice') {
    const percent = total ? current / total * 100 : 100;
    return `
      <header class="training-head">
        <div class="training-topline">
          <button class="back-button" type="button" data-action="exit-training">← Exit</button>
          <span id="session-clock" class="session-clock">${formatDuration(getProgress(lesson.day).trainingSeconds)}</span>
        </div>
        <div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:${percent}%"></div></div>
        <div class="progress-label"><span>${label}</span><span>${current} / ${total}</span></div>
      </header>`;
  }

  function renderPractice(lesson, progress) {
    const sentences = getSentences(lesson);
    const sentence = sentences[session.sentenceIndex];
    view.innerHTML = `
      ${trainingHeader(lesson, session.sentenceIndex + 1, sentences.length)}
      <article class="sentence-panel" key="${escapeHtml(sentence.id)}">
        <span class="sentence-id">${escapeHtml(sentence.id)}</span>
        <p class="sentence-text">${escapeHtml(sentence.text)}</p>
        <div class="pattern-block"><span>Sentence pattern</span><p>${escapeHtml(sentence.pattern)}</p></div>
        <div class="examples-block"><span>In context</span>${sentence.examples.map(example => `<p>${escapeHtml(example)}</p>`).join('')}</div>
        <button class="primary-button button-block" type="button" data-action="practice-sentence">Mark as Practiced</button>
      </article>`;
  }

  function markSentencePracticed() {
    const lesson = getLesson(session.day);
    const sentences = getSentences(lesson);
    const progress = getProgress(session.day);
    const sentence = sentences[session.sentenceIndex];
    if (!progress.practiced.includes(sentence.id)) progress.practiced.push(sentence.id);
    saveState();
    if (session.sentenceIndex < sentences.length - 1) session.sentenceIndex += 1;
    else session.phase = 'challenge';
    renderTraining();
  }

  function renderChallenge(lesson, progress) {
    const target = lesson.speakingChallenge.targetSeconds;
    const best = progress.speakingSeconds || 0;
    view.innerHTML = `
      ${trainingHeader(lesson, getSentences(lesson).length, getSentences(lesson).length, 'Speaking challenge')}
      <section class="challenge">
        <p class="eyebrow">Speaking challenge</p>
        <h1>Look up. Speak freely.</h1>
        <p class="challenge-instruction">${escapeHtml(lesson.speakingChallenge.instruction)}</p>
        ${best ? `<span class="record-chip">Current best · ${best}s</span>` : ''}
        <div class="challenge-orbit" style="--timer-progress:${Math.min(100, session.speakingSeconds / target * 100)}%">
          <div class="timer-content"><strong id="challenge-clock">${timerText(session.speakingSeconds)}</strong><span>${target} second target</span></div>
        </div>
        <div class="button-row">
          <button class="secondary-button" type="button" data-action="toggle-speaking">${session.speakingRunning ? 'Pause' : session.speakingSeconds ? 'Resume' : 'Start'}</button>
          <button class="primary-button" type="button" data-action="stop-speaking" ${session.speakingSeconds ? '' : 'disabled'}>Finish</button>
        </div>
        ${session.speakingSeconds ? '<button class="back-button" type="button" data-action="reset-speaking">Try again</button>' : ''}
      </section>`;
  }

  function toggleSpeaking() {
    session.speakingRunning = !session.speakingRunning;
    lastTick = Date.now();
    renderTraining();
  }

  function resetSpeaking() {
    session.speakingRunning = false;
    session.speakingSeconds = 0;
    renderTraining();
  }

  function buildReviewPrompts(day) {
    const priorPatterns = lessonData.lessons
      .filter(lesson => lesson.day < day && state.progress[String(lesson.day)]?.practiced?.length)
      .flatMap(lesson => getSentences(lesson).map(sentence => ({ day: lesson.day, topic: lesson.topic, pattern: sentence.pattern })));
    if (!priorPatterns.length) return [];
    const offset = day % priorPatterns.length;
    return [priorPatterns[offset], priorPatterns[(offset + Math.max(1, Math.floor(priorPatterns.length / 2))) % priorPatterns.length]]
      .filter((item, index, list) => list.findIndex(other => other.pattern === item.pattern) === index)
      .slice(0, 2);
  }

  function finishSpeaking() {
    session.speakingRunning = false;
    const progress = getProgress(session.day);
    progress.speakingSeconds = Math.max(progress.speakingSeconds || 0, session.speakingSeconds);
    session.reviewPrompts = buildReviewPrompts(session.day);
    session.reviewAnswers = new Array(session.reviewPrompts.length).fill(null);
    if (!session.reviewPrompts.length) {
      progress.reviewPoints = 20;
      session.phase = 'realwork';
      showToast('First-day review credit: +20');
    } else {
      session.phase = 'review';
    }
    saveState();
    renderTraining();
  }

  function renderRecallReview(lesson, progress) {
    const prompts = session.reviewPrompts;
    const answered = session.reviewAnswers.filter(answer => answer !== null).length;
    view.innerHTML = `
      ${trainingHeader(lesson, answered, prompts.length, 'Memory check')}
      <p class="eyebrow">Quick review</p>
      <h1>Can you recall it?</h1>
      <p class="page-subtitle">Say each pattern aloud, then confirm honestly.</p>
      <div>${prompts.map((prompt, index) => `
        <article class="review-prompt">
          <span class="micro">Day ${prompt.day} · ${escapeHtml(prompt.topic)}</span>
          <p>${escapeHtml(prompt.pattern)}</p>
          <div class="binary-buttons">
            <button type="button" class="${session.reviewAnswers[index] === false ? 'is-selected' : ''}" data-action="answer-review" data-index="${index}" data-value="false">Not yet</button>
            <button type="button" class="${session.reviewAnswers[index] === true ? 'is-selected' : ''}" data-action="answer-review" data-index="${index}" data-value="true">Recalled it</button>
          </div>
        </article>`).join('')}</div>
      <button class="primary-button button-block" type="button" data-action="finish-review" ${answered === prompts.length ? '' : 'disabled'}>Continue</button>`;
  }

  function answerReview(index, value) {
    session.reviewAnswers[index] = value;
    renderTraining();
  }

  function finishReview() {
    const progress = getProgress(session.day);
    progress.reviewPoints = session.reviewAnswers.filter(Boolean).length * 10;
    session.phase = 'realwork';
    saveState();
    renderTraining();
  }

  function renderRealWork(lesson) {
    view.innerHTML = `
      ${trainingHeader(lesson, 1, 1, 'Real-world transfer')}
      <section class="challenge">
        <p class="eyebrow">Real Work Hit</p>
        <h1>Did it leave the practice room?</h1>
        <p class="challenge-instruction">Did you use today’s English in a real Teams, Zoom, or in-person meeting?</p>
        <div class="choice-stack">
          <button type="button" data-action="real-work" data-hits="0"><span>No, not yet</span><small>+0 points</small></button>
          <button type="button" data-action="real-work" data-hits="1"><span>Yes, once</span><small>+10 points</small></button>
          <button type="button" data-action="real-work" data-hits="2"><span>Yes, 2+ times</span><small>+20 points</small></button>
        </div>
      </section>`;
  }

  function completeTraining(hits) {
    const lesson = getLesson(session.day);
    const progress = getProgress(session.day);
    const sentences = getSentences(lesson);
    progress.realWorkHits = Number(hits);
    const score = utils.calculateScore({
      practicedCount: progress.practiced.length,
      totalSentences: sentences.length,
      speakingSeconds: progress.speakingSeconds,
      reviewPoints: progress.reviewPoints,
      realWorkHits: progress.realWorkHits
    });
    progress.breakdown = score;
    progress.score = score.total;
    progress.lastAttemptDate = utils.localDateKey();
    if (score.total >= utils.COMPLETION_SCORE && !progress.completedDate) {
      progress.completedDate = utils.localDateKey();
      progress.completedAt = new Date().toISOString();
    }
    saveState();
    session.phase = 'complete';
    session.active = false;
    stopTicking();
    renderTraining();
  }

  function renderCompletion(lesson, progress) {
    const passed = progress.score >= utils.COMPLETION_SCORE;
    const streak = utils.calculateStreak(state.progress);
    const total = state.stats.totalTrainingSeconds || totalTrainingSeconds();
    view.innerHTML = `
      <section class="completion">
        <div class="completion-mark" aria-hidden="true">${passed ? '✓' : '↗'}</div>
        <p class="eyebrow">${passed ? 'Training complete' : 'Session saved'}</p>
        <h1>${passed ? 'Target reached.' : 'One more push.'}</h1>
        <p class="final-score">${progress.score}<span> / 100</span></p>
        <p class="page-subtitle">${passed ? 'Clear practice. Measurable progress.' : 'Score 70 or more to complete this day.'}</p>
        <div class="completion-grid">
          <div><strong>${progress.speakingSeconds}s</strong><span>Speaking</span></div>
          <div><strong>+${progress.realWorkHits}</strong><span>Real Work Hits</span></div>
          <div><strong>${streak} ${streak === 1 ? 'day' : 'days'}</strong><span>Current streak</span></div>
          <div><strong>${formatDuration(total, true)}</strong><span>Total training</span></div>
        </div>
        <button class="primary-button button-block" type="button" data-action="finish-session">Done</button>
        ${!passed ? '<button class="back-button" type="button" data-action="retry-session">Try this lesson again</button>' : ''}
      </section>`;
  }

  function totalTrainingSeconds() {
    return Object.values(state.progress).reduce((sum, item) => sum + (Number(item.trainingSeconds) || 0), 0);
  }

  function weeklyTrainingSeconds() {
    const ledger = state.stats.trainingByDate || {};
    if (Object.keys(ledger).length) return utils.weeklyTrainingSeconds(ledger);
    const today = new Date();
    const mondayOffset = (today.getDay() + 6) % 7;
    const mondayKey = utils.localDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset));
    return Object.values(state.progress).reduce((sum, item) => item.lastAttemptDate >= mondayKey ? sum + (Number(item.trainingSeconds) || 0) : sum, 0);
  }

  function statsSnapshot() {
    const completed = completedEntries();
    const items = Object.values(state.progress);
    const scores = completed.map(item => item.score);
    return {
      streak: utils.calculateStreak(state.progress),
      longestStreak: utils.longestStreak(state.progress),
      completed: completed.length,
      average: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      realWork: items.reduce((sum, item) => sum + (Number(item.realWorkHits) || 0), 0),
      speakingPB: Math.max(0, ...items.map(item => Number(item.speakingSeconds) || 0)),
      scorePB: Math.max(0, ...items.map(item => Number(item.score) || 0)),
      hitsPB: Math.max(0, ...items.map(item => Number(item.realWorkHits) || 0)),
      today: utils.trainingSecondsForDate(state.stats.trainingByDate),
      total: state.stats.totalTrainingSeconds || totalTrainingSeconds(),
      weekly: weeklyTrainingSeconds()
    };
  }

  function renderTrend(entries) {
    const values = entries.slice(0, 7).reverse();
    if (values.length < 2) return '<p class="micro">Complete two lessons to see your score trend.</p>';
    const width = 340;
    const height = 110;
    const points = values.map((item, index) => {
      const x = 8 + index * ((width - 16) / (values.length - 1));
      const y = height - 8 - (item.score / 100 * (height - 20));
      return { x, y, score: item.score };
    });
    const line = points.map(point => `${point.x},${point.y}`).join(' ');
    const area = `8,${height} ${line} ${width - 8},${height}`;
    return `<svg class="trend-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Recent score trend">
      <defs><linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3155d9" stop-opacity=".22"/><stop offset="1" stop-color="#3155d9" stop-opacity="0"/></linearGradient></defs>
      <line class="guide" x1="8" x2="332" y1="35" y2="35"/><line class="guide" x1="8" x2="332" y1="76" y2="76"/>
      <polygon class="area" points="${area}"/><polyline class="line" points="${line}"/>
      ${points.map(point => `<circle cx="${point.x}" cy="${point.y}" r="4"><title>${point.score}</title></circle>`).join('')}
    </svg>`;
  }

  function renderProgress() {
    const stats = statsSnapshot();
    const history = completedEntries();
    view.innerHTML = `
      <p class="eyebrow">Your momentum</p>
      <h1 class="page-title">Progress</h1>
      <p class="page-subtitle">Small sessions, visible gains.</p>
      <section class="metric-hero">
        <p class="eyebrow">Current streak</p>
        <strong>${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}</strong>
        <p>Longest streak · ${stats.longestStreak} ${stats.longestStreak === 1 ? 'day' : 'days'}</p>
      </section>
      <div class="metric-grid">
        <div class="metric"><strong>${formatDuration(stats.total, true)}</strong><span>Total training</span></div>
        <div class="metric"><strong>${stats.completed} / 30</strong><span>Lessons completed</span></div>
        <div class="metric"><strong>${stats.average}</strong><span>Average score</span></div>
        <div class="metric"><strong>${stats.realWork}</strong><span>Real Work Hits</span></div>
        <div class="metric"><strong>${stats.speakingPB}s</strong><span>Speaking PB</span></div>
        <div class="metric"><strong>${formatDuration(stats.today, true)}</strong><span>Today</span></div>
      </div>
      <div class="time-summary"><span>This week</span><strong>${formatDuration(stats.weekly, true)}</strong></div>
      <div class="section-heading"><h2>Personal best</h2><span>Your high-water marks</span></div>
      <div class="pb-list">
        <div><span>Longest speaking session</span><strong>${stats.speakingPB}s</strong></div>
        <div><span>Highest daily score</span><strong>${stats.scorePB}</strong></div>
        <div><span>Longest streak</span><strong>${stats.longestStreak} ${stats.longestStreak === 1 ? 'day' : 'days'}</strong></div>
        <div><span>Most Real Work Hits</span><strong>${stats.hitsPB}</strong></div>
      </div>
      <div class="section-heading"><h2>Score trend</h2><span>Last 7 completions</span></div>
      <div class="trend-wrap">${renderTrend(history)}</div>
      <div class="section-heading"><h2>Recent lessons</h2><span>${stats.scorePB} score PB</span></div>
      ${history.length ? `<div class="history-list">${history.slice(0, 8).map(item => `
        <button class="lesson-row" type="button" data-action="review-lesson" data-day="${item.day}">
          <span class="history-day">Day ${item.day}</span><span class="history-topic">${escapeHtml(getLesson(item.day)?.topic || '')}</span><span class="history-score ${item.score >= 70 ? 'pass' : ''}">${item.score}</span>
        </button>`).join('')}</div>` : '<div class="empty-state"><p>Your first completed lesson will appear here.</p></div>'}
    `;
  }

  function renderLibrary() {
    const current = lessonDayForToday();
    view.innerHTML = `
      <p class="eyebrow">30-day programme</p>
      <h1 class="page-title">Library</h1>
      <p class="page-subtitle">Every lesson stays open for review.</p>
      <div class="library-list">${lessonData.lessons.map(lesson => {
        const progress = state.progress[String(lesson.day)];
        const complete = progress?.score >= utils.COMPLETION_SCORE;
        const rowClass = complete ? 'is-complete' : lesson.day === current ? 'is-current' : '';
        const status = complete ? `${progress.score} points · Complete` : lesson.day === current ? 'Today’s lesson' : lesson.scenario;
        return `<button class="lesson-row ${rowClass}" type="button" data-action="review-lesson" data-day="${lesson.day}">
          <span class="day-number">${complete ? '✓' : String(lesson.day).padStart(2, '0')}</span>
          <span><strong>${escapeHtml(lesson.topic)}</strong><small>${escapeHtml(status)}</small></span><span class="row-arrow">›</span>
        </button>`;
      }).join('')}</div>`;
  }

  function renderLessonReview() {
    const lesson = getLesson(selectedLessonDay);
    if (!lesson) return setView('library');
    const sentences = getSentences(lesson);
    view.innerHTML = `
      <section class="review-sheet">
        <button class="back-button" type="button" data-nav="library">← Library</button>
        <p class="eyebrow">Day ${String(lesson.day).padStart(2, '0')} · Review mode</p>
        <h1>${escapeHtml(lesson.topic)}</h1>
        <p class="page-subtitle">${escapeHtml(lesson.scenario)}</p>
        <div class="section-heading"><h2>Speaking logic</h2><span>${sentences.length} expressions</span></div>
        ${logicMarkup(lesson.speakingLogic)}
        <div class="section-heading"><h2>Core sentences</h2><span>Tap for examples</span></div>
        ${sentences.map(sentence => `<article class="review-sentence">
          <span class="sentence-id">${escapeHtml(sentence.id)}</span>
          <h3>${escapeHtml(sentence.text)}</h3>
          <p class="micro">${escapeHtml(sentence.pattern)}</p>
          <details><summary>Show examples</summary>${sentence.examples.map(example => `<p>${escapeHtml(example)}</p>`).join('')}</details>
        </article>`).join('')}
      </section>`;
  }

  function renderSettings() {
    view.innerHTML = `
      <p class="eyebrow">Local & private</p>
      <h1 class="page-title">Settings</h1>
      <p class="page-subtitle">Your learning data stays on this device unless you export it.</p>
      <section class="settings-group">
        <h2>App</h2>
        <button class="settings-row" type="button" data-action="install-app" id="settings-install">
          <span><strong>Install BA Speak</strong><small>Add it to your home screen</small></span><span class="row-action">Install</span>
        </button>
      </section>
      <section class="settings-group">
        <h2>Backup</h2>
        <button class="settings-row" type="button" data-action="export-progress"><span><strong>Export progress</strong><small>Download a JSON backup</small></span><span class="row-action">Export</span></button>
        <button class="settings-row" type="button" data-action="import-progress"><span><strong>Import progress</strong><small>Restore a previous JSON backup</small></span><span class="row-action">Import</span></button>
        <button class="settings-row danger" type="button" data-action="reset-progress"><span><strong>Reset all progress</strong><small>Permanently clear local learning data</small></span><span class="row-action">Reset</span></button>
      </section>
      <div class="version-list">App Version ${APP_VERSION}<br>Content Version ${escapeHtml(lessonData.contentVersion)}<br>Storage Version ${state.version}</div>`;
  }

  function exportProgress() {
    const payload = { product: 'BA English Speaking Trainer', exportedAt: new Date().toISOString(), appVersion: APP_VERSION, data: state };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ba-speak-backup-${utils.localDateKey()}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Progress exported');
  }

  async function importProgress(file) {
    try {
      const parsed = JSON.parse(await file.text());
      const candidate = parsed.data || parsed;
      if (!candidate || typeof candidate !== 'object' || !candidate.progress) throw new Error('Invalid backup');
      state = utils.migrateState(candidate);
      state.stats.totalTrainingSeconds = totalTrainingSeconds();
      saveState();
      setView('progress');
      showToast('Progress restored');
    } catch (error) {
      showToast('That backup file is not valid');
    } finally {
      importInput.value = '';
    }
  }

  async function promptInstall() {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      installButton.hidden = true;
      return;
    }
    showToast('Use your browser menu, then choose “Add to Home Screen”');
  }

  view.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.nav) return setView(button.dataset.nav);
    const action = button.dataset.action;
    if (action === 'start-training') startTraining();
    if (action === 'show-result') {
      const day = lessonDayForToday();
      session = { day, phase: 'complete', active: false };
      currentView = 'training';
      renderTraining();
    }
    if (action === 'exit-training') setView('today');
    if (action === 'practice-sentence') markSentencePracticed();
    if (action === 'toggle-speaking') toggleSpeaking();
    if (action === 'reset-speaking') resetSpeaking();
    if (action === 'stop-speaking') finishSpeaking();
    if (action === 'answer-review') answerReview(Number(button.dataset.index), button.dataset.value === 'true');
    if (action === 'finish-review') finishReview();
    if (action === 'real-work') completeTraining(Number(button.dataset.hits));
    if (action === 'finish-session') setView('today');
    if (action === 'retry-session') startTraining();
    if (action === 'review-lesson') {
      selectedLessonDay = Number(button.dataset.day);
      currentView = 'review';
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (action === 'export-progress') exportProgress();
    if (action === 'import-progress') importInput.click();
    if (action === 'install-app') promptInstall();
    if (action === 'reset-progress' && confirm('Reset all learning progress on this device? This cannot be undone.')) {
      state = utils.defaultState();
      saveState();
      renderSettings();
      showToast('All progress reset');
    }
  });

  document.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click', () => setView(button.dataset.nav)));
  importInput.addEventListener('change', () => importInput.files[0] && importProgress(importInput.files[0]));
  installButton.addEventListener('click', promptInstall);
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
  });
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  document.addEventListener('visibilitychange', () => {
    if (!session) return;
    lastTick = Date.now();
    if (document.hidden && session.speakingRunning) {
      session.speakingRunning = false;
      showToast('Speaking timer paused');
    }
  });

  function updateNetworkStatus() {
    offlinePill.hidden = navigator.onLine;
  }

  async function init() {
    updateNetworkStatus();
    try {
      const response = await fetch('./data/lessons.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Lessons failed: ${response.status}`);
      lessonData = await response.json();
      if (!Array.isArray(lessonData.lessons) || lessonData.lessons.length !== 30) throw new Error('Expected 30 lessons');
      state.stats.totalTrainingSeconds = totalTrainingSeconds();
      saveState();
      render();
      if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        navigator.serviceWorker.register('./service-worker.js').catch(() => {});
      }
    } catch (error) {
      view.innerHTML = `<section class="error-state"><div><h1>Lessons unavailable</h1><p>Start the app through a local web server, then try again.</p><button class="primary-button" type="button" onclick="location.reload()">Reload</button></div></section>`;
      console.error(error);
    }
  }

  init();
})();
