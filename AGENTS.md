# AGENTS.md

Work in a **local git clone**. Do not start Cloud Agents for this project.

Dead Rooms is a single, fully client-side browser game (Vite + React 19 + Phaser 3 + Tailwind 4, TypeScript). There is **no backend, database, or secrets**. Profiles, settings, stats, and high scores live in the browser's `localStorage`. The only process to start is the Vite dev server.

## Clone and open (once per machine)

```bash
git clone https://github.com/prkrdavis-sys/dead-rooms.git
cd dead-rooms
npm install
```

Open that folder in Cursor Desktop (**File → Open Folder**). Start Agent with the environment set to **this computer / Local**, not Cloud.

Cursor Desktop, Cursor CLI, the Agents Window on this machine, and local `/worktree` checkouts all use this same repo. After cloning, every local agent can work here.

To keep Agent local by default: **Cursor Settings → Agents → Conversation → Default Environment** → this machine.

## Commands

| Command | What it does |
| --- | --- |
| `npm install` or `npm ci` | Install dependencies |
| `npm run dev` | Vite at http://localhost:43180/ |
| `npm run build` | `tsc -b` then production build (this is the type-check) |
| `npm run lint` | oxlint |
| `npm run preview` | Production preview on the same port |

## Non-obvious notes

- Dev and preview are pinned to **port 43180** with `strictPort: true` (`vite.config.ts`). If that port is already in use, startup fails instead of picking another port — free the port or reuse the existing server. `dev` and `preview` cannot run at the same time.
- Run the dev server as a long-lived process and leave it running. Do not treat it as an install step.
- The "chunks larger than 500 kB" warning from the build is expected (Phaser bundle) and is not an error.
- Manual playtest: open the printed URL, click **SURVIVE** → pick room / special / difficulty → **ENTER THE ROOM**, click the canvas for focus, then WASD to move and Space to fire.

## Layout

- `src/ui/` — React screens, HUD, touch controls
- `src/game/` — Phaser bootstrap, scenes, animations, textures
- `src/data/` — maps, weapons, enemies, specials
- `src/lib/storage.ts` — localStorage profiles, settings, stats
- `src/lib/bus.ts` — UI ↔ game events
