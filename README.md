# Momentum

**Build momentum, achieve goals.** A premium, local-first task-management desktop app with a golden-black dark theme, energy-based planning, streaks, and rewarding completion moments.

Electron + React 18 + SQLite (WebAssembly) + Zustand.

---

## Download

Grab the latest build for your OS from the [**Releases**](https://github.com/fadhiilhamizan/Momentum/releases) page:

- **Windows** — `Momentum-<version> Setup.exe` (installer) or the portable `.zip`
- **macOS** — `.zip` (Apple Silicon)
- **Linux** — `.deb`, `.rpm`, or the portable `.zip`

Installed apps check GitHub Releases hourly and self-update in the background. Builds are
currently unsigned, so on first launch you may see a Gatekeeper (macOS) or SmartScreen
(Windows) warning — choose "Open anyway" / "More info → Run anyway" to proceed.

## Status

**Phases 1–4 complete** — MVP, Power Features, Intelligence, and a packaged installer.

| Area | State |
| --- | --- |
| Electron + Webpack + React scaffold | ✅ |
| SQLite (WASM) data layer + IPC bridge | ✅ |
| Task CRUD (create, edit, delete, star, complete) | ✅ |
| Today view (banner, energy grouping, overdue, completed-today) | ✅ |
| Quick energy / time-budget filtering | ✅ |
| All Tasks + Starred views (filter, sort) | ✅ |
| Streak + XP / level system | ✅ |
| Completion animation (sparkles + XP toast) | ✅ |
| Golden-black design system | ✅ |
| Keyboard shortcuts | ✅ |
| **Projects** — cards, progress rings, favorites, detail view, CRUD | ✅ (Phase 2) |
| **Task detail panel** — notes, project, due date, best time | ✅ (Phase 2) |
| **Tags & subtasks** (with progress) | ✅ (Phase 2) |
| **Recurring tasks** (daily/weekly/monthly, auto-spawn next) | ✅ (Phase 2) |
| **Focus / Pomodoro timer** with post-session review | ✅ (Phase 2) |
| **Analytics dashboard** — trend chart, project donut, 13-week heatmap, insights | ✅ (Phase 3) |
| **Reflection journaling** — daily prompts, mood, history | ✅ (Phase 3) |
| **Smart suggestions** — energy/time-aware next-task pick | ✅ (Phase 3) |
| **JSON data export** | ✅ (Phase 3) |
| Accessibility, scroll-lock, sound, confirm dialogs, autocomplete | ✅ (polish) |
| **Drag-to-reorder** tasks (All Tasks · Manual, and Projects) | ✅ (Phase 4) |
| **Desktop notifications** — permission + once-a-day briefing | ✅ (Phase 4) |
| **Onboarding welcome** + **Help & shortcuts** (`?`) | ✅ (Phase 4) |
| **Animated background, confetti, level-up, count-ups, button shine** | ✅ (Phase 4) |
| **Windows installer** (`npm run make`) + app icon + auto-update packaging | ✅ (Phase 4) |

### Recent additions

- **Command palette** (`Ctrl/Cmd + K`) — fuzzy-jump to any view, run quick actions, or search open tasks.
- **All Tasks filters** — narrow by priority, energy, project and tag (on top of status + sort).
- **Advanced options at task creation** — set notes, best time, repeat, tags and subtasks up front.
- **System theme** — Dark / Light / **System** (follows your OS appearance, live).
- **Undo on delete** — deleting a task shows an Undo toast that restores it.
- **Persistent focus timer** — a running Pomodoro session survives a reload/restart (wall-clock accurate).
- **Reflection uses SVG icons** (no emoji) and history shows mood trends.
- **Danger Zone** — wipe all local data behind a confirmation, in Settings.
- **Backups include your streak**, and import restores it.
- **Cross-platform releases** — Windows, macOS and Linux built and published automatically via GitHub Actions.

## Quick start

```bash
npm install      # install dependencies
npm start        # launch the Electron app (Forge dev, HMR)
npm run make     # build for your platform (see Distribution below)
```

## Distribution

### Releasing a new version (automated)

Commit your work, then cut a release with a version bump that tags the commit and triggers CI:

```bash
git add -A && git commit -m "…"   # the release only includes committed code
git push                          # push code + the workflow to GitHub

npm run release:patch             # 1.0.0 → 1.0.1: bumps package.json, tags, pushes the tag
# or: npm run release:minor / npm run release:major
```

Pushing the `v*` tag triggers [`.github/workflows/release.yml`](.github/workflows/release.yml),
which builds on **macOS, Ubuntu and Windows** and publishes the installers to a GitHub Release
using the built-in `GITHUB_TOKEN` (no personal access token required). Each release produces:

- **Windows** — `Momentum-<version> Setup.exe` (+ `.nupkg` / `RELEASES` Squirrel feed for auto-update) and a portable `.zip`
- **macOS** — a `.zip` (Apple Silicon)
- **Linux** — `.deb`, `.rpm`, and a portable `.zip`

The version is the single source of truth in `package.json`; the `release:*` scripts keep it
advancing so releases never get stuck at one tag.

### Building locally

`npm run make` builds for your **current** platform under `out/make/`. The app icon is generated
from `assets/logo.svg` by a pure-JS script (no native image tooling required):

```bash
node scripts/make-icon.js   # regenerates assets/icon.png + assets/icon.ico
```

> **Packaging note:** sql.js is loaded at runtime from packaged resources (not
> webpack-bundled). Forge's webpack plugin strips `node_modules` from the asar, so
> any external module must be shipped via `extraResource` and required from
> `process.resourcesPath`. Always test the `make` output, not just `npm start`.

### Auto-update

The client is wired up with [`update-electron-app`](https://github.com/electron/update-electron-app)
(free, backed by update.electronjs.org — no server to run). Packaged builds default to this
repo, so installed apps check GitHub Releases hourly and apply updates via Squirrel with no
extra configuration.

- Requires a **public** repo with **published** (non-draft) Releases — update.electronjs.org
  can't read private repos or drafts.
- If you fork, point it at your own repo by setting `MOMENTUM_UPDATE_REPO=your-user/your-repo`
  (PowerShell: `$env:MOMENTUM_UPDATE_REPO=...`) before building.
- Update activity is logged to `%APPDATA%/Momentum/momentum-main.log`.

### Code signing (avoiding SmartScreen)

Signing is env-driven — provide a Windows code-signing certificate and the installer
+ app are signed automatically:

```bash
set WINDOWS_CERT_FILE=C:\path\to\cert.pfx
set WINDOWS_CERT_PASSWORD=your-password
npm run make
```

- A standard **OV** certificate signs the binaries; SmartScreen's warning clears once
  the app builds download **reputation**.
- An **EV** certificate clears SmartScreen immediately (no reputation period).
- **Self-signed certs do _not_ clear SmartScreen** — they only prove the pipeline works.
- Certificates come from a CA (DigiCert, Sectigo, SSL.com, etc.); they can't be
  self-generated for public distribution.

### Assets

- `assets/logo.svg` — full-color badge (source of the app icon)
- `assets/logo-dark.svg` — gold flame for **dark** backgrounds
- `assets/logo-light.svg` — dark flame for **light** backgrounds
- `assets/icon.png` / `assets/icon.ico` — rendered from `logo.svg`

## Backup & restore

Settings → **Data** → **Export** writes a JSON backup of all tasks, projects, reflections
and your streak. **Import** merges a backup back in (idempotent by id / reflection date, and
it restores your streak), so it's safe to re-import or move data between machines.

Settings → **Danger Zone** → **Delete all data** wipes all local content behind a confirmation
— handy for starting fresh. Your preferences (theme, sound, etc.) are left intact.

## Architecture

```
src/
  main/                      Electron main process (Node)
    index.js                 window + IPC handlers
    preload.js               contextBridge -> window.momentum
    database.js              sql.js data-access layer (single source of DB truth)
  renderer/                  React app (browser-safe target)
    App.jsx                  routing, data loading, global shortcuts
    store/                   Zustand stores (task / project / user / ui)
    pages/                   Today, AllTasks, Starred, Projects, Analytics, ...
    components/              TaskCard, TaskInput, Sidebar, selectors, ...
    utils/                   api (IPC + localStorage fallback), date/task helpers
    styles/                  colors, themes, animations, index (design system)
```

**Data flow:** Renderer → Zustand store → `utils/api` → (Electron) IPC → main `database.js` → SQLite file. In a plain browser (e.g. the live preview) `window.momentum` is absent, so `utils/api` transparently falls back to `localStorage` — the UI stays fully functional for visual iteration.

## Why sql.js instead of better-sqlite3?

The spec calls for SQLite. `better-sqlite3` is a **native** module that must be compiled against Electron's ABI, which needs Python + MSVC build tools — not present on this machine, and no matching prebuild exists for the installed Node/Electron. `sql.js` is **real SQLite compiled to WebAssembly**: zero native compilation, the exact SQL schema is preserved, and it runs everywhere. It lives in memory and is serialized to `momentum.sqlite` in the user-data directory after each mutation (debounced) and on quit.

`database.js` is deliberately the *only* place that touches the engine, so swapping in `better-sqlite3` later (if build tools are installed) means changing that one file — the exported function surface stays identical.

## Data location

- **Database:** `%APPDATA%/Momentum/momentum.sqlite` (Windows)
- **Settings:** `electron-store` (`momentum-settings.json` in the same folder)
- Everything is local. No accounts, no cloud, no telemetry.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + K` | Command palette (search + jump) |
| `Ctrl/Cmd + N` | New task (jump to Today, focus input) |
| `Ctrl/Cmd + T` | Today view |
| `Ctrl/Cmd + Shift + P` | Projects |
| `Ctrl/Cmd + Shift + A` | Analytics |
| `Ctrl/Cmd + ,` | Settings |
| `Space` | Focus the task input |
| `Enter` | Add task (from input) |
| `Escape` | Blur / close a dialog or focus session |
| `?` | Help & shortcuts |
| Click a task | Open its details |
