<div align="center">

# Momentum

**Build momentum, achieve goals.**

A premium, local-first task manager for the desktop: energy-based planning, streaks, focus sessions, and rewarding completion moments, wrapped in a calm golden-black interface.

[![CI](https://github.com/fadhiilhamizan/Momentum/actions/workflows/ci.yml/badge.svg)](https://github.com/fadhiilhamizan/Momentum/actions/workflows/ci.yml)
[![Latest release](https://img.shields.io/github/v/release/fadhiilhamizan/Momentum)](https://github.com/fadhiilhamizan/Momentum/releases)
[![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://github.com/fadhiilhamizan/Momentum/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)

</div>

![Momentum — Today view](docs/screenshots/today.png)

Momentum helps you plan by how you actually feel, matching tasks to your energy and the time you have rather than drowning you in a flat to-do list. Everything lives on your device: no accounts, no cloud, no tracking.

## Features

**Plan & organize**

- **Natural-language quick add:** type `Draft report tomorrow 3pm #work !high` and Momentum parses the due date, time, tags, and priority for you.
- **Rich tasks:** priority, energy level, time estimate, best time of day, notes, tags, and a due date with an optional time.
- **Nested subtasks:** checklist steps that can nest into sub-steps and carry their own due dates.
- **Dependencies:** mark a task as *waiting on* others; blocked tasks are clearly flagged and kept out of suggestions.
- **Recurring tasks:** daily, weekdays, weekly, every two weeks, monthly, or the last day of the month.
- **Projects:** group work into colour-coded projects with progress rings and favourites.
- **Filter, sort & organize:** filter by priority, energy, project, or tag; drag to reorder; bulk-complete/delete/reproject; one-click undo.

**Plan by energy & time**

- Energy-based grouping and an **"I have X minutes"** quick filter on the Today view.
- A smart **momentum pick** that suggests the best next task for your current energy and time, and never one that's still blocked.
- Overdue, due-today, and completed-today at a glance, with a rotating, context-aware nudge.

**Calendar**

- A week-at-a-glance view of everything with a due date. **Drag tasks between days** to reschedule, or add one to any day inline.

**Focus**

- A built-in **Pomodoro timer** with short/long breaks and a gentle post-session review. A running session survives a reload or restart, wall-clock accurate.

**Stay motivated**

- **Streaks** with milestones, **XP & levels**, and celebratory sparkles/confetti on completion.
- A **weekly goal** with an end-of-week review, plus daily **reflection journaling** with mood tracking.

**Insight**

- Completion trend, a 13-week activity heatmap, a by-project breakdown, mood-over-time, and plain-language insights (*"You're most productive on Tuesdays"*).

**Reminders & notifications**

- Desktop reminders when a timed task comes due, with a configurable lead time, plus an optional once-a-day briefing of what matters most.

**Fast & keyboard-first**

- A **command palette** (`Ctrl`/`Cmd` + `K`) to jump anywhere or search tasks, with shortcuts throughout.
- Dark, light, or **system** theme; configurable week-start and 12/24-hour time.

**Private & portable**

- **Local-first:** your data never leaves your device.
- JSON **export/import** and optional **auto-backup** to a folder of your choice.
- Runs on **Windows, macOS, and Linux** with automatic background updates.

## Screenshots

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/calendar.png" alt="Calendar — week view with drag-to-reschedule" /></td>
    <td width="50%"><img src="docs/screenshots/all-tasks.png" alt="All Tasks — filter, sort, and bulk actions" /></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/screenshots/projects.png" alt="Projects — colour-coded with progress rings" /></td>
    <td width="50%"><img src="docs/screenshots/analytics.png" alt="Analytics — trends, heatmap, and insights" /></td>
  </tr>
</table>

## Download

Grab the latest build for your OS from the [**Releases**](https://github.com/fadhiilhamizan/Momentum/releases) page:

| Platform | Files |
| --- | --- |
| **Windows** | `Momentum-<version> Setup.exe` (installer) or the portable `.zip` |
| **macOS** | `.zip` (Apple Silicon) |
| **Linux** | `.deb`, `.rpm`, or the portable `.zip` |

Installed apps check for updates in the background and self-update. Builds are currently unsigned, so on first launch you may see a Gatekeeper (macOS) or SmartScreen (Windows) warning; choose **Open anyway** / **More info → Run anyway** to proceed.

## Tech stack

Electron · React 18 · Zustand · React Router · Recharts · date-fns · SQLite (via [sql.js](https://sql.js.org) / WebAssembly). Tooling: Vitest, ESLint, TypeScript type-checking (JSDoc), and GitHub Actions CI.

## Development

```bash
npm install      # install dependencies
npm start        # launch the app in dev (Electron Forge + Webpack, with HMR)
```

Quality checks (all run in CI on every push and pull request):

```bash
npm run lint         # ESLint
npm run typecheck    # TypeScript (checks .d.ts + files opted-in with // @ts-check)
npm test             # Vitest: pure helpers, a data-layer contract test, and migrations
```

### Architecture

```text
src/
  main/            Electron main process (Node)
    index.js         window, IPC handlers, auto-update, auto-backup
    preload.js       contextBridge to window.momentum
    database.js      sql.js data-access layer with versioned migrations
  renderer/        React app (browser-safe build)
    App.jsx          routing, data loading, global shortcuts
    store/           Zustand stores (task / project / user / ui / focus)
    pages/           Today, Calendar, All Tasks, Projects, Analytics, ...
    components/      TaskCard, TaskInput, SubtaskEditor, FocusTimer, ...
    utils/           api (IPC + localStorage fallback), date & task helpers
    styles/          colours, themes, animations, design system
  shared/          isomorphic helpers used by both processes (recurrence, subtasks)
  types.d.ts       canonical Task / Project / Reflection type definitions
```

**Data flow:** Renderer → Zustand store → `utils/api` → (Electron) IPC → `database.js` → SQLite file. In a plain browser (e.g. a live preview) the `window.momentum` bridge is absent, so `utils/api` transparently falls back to `localStorage`, keeping the UI fully functional for visual iteration.

SQLite runs as **real SQLite compiled to WebAssembly** (sql.js), so there's no native build step: it works everywhere, preserves the exact schema, lives in memory, and is serialized to `momentum.sqlite` after each mutation and on quit. `database.js` is the single place that touches the engine.

## Building & releasing

Build for your current platform:

```bash
npm run make     # produces installers under out/make/
```

Cut a release (bumps `package.json`, tags, and pushes; the version is the single source of truth):

```bash
npm run release:patch   # or release:minor / release:major
```

Pushing the `v*` tag triggers [`.github/workflows/release.yml`](.github/workflows/release.yml), which builds on macOS, Ubuntu, and Windows and publishes the installers to a GitHub Release using the built-in `GITHUB_TOKEN`, so no personal token is required.

**Auto-update** is wired up with [`update-electron-app`](https://github.com/electron/update-electron-app) (backed by update.electronjs.org, no server to run). It requires a public repo with published Releases. **Code signing** is env-driven: set `WINDOWS_CERT_FILE` / `WINDOWS_CERT_PASSWORD` before building to sign Windows binaries.

## Your data

- **Database:** `%APPDATA%/Momentum/momentum.sqlite` (Windows) and the equivalent user-data directory on macOS/Linux.
- **Settings:** stored via `electron-store` alongside the database.
- **Backup & restore:** Settings → **Data** exports/imports everything (tasks, projects, reflections, and your streak) as JSON, safe to move between machines. Enable **Auto-backup** to write a dated JSON snapshot to a folder on every quit.
- **Reset:** Settings → **Danger Zone** wipes all local content behind a confirmation, leaving your preferences intact.

Everything is local. No accounts, no cloud, no telemetry.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl`/`Cmd` + `K` | Command palette (search & jump) |
| `Ctrl`/`Cmd` + `N` | New task |
| `Ctrl`/`Cmd` + `T` | Today |
| `Ctrl`/`Cmd` + `Shift` + `P` | Projects |
| `Ctrl`/`Cmd` + `Shift` + `A` | Analytics |
| `Ctrl`/`Cmd` + `,` | Settings |
| `Space` | Focus the task input |
| `Enter` | Add the task |
| `Esc` | Close a dialog or focus session |
| `?` | Help & shortcuts |

## License

[MIT](LICENSE) © Fadhil
