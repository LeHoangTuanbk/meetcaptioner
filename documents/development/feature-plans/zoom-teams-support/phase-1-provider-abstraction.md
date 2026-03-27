# Phase 1: Provider Abstraction

## Document Purpose

This document defines the implementation plan for converting the current Google Meet-specific content runtime into a provider-based architecture that can support additional meeting platforms.

This phase is the foundation for the entire initiative. Its success is measured by architectural clarity and zero behavioral regression for current Google Meet users.

## Phase Metadata

- Phase status: Completed
- Parent initiative: [zoom-teams-support.md](../zoom-teams-support.md)
- Primary branch: `feature/add-zoom-teams-support`
- Recommended PR title: `refactor: introduce meeting provider abstraction`

## Business Goal

Create a stable foundation for multi-platform support without shipping incomplete Zoom or Teams functionality yet.

This phase reduces future delivery risk by:

- keeping future provider work isolated
- reducing duplicated logic
- preserving existing user behavior on Meet
- making future bug ownership easier

## Technical Goal

Replace direct Google Meet assumptions in the content runtime with a provider adapter selected at runtime.

At the end of this phase:

- Google Meet should still work
- no new platform should be user-visible yet
- the codebase should be structurally ready for Teams and Zoom adapters
- the shared runtime should be structurally ready for provider-aware capture guidance
- the session model should be ready to store richer provider metadata

## Current Problems To Solve

## Problem 1: Direct Meet URL Coupling

Current state:
- the content script only matches `https://meet.google.com/*`
- runtime gating also assumes Meet meeting URL structure

Impact:
- no second provider can be added cleanly
- session startup logic is not reusable

## Problem 2: Direct Meet DOM Coupling

Current state:
- caption region, entry, speaker, and text selectors are hardcoded in the observer

Impact:
- any new platform requires branching inside generic logic
- selector churn becomes hard to debug

## Problem 3: Session Metadata Is Meet-Shaped

Current state:
- history assumes `meetingCode`
- title extraction is based on Meet-specific DOM attributes

Impact:
- session storage is not ready for Teams or Zoom identifiers

## Problem 4: Capture Guidance Is Meet-Shaped

Current state:
- waiting guidance is embedded in a generic empty state
- the wording is effectively Google Meet specific

Impact:
- the product has no clean way to guide users across providers
- multi-platform support would feel incomplete even if capture technically works

## Scope

## In Scope

- provider abstraction design and initial implementation
- migration of current Meet logic into a Meet adapter
- shared runtime entry flow for selecting a provider
- session metadata generalization
- capture guidance modal foundation
- provider instruction contract for capture enablement
- history data model preparation for provider-aware search and filtering
- backward-compatible history rendering updates if schema changes are introduced
- user-facing text cleanup where platform-agnostic wording is required for the architecture to make sense

## Out Of Scope

- adding Teams selectors
- adding Zoom selectors
- new product claims in store docs
- new analytics, summaries, or export features

## Proposed Architecture

## New Modules To Introduce

Suggested file layout:

```text
entrypoints/content/
  providers/
    types.ts
    registry.ts
    google-meet.ts
  platform-runtime.ts
  overlay/
    capture-guide.ts
```

Representative responsibilities:

- `providers/types.ts`
  - provider contracts
  - shared provider result types
- `providers/registry.ts`
  - provider lookup by URL
  - list of supported providers
- `providers/google-meet.ts`
  - current Meet-specific URL match
  - current caption DOM observation
  - Meet session metadata extraction
  - Meet capture guidance content
- `platform-runtime.ts`
  - boot sequence for selecting provider and wiring shared runtime
- `overlay/capture-guide.ts`
  - shared modal rendering and interaction logic

## Suggested Shared Types

```ts
export type MeetingPlatform = "google-meet" | "microsoft-teams" | "zoom-web";

export type PlatformEmptyState = {
  waitingTitle: string;
  waitingBody: string;
};

export type ProviderCaptureGuide = {
  modalTitle: string;
  modalBody: string;
  steps: Array<{
    title: string;
    detail: string;
  }>;
  troubleshootingHint?: string;
};

export type MeetingSessionMetadata = {
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

export type CaptionObservation = {
  speaker: string;
  text: string;
  sourceKey: string;
};

export type MeetingProvider = {
  platform: MeetingPlatform;
  matchesUrl(url: URL): boolean;
  bootstrap(): Promise<void>;
  startCaptionObserver(onCaption: (caption: CaptionObservation) => void): () => void;
  getSessionMetadata(): MeetingSessionMetadata;
  getEmptyState(): PlatformEmptyState;
  getCaptureGuide(): ProviderCaptureGuide;
  isCaptioningCurrentlyAvailable(): boolean;
};
```

The final shape can vary, but the architecture should preserve the same boundaries.

## Target Refactor Path

## Refactor Theme 1: Runtime Boot

Current flow:
- content script loads
- Meet URL is validated inline
- overlay is created
- observer starts
- session starts

Target flow:
- content script loads
- URL is passed to provider registry
- if no provider matches, exit early
- provider bootstraps
- overlay starts with provider-aware state
- shared caption pipeline consumes normalized caption observations
- capture guide can be shown from provider data
- session starts with provider metadata

## Refactor Theme 2: Caption Ingestion

Current flow:
- observer directly manipulates caption lifecycle with Meet DOM elements

Target flow:
- provider adapter owns DOM discovery
- provider emits normalized caption observations
- shared caption manager owns caption lifecycle, finalization, translation, and persistence

## Refactor Theme 3: Session Persistence

Current flow:
- session shape centers on `meetingCode`

Target flow:
- session shape should support multiple providers
- `meetingCode` should no longer be the only identity field
- provider-aware identifier storage should support future history filtering and search

Recommended session shape:

```ts
type MeetingSession = {
  id: string;
  platform: MeetingPlatform;
  providerLabel: string;
  meetingUrl: string;
  title?: string;
  identifiers: {
    meetingCode?: string;
    meetingId?: string;
    conferenceId?: string;
    meetingNumber?: string;
    threadId?: string;
  };
  searchableText: string;
  startTime: number;
  endTime?: number;
  captions: SavedCaption[];
};
```

Backward compatibility note:
- existing sessions using `meetingCode` should still render
- history compatibility helpers may temporarily map `meetingCode` into `identifiers.meetingCode`

## Refactor Theme 4: Capture Guidance Foundation

Current flow:
- waiting guidance is embedded inside the overlay empty state
- the wording is Meet-specific

Target flow:
- each provider exposes a capture guide contract
- the shared UI can render a provider-aware capture modal
- the overlay waiting state uses the same provider data as fallback guidance

Recommended first-pass shared UI responsibilities:

- open the capture modal when a supported provider session starts and captions are not active
- allow dismissing for the current session
- keep overlay empty-state guidance visible even if the modal is dismissed

## File Impact Forecast

High-confidence files likely to change:

- `entrypoints/content/index.ts`
- `entrypoints/content/observer.ts`
- `entrypoints/content/history-service.ts`
- `entrypoints/content/render.ts`
- `entrypoints/content/types.ts`
- `entrypoints/content/state.ts`
- `entrypoints/content/overlay/index.ts`
- `entrypoints/background/types/index.ts`
- `entrypoints/meeting-history/components/types.ts`
- `entrypoints/meeting-history/components/session-list.tsx`
- `entrypoints/meeting-history/components/use-session-detail.ts`
- `entrypoints/meeting-history/use-history.ts`
- `wxt.config.ts`

Likely new files:

- `entrypoints/content/providers/types.ts`
- `entrypoints/content/providers/registry.ts`
- `entrypoints/content/providers/google-meet.ts`
- `entrypoints/content/platform-runtime.ts`
- `entrypoints/content/overlay/capture-guide.ts`

## Implementation Steps

## Step 1: Introduce Shared Provider Types

Deliverables:

- provider contract types
- platform enum or union
- session metadata shape
- capture guide contract
- identifier object shape for cross-provider sessions

Developer notes:

- keep types small and explicit
- avoid adding speculative capabilities not needed by Meet, Teams, or Zoom

Validation:

- TypeScript compiles
- no runtime behavior change yet

## Step 2: Move Meet URL Matching Into A Provider

Deliverables:

- registry that selects the Meet provider for current URLs
- content entrypoint uses provider selection instead of inline Meet regex logic

Validation:

- non-Meet pages still exit cleanly
- Meet pages still initialize

## Step 3: Move Meet Caption Discovery Into Provider Module

Deliverables:

- Meet selector logic extracted from the shared observer
- normalized caption event output

Important constraint:

- preserve current finalization behavior and update semantics
- do not weaken speaker/text dedup logic during extraction

Validation:

- live Meet captions still append and update as before
- translation still runs on finalized captions

## Step 4: Introduce Shared Runtime Controller

Deliverables:

- shared startup flow connecting provider, overlay, caption manager, and session history
- provider-owned empty-state messaging or capability checks
- capture-guide readiness state in the shared runtime

Validation:

- startup remains stable on page reload
- duplicate injection prevention still works

## Step 5: Generalize Session Metadata

Deliverables:

- session metadata uses `platform`, `providerLabel`, and richer identifiers
- session metadata can preserve provider-specific identifiers
- a compatibility strategy exists for old stored Meet sessions
- history UI is updated to render generic meeting identifiers or metadata blocks later

Migration guidance:

- do not perform destructive migration of old storage immediately
- render old sessions through a compatibility read path

Validation:

- old sessions still open in history
- new Meet sessions save with the new shape
- new Meet sessions expose fields suitable for future provider filters and search

## Step 6: Provider-Agnostic Empty State Copy

Deliverables:

- empty-state UI no longer hardcodes `Please, turn on CC in Google Meet`
- provider-specific guidance can still be shown when needed
- provider-aware capture guide content can be surfaced in a shared modal

Validation:

- Meet waiting state remains understandable
- future providers can inject correct guidance

## Step 7: Lay History Foundation For Provider Filters And Search

Deliverables:

- history types can represent provider identity cleanly
- search helper design can include metadata fields beyond caption text
- UI does not need to expose provider filters yet, but the model must be ready

Validation:

- session types and helper functions support future provider filtering without another schema rewrite

## Testing Strategy

## Automated Validation

Minimum:

- `pnpm build`

Recommended follow-up if time permits:

- add low-level pure-function tests around provider registry or session compatibility helpers once test tooling exists

## Manual QA Checklist

### Meet Baseline

- load the unpacked extension in Chrome
- join a real Google Meet session in the browser
- turn Meet captions on
- verify overlay appears
- verify caption updates stream normally
- verify speaker changes create distinct caption items
- verify translation toggle still works
- verify re-translation still works
- verify session saves to history

### Non-Meet Safety

- open ordinary non-meeting pages
- verify the content script does not inject the overlay
- open non-meeting pages under `meet.google.com` if applicable
- verify early exit still behaves correctly

### History Compatibility

- confirm previously stored sessions still render
- create a new Meet session after the refactor
- verify both old and new sessions appear in history

### Capture Guidance Foundation

- verify the shared runtime can resolve Meet capture guidance content
- verify the waiting-state copy is now provider-aware or provider-fed
- if the modal shell is introduced in this phase, verify it renders correctly for Meet

## Risks

## Risk 1: Refactor Regresses Meet Capture Timing

Mitigation:
- preserve current debounce and finalization timing
- avoid rewriting caption lifecycle and provider abstraction simultaneously

## Risk 2: Session Shape Change Breaks History UI

Mitigation:
- add compatibility reads before writing new session fields
- verify history with pre-existing local data

## Risk 3: Provider Interface Too Narrow Or Too Broad

Mitigation:
- design around actual needs from Meet, Teams, and Zoom only
- keep provider methods few and concrete

## Exit Criteria

- Google Meet functionality works end to end after refactor
- provider architecture exists and is the only place where Meet-specific capture logic lives
- session model can represent provider identity and richer identifiers
- capture guidance contract exists for providers
- no Teams or Zoom support is falsely advertised yet

## Recommended Commit Breakdown

1. `refactor: add shared meeting provider types and capture guide contract`
2. `refactor: move google meet logic into provider module`
3. `refactor: generalize meeting session metadata for multi-provider history`
4. `feat: add provider-aware capture guidance foundation`
5. `chore: make content empty-state copy platform-aware`

## Recommended Next Action After Phase Completion

Start Teams Web DOM reconnaissance and implementation using the new provider contract.

## Current Execution State

- Google Meet provider extracted: Yes
- Shared provider registry implemented: Yes
- Shared session metadata model implemented: Yes
- Capture guide foundation implemented: Yes
- History model migrated to multi-provider metadata: Yes
- Recommended next action: treat this phase as complete and keep follow-up work limited to bug fixes only
