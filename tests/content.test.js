const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const content = require('../data/lessons.json');
const readings = require('../data/readings.json');

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

test('every core sentence and context example has a generated audio file', () => {
  const expected = [];
  for (const lesson of content.lessons) {
    for (const sentence of lesson.sections.flatMap(section => section.sentences)) {
      const prefix = `day-${String(lesson.day).padStart(2, '0')}-${sentence.id.toLowerCase()}`;
      expected.push(`${prefix}.mp3`);
      sentence.examples.forEach((example, index) => expected.push(`${prefix}-e${index + 1}.mp3`));
    }
  }

  const audioDirectory = path.join(__dirname, '..', 'assets', 'audio');
  const actual = fs.readdirSync(audioDirectory).filter(file => file.endsWith('.mp3')).sort();
  assert.deepEqual(actual, expected.sort());
  for (const filename of actual) {
    assert.ok(fs.statSync(path.join(audioDirectory, filename)).size > 1_000, `${filename} is unexpectedly small`);
  }

  const manifest = JSON.parse(fs.readFileSync(path.join(audioDirectory, 'manifest.json'), 'utf8'));
  assert.equal(manifest.voice, 'en-US-AriaNeural');
  assert.equal(manifest.clips, expected.length);
});

test('reading library has 10 sourced public-domain excerpts with useful glossaries', () => {
  assert.equal(readings.contentVersion, '2026.10.16');
  assert.equal(readings.readings.length, 10);
  assert.equal(new Set(readings.readings.map(item => item.id)).size, 10);
  for (const reading of readings.readings) {
    assert.ok(reading.title && reading.author && reading.summary, `${reading.id} metadata`);
    assert.ok(reading.text.split(/\s+/).length >= 25, `${reading.id} excerpt is too short`);
    assert.ok(/^https:\/\/www\.gutenberg\.org\//.test(reading.sourceUrl), `${reading.id} source`);
    assert.ok(Object.keys(reading.glossary).length >= 8, `${reading.id} glossary is too small`);
    for (const word of Object.keys(reading.glossary)) {
      assert.match(reading.text.toLowerCase().replace(/’/g, "'"), new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), `${reading.id}: ${word}`);
    }
  }
});

test('HTML, JavaScript and service-worker cache use one release version', () => {
  const root = path.join(__dirname, '..');
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const serviceWorker = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const version = packageJson.version;

  assert.match(app, new RegExp(`APP_VERSION = '${version.replaceAll('.', '\\.')}'`));
  assert.match(serviceWorker, new RegExp(`CACHE_VERSION = 'ba-speak-v${version.replaceAll('.', '\\.')}'`));
  for (const asset of ['styles.css', 'logic.js', 'app.js']) {
    assert.match(index, new RegExp(`${asset.replace('.', '\\.')}\\?v=${version.replaceAll('.', '\\.')}`), `${asset} HTML version`);
    assert.ok(serviceWorker.includes(`'./${asset}?v=${version}'`), `${asset} service-worker version`);
  }
});
