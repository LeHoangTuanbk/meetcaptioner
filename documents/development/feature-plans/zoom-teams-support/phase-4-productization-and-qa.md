# Phase 4: Productization And QA

## Document Purpose

This document defines the final productization phase after the provider architecture and both new browser platforms are implemented.

The purpose of this phase is to turn a technically working multi-platform extension into a releasable product with clear messaging, reliable history behavior, accurate guidance, and repeatable QA coverage.

## Phase Metadata

- Phase status: Planned
- Parent initiative: [zoom-teams-support.md](../zoom-teams-support.md)
- Dependency: Phases 1, 2, and 3 completed
- Recommended PR title: `chore: productize multi-platform meeting support`

## Business Goal

Ship multi-platform support in a way that users can understand and trust.

This means:

- clear platform messaging
- no misleading support claims
- history views that make platform origin obvious
- provider filter and search behavior that scales with the new session model
- documentation that reduces confusion around browser-only scope

## Technical Goal

Finalize the shared data model, UX copy, permissions, QA workflow, provider-aware history search and filtering, and release documentation for multi-platform support.

## Scope

## In Scope

- platform-aware history UX
- provider-aware history filtering
- provider-aware search across session metadata
- popup, options, and README wording updates
- manifest host permission finalization
- manual QA matrix
- release notes and rollout guidance
- backward compatibility review for old Meet sessions
- capture guidance modal polish across providers

## Out Of Scope

- major new feature work unrelated to platform support
- post-meeting summaries or analytics
- automated test framework introduction if it would delay shipping significantly

## Product Workstreams

## Workstream 1: Product Messaging

Current messaging still says:

- Google Meet only
- Meet-specific usage instructions

Target messaging should become:

- browser-based meeting captions for Google Meet, Microsoft Teams Web, and Zoom Web App
- explicit note that desktop apps are not supported

Surfaces to review:

- `README.md`
- extension manifest description if needed
- popup copy
- options page copy
- history page copy if platform labels are added
- store submission notes and permission justifications

Documentation sync rule:

- when any supported provider behavior changes, the related product and operational docs should be updated in the same phase or PR

## Workstream 2: History Experience

History should no longer feel Meet-shaped.

Recommended additions:

- show platform label on session cards and details
- display a generic session metadata block, not only `meetingCode`
- add provider filter control
- expand search to provider-aware metadata
- preserve backward compatibility for older stored Meet sessions

Recommended UX examples:

- `Google Meet`
- `Microsoft Teams Web`
- `Zoom Web App`

Optional but high-value enhancement:

- include platform badge in session list
- include a compact metadata row in the detail page

## Recommended Search Scope

History search should include:

- provider label
- title
- `meetingCode`
- `meetingId`
- `meetingNumber`
- `conferenceId`
- `threadId`
- meeting URL where useful
- caption text

Recommended filtering behavior:

- default filter: `All providers`
- secondary filters:
  - `Google Meet`
  - `Microsoft Teams Web`
  - `Zoom Web App`

Recommended implementation note:

- search should operate on a normalized helper rather than scattering field checks across multiple components

## Workstream 3: Host Permission And Store Readiness

The manifest and store justification docs must align with actual supported domains and user-visible behavior.

Required updates:

- add Teams host permissions
- add Zoom host permissions
- update permission justification notes
- update single-purpose description if needed

Important constraint:

- do not broaden store claims beyond what was manually validated

## Workstream 4: QA Matrix

Because automated coverage is light, this phase must establish a strong manual QA matrix that can be reused for future regressions.

## Workstream 5: Capture Guidance Modal Polish

By this phase, every provider should already expose a capture guide.

This workstream finishes the UX:

- align modal layout and wording quality across providers
- ensure dismiss and re-open behavior feels consistent
- confirm overlay waiting-state fallback is coherent with modal copy
- decide whether to remember modal dismissal per provider beyond the current session

## Recommended Data Model Finalization

By the end of this phase, session data should clearly support platform identity.

Recommended final shape:

```ts
type MeetingSession = {
  id: string;
  platform: "google-meet" | "microsoft-teams" | "zoom-web";
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

Backward compatibility guidance:

- when reading old sessions, map `meetingCode` into `identifiers.meetingCode`
- if `platform` is missing on old sessions, infer `google-meet`
- if `providerLabel` is missing on old sessions, infer `Google Meet`
- if `searchableText` is missing, compute it on read

## Implementation Steps

## Step 1: Finalize Product Copy

Deliverables:

- popup text updated
- options text updated
- README updated
- internal docs updated
- deployment and store notes updated where scope or permissions changed

Required wording discipline:

- say `Microsoft Teams Web`
- say `Zoom Web App`
- do not imply native desktop support

## Step 2: Finalize History UX

Deliverables:

- platform shown in session list or detail view
- provider filter control
- generic metadata rendering
- search expanded across provider metadata and caption text
- compatibility path for old sessions

Validation:

- mixed old and new sessions remain readable
- search still works across platforms
- provider filters behave predictably with and without search terms

## Step 3: Finalize Manifest And Store Notes

Deliverables:

- host permissions match actual support
- store notes describe all supported browser platforms
- permission justifications remain accurate

Validation:

- extension still builds
- generated manifest contains only intended hosts

## Step 4: Create Cross-Platform QA Matrix

Deliverables:

- a reusable manual test matrix for Meet, Teams Web, and Zoom Web App
- regression checklist for translation and history
- regression checklist for capture guidance modal accuracy

Suggested matrix dimensions:

- platform
- join path
- capture guidance modal shown
- capture guidance modal accurate
- captions off
- captions on
- single speaker
- speaker change
- translation off
- translation on
- target language change
- meeting leave and history persistence

## Step 5: Perform End-To-End Validation

Deliverables:

- one full smoke pass on each platform
- one regression pass on Meet after all product copy and schema changes

Validation minimum:

- `pnpm build`
- manual browser testing on all supported platforms

## Step 6: Release Packaging

Deliverables:

- release notes draft
- known limitations section
- rollout recommendation

Recommended rollout wording:

- initial release should be framed as browser support for three platforms
- clarify that caption availability depends on each meeting platform’s own caption controls

## Manual QA Matrix

## Common Checks For Every Platform

- overlay appears only on supported meeting pages
- waiting state is understandable when captions are off
- provider-specific capture guidance modal is understandable when captions are off
- caption text streams into the overlay once native captions are on
- translation toggle works
- target language changes trigger re-translation
- leaving the meeting persists session history

## Google Meet Regression Checks

- original Meet selectors still work
- title and meeting identifier remain readable
- translation and history remain unchanged in quality

## Teams Web Checks

- Teams meeting URL is matched correctly
- captions are captured only after live captions are enabled
- history labels the session as Teams Web
- search can find Teams sessions by title and metadata

## Zoom Web App Checks

- supported Zoom browser flow is matched correctly
- captions or live transcription are captured once enabled
- history labels the session as Zoom Web App
- search can find Zoom sessions by title and metadata

## Risks

## Risk 1: Product Copy Gets Ahead Of Reality

Mitigation:
- only update public claims after manual validation passes

## Risk 2: Old History Data Renders Poorly

Mitigation:
- explicitly support old session reads in the UI
- test on a browser profile with existing stored data

## Risk 3: Manifest Permissions Become Overbroad

Mitigation:
- keep host permissions limited to actual supported meeting domains
- review generated manifest before release

## Exit Criteria

- all three supported browser platforms pass smoke testing
- history is platform-aware
- history supports provider filters and provider-aware search
- all three providers expose accurate capture guidance modal content
- user-facing copy reflects real capabilities
- release notes and permission justification are updated

## Recommended Commit Breakdown

1. `feat: add platform-aware history filters and metadata search`
2. `feat: polish provider capture guidance modal across platforms`
3. `docs: update product messaging for multi-platform browser support`
4. `chore: finalize permissions and release notes`
5. `docs: add multi-platform qa matrix`

## Recommended Release Notes Structure

- New: support for Microsoft Teams Web
- New: support for Zoom Web App
- Improved: unified meeting history across platforms
- Improved: provider-aware history filters and search
- Note: native desktop Zoom and Teams apps are not supported
- Note: captions must be enabled in the meeting platform itself
