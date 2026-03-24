# Static Direction Support

## Document Purpose

This document stores the execution context for introducing static, language-metadata-driven direction support into MeetCaptioner.

This feature is intentionally separated from Persian language support. Persian target-language support will be planned and implemented in a different branch.

## Metadata

- Feature status: In Progress
- Branch: `feature/add-static-direction-support`
- Created on: 2026-03-24
- Current phase status: Phase 1 completed, next phase is live-surface direction application

## Executive Summary

The goal of this feature is to make translated text render with a stable direction based on language metadata.

Direction must be:

- static
- metadata-driven
- reusable
- independent from text-content heuristics

This feature is not about adding new target languages. It is about making the UI direction-aware where translated text is displayed or edited.

## Problem Statement

The current UI does not apply explicit direction to translation surfaces. As a result:

- RTL translations may render inconsistently
- mixed-language strings can look unstable
- the codebase has no reusable direction model

## Current State

## What Exists

- Shared language metadata now exists in [language-metadata.ts](/home/mehdi/repositories/meetcaptioner/entrypoints/shared/language-metadata.ts)
- Direction metadata is already available through `getLanguageDirection`
- Existing language consumers now read from a shared source:
  - [content/constants.ts](/home/mehdi/repositories/meetcaptioner/entrypoints/content/constants.ts)
  - [options/components/constants.ts](/home/mehdi/repositories/meetcaptioner/entrypoints/options/components/constants.ts)
  - [background/utils.ts](/home/mehdi/repositories/meetcaptioner/entrypoints/background/utils.ts)

## What Is Missing

- No translation surface uses `dir` from language metadata yet
- No translation edit surface uses `dir` from language metadata yet
- History translation rendering is not direction-aware yet

## Product Goals

- translated output should render with explicit `ltr` or `rtl`
- translation editing should preserve the same direction as translation display
- the implementation should support future RTL languages without scattered special cases

## Non-Goals

- adding Persian language support in this branch
- full UI mirroring
- changing original caption direction
- text-content-based direction detection

## Technical Design

## Source Of Truth

Direction is derived from the shared language metadata module.

Expected shape:

```ts
type LanguageDirection = "ltr" | "rtl";
```

## Direction Resolution Strategy

- Use target language code as input
- Resolve `ltr` or `rtl` via shared helper
- Fallback to `ltr` for unknown codes

## Direction Application Scope

## In Scope

- live overlay translated text
- live overlay translation edit textarea
- translation-specific wrappers if needed
- history translation cells

## Out Of Scope

- original caption text blocks
- popup content
- global layout reversal

## File Impact Forecast

## Already Changed In Phase 1

- `entrypoints/shared/language-metadata.ts`
- `entrypoints/content/constants.ts`
- `entrypoints/options/components/constants.ts`
- `entrypoints/background/utils.ts`
- `entrypoints/background/constants/index.ts`

## Likely To Change Next

- `entrypoints/content/render.ts`
- `entrypoints/content/caption-ui.ts`
- `entrypoints/history/components/session-detail.tsx`
- possibly translation-related content styles if explicit selectors are needed

## Execution Phases

## Phase 0: Planning

- Status: Completed
- Goal: preserve scope and execution context in-repo

## Phase 1: Shared Metadata Foundation

- Status: Completed
- Goal: remove duplicated language configuration and establish reusable direction metadata
- Technical outputs:
  - shared language metadata module
  - reusable `getLanguageDirection`
  - existing language consumers migrated to the shared source

## Phase 2: Apply Direction To Live Translation Surfaces

- Status: Completed
- Goal: make live overlay translations direction-aware
- Technical tasks:
  - resolve direction from current `targetLanguage`
  - apply `dir` to translation display node
  - apply `dir` to translation edit textarea
  - confirm no regression for LTR languages

## Phase 3: Apply Direction To History Translation Surfaces

- Status: Completed
- Goal: make saved translations readable with stable direction in history UI
- Technical tasks:
  - apply direction to translation column
  - verify mixed text readability
  - confirm original captions remain unchanged
- Current implementation note:
  - history uses the currently saved `targetLanguage` from settings as the static direction source because translation direction is not yet persisted per session

## Phase 4: Verification And Cleanup

- Status: Planned
- Goal: build validation and code cleanup
- Technical tasks:
  - run build
  - review direction usage coverage
  - remove dead code if found

## Acceptance Criteria

- live overlay translation display uses static direction from language metadata
- translation edit textarea uses static direction from language metadata
- LTR languages continue rendering correctly
- history translation display uses intended direction behavior
- no hardcoded single-language hacks are required to make the feature work

## Risks

## Risk 1: Direction Applied To Wrong Surface

Mitigation:
Limit application to translated surfaces only.

## Risk 2: Mixed-Language Rendering Still Looks Awkward

Mitigation:
Apply `dir` at the correct node level and validate with realistic mixed content.

## Risk 3: History Direction Ambiguity

Mitigation:
If current target language is not a sufficient proxy for saved history rendering, revisit whether translation language or direction should be persisted later.

## Progress Log

## 2026-03-24

- created branch for static direction support
- completed planning split from Persian language support
- completed Phase 1 shared metadata foundation
- completed Phase 2 live translation direction support
- completed Phase 3 history translation direction support using current settings as the direction source

## Current Execution State

- Branch ready: Yes
- Planning document ready: Yes
- Implementation started: Yes
- Current completed phase: Phase 3
- Recommended next action: Execute Phase 4 for verification and cleanup
