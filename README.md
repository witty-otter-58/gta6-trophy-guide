# Leonida Trophy Guide — GTA VI (PS5)

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/witty-otter-58/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/witty-otter-58/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

A complete trophy guide for Grand Theft Auto VI on PlayStation 5, covering all 55 trophies on the road to the Platinum. Every trophy comes with a step-by-step guide, and a built-in checklist tracker keeps your progress saved in the browser.

## What it covers

- **All 55 PS5 trophies** — every trophy with a written guide, so nothing is left to guesswork.
- **Checklist tracker** — tick trophies off as you earn them; progress is saved in the browser and survives reloads.
- **Export / import** — back up your checklist to a file, or restore it on another machine.
- **Filters** — narrow the list by category, difficulty, or completion status to find what to hunt next.
- **Spoiler mode** — hide story details until you want to see them.
- **Roadmap to Platinum** — the suggested order to work through the list, so you know what to do first and what to leave for the endgame.
- **Missable flags** — trophies that can be missed are clearly marked, with what to do (or avoid) before they are gone for good.

## How to run it

The guide is plain static files in `app/` — no build step, and it works offline once loaded.

Serve the folder and open it in a browser:

```sh
node serve.ts
```

Then open <http://localhost:8080> (use `--port <n>` for a different port).

Or serve `app/` with any static server of your choice and open `index.html`.

## Build

`main.ts` (Node 22, standard library only) assembles the submission: it copies `app/` and `screenshots/` into the output folder and writes `dossier.json`.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Screenshots

See `screenshots/` — cover, roadmap, spoiler mode, and collectibles views.
