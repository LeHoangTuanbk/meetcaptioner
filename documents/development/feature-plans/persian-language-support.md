# Persian Language Support

## Document Purpose

This document stores the feature context for introducing Persian (`fa`) as a supported target translation language in MeetCaptioner.

This feature is intentionally separated from static direction support. Direction infrastructure is handled in a different branch so Persian language support can build on a cleaner base.

## Metadata

- Feature status: Deferred
- Branch: Not created yet
- Created on: 2026-03-24
- Dependency note: depends on shared language metadata work from the static direction support track

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

## Planned Phases

## Phase 0: Planning

- Status: Completed

## Phase 1: Add Persian To Shared Language Metadata

- Status: Not Started
- Tasks:
  - add `{ code: "fa", name: "Persian", direction: "rtl" }`
  - verify consumers automatically receive the new language

## Phase 2: Validate End-To-End Translation Flow

- Status: Not Started
- Tasks:
  - select Persian in live UI
  - validate prompt language resolution
  - test translation rendering with the direction-support infrastructure already in place

## Risks

- Persian added before direction support lands could produce a low-quality UX
- partial rollout could update one consumer but miss another if shared metadata is bypassed

## Current Execution State

- Branch ready: No
- Planning document ready: Yes
- Implementation started: No
- Recommended next action: create a dedicated Persian support branch after the direction-support work reaches a stable checkpoint

