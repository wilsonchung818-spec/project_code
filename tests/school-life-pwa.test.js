const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..", "school-life-100");

test("school-life PWA has an installable app shell", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./#learn");
  assert.equal(manifest.scope, "./");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));

  for (const file of [
    "index.html",
    "styles.css",
    "app.js",
    "data.js",
    "service-worker.js",
    "assets/icons/icon-192.png",
    "assets/icons/icon-512.png",
    "assets/icons/icon-maskable-512.png",
  ]) {
    assert.ok(fs.existsSync(path.join(root, file)), `${file} should exist`);
  }
});

test("book lesson contains three complete visual conversations", () => {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, "data.js"), "utf8"), sandbox);
  const lesson = sandbox.window.SCHOOL_LIFE_LESSON;

  assert.equal(lesson.word, "book");
  assert.equal(lesson.chunks.length, 3);
  assert.equal(lesson.scenes.length, 3);
  for (const scene of lesson.scenes) {
    assert.match(scene.image, /^\.\/assets\/images\//);
    assert.ok(scene.question);
    assert.ok(scene.answer);
    assert.ok(scene.zh);
    assert.ok(scene.audio);
    assert.ok(scene.choices.length >= 3);
  }
});

test("service worker precaches the core lesson", () => {
  const source = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
  assert.match(source, /manifest\.webmanifest/);
  assert.match(source, /scene-reading\.png/);
  assert.match(source, /book-dialogue-3\.mp3/);
  assert.doesNotMatch(source, /fetch\(["']\//);
});
