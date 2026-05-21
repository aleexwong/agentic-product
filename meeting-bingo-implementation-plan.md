# Meeting Bingo — Implementation Plan

**Based on**: Architecture v1.0, PRD v1.0, UXR v1.0  
**Target**: 90-minute MVP  
**Stack**: React 18 + TypeScript + Vite + Tailwind CSS + Web Speech API  

---

## Review Summary

Reviewed: 2026-05-21 | Reviewers: VP Product, VP Engineering, VP Design

### Changes Applied

| # | Change |
|---|--------|
| 1 | Drop `GameContext.tsx`: use `App.tsx`-level `useState` as shown in architecture. Removed from dependency graph and Phase 2.2. |
| 2 | Replace permanent `animate-pulse` on `isAutoFilled` with one-shot `animate-bounce-in` keyframe (already defined in tailwind.config) — clears after playing. |
| 3 | Specify `alreadyFilledSet` in Phase 4.2: derive as `useMemo(() => new Set(filledWords), [game.card])` inside `GameBoard`; eliminates stale closure risk. |
| 4 | Add minimal ARIA to `BingoSquare` (`aria-label` per square) and `role="grid"` on `BingoCard` container. |
| 5 | Disable hover/active scale transforms on Free Space square via conditional class (`isFreeSpace && 'hover:scale-100 active:scale-100'`). |
| 6 | CategorySelect shows card preview with "Regenerate" + "Start Game" buttons instead of immediate transition — satisfies PRD US-1.3 AC. |
| 7 | Add `clsx` and `tailwind-merge` to dependencies for correct Tailwind class deduplication in `cn()`. |
| 8 | Near-bingo state uses pulsing yellow border; auto-fill uses `bounce-in` animation — two distinct visuals for two distinct events. |
| 9 | Move `recognition.start()` out of `setState` updater in `onend` handler; use a `useRef` flag to track desired listening state safely. |
| 10 | Toast: max 3 visible, newest-on-top, 2.5s auto-dismiss, coalesce multiple detections from one sentence into a single toast. |
| 11 | Rebalance Phase 1 to 25 min, Phase 2 to 25 min; buzzword pack authoring called out as parallelizable pre-work. |
| 12 | Note added: `useBingoDetection.ts` from architecture file tree intentionally merged into `useGame.ts` to reduce hook count. |
| 13 | Add `@types/canvas-confetti` to `devDependencies` — required to pass `tsc` build step. |
| 14 | `buildShareText` uses `window.location.href` instead of hardcoded URL; note to update slug after first Vercel deploy. |
| 15 | LandingPage note: "Join Game" omitted intentionally — multiplayer explicitly out of scope per PRD §2.2. |
| 16 | Resolved color token conflict: `blue-500` (#3b82f6) is the canonical filled-square background; `--filled-square: #dbeafe` reference removed. |
| 17 | Home/New Card buttons show confirmation dialog or undo snackbar before calling `resetGame` to prevent accidental data loss on mobile. |

### Unresolved Items

- [ ] Join Game / multiplayer flow — deferred to post-MVP (PRD §2.2 explicit out-of-scope)
- [ ] Custom buzzword lists — deferred to post-MVP backlog
- [ ] Dark mode — P2, drop if time

---

## Phase 1: Project Foundation (25 min)

### 1.1 Scaffold
```bash
npm create vite@latest meeting-bingo -- --template react-ts
cd meeting-bingo
npm install canvas-confetti clsx tailwind-merge
npm install -D tailwindcss postcss autoprefixer @types/canvas-confetti
npx tailwindcss init -p
```

### 1.2 Config files
- `tailwind.config.js` — add `content` glob, extend with `bounceIn` keyframe and `pulse-fast` animation
- `vite.config.ts` — set `server.port: 3000`, enable `sourcemap` in build
- `tsconfig.json` — default from template is fine

### 1.3 Files to create (in order)
1. `src/types/index.ts` — all interfaces (copy from architecture doc verbatim)
2. `src/data/categories.ts` — three category packs (agile, corporate, tech), 40+ words each
3. `src/index.css` — Tailwind directives only

---

## Phase 2: Core Game Logic (25 min)

### 2.1 Pure logic (no React, no UI)
Create these first so they can be tested independently:

| File | Key function | Notes |
|------|-------------|-------|
| `src/lib/cardGenerator.ts` | `generateCard(categoryId)` | Fisher-Yates shuffle; picks 24 words; FREE at [2][2] |
| `src/lib/bingoChecker.ts` | `checkForBingo(card)` | Check 5 rows + 5 cols + 2 diagonals; return first `WinningLine` or null |
| `src/lib/wordDetector.ts` | `detectWordsWithAliases(transcript, cardWords, alreadyFilled)` | Word-boundary regex for singles; substring for phrases; include alias map for CI/CD, MVP, ROI |
| `src/lib/shareUtils.ts` | `buildShareText(game)` | Use `window.location.href` for the play URL (not hardcoded); update after first Vercel deploy |
| `src/lib/utils.ts` | `cn(...classes)` | Use `clsx` + `tailwind-merge` for correct Tailwind class deduplication |

### 2.2 React state
- **No `GameContext`** — keep all game state in `App.tsx` via `useState` (matches architecture reference code; avoids dual-authority with `useGame`)
- `src/hooks/useGame.ts` — game state machine (`idle → setup → playing → won`); calls `checkForBingo` on every fill; exposes `handleSquareClick(row, col)`. Note: `useBingoDetection.ts` from the architecture file tree is intentionally merged here to reduce hook count.
- `src/hooks/useLocalStorage.ts` — generic `useLocalStorage<T>(key, defaultValue)` hook; persist `GameState` across refreshes

---

## Phase 3: UI Screens (build in screen-flow order)

### 3.1 Shared primitives
- `src/components/ui/Button.tsx` — variant prop: `primary | secondary | ghost`
- `src/components/ui/Card.tsx` — wrapper div with border + shadow
- `src/components/ui/Toast.tsx` — auto-dismiss notification; max 3 visible, newest-on-top, 2.5s dismiss; coalesces multi-word detections into one toast

### LandingPage note
"Join Game" CTA is intentionally omitted — multiplayer is explicitly out of scope for MVP per PRD §2.2.

### 3.2 LandingPage (`src/components/LandingPage.tsx`)
UXR requirement: first impression must immediately communicate the concept.
- Headline: "Turn any meeting into a game"
- Subtext: "Auto-detects buzzwords using speech recognition"
- Large "New Game" CTA
- Privacy line: "Audio processed locally. Never recorded." — this is trust-critical per UXR
- How It Works: 4-step list (pick category → enable mic → join meeting → watch squares fill)

### 3.3 CategorySelect (`src/components/CategorySelect.tsx`)
- Three cards: Agile 🏃 / Corporate 💼 / Tech 💻
- Each card shows category name, description, and 3–4 sample words (preview reduces decision paralysis per UXR)
- Selecting a category shows a card preview with "Regenerate Card" + "Start Game" buttons — satisfies PRD US-1.3 AC ("Can regenerate card before starting game")

### 3.4 BingoSquare (`src/components/BingoSquare.tsx`)
States to style distinctly:
- Default: white bg, gray border, hover lifts
- Filled (manual): blue-500 bg, white text, strikethrough word
- Auto-filled: same as filled + `animate-bounce-in` on fill (one-shot keyframe, not `animate-pulse` which persists)
- Free space: amber-100 bg, star icon, non-interactive — **disable hover/active scale transforms** (`isFreeSpace && 'hover:scale-100 active:scale-100'`)
- Winning square: green-500 bg + ring

### 3.5 BingoCard (`src/components/BingoCard.tsx`)
- 5×5 CSS grid with `role="grid"` for screen readers
- Passes `isWinningSquare` prop down (derived from `winningLine.squares`)
- Passes `onClick` that calls `handleSquareClick(row, col)`
- Each `BingoSquare` gets `aria-label` (e.g., `"Sprint, filled"` / `"Backlog, not filled"`)

### 3.6 GameBoard (`src/components/GameBoard.tsx`)
Header row: logo | listening indicator | "X/24 filled" counter  
Body: `<BingoCard>` + `<TranscriptPanel>`  
Footer: "New Card" button + "Start/Stop Listening" toggle

Near-bingo UX (UXR critical moment): when any line has 4/5 filled, show "⚡ One away!" badge and apply a **pulsing yellow border** to the incomplete squares — distinct from the `bounce-in` used for auto-fill.

### 3.7 WinScreen (`src/components/WinScreen.tsx`)
- Confetti fires on mount via `canvas-confetti`
- Show the filled card with winning line highlighted green
- Stats: time to BINGO, winning word, squares filled, category
- "Share Result" button → calls `buildShareText`, copies to clipboard (falls back to `navigator.share` on mobile)
- "Play Again" → back to CategorySelect; "Home" → landing with **confirmation dialog** ("Start over? Your current game will be lost.") to prevent accidental reset on mobile

---

## Phase 4: Speech Recognition (25 min)

### 4.1 Hook (`src/hooks/useSpeechRecognition.ts`)
- Feature-detect `window.SpeechRecognition || window.webkitSpeechRecognition`; set `isSupported: false` if absent
- Config: `continuous: true`, `interimResults: true`, `lang: 'en-US'`
- Auto-restart on `onend`: use a `useRef` flag (`shouldListenRef`) to track desired state — do NOT call `recognition.start()` inside a `setState` updater (double-invoked in React Strict Mode)
- Expose: `{ isSupported, isListening, transcript, interimTranscript, error, startListening, stopListening, resetTranscript }`

### 4.2 Wiring auto-fill
In `GameBoard.tsx`:
```
useSpeechRecognition → onResult callback
  → alreadyFilledSet = useMemo(() => new Set(filledWords), [game.card])
  → detectWordsWithAliases(newTranscript, card.words, alreadyFilledSet)
  → for each detected word: fillSquare(word) + show Toast (coalesce multiple in one sentence)
  → checkForBingo after each fill → if win: transition to WinScreen
```
Toast rules: max 3 visible, newest-on-top, 2.5s auto-dismiss; if multiple words detected in a single result, group into one toast ("Sprint, Backlog detected!").

### 4.3 TranscriptPanel (`src/components/TranscriptPanel.tsx`)
- Red pulsing dot when listening, gray when paused
- Shows last ~100 chars of final transcript + italic interim text in gray
- Detected words appear as green pill badges (last 5)
- Reassures user transcription is alive (UXR: visual feedback that it's working)

### 4.4 Fallback
If `isSupported` is false: hide the "Start Listening" button entirely; show a banner "Tap squares manually — speech recognition not available in this browser." Manual tap always works regardless.

---

## Phase 5: Polish & Deploy (15 min)

### 5.1 Win celebration
```ts
import confetti from 'canvas-confetti';
confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
```
No sound by default — user is still in a meeting (UXR).

### 5.2 Share text format
```
🎯 BINGO! I won Meeting Bingo in [X] minutes!
Category: Agile & Scrum | Winning word: "Scope Creep"
Squares filled: 12/24

Play at: meetingbingo.vercel.app
```

### 5.3 localStorage persistence
On every `GameState` change, write to `localStorage['meeting-bingo-state']`. On app load, rehydrate if `status === 'playing'` (so a refresh mid-game doesn't lose progress).

### 5.4 Deploy
```bash
npm run build       # tsc + vite build
npx vercel --prod   # deploys dist/ to Vercel free tier
```

---

## Dependency Graph (what to build first)

```
types/index.ts
  └── data/categories.ts          ← pre-work: can author buzzword packs in parallel
        └── lib/cardGenerator.ts
              └── lib/bingoChecker.ts  (merged: no separate useBingoDetection.ts)
              └── lib/wordDetector.ts
              └── App.tsx [useState — no GameContext]
                    └── hooks/useGame.ts
                    └── hooks/useLocalStorage.ts
                    └── hooks/useSpeechRecognition.ts
                          └── components/ui/*
                                └── LandingPage → CategorySelect (w/ preview+regenerate) → BingoCard/BingoSquare → GameBoard → WinScreen
```

---

## Acceptance Checklist (from PRD)

### P0 — Must ship
- [ ] Card generates 24 unique words + FREE center in < 2s
- [ ] 3 category packs with 40+ words each
- [ ] Manual tap toggles square fill (and unfill)
- [ ] BINGO detected for all 12 lines (5 rows + 5 cols + 2 diagonals)
- [ ] Web Speech API transcription starts within 1s of enabling
- [ ] Auto-fill triggers within 500ms of word spoken
- [ ] Win celebration plays (confetti, winning line highlighted)
- [ ] No account or signup required

### P1 — High value
- [ ] Share button copies result text to clipboard
- [ ] localStorage persists game across refresh
- [ ] Responsive layout works on mobile

### P2 — Drop if time
- [ ] Light/dark theme toggle

---

## Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| Web Speech API unavailable (Firefox) | Feature-detect before rendering mic button; manual tap always works |
| Poor transcription accuracy | `detectWordsWithAliases` covers common acronym variations; manual fallback removes frustration |
| Time overrun | P2 features are fully droppable; P1 share/persistence are addable in < 5min each |
| Mic permission denied | Show clear privacy message before prompt; graceful message on denial |

---

## Key UX Constraints (from UXR)

1. **Silent by default** — no sound effects; user is in a meeting
2. **Privacy message is load-bearing** — show "Audio processed locally. Never recorded." before mic prompt
3. **First auto-fill is the magic moment** — animation must be unmissable but not disruptive
4. **Near-bingo state** — explicitly surface "1 away!" to keep user engaged with meeting audio
5. **Share is the viral loop** — make it one click, optimize text for Slack paste
