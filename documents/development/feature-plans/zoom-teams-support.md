# Zoom And Teams Support

## Document Purpose

This document stores the execution context for expanding MeetCaptioner beyond Google Meet and into browser-based Zoom and Microsoft Teams meetings.

This initiative is intentionally planned as a multi-phase feature because the current implementation is structurally tied to Google Meet selectors, URL patterns, and session metadata assumptions.

The goal of this document set is to make implementation incremental, testable, and safe to execute over multiple branches or PRs without losing architectural direction.

## Metadata

- Feature status: Planned
- Feature status: Completed
- Branch: `feature/add-zoom-teams-support`
- Created on: 2026-03-25
- Current phase status: Planned implementation completed
- Initiative type: Multi-platform expansion
- Primary target platforms:
  - Google Meet existing baseline
  - Microsoft Teams Web
  - Zoom Web App

## Executive Summary

MeetCaptioner already has a reusable core for:

- overlay rendering
- caption list management
- translation orchestration
- provider-backed translation execution
- local meeting history persistence

The current limitation is that caption discovery, guidance, and meeting metadata extraction are tightly coupled to Google Meet.

This initiative now explicitly includes four product capabilities across all supported providers:

1. provider-aware capture guidance modal
2. provider-specific caption capture and translation
3. provider-aware history storage
4. provider-aware history filtering and search

This initiative splits platform expansion into four implementation phases:

1. Provider abstraction and Google Meet migration
2. Microsoft Teams Web proof of concept and hardening
3. Zoom Web App proof of concept and hardening
4. Productization, history generalization, provider-aware search/filter, QA, and release readiness

This sequencing is designed to reduce risk. It avoids building two more platform implementations on top of a Meet-specific foundation.

## Business Context

## Why This Matters

- users increasingly split meetings across Google Meet, Teams, and Zoom
- the current product value drops to zero outside Google Meet
- multi-platform coverage materially improves install retention and product differentiation
- Bring Your Own Model translation remains useful even on platforms that already offer native captions or translation

## User Value Proposition

The expansion is not only about “showing captions” on more platforms.

The real product value across providers is:

- one consistent capture and translation experience across platforms
- one provider-aware guidance model for enabling caption capture
- one meeting history across platforms
- one translation workflow across platforms
- privacy-preserving local or user-owned AI providers
- custom prompts and model choice independent from meeting vendor controls

## Refined Product Requirements

The implementation path should explicitly satisfy these user-facing requirements:

1. when the extension detects a supported meeting provider, a capture guidance modal should be available for that provider
2. the modal should explain how to enable native caption or text capture on that provider
3. after captions are enabled, the existing capture and translation flow should continue as normal
4. the history page must support filtering by provider
5. the history page must support searching by provider-aware session metadata
6. the extension should store as much useful session metadata as is realistically available for each provider
7. implementation work must update and keep in sync all relevant project documentation

These requirements apply to all supported browser providers:

- Google Meet
- Microsoft Teams Web
- Zoom Web App

## Product Constraints

- this is a Chrome extension, so browser-based meetings are in scope
- native desktop Zoom and native desktop Teams are out of scope for direct capture
- caption availability still depends on each platform having captions enabled by the user, host, or admin
- platform DOM structures may change without notice

## Current State Summary

## What Is Reusable Today

- content overlay creation and interaction model
- caption render pipeline
- translation requests and provider fallback
- options, popup, and history applications
- local storage flows for settings and meeting history

## What Is Platform-Specific Today

- content script match pattern and URL gating
- DOM selector strategy for caption region, speaker, and caption text
- meeting session metadata extraction
- user-facing text that references Google Meet only
- waiting guidance that is effectively Meet-shaped
- manifest host permissions limited to Meet

## Architectural Direction

The target architecture should treat each meeting platform as an adapter behind one shared runtime.

Recommended conceptual layers:

1. Platform detection
2. Platform capability adapter
3. Shared caption ingestion pipeline
4. Shared overlay, capture guidance, and translation pipeline
5. Shared persistence and history layer

## Capture Guidance Modal

## Product Intent

Users should not need to remember where each meeting platform hides its caption controls.

The extension should guide the user at the right moment:

- when a supported meeting provider is detected
- when native captions are not yet active
- when the user needs help enabling text capture

## Expected Behavior

- the extension detects the provider
- the extension shows or makes available a provider-specific capture guidance modal
- the modal explains how to enable captions or live transcription on that provider
- after native captions are enabled, the standard capture pipeline begins
- translation and history continue through the shared flow

## Recommended UX Behavior

Recommended first-pass behavior:

- show a lightweight capture guidance modal on first supported meeting detection
- show provider-specific steps inside the modal
- allow the user to dismiss the modal for the current meeting session
- keep provider-specific waiting guidance in the overlay as a fallback

Recommended state model:

- `never_shown`
- `dismissed_for_session`
- `completed_for_session`

Optional future enhancement:

- remember `don't show this again` per provider in local settings

## Provider Instruction Contract

Each provider should expose instruction content that can be rendered inside the shared modal.

Representative shape:

```ts
type CaptureInstructionStep = {
  title: string;
  detail: string;
};

type ProviderCaptureGuide = {
  modalTitle: string;
  modalBody: string;
  steps: CaptureInstructionStep[];
  troubleshootingHint?: string;
};
```

## Rich Session Metadata Strategy

Meeting storage should preserve both normalized fields and provider-specific identifiers where available.

Recommended direction:

```ts
type MeetingSessionIdentifiers = {
  meetingCode?: string;
  meetingId?: string;
  conferenceId?: string;
  meetingNumber?: string;
  threadId?: string;
};

type MeetingSession = {
  id: string;
  platform: MeetingPlatform;
  providerLabel: string;
  meetingUrl: string;
  title?: string;
  identifiers: MeetingSessionIdentifiers;
  searchableText: string;
  startTime: number;
  endTime?: number;
  captions: SavedCaption[];
};
```

Rationale:

- different providers expose different identifiers
- storing one overloaded field will become confusing
- a normalized `identifiers` object preserves provider differences cleanly
- a precomputed `searchableText` field can simplify history search later if needed

## History Product Requirements

## Required Behaviors

- history should be filterable by provider
- history should support `All providers` plus individual provider filters
- history search should include:
  - title
  - provider name
  - meeting code when present
  - meeting ID when present
  - provider-specific identifiers when present
  - caption text
- session cards or detail views should display the provider clearly

## Recommended UX Shape

Recommended first release UX:

- provider filter control above the session list
- provider badge on each session row or card
- generic session info block in detail view
- search input that works across metadata and caption text

Recommended provider labels:

- `Google Meet`
- `Microsoft Teams Web`
- `Zoom Web App`

## Capability Matrix Recommendation

To avoid ambiguity during implementation, each provider should be evaluated against the same matrix:

- browser URL detection quality
- capture enablement guide quality
- title availability
- meeting code availability
- meeting ID availability
- speaker attribution quality
- caption stability quality
- history metadata completeness

This matrix can live in the phase docs during implementation and later be moved to release notes or internal QA docs if helpful.

## Proposed Adapter Model

The implementation does not need to match this exact type shape, but the design should preserve these responsibilities.

```ts
type MeetingPlatform = "google-meet" | "microsoft-teams" | "zoom-web";

type MeetingSessionMetadata = {
  platform: MeetingPlatform;
  providerLabel: string;
  title?: string;
  sourceUrl: string;
  identifiers: {
    meetingCode?: string;
    meetingId?: string;
    conferenceId?: string;
    meetingNumber?: string;
    threadId?: string;
  };
};

type CaptionChunk = {
  speaker: string;
  text: string;
  sourceNodeKey?: string;
};

type PlatformAdapter = {
  platform: MeetingPlatform;
  matchesUrl(url: URL): boolean;
  waitForMeetingRoot(): Promise<void>;
  observeCaptions(onCaption: (chunk: CaptionChunk) => void): () => void;
  getSessionMetadata(): MeetingSessionMetadata;
  isCaptioningAvailable(): boolean;
  getEmptyStateMessage(): {
    title: string;
    body: string;
  };
  getCaptureGuide(): ProviderCaptureGuide;
};
```

## Initiative Phases

## Phase 1: Provider Abstraction

Goal:
Move the current Google Meet implementation into a provider-based architecture without changing product behavior.

Why first:
This phase pays down the structural coupling that would otherwise multiply across Zoom and Teams work.

Detailed execution document:
- [phase-1-provider-abstraction.md](./zoom-teams-support/phase-1-provider-abstraction.md)

## Phase 2: Microsoft Teams Web

Goal:
Add a first non-Meet provider using the new abstraction and validate the architecture under real multi-platform conditions.

Why second:
Teams Web is the strongest first expansion candidate because browser usage is common and official caption capabilities are mature.

Detailed execution document:
- [phase-2-teams-web.md](./zoom-teams-support/phase-2-teams-web.md)

## Phase 3: Zoom Web App

Goal:
Add Zoom Web App support on top of the provider architecture and validate the second external platform.

Why third:
Zoom Web App support is feasible, but browser usage is less universal than Teams Web and may face more user-path variability.

Detailed execution document:
- [phase-3-zoom-web.md](./zoom-teams-support/phase-3-zoom-web.md)

## Phase 4: Productization And Release Readiness

Goal:
Generalize product language, complete history and metadata support, add provider-aware history filter and search, harden QA, and prepare the extension for staged rollout.

Why last:
This phase should land after the platform adapters exist and the real product surface can be polished holistically.

Detailed execution document:
- [phase-4-productization-and-qa.md](./zoom-teams-support/phase-4-productization-and-qa.md)

## Cross-Cutting Technical Principles

## Principle 1: Keep The Shared Pipeline Shared

Platform logic must stop at:

- discovering captions
- normalizing caption events
- extracting session metadata
- exposing provider-specific empty-state messaging
- exposing provider-specific capture guidance

Translation, rendering, and persistence should stay platform-agnostic.

## Principle 2: Prefer Stable Selectors, But Design For Change

DOM-driven capture is inherently fragile.

Mitigations:

- isolate selectors in provider modules
- centralize platform-specific parsing helpers
- prefer semantic attributes over generated class names when possible
- keep provider validation checklists in-repo

## Principle 3: Do Not Hide Capability Differences

Platform differences should be expressed explicitly in:

- capture guidance modal content
- empty-state messaging
- troubleshooting guidance
- known limitations in docs
- QA matrices

## Principle 4: Preserve Existing Meet Behavior

Google Meet remains the current production baseline. Phase 1 must not reduce quality or regress history or translation behavior.

## Principle 5: Normalize Metadata, Preserve Raw Detail

Do not force every provider into the same single identifier field.

Instead:

- keep normalized fields for shared UX
- preserve provider-specific identifiers where useful
- build history search on top of the richer metadata set

## Principle 6: Guidance Is Part Of The Feature, Not Extra UX

The provider-aware capture modal is part of the product requirement, not optional polish.

Without it, multi-provider support remains technically functional but operationally confusing.

## Non-Goals

- desktop app integration for Zoom or Teams
- audio capture or speech-to-text generation by the extension itself
- replacing native captions when the meeting platform disables them
- full UI localization for all extension screens
- summarization or post-meeting analytics in this initiative

## Risks

## Risk 1: Provider Abstraction Becomes Over-Engineered

Mitigation:
Design for the current known platforms only. Avoid speculative abstractions for unsupported future providers.

## Risk 2: Teams Or Zoom DOM Changes Frequently

Mitigation:
Keep DOM logic isolated and document provider validation scenarios as part of each phase.

## Risk 3: History Schema Becomes Inconsistent Across Old And New Sessions

Mitigation:
Introduce backward-compatible session shape changes and verify old Meet-only sessions still render.

## Risk 4: Product Messaging Becomes Misleading Midway

Mitigation:
Do not update store-facing claims until supported platforms are functionally validated.

## Dependency Map

- Phase 2 depends on Phase 1
- Phase 3 depends on Phase 1
- Phase 4 depends on Phases 1, 2, and 3

## Suggested Delivery Strategy

Recommended PR structure:

1. PR 1: provider abstraction plus capture-guide foundation and metadata model
2. PR 2: Teams Web support plus Teams capture guide
3. PR 3: Zoom Web support plus Zoom capture guide
4. PR 4: history filters, provider-aware search, permissions, docs, QA, and release updates

This structure keeps review size manageable and allows selective rollback if a platform implementation proves unstable.

## Manual Validation Baseline

Every phase should at minimum validate:

- extension builds successfully with `pnpm build`
- Google Meet baseline still works after platform-related changes
- new platform behavior is tested in an actual browser meeting session
- meeting history still saves and renders without blocking errors
- provider-specific capture guidance is accurate and understandable
- provider metadata is searchable where expected once the history layer exposes it

## Additional Product Ideas

These are not required for the first implementation, but they are worth tracking because they align with the direction of the feature:

- provider badge in the live overlay header
- session detail panel with a compact metadata table
- `re-open capture guide` action from the overlay
- provider-specific troubleshooting links in the modal
- internal provider capability scorecard for maintenance

## Documentation Sync Requirement

Every meaningful implementation change in this initiative should update the relevant documentation in the same delivery cycle.

At minimum, keep these surfaces synchronized when behavior changes:

- initiative and phase plan documents
- `README.md`
- popup and options instructional copy where applicable
- store and deployment notes under `documents/deployment/notes/`
- any QA checklist or troubleshooting notes introduced during implementation

Recommended rule:

- no provider capability, UX behavior, or limitation should ship without matching documentation updates

## Current Execution State

- Branch ready: Yes
- Planning document ready: Yes
- Implementation started: Yes
- Current active phase: Completed
- Recommended next action: treat planned implementation work as complete and use this branch as the baseline for future enhancements or post-release fixes
