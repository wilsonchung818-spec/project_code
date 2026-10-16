const test = require('node:test');
const assert = require('node:assert/strict');
const logic = require('../logic.js');

test('score calculation follows the 30/30/20/20 model', () => {
  assert.deepEqual(logic.calculateScore({ practicedCount: 4, totalSentences: 4, speakingSeconds: 67, reviewPoints: 20, realWorkHits: 1 }), {
    sentence: 30, speaking: 30, review: 20, realWork: 10, total: 90
  });
});

test('speaking score handles every time band', () => {
  assert.equal(logic.speakingPoints(0), 0);
  assert.equal(logic.speakingPoints(12), 5);
  assert.equal(logic.speakingPoints(30), 10);
  assert.equal(logic.speakingPoints(45), 20);
  assert.equal(logic.speakingPoints(60), 30);
});

test('current streak ignores duplicate completions on the same date', () => {
  const progress = {
    1: { score: 80, completedDate: '2026-09-23' },
    2: { score: 70, completedDate: '2026-09-24' },
    3: { score: 95, completedDate: '2026-09-25' },
    4: { score: 85, completedDate: '2026-09-25' }
  };
  assert.equal(logic.calculateStreak(progress, '2026-09-25'), 3);
  assert.equal(logic.longestStreak(progress), 3);
});

test('state migration preserves progress and fills new settings', () => {
  const migrated = logic.migrateState({ version: 0, progress: { 1: { score: 75 } }, settings: { sound: true } });
  assert.equal(migrated.version, 2);
  assert.equal(migrated.progress[1].score, 75);
  assert.equal(migrated.settings.sound, true);
  assert.equal(migrated.settings.reducedData, false);
  assert.deepEqual(migrated.stats.trainingByDate, {});
  assert.deepEqual(migrated.wordBank, []);
  assert.deepEqual(migrated.reading, { completed: [], lastBookId: null });
});

test('state migration reconstructs the date ledger for existing users', () => {
  const migrated = logic.migrateState({
    progress: {
      1: { trainingSeconds: 90, lastAttemptDate: '2026-09-25' },
      2: { trainingSeconds: 30, lastAttemptDate: '2026-09-25' }
    }
  });
  assert.deepEqual(migrated.stats.trainingByDate, { '2026-09-25': 120 });
});

test('training time is reported from the local-date ledger', () => {
  const ledger = {
    '2026-09-20': 600,
    '2026-09-21': 120,
    '2026-09-23': 180,
    '2026-09-27': 999,
    '2026-09-28': 500
  };
  assert.equal(logic.trainingSecondsForDate(ledger, '2026-09-23'), 180);
  assert.equal(logic.weeklyTrainingSeconds(ledger, '2026-09-23'), 300);
});

test('streak accepts a completion yesterday and stops at a gap', () => {
  const progress = {
    1: { score: 90, completedDate: '2026-09-20' },
    2: { score: 90, completedDate: '2026-09-22' },
    3: { score: 90, completedDate: '2026-09-23' },
    4: { score: 90, completedDate: '2026-09-24' }
  };
  assert.equal(logic.calculateStreak(progress, '2026-09-25'), 3);
  assert.equal(logic.longestStreak(progress), 3);
});

test('personal words use a simple spaced-review schedule', () => {
  const word = { id: 'w1', word: 'clarify', intervalDays: 0, reviewCount: 0 };
  const tomorrow = logic.reviewWord(word, 'good', '2026-10-16');
  assert.equal(tomorrow.dueDate, '2026-10-17');
  assert.equal(tomorrow.reviewCount, 1);
  assert.equal(logic.isWordDue(tomorrow, '2026-10-16'), false);
  const inThreeDays = logic.reviewWord(tomorrow, 'good', '2026-10-17');
  assert.equal(inThreeDays.dueDate, '2026-10-20');
  const again = logic.reviewWord(inThreeDays, 'again', '2026-10-18');
  assert.equal(again.dueDate, '2026-10-18');
  assert.equal(logic.isWordDue(again, '2026-10-18'), true);
});

test('word normalization keeps useful apostrophes and removes punctuation', () => {
  assert.equal(logic.normalizeWord('  Clarify! '), 'clarify');
  assert.equal(logic.normalizeWord("Reader's"), "reader's");
});
