# Dead Rooms

A 2.5D wave-survival shooter for the browser, inspired by the old Flash rooms of *Boxhead* — original names, original layout, original art mix. Pick a sealed room, pick a special, and last as long as you can.

It is a self-contained **Progressive Web App**. You can install it to a phone home screen and play offline after the first load.

## Play

```bash
npm install
npm run dev
```

Open the printed local URL (default **http://localhost:43180**).

Production build:

```bash
npm run build
npm run preview
```

### Add to a phone home screen

- **iPhone / iPad:** Safari → Share → Add to Home Screen.
- **Android:** Chrome menu → Install app / Add to Home Screen.
- Desktop Chrome can install it as a standalone window too.

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Move | WASD or arrows | Left stick |
| Fire the way you are walking | Space | Fire |
| Special (chosen before the run) | Shift | Special |
| Weapons 1–10 | Keys `1`–`9` and `0` | Weapon strip |
| Pause | P or Esc | Pause |

Charge Packs (`9`): tap fire to plant, **hold fire** to detonate. Explosions hurt you.

## What’s in a run

- Five rooms: Warehouse, Corridors, Four Courts, The Strip, Castle.
- Difficulty slider scales how many hostiles come per wave.
- Ten loadout slots from the start (pistol is the only infinite ammo). Ammo crates and health packs drop. A later update can unlock weapons as drops; the data is already structured for that.
- Three specials: Burst Dash, Red Flare, Riot Stomp.
- Six hostiles with readable tells (library has lore + stats).
- Gore slider (0–100). Phones cap particle count so the floor can get ugly without dropping the frame rate.
- Local profiles, local stats, local high-water marks. Nothing is uploaded.

## Credits

Art and interface/gun audio by [Kenney](https://kenney.nl) (CC0). Menu music stays a synthesized drone; a second synthesized pulse plays during levels so the install stays small. Full notes in [ATTRIBUTION.md](ATTRIBUTION.md).

## Deploy (GitHub + Vercel)

- GitHub: [prkrdavis-sys/dead-rooms](https://github.com/prkrdavis-sys/dead-rooms)
- Production: [dead-rooms.vercel.app](https://dead-rooms.vercel.app)
- Dashboard: [Vercel project](https://vercel.com/hughs-projects-ca410e96/dead-rooms)

GitHub is connected, so later pushes to `main` deploy automatically. Manual deploy:

```bash
npx vercel --prod --yes
```
