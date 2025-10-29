# hi-introvert — web (DOM)

A lean browser chatroom + top-view for the companion, built with React + Vite.

What it shows
- Chatroom (left: top-view canvas, right: messages)
- Top-view renders entities as circles; color reflects emotion valence
- Uses a small BrowserChatRuntime (no Node APIs)

Dev
```bash
cd hi-introvert/web
npm i
npm run dev   # http://localhost:5173
```

Notes
- Relies on `@v1b3x0r/mds-core` from the repo. If local linking is needed, run `npm run build` at repo root to ensure `dist/` is fresh.
- This runtime is minimal: no sensors/persistence; uses `World` + transcript only.
- You can swap the minimal materials in `src/web-runtime/BrowserChatRuntime.ts` with real `.mdm` later by bundling JSON.

