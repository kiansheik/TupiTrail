
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Legal & Branding Notice

This project is not affiliated with, endorsed by, or connected to Duolingo, Inc. All references to language learning flows are generic and not intended to imply association. For more information and the official project, visit: [https://tama.academiatupi.com](https://tama.academiatupi.com)


## Commands

```bash
# Development
make dev                        # Start dev server (sets VITE_LEXICON_TARGET_LANG=en)
make build                      # TypeScript check + Vite build
make test                       # Run all tests (vitest run)
make lint                       # ESLint

# Individual test file
npx vitest run src/core/lesson-engine/session.test.ts

# Lesson builder workflow
make import-lesson ZIP=path/to/export.zip   # Import builder ZIP into course data
make delete-lesson LESSON=unit1-my-lesson   # Remove lesson + its assets from course data

# Audio validation
make check-required-audio        # List missing audio files
make check-required-audio-strict # Fail if any required audio is missing

# Deployment
make deploy-gh-pages             # Full pipeline: lint → build → test → gh-pages
```

## Architecture: 3-Layer Design

**Core** (`src/core/lesson-engine/`) — Pure business logic, no React dependencies. Tested with Vitest.
- `types.ts` — All domain types (Exercise, UserAnswer, LessonData, etc.)
- `template-types.ts` — `LessonTemplateData` with `TextInput = string | LocalizedText` for pre-materialization fields
- `session.ts` — Queue state machine (phases: `main → review → complete`)
- `evaluator.ts` — Exercise evaluation, case-insensitive matching
- `combo.ts`, `xp.ts`, `progress.ts` — Gamification metrics

**Data** (`src/data/`) — Content and materialization layer.
- `course/en/course.ts` — Master course definition: `lessons` array + `pathNodesSeed` (map nodes) + `lessonById` lookup Map
- `course/en/unitN/lessonN.ts` — Lesson files typed as `LessonTemplateData` (not `LessonData`)
- `lexicon/materializeLesson.ts` — Converts `LessonTemplateData → LessonData`, resolving `LocalizedText` via `resolveText()`
- `lexicon/helpers.ts` — `enText()`, `ptBrText()`, `tupiText()` constructors
- Build-time lang target via `VITE_LEXICON_TARGET_LANG` env var

**App** (`src/app/`, `src/screens/`, `src/components/`, `src/store/`) — React + Zustand layer.
- `store/useAppStore.ts` — Persisted to localStorage: profile, progress, `pathNodes`, lesson resume state
- `store/useLessonSessionStore.ts` — In-memory active lesson session
- `store/migrations.ts` — Versioned store migrations (currently v5); `rebuildPathNodes` merges seed with saved state (preserves unlock/completion, drops stale nodes)
- `onRehydrateStorage` in `useAppStore` always re-syncs `pathNodes` with the seed on hydration — new lessons appear without a version bump
- `app/router.tsx` — HashRouter (GitHub Pages); all lesson routes use `/lesson/:lessonId/...`

## Key Concepts

**Lesson types: Template vs Engine**
- Lesson files in `src/data/` use `LessonTemplateData` with `TextInput = string | LocalizedText` fields
- `materializeLesson()` resolves these to plain strings for the engine
- Never type lesson data files as `LessonData` directly

**LocalizedText** is `{ value: string; lang: LanguageTag; key?: string }` — not a string union. Use `resolveText()` (not `resolveLocalizedText()`) when the field might be a plain string.

**Adding a new lesson**
Use `make import-lesson ZIP=...` — the script (`scripts/import-lesson.mjs`) fully automates patching `course.ts` (import, materializeLesson, `lessons` array, `pathNodesSeed` node). If the unit doesn't exist yet, the script creates it automatically. It also bumps `APP_STORE_VERSION` in `migrations.ts` when adding a new pathNode. Manual edits are only needed for custom node positions.

**Deleting a lesson**
Use `make delete-lesson LESSON=unit1-my-lesson` — removes the lesson file, its audio assets, and patches `course.ts` to remove the import, materialize call, lessons array entry, and pathNodesSeed node.

**Map unlock flow**
`applyLessonResult()` in `useAppStore` dynamically unlocks the next `pathNodes` entry after the completed one — no hardcoding of lesson IDs.

**Builder image storage**
Images uploaded in the lesson builder are stored in IndexedDB (not localStorage) via `src/lib/builder/imageStorage.ts`. They're referenced by UUID `imageKey` in `BuilderSelectImageOption`. The builder screen calls `migrateImagesToIndexedDB()` on mount to migrate any legacy `imageSrc` base64 data.

**Audio**
- `audio.mode === 'file'` → static file path (must exist in `public/audio/`)
- `audio.mode === 'recorded'` → builder-recorded blob in IndexedDB, exported to `audio/` folder in ZIP
- Word-level audio: keyed as `_word_${normalizedWord}` in IndexedDB; builder shows checkbox to reuse existing word audio
- Web Speech API TTS is used as fallback when no audio spec is provided

**PathMap and units**
- `PathMap` component cycles through `UNIT_PALETTES` (5 color palettes) based on `unitId` trailing number
- `LessonIntroScreen` redirects to `/map` (via `useEffect`) for unknown/stale `lessonId`s — never silently falls back to a different lesson

## Routing

HashRouter routes (key ones):
- `/` — HomeRoute: conditional redirect based on `onboardingCompleted` and `lessonResume`
- `/map` — PathMapScreen; supports `?sim=N` query param to simulate N lessons completed (for testing without replaying)
- `/lesson/:lessonId/intro` → `/run` → `/complete`
- `/lessonbuilder`, `/lessonbuilder/:builderId` — Lesson builder

## Styling

Tailwind CSS with custom theme tokens:
- Colors: `shell` (background), `ink` (text), `primary`/`primaryDark`, `accent`, `danger`, `success`
- Fonts: `font-display` (Baloo 2), default sans (Nunito)
- `shadow-chunky`, `rounded-chunky` custom utilities

The app renders inside a fixed mobile frame (`MobileFrame` component) — always design for ~390×844px portrait.

## Testing

Tests live alongside source files (`*.test.ts`). Core engine logic is well-tested; UI components are mostly untested. Run `npx vitest run` for a single pass or `npx vitest` for watch mode.
