# Momentum

**Build momentum, achieve goals.** A premium, local-first task-management desktop app with a golden-black dark theme, energy-based planning, streaks, and rewarding completion moments.

Electron + React 18 + SQLite (WebAssembly) + Zustand.

---

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

## Quick start

```bash
npm install      # already done
npm start        # launch the Electron app (Forge dev, HMR)
npm run make     # build the installer (see Distribution below)
```

## Distribution

`npm run make` produces a Windows installer under `out/make/`:

- `squirrel.windows/x64/Momentum-<version> Setup.exe` — the installer
- `momentum-<version>-full.nupkg` + `RELEASES` — the Squirrel feed for **auto-updates**

The app icon is generated from `assets/logo.svg` by a pure-JS script (no native
image tooling required):

```bash
node scripts/make-icon.js   # regenerates assets/icon.png + assets/icon.ico
```

**Auto-update:** Squirrel packaging is already in place (`electron-squirrel-startup`
handles install/update shortcuts, and the `.nupkg`/`RELEASES` feed is produced). To
enable live updates, host `RELEASES` + the `.nupkg` files (e.g. GitHub Releases) and
point `autoUpdater.setFeedURL(...)` (or add `update-electron-app`) at that feed.

macOS/Linux targets (`maker-zip`, `maker-deb`, `maker-rpm`) are configured and build
when `make` runs on those platforms.

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
| `Ctrl/Cmd + N` | New task (jump to Today, focus input) |
| `Ctrl/Cmd + T` | Today view |
| `Ctrl/Cmd + Shift + P` | Projects |
| `Ctrl/Cmd + Shift + A` | Analytics |
| `Ctrl/Cmd + ,` | Settings |
| `Space` | Focus the task input |
| `Enter` | Add task (from input) |
| `Escape` | Blur / close |
| Double-click a task title | Inline edit |
