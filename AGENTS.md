# AGENTS.md

## Cursor Cloud specific instructions

Dead Rooms is a single, fully client-side browser game (Vite + React 19 + Phaser 3 + Tailwind 4, TypeScript). There is **no backend, database, or secrets** — all persistence (profiles, settings, stats, high scores) lives in the browser's `localStorage`. There is only one service: the Vite dev server.

Standard commands are defined in `package.json` (`dev`, `build`, `lint`, `preview`) and documented in `README.md`.

Non-obvious notes:
- The dev and preview servers are pinned to **port 43180** with `strictPort: true` (see `vite.config.ts`). If that port is already in use (e.g. a leftover dev server), startup fails hard instead of picking another port — free the port or reuse the existing server. `dev` and `preview` cannot run at the same time.
- Run the dev server as a long-lived process (e.g. in a tmux terminal), not from `install`/`start`, and reach it at `http://localhost:43180/`.
- `npm run build` runs `tsc -b` first, so it doubles as the type-check. The "chunks larger than 500 kB" warning from the build is expected (Phaser bundle) and is not an error.
- Manual/GUI testing: open the printed URL in a browser, click "SURVIVE" → pick room/special/difficulty → "ENTER THE ROOM", then click the canvas for focus and use WASD to move and Space to fire.
