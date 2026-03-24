# Persian Language Support

## Document Purpose

This document stores the feature context for introducing Persian (`fa`) as a supported target translation language in MeetCaptioner.

This feature is intentionally separated from static direction support. Direction infrastructure is handled in a different branch so Persian language support can build on a cleaner base.

## Metadata

- Feature status: In Review
- Branch: `feature/add-persian-language-support`
- Created on: 2026-03-24
- Tracking issue: `#10`
- Tracking pull request: `#11`
- Dependency note: depends on direction-support work tracked in issue `#8` and PR `#9`

## Executive Summary

The goal of this feature is to add Persian as a supported target language across the translation flow.

This includes:

- target-language selection
- prompt language resolution
- end-to-end translation flow support

This feature does not own direction infrastructure. It should consume the direction system from the separate direction-support branch.

## Why This Feature Exists

- Persian is a valid target translation need for real-time meeting assistance
- product support for Persian should be explicit and testable
- once direction infrastructure exists, Persian support becomes safer to add without one-off UI hacks

## Scope

## In Scope

- add `fa` to shared language metadata
- expose Persian anywhere target languages are selectable or resolved
- validate live translation flow with Persian target language

## Out Of Scope

- full product localization into Persian
- standalone RTL infrastructure design
- platform expansion beyond Google Meet

## Technical Notes

- this feature should be implemented after the static direction support branch is in a usable state
- the preferred implementation path is to update the shared language metadata module instead of patching multiple duplicated constants
- while PR `#9` is unmerged, this branch should stay rebased on top of the direction-support branch to minimize conflicts
- translation UX changes required by the Persian flow now live in this branch because target-language switching and manual re-translation needed to behave correctly for RTL/LTR transitions

## Planned Phases

## Phase 0: Planning

- Status: Completed

## Phase 1: Add Persian To Shared Language Metadata

- Status: Completed
- Tasks:
  - add `{ code: "fa", name: "Persian", direction: "rtl" }`
  - verify consumers automatically receive the new language

## Phase 2: Validate End-To-End Translation Flow

- Status: Completed
- Tasks:
  - select Persian in live UI
  - validate prompt language resolution
  - test translation rendering with the direction-support infrastructure already in place

## Phase 3: Translation UX Hardening

- Status: Completed
- Tasks:
  - clear stale translations before manual re-translation requests
  - auto-start translation when the target-language dropdown changes
  - protect the UI from stale async responses overwriting newer translations

## Phase 4: Settings Validation And Review Feedback

- Status: Completed
- Tasks:
  - update OpenAI settings validation to use model lookup instead of a generation request
  - address Copilot review feedback around translation-state cleanup and request/response typing
  - align the PR description with the actual implementation scope

## Manual QA Checklist

- build the extension with `pnpm build`
- load `.output/chrome-mv3` in `chrome://extensions`
- verify `Persian` appears in the target-language dropdown
- verify selecting `Persian` immediately starts translation for existing captions
- verify existing translations are cleared before new responses arrive when changing target language
- verify manual `Translate` and `↻` actions also clear stale translations before the new response
- verify translated Persian text renders RTL in the overlay
- verify translation editing keeps RTL direction
- verify saved translations remain readable in history
- verify OpenAI settings save succeeds without output-limit errors when a valid key and supported model are selected

## Risks

- Persian added before direction support lands could produce a low-quality UX
- partial rollout could update one consumer but miss another if shared metadata is bypassed
- stacked-branch development can create reviewer confusion if the dependency PR is not merged first

## Progress Log

## 2026-03-24

- created the dedicated Persian support branch and feature plan
- added Persian to shared language metadata with RTL direction
- validated end-to-end Persian exposure in target-language consumers
- added static direction handling to translated surfaces through the dependency branch
- improved translation UX for language switching and manual re-translation
- updated OpenAI settings validation to avoid false output-limit failures during settings save
- addressed Copilot review feedback on translation configuration, cleanup, and typing
- opened and synced upstream PR `#11`

## Current Execution State

- Branch ready: Yes
- Planning document ready: Yes
- Implementation started: Yes
- Current completed phases: Phase 4
- Current PR status: Ready for review
- Recommended next action: merge dependency PR `#9`, then merge PR `#11`, followed by one final Persian QA pass on top of upstream `main`
