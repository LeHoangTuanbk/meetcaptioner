# Phase 3: Zoom Web App

## Document Purpose

This document defines the implementation plan for adding Zoom Web App support after the provider abstraction is complete and Teams Web support has validated the architecture.

This phase should reuse the same adapter boundaries proven by Meet and Teams rather than introducing Zoom-specific logic into shared runtime modules.

## Phase Metadata

- Phase status: Planned
- Parent initiative: [zoom-teams-support.md](../zoom-teams-support.md)
- Dependency: Phase 1 completed
- Recommended sequencing: after Phase 2
- Recommended PR title: `feat: add zoom web caption provider`

## Business Goal

Bring the extension to Zoom users who join meetings in the browser and extend the product narrative from `Meet-only` to `browser meeting caption workspace`.

## Strategic Note

Zoom browser support is valuable, but it should be planned with realistic expectations:

- some users are pushed toward the desktop app
- some organizations default to native app launch
- caption and transcript availability may vary by host settings and plan

That makes Zoom support important, but a slightly riskier investment than Teams Web.

## Technical Goal

Implement a `zoom-web` provider that:

- matches Zoom Web App meeting pages
- captures visible caption text from the browser meeting UI
- exposes Zoom-specific capture guidance
- integrates with shared translation and history flows
- maintains acceptable quality despite Zoom-specific UX differences

## Scope

## In Scope

- Zoom Web App meeting support in browser
- Zoom host permission updates
- Zoom-specific caption waiting-state guidance
- Zoom-specific capture guidance modal content
- Zoom session metadata extraction

## Out Of Scope

- desktop Zoom app integration
- Zoom SDK app development
- transcript file ingestion
- webinar-specialized provider variants unless required by the same DOM path

## Discovery Work Required Before Coding

This phase should begin with a real Zoom Web App session and a short reconnaissance checklist.

Required observations:

1. browser URL shape before joining and after joining
2. whether Zoom opens the web meeting inside the same tab or redirects
3. whether captions are visible directly in DOM or inside complex containers
4. whether speaker names are displayed alongside captions
5. whether live transcription and closed captions use the same DOM surface
6. whether caption nodes are appended or mutated
7. whether caption availability differs between Zoom Web App and generic web client flows
8. what exact user-visible labels are used to enable captions or live transcription in Zoom Web App today
9. what meeting identifiers are reliably available in the browser flow:
   - meeting number
   - encoded meeting ID
   - session title

The answers will guide how narrow or broad the URL matching and selector strategy should be.

## Product Assumptions

## Assumption 1: Web-Only

The extension can only support Zoom sessions that actually remain in the browser.

## Assumption 2: Visible Captions Required

The extension depends on captions or live transcription being visible in the web UI.

## Assumption 3: Speaker Names May Be Less Reliable Than Meet

This is an implementation risk to verify early. The provider should degrade gracefully if speaker attribution is partial or absent.

## Recommended Technical Design

## Provider Name

Recommended platform ID:

```ts
"zoom-web"
```

This keeps Zoom browser support distinct from any future non-browser integration work.

## Session Metadata Strategy

Recommended Zoom metadata:

```ts
{
  platform: "zoom-web",
  providerLabel: "Zoom Web App",
  title: "<meeting title if available>",
  sourceUrl: window.location.href,
  identifiers: {
    meetingId?: "<best available zoom meeting identifier>",
    meetingNumber?: "<best available zoom meeting number>"
  }
}
```

Priority order for stored identifiers:

1. meeting number or encoded meeting identifier from URL
2. stable DOM-exposed meeting identifier
3. deterministic fallback string

## Caption Observation Strategy

Zoom may not mirror Meet’s caption DOM shape.

Possible provider behaviors to support:

- a single rolling transcription view
- live lines with incremental updates
- transcript-like panel with speaker groups

Recommended design:

- normalize all Zoom observations before they enter shared caption lifecycle logic
- if speaker identity is absent, preserve text capture and use a fallback label rather than blocking feature value

## Empty-State Messaging

Recommended Zoom waiting copy:

- title: `Waiting for captions...`
- body: `Turn on captions or live transcription in Zoom Web App to start capturing text`

## Capture Guidance Modal Content

The Zoom provider should supply modal content that reflects the actual browser flow rather than generic Zoom instructions.

Recommended initial content direction:

- modal title: `Enable Capture In Zoom Web App`
- modal body: `MeetCaptioner can start once captions or live transcription are enabled in this browser meeting`
- step 1: open the in-meeting controls
- step 2: open captions or transcript controls
- step 3: enable captions or live transcription
- troubleshooting hint: some meetings may prefer the desktop app or restrict caption controls by host settings

The exact wording must be verified against the current Zoom Web App UI.

## File Impact Forecast

Likely files to add:

- `entrypoints/content/providers/zoom-web.ts`

Likely files to change:

- `entrypoints/content/providers/registry.ts`
- `entrypoints/content/render.ts`
- `entrypoints/content/history-service.ts`
- `wxt.config.ts`
- `README.md`
- `entrypoints/popup/App.tsx`
- `entrypoints/options/App.tsx`
- `entrypoints/history/use-history.ts`
- `entrypoints/history/components/session-list.tsx`

## Implementation Steps

## Step 1: Reconnaissance And Zoom Path Validation

Deliverables:

- documented Zoom browser flow
- supported URL patterns for Zoom Web App
- preliminary DOM selector notes
- preliminary capture-guide copy verified against the real UI

Important decision gate:

- if the browser flow is too inconsistent, narrow initial support explicitly to the Zoom Web App path that can be validated reliably

## Step 2: Register Zoom Host Permissions And Provider

Deliverables:

- manifest updated for Zoom domains
- provider registry recognizes supported Zoom browser meeting URLs

Validation:

- overlay appears on supported Zoom browser meetings
- overlay does not appear on unrelated Zoom pages

## Step 3: Implement Zoom Caption Capture

Deliverables:

- Zoom captions appear inside the shared overlay
- duplicate suppression is reasonable

Validation:

- live captions stream while people are speaking
- low-value noise and empty lines are ignored

## Step 4: Handle Speaker And Update Edge Cases

Deliverables:

- acceptable behavior when Zoom captions update in place
- fallback behavior when speaker labels are missing or inconsistent

Validation:

- caption grouping stays understandable
- translation still has enough context for useful output

## Step 5: Zoom Capture Guidance Modal

Deliverables:

- Zoom provider exposes provider-specific capture guide content
- guidance reflects the browser-based Zoom path, not generic desktop Zoom instructions

Validation:

- the guidance appears or is available on supported Zoom browser meetings
- a user can follow the steps to enable visible caption text

## Step 6: Persist Zoom Sessions To History

Deliverables:

- Zoom meetings save with `platform: "zoom-web"`
- identifiers and titles are usable in history search and display
- Zoom-specific identifiers are preserved when available

Validation:

- Zoom sessions render beside Meet and Teams sessions
- mixed-platform history remains understandable

## Step 7: Documentation And User Guidance

Deliverables:

- product copy mentions Zoom Web App specifically, not generic `Zoom` if desktop app is unsupported
- troubleshooting notes clarify browser-only scope

## Testing Strategy

## Minimum Technical Validation

- `pnpm build`
- manual validation in a real Zoom browser meeting

## Manual QA Checklist

### Startup

- join a Zoom meeting that stays in the browser
- verify overlay appears on supported meeting pages
- refresh during the meeting and confirm reinitialization works
- verify the Zoom capture guidance modal is available

### Guidance

- verify the modal title and steps clearly reference Zoom Web App
- verify the steps do not incorrectly describe the desktop app flow
- verify waiting-state fallback guidance remains available if captions stay off

### Capture

- turn on captions or live transcription
- verify overlay receives text
- verify duplicate handling remains acceptable
- verify fallback speaker behavior if names are incomplete

### Translation

- enable translation
- verify translated captions appear
- change target language
- verify Zoom-origin captions are retranslated correctly

### Persistence

- leave the Zoom meeting
- verify history includes the Zoom session
- verify platform identity is clear in the stored session

### Search And Filter

- once provider-aware history UI lands, verify Zoom sessions can be filtered independently
- verify search can find the Zoom session by title, provider label, and stored identifiers where available

### Regression

- rerun one Google Meet smoke test
- rerun one Teams smoke test

## Risks

## Risk 1: Zoom Browser Routing Is Inconsistent

Mitigation:
- limit support to confirmed stable web meeting URLs
- document unsupported entry paths explicitly

## Risk 2: Zoom Caption UI Lacks Strong Speaker Metadata

Mitigation:
- support speaker fallback labels
- preserve capture value even when attribution quality is imperfect

## Risk 3: Users Expect Desktop App Support

Mitigation:
- use explicit product language: `Zoom Web App`
- update popup, README, and store text carefully

## Exit Criteria

- Zoom Web App meetings can display captured captions in overlay
- translations work on finalized Zoom captions
- Zoom sessions save to history with platform identity
- Zoom guidance modal content is available and accurate enough for supported browser paths
- Meet and Teams smoke tests still pass

## Recommended Commit Breakdown

1. `feat: add zoom web host permissions and provider registration`
2. `feat: implement zoom web caption observation`
3. `feat: add zoom web capture guidance content`
4. `feat: persist zoom web session metadata`
5. `docs: clarify zoom browser-only support`

## Recommended Next Action After Phase Completion

Execute productization, cross-platform polish, and release-readiness work in Phase 4.
