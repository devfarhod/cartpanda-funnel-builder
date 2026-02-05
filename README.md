# CartPanda Funnel Builder

Visual drag-and-drop funnel builder

**Live app**: https://dazzling-semifreddo-788a90.netlify.app/

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Funnel state is saved in `localStorage` and survives refresh.

---

## Architecture

- **Next.js** – one page, everything runs on the client.
- **React Flow** – used for the canvas: drag nodes, connect them, custom node for each funnel step.
- **Zustand** – one store for nodes, edges, and all actions. Undo/redo (zundo) lives in memory only. Persist middleware sits on the outside and writes only nodes, edges, counters to localStorage, so after undo/redo the new state gets saved too. A small merge step keeps actions intact when restoring from history.
- **Layout** – funnel code under `src/features/funnel-builder/`, shared UI under `src/shared/`.

---

## Tradeoffs & what I'd do next

- **Clear all** – Would add a "Clear all" button in the toolbar to reset the canvas in one click. Not there yet.
- **Validation** – Would improve it: more rules, clearer messages, highlight problematic nodes, etc.
- **Undo/redo** – Would persist it: save history to localStorage too so undo/redo still works after refresh. Right now it's session-only.
