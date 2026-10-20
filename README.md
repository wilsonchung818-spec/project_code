# BA English Speaking Trainer

A mobile-first, installable PWA for Business Analysts, Product Managers, Project Managers, and Scrum Masters who want measurable English speaking practice for international work.

The app is deliberately private and lightweight: no account, backend, speech recognition, or cloud database. It runs as a static site and keeps progress on the device.

## Features

- 40 practical BA/PM/Scrum Master lessons, stored separately from application code
- Days 11–18 use an Ogden Basic English-inspired vocabulary model: the 18 operators, mostly 850-word vocabulary, and necessary BA/Scrum terms
- Days 19–40 cycle through Tim Ferriss's 12 sentence frames, adapted to natural modern workplace and daily-life English
- Four sentences per lesson from Day 11 onward: three workplace situations and one everyday-life situation
- Days 19–40 visually separate the fixed grammar skeleton from replaceable parts and provide two natural alternatives for every sentence
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
python scripts/generate_audio.py --force --from-day 19 --to-day 40
```

## File structure

```text
.
├── .github/workflows/deploy.yml  # GitHub Pages deployment
├── assets/audio/                 # Generated lesson MP3 files and manifest
├── assets/icons/                 # PWA and browser icons
├── data/lessons.json             # Versioned 40-day course content
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

Every sentence has a stable `id`, full `text`, reusable `pattern`, and two contextual `examples`. Days 19–40 also include a `deconstruction` object containing the source frame, fixed skeleton, and ordered fixed/replaceable segments. Keep sentence IDs stable after release because saved practice data refers to them.

Days 11–18 follow [Ogden's 850-word list](https://zbenglish.net/sites/basic/words.html) and the [18 Basic English operators](https://zbenglish.net/sites/basic/verbs.html) as a practical writing guide. Required domain terms such as API, UAT, sprint, story, release, production, dependency, sign-off, and rollback are retained.

Days 19–40 use the 12 diagnostic sentence frames described in [Tim Ferriss's language-learning article](https://tim.blog/2007/11/07/how-to-learn-but-not-master-any-language-in-1-hour-plus-a-favor/). The frames repeat in order while the replaceable parts use current BA, PM, Scrum Master, and everyday situations.

### Modify an existing lesson

1. Edit only the relevant lesson in `data/lessons.json`.
2. Keep its `day` and existing sentence IDs stable where possible.
3. Update `contentVersion`.
4. Bump the release version in `package.json`, `index.html`, `app.js`, and `service-worker.js`.
5. Regenerate changed audio, run tests, and check the mobile UI.

### Add Day 41

1. Copy one complete lesson object in `data/lessons.json`.
2. Set `day` to `41` and provide unique, stable sentence IDs.
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
