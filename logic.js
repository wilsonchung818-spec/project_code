(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.BAUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_VERSION = 1;
  const COMPLETION_SCORE = 70;

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function dateFromKey(key) {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function addDays(key, amount) {
    const date = dateFromKey(key);
    date.setDate(date.getDate() + amount);
    return localDateKey(date);
  }

  function speakingPoints(seconds) {
    const value = Number(seconds) || 0;
    if (value >= 60) return 30;
    if (value >= 45) return 20;
    if (value >= 30) return 10;
    return value > 0 ? 5 : 0;
  }

  function sentencePoints(practicedCount, totalCount) {
    if (!totalCount) return 0;
    return Math.round(Math.min(practicedCount, totalCount) / totalCount * 30);
  }

  function realWorkPoints(hits) {
    return hits >= 2 ? 20 : hits === 1 ? 10 : 0;
  }

  function calculateScore(input) {
    const sentence = sentencePoints(input.practicedCount || 0, input.totalSentences || 0);
    const speaking = speakingPoints(input.speakingSeconds || 0);
    const review = Math.max(0, Math.min(20, Number(input.reviewPoints) || 0));
    const realWork = realWorkPoints(Number(input.realWorkHits) || 0);
    return { sentence, speaking, review, realWork, total: sentence + speaking + review + realWork };
  }

  function calculateStreak(progress, todayKey = localDateKey()) {
    const completedDates = [...new Set(Object.values(progress || {})
      .filter(item => item && item.score >= COMPLETION_SCORE && item.completedDate)
      .map(item => item.completedDate))]
      .sort().reverse();
    if (!completedDates.length) return 0;
    if (completedDates[0] !== todayKey && completedDates[0] !== addDays(todayKey, -1)) return 0;
    let streak = 1;
    for (let index = 1; index < completedDates.length; index += 1) {
      if (completedDates[index] === addDays(completedDates[index - 1], -1)) streak += 1;
      else break;
    }
    return streak;
  }

  function longestStreak(progress) {
    const dates = [...new Set(Object.values(progress || {})
      .filter(item => item && item.score >= COMPLETION_SCORE && item.completedDate)
      .map(item => item.completedDate))]
      .sort();
    let longest = 0;
    let run = 0;
    let previous = null;
    dates.forEach(date => {
      run = previous && date === addDays(previous, 1) ? run + 1 : 1;
      longest = Math.max(longest, run);
      previous = date;
    });
    return longest;
  }

  function trainingSecondsForDate(trainingByDate, dateKey = localDateKey()) {
    return Math.max(0, Number(trainingByDate?.[dateKey]) || 0);
  }

  function weeklyTrainingSeconds(trainingByDate, todayKey = localDateKey()) {
    const today = dateFromKey(todayKey);
    const mondayOffset = (today.getDay() + 6) % 7;
    const mondayKey = addDays(todayKey, -mondayOffset);
    return Object.entries(trainingByDate || {}).reduce((sum, [dateKey, seconds]) => {
      return dateKey >= mondayKey && dateKey <= todayKey
        ? sum + Math.max(0, Number(seconds) || 0)
        : sum;
    }, 0);
  }

  function defaultState() {
    return {
      version: STORAGE_VERSION,
      createdAt: new Date().toISOString(),
      progress: {},
      stats: { totalTrainingSeconds: 0, trainingByDate: {} },
      settings: { sound: false, reducedData: false }
    };
  }

  function migrateState(value) {
    const clean = defaultState();
    if (!value || typeof value !== 'object') return clean;
    clean.createdAt = typeof value.createdAt === 'string' ? value.createdAt : clean.createdAt;
    clean.progress = value.progress && typeof value.progress === 'object' ? value.progress : {};
    clean.stats = { ...clean.stats, ...(value.stats || {}) };
    clean.stats.trainingByDate = clean.stats.trainingByDate && typeof clean.stats.trainingByDate === 'object'
      ? clean.stats.trainingByDate
      : {};
    if (!Object.keys(clean.stats.trainingByDate).length) {
      Object.values(clean.progress).forEach(item => {
        if (!item?.lastAttemptDate) return;
        clean.stats.trainingByDate[item.lastAttemptDate] = (clean.stats.trainingByDate[item.lastAttemptDate] || 0)
          + Math.max(0, Number(item.trainingSeconds) || 0);
      });
    }
    clean.settings = { ...clean.settings, ...(value.settings || {}) };
    return clean;
  }

  return {
    STORAGE_VERSION,
    COMPLETION_SCORE,
    localDateKey,
    addDays,
    speakingPoints,
    sentencePoints,
    realWorkPoints,
    calculateScore,
    calculateStreak,
    longestStreak,
    trainingSecondsForDate,
    weeklyTrainingSeconds,
    defaultState,
    migrateState
  };
});
