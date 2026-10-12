const test = require('node:test');
const assert = require('node:assert/strict');
const content = require('../data/lessons.json');

const OPERATORS = {
  come: /\b(?:come|comes|came|coming)\b/i,
  get: /\b(?:get|gets|got|getting)\b/i,
  give: /\b(?:give|gives|gave|given|giving)\b/i,
  go: /\b(?:go|goes|went|gone|going)\b/i,
  keep: /\b(?:keep|keeps|kept|keeping)\b/i,
  let: /\b(?:let|lets|letting)\b/i,
  make: /\b(?:make|makes|made|making)\b/i,
  put: /\b(?:put|puts|putting)\b/i,
  seem: /\b(?:seem|seems|seemed|seeming)\b/i,
  take: /\b(?:take|takes|took|taken|taking)\b/i,
  be: /\b(?:be|am|is|are|was|were|been|being)\b/i,
  do: /\b(?:do|does|did|done|doing)\b/i,
  have: /\b(?:have|has|had|having)\b/i,
  say: /\b(?:say|says|said|saying)\b/i,
  see: /\b(?:see|sees|saw|seen|seeing)\b/i,
  send: /\b(?:send|sends|sent|sending)\b/i,
  may: /\bmay\b/i,
  will: /\bwill\b/i
};

test('course has 30 lessons and the current content version', () => {
  assert.equal(content.contentVersion, '2026.10.12');
  assert.equal(content.lessons.length, 30);
});

test('Days 11–30 contain three work sentences and one life sentence', () => {
  for (const lesson of content.lessons.filter(item => item.day >= 11)) {
    assert.equal(lesson.sections.length, 2, `Day ${lesson.day} section count`);
    const sentences = lesson.sections.flatMap(section => section.sentences);
    assert.equal(sentences.length, 4, `Day ${lesson.day} sentence count`);
    assert.equal(sentences.filter(sentence => sentence.context === 'Work').length, 3, `Day ${lesson.day} work count`);
    assert.equal(sentences.filter(sentence => sentence.context === 'Life').length, 1, `Day ${lesson.day} life count`);
    assert.deepEqual(sentences.map(sentence => sentence.id), ['S1', 'S2', 'S3', 'S4'], `Day ${lesson.day} sentence IDs`);
    assert.equal(lesson.sentencePatterns.length, 4, `Day ${lesson.day} pattern count`);
  }
});

test('every revised sentence uses at least one Basic English operator', () => {
  for (const lesson of content.lessons.filter(item => item.day >= 11)) {
    for (const sentence of lesson.sections.flatMap(section => section.sentences)) {
      assert.ok(Object.values(OPERATORS).some(pattern => pattern.test(sentence.text)), `Day ${lesson.day} ${sentence.id}: ${sentence.text}`);
    }
  }
});

test('Days 11–30 cover all 18 Basic English operators', () => {
  const revisedText = content.lessons
    .filter(item => item.day >= 11)
    .flatMap(item => item.sections.flatMap(section => section.sentences.map(sentence => sentence.text)))
    .join(' ');
  const missing = Object.entries(OPERATORS)
    .filter(([, pattern]) => !pattern.test(revisedText))
    .map(([operator]) => operator);
  assert.deepEqual(missing, []);
});
