# BA English Speaking Trainer

A mobile-first, installable PWA for senior Business Analysts, Project Managers, and Scrum Masters who want measurable English speaking practice for international banking and IT work.

The MVP is deliberately small: no account, backend, speech recognition, or cloud database. It runs as a static site and keeps progress on the device.

## Features

- 30 practical BA/PM/Scrum Master lessons, stored separately from application code
- Sentence-by-sentence practice with patterns and workplace examples
- Active training timer that pauses when the app is not visible
- Timed speaking challenge with personal-best tracking
- Recall review of previously learned patterns
- Real Work Hit tracking for expressions used in meetings
- Daily score, streak, training time, score trend, and personal bests
- Review mode that never changes historical scores
- Local JSON export/import and confirmed full reset
- Installable PWA with offline application shell and network-first lesson updates
- Repository-subpath-safe relative URLs for GitHub Pages

## Local development

The app must be served over HTTP because browsers block JSON fetches and service workers from `file://` pages.

With Python:

```bash
python -m http.server 4173
```

Then open <http://localhost:4173>.

Run the zero-dependency logic tests with Node.js 18 or later:

```bash
node --test tests/logic.test.js
```

## File structure

```text
.
├── .github/workflows/deploy.yml  # GitHub Pages deployment
├── assets/icons/                 # PWA and browser icons
├── data/lessons.json             # Versioned 30-day course content
├── tests/logic.test.js           # Scoring, streak, and migration tests
├── app.js                        # UI, timers, navigation, and persistence
├── index.html                    # Semantic app shell
├── logic.js                      # Pure scoring/state/date functions
├── manifest.json                 # PWA metadata
├── service-worker.js             # Offline cache and update strategy
└── styles.css                    # Mobile-first product UI
```

## Lesson content

`data/lessons.json` has a top-level `contentVersion` plus a `lessons` array. Each lesson contains:

- `day`, `topic`, and `scenario`
- `speakingLogic`
- `sentencePatterns` and `examples`
- one or more `sections`, each containing sentence objects
- `speakingChallenge`

Every sentence has a stable `id`, the full `text`, a reusable `pattern`, and contextual `examples`. Keep sentence IDs stable after release because saved practice data refers to them.

### Modify an existing lesson

1. Edit only the relevant lesson in `data/lessons.json`.
2. Keep its `day` and existing sentence IDs stable where possible.
3. Update `contentVersion` (for example, `2026.10.01`).
4. Update `CACHE_VERSION` in `service-worker.js` when shipping a release.
5. Validate the JSON and test locally.

### Add Day 31

1. Copy one complete lesson object in `data/lessons.json`.
2. Set `day` to `31` and provide unique, stable sentence IDs within that lesson.
3. Update `contentVersion`.
4. Change the expected lesson count in `app.js` and any `30` display labels to the new programme length.
5. Update tests and this README, then bump the service-worker cache version.

## Scoring

The maximum daily score is 100:

- Sentence completion: 30 points, proportional to sentences practiced
- Speaking challenge: 5 points below 30 seconds, 10 at 30–44, 20 at 45–59, and 30 at 60+
- Recall review: 10 points for each of two recalled patterns; the first lesson receives 20 introductory points
- Real Work Hit: 0 points for none, 10 for one, and 20 for two or more

A score of 70 or above completes the day. A date can increase the streak only once, even if multiple lessons are completed or retried on that date.

## Local progress and privacy

State is saved under `ba-speaking-trainer:v1` in `localStorage` with this versioned shape. Training seconds are also recorded in a local-date ledger so Today and This Week remain accurate when a lesson spans more than one date:

```js
{
  version: 1,
  createdAt: "...",
  progress: {},
  stats: { totalTrainingSeconds: 0, trainingByDate: {} },
  settings: {}
}
```

Application and content updates do not clear this key. Settings provides JSON export, validated import, and a confirmed reset. Data does not leave the device unless the user explicitly downloads a backup.

## GitHub Pages deployment

The included workflow deploys the repository root on pushes to `main` or `master`.

1. In the GitHub repository, open **Settings → Pages**.
2. Under **Build and deployment**, select **GitHub Actions**.
3. Push to `main` or run **Deploy static PWA to GitHub Pages** manually from the Actions tab.

All runtime paths start with `./`, so the app works at a project URL such as:

```text
https://wilsonchung818-spec.github.io/project_code/
```

## PWA updates and stale-cache troubleshooting

The service worker uses a named, versioned cache. During installation it reloads the application shell from the network instead of copying potentially stale browser-cache entries. HTML/CSS/JS are then served cache-first for reliable offline startup, and navigation requests fall back to cached `index.html` so query-string routes also reload offline. `data/lessons.json` is network-first, so updated lessons are fetched when online and the previous copy remains the offline fallback.

For every deployed app release:

1. Change `CACHE_VERSION` in `service-worker.js`.
2. Update `contentVersion` if lesson content changed.
3. Deploy normally. The new service worker installs, activates immediately, and removes old `ba-speak-*` caches.

If a device still shows stale content, close all installed-app/browser tabs and reopen the app. As a last resort, clear site data or unregister the service worker in browser developer tools. Export progress first if clearing site data, because that also removes `localStorage`.

## Security note

Never store GitHub tokens, API keys, passwords, or other credentials in this repository. Use the existing authenticated Git environment, environment variables, or GitHub Actions secrets. `.env` files and common local artifacts are ignored by `.gitignore`.

## MVP limitations

- No speech recognition or pronunciation scoring
- No cloud sync or multi-device account
- Training records use the device’s local date and time
- Browser storage can be removed by the user or operating system, so regular JSON exports are recommended
