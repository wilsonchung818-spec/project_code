# BA English Speaking Trainer

A mobile-first, installable PWA for Business Analysts, Product Managers, Project Managers, and Scrum Masters who want measurable English speaking practice for international work.

The app is deliberately private and lightweight: no account, backend, speech recognition, or cloud database. It runs as a static site and keeps progress on the device.

## Features

- 60 practical BA/PM/Scrum Master lessons, stored separately from application code
- Days 11–18 use an Ogden Basic English-inspired vocabulary model: the 18 operators, mostly 850-word vocabulary, and necessary BA/Scrum terms
- Days 19–41 cycle through Tim Ferriss's 12 sentence frames, adapted to workplace and daily-life English
- Days 11–41 have four core sentences: three workplace situations and one everyday-life situation
- Days 42–60 have four independent dialogues per day (three BA/SM work scenes and one life scene), each with Q1 → A1 → Q2 → A2
- Every dialogue answer has a reusable frame, highlighted replaceable parts, Chinese substitution guidance, two cross-context examples, and editable slots with a live sentence preview
- High-frequency answer frames recur across scenes; hide answers to practise recall, play questions individually, and listen to full dialogues or example sentences
- Consistent AI-generated US female news-style audio for every core sentence and alternative, with normal speed, slow speed, and a three-pass shadowing drill
- Active training timer, speaking challenge, recall review, Real Work Hit tracking, scores, streaks, and personal bests
- Create workspace for saving new words, writing personal sentences, and reviewing them with a simple spaced schedule
- Reusable dialogue and 60-second story prompts that bring saved words into active speaking
- Reading library with 10 sourced public-domain classic excerpts, tap-to-translate vocabulary, and reading progress
- Local JSON export/import, confirmed reset, installable PWA, and offline application shell

## Local development

The app must be served over HTTP because browsers block JSON fetches and service workers from `file://` pages.

```bash
python -m http.server 4173
```

Then open <http://localhost:4173>.

Run the zero-dependency logic and lesson-content tests with Node.js 18 or later:

```bash
npm test
```

### Regenerate lesson audio

The committed MP3 assets use `en-US-AriaNeural`, a US female news-style voice. Audio generation is a build-time task; the deployed app does not expose credentials or call a speech service at runtime.

```bash
python -m pip install -r scripts/requirements-audio.txt
python scripts/generate_audio.py --force
```

To regenerate only a changed range:

```bash
node scripts/upgrade_dialogues.cjs
python scripts/generate_audio.py --force --from-day 42 --to-day 60
```

## File structure

```text
.
├── .github/workflows/deploy.yml  # GitHub Pages deployment
├── assets/audio/                 # Generated lesson MP3 files and manifest
├── assets/icons/                 # PWA and browser icons
├── data/lessons.json             # Versioned 60-day course content
├── data/readings.json            # Public-domain excerpts and Chinese glossaries
├── scripts/generate_audio.py     # Stable lesson-audio generator
├── tests/                        # Scoring, migration, content, and release tests
├── app.js                        # UI, timers, navigation, and persistence
├── index.html                    # Semantic app shell
├── logic.js                      # Pure scoring/state/date functions
├── manifest.json                 # PWA metadata
├── service-worker.js             # Offline cache and update strategy
└── styles.css                    # Mobile-first product UI
```

## Lesson content

`data/lessons.json` has a top-level `contentVersion` plus a `lessons` array. Each lesson contains its day, topic, scenario, speaking logic, sentence patterns, sections, and speaking challenge.

Each S item has a stable `id`, `text`, `pattern`, and two `examples`. Days 19–41 include a `deconstruction` object for the 12-frame course. Days 42–60 include a `dialogue` with scene, roles, and four turns; A1/A2 each have `reuse` metadata. Legacy fields mirror A1 for compatibility. Keep day numbers and S IDs stable because saved practice data refers to them. Existing progress is retained when content changes; all revised dialogues are accessible through Library.

Days 11–18 follow [Ogden's 850-word list](https://zbenglish.net/sites/basic/words.html) and the [18 Basic English operators](https://zbenglish.net/sites/basic/verbs.html) as a practical writing guide. Required domain terms such as API, UAT, sprint, story, release, production, dependency, sign-off, and rollback are retained.

Days 19–41 use the 12 diagnostic sentence frames described in [Tim Ferriss's language-learning article](https://tim.blog/2007/11/07/how-to-learn-but-not-master-any-language-in-1-hour-plus-a-favor/). Days 42–60 extend the fixed-skeleton/replaceable-parts method into practical two-round conversations rather than forcing every response into the original 12 frames. Edit `scripts/upgrade_dialogues.cjs` and run it to rebuild both the lesson JSON and [the full dialogue text](docs/dialogues-42-60.md). The older `extend_course_60.cjs` script is guarded against overwriting the dialogue course.

The 76 revised scenes contain 304 dialogue turns, 152 reusable answers, and 304 example instances. Each scene has nine audio files: the full conversation, four turns, two A1 examples, and two A2 examples. Audio uses AI-generated `en-US-AriaNeural`; app audio URLs include the content version to avoid replaying old recordings after an update. Edited personal sentences are for speaking practice and are not saved or automatically checked for grammar.

### Modify an existing lesson

1. For Days 42–60, edit `scripts/upgrade_dialogues.cjs` and run it. For earlier days, edit the relevant lesson in `data/lessons.json`.
2. Keep its `day` and existing sentence IDs stable where possible.
3. Update `contentVersion`.
4. Bump the release version in `package.json`, `index.html`, `app.js`, and `service-worker.js`.
5. Regenerate changed audio, run tests, and check the mobile UI.

### Add a future day

1. Copy one complete lesson object in `data/lessons.json`.
2. Set `day` to the next day number and use stable sentence IDs.
3. Update `contentVersion` and the expected lesson count in `app.js` and tests.
4. Regenerate audio, bump the cache version, and test the full release.

## Scoring

The maximum daily score is 100:

- Sentence completion: 30 points, proportional to sentences practised
- Speaking challenge: 5 points below 30 seconds, 10 at 30–44, 20 at 45–59, and 30 at 60+
- Recall review: 10 points for each of two recalled patterns; the first lesson receives 20 introductory points
- Real Work Hit: 0 points for none, 10 for one, and 20 for two or more

A score of 70 or above completes the day. A date can increase the streak only once, even if multiple lessons are completed or retried on that date.

## Local progress and privacy

State is saved under `ba-speaking-trainer:v1` in `localStorage`. Application and content updates do not clear this key. Settings provides JSON export, validated import, and a confirmed reset. Data does not leave the device unless the user explicitly downloads a backup.

## GitHub Pages deployment

The included workflow deploys the repository root on pushes to `main` or `master`. Runtime paths are relative, so the app works at a project URL such as:

```text
https://wilsonchung818-spec.github.io/project_code/
```

## PWA updates and stale-cache troubleshooting

The service worker uses a named, versioned cache. During installation it reloads the application shell from the network. HTML/CSS/JS are cache-first for reliable offline startup; `data/lessons.json` and `data/readings.json` are network-first so updated content is fetched while online.

For every release, update the service-worker cache version and content version, then deploy normally. If a device still shows stale content, close every installed-app/browser tab and reopen it. As a last resort, export progress and clear the site's browser data.

## Security and limitations

Never store tokens, API keys, passwords, or other credentials in this repository. The current MVP has no speech recognition, pronunciation scoring, cloud sync, or multi-device account. Browser storage can be removed by the user or operating system, so regular JSON exports are recommended.
