# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A **planning workspace**, not a runnable application. The actual app (Meeting Bingo) is described in four planning docs and will be scaffolded into a `meeting-bingo/` subdirectory when the implementation plan is executed. There is no source code, build, lint, or test step yet.

The "agentic product" name refers to a workshop format: build a complete MVP from PRD → UXR → Architecture → Implementation Plan → execution, with each artifact reviewed before the next is written.

## The four planning docs (authority order)

These supersede each other when they conflict:

1. **`meeting-bingo-implementation-plan.md`** — authoritative. Contains a `Review Summary` table of 17 deltas already applied to override Architecture / PRD decisions (e.g., drop `GameContext`, merge `useBingoDetection` into `useGame`, one-shot `bounce-in` instead of permanent `animate-pulse`, `shouldListenRef` for Strict Mode safety, toast coalescing rules). Always check this table before quoting a design decision from one of the earlier docs.
2. **`meeting-bingo-architecture.md`** — file tree, full TypeScript interfaces, reference implementations (cardGenerator, bingoChecker, wordDetector, useSpeechRecognition). The file tree shows `useBingoDetection.ts` and `GameContext.tsx` that the Implementation Plan explicitly removes — do not create them.
3. **`meeting-bingo-prd.md`** — user stories with P0/P1/P2 acceptance criteria. P0 = must ship; P1 = high value, addable in <5min each; P2 = drop if time.
4. **`meeting-bingo-uxr.md`** — personas, journey, key moments. Several UI requirements are load-bearing: silent by default (no sound effects, user is in a meeting), the privacy line "Audio processed locally. Never recorded." must precede the mic permission prompt, near-bingo state must be surfaced with distinct visual.

## Linear is the source of truth for execution

The implementation plan has been broken into Linear issues `ALE-5` through `ALE-26` in the **Meeting Bingo MVP** project on the `Alex-test123123` team. When work starts, read issues from Linear rather than re-deriving from the markdown — the issues already encode the dependency graph, label taxonomy (`phase-1-foundation` … `phase-5-polish`, `P0`/`P1`/`P2`, `infrastructure`/`logic`/`ui-component`/`hook`/`deploy`), and per-file scoping (each issue fits under 150k tokens of context).

When making non-trivial changes to the plan or scope, update both the markdown and the corresponding Linear issues — they are intentionally kept in sync.

## The `plan-review-skill`

A project-installed skill at `.claude/skills/plan-review-skill/` that spawns three parallel VP reviewers (Product, Engineering, Design) to audit a plan, then asks the user how to apply the findings. Invoke when reviewing new plan docs or proposed architecture changes — it's how the 17 review deltas in the Implementation Plan were generated. The skill is a thin dispatcher; full workflow lives in `agent-prompt.md` and runs in a subagent so it doesn't bloat the main context.

## Local permissions

`.claude/settings.local.json` pre-approves the Linear MCP write tools (`save_project`, `save_issue`, `save_document`, `save_status_update`, label create/list) and `gh api *`. Other tools still prompt. When the meeting-bingo app is scaffolded, expect to want to add `npm`, `vite`, `tsc` allowlist entries to this file.
