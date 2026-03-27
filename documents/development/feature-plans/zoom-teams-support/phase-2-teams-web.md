# Phase 2: Microsoft Teams Web

## Document Purpose

This document defines the implementation path for adding Microsoft Teams Web support after the provider abstraction has landed.

This phase is the first real test of whether the new provider architecture is correctly scoped.

## Phase Metadata

- Phase status: Completed
- Parent initiative: [zoom-teams-support.md](../zoom-teams-support.md)
- Dependency: Phase 1 completed
- Recommended PR title: `feat: add microsoft teams web caption provider`

## Business Goal

Bring the extension to a second major meeting platform with meaningful browser adoption and strong accessibility and captioning relevance.

Why Teams first:

- Teams Web usage is common in many organizations
- official caption capabilities are mature
- the browser story is stronger than Zoom in many enterprise contexts
- it is the best first proving ground for multi-platform expansion

## Technical Goal

Implement a new `microsoft-teams` provider that:

- detects Teams meeting pages
- locates the live caption region
- normalizes speaker and text observations
- emits session metadata
- emits provider-specific capture guidance
- integrates with the shared overlay, translation, and history pipeline

## Product Assumptions

## Assumption 1: We Are Targeting Teams Web

In scope:

- Teams meeting pages running in the browser
- browser meeting entry paths under both `teams.microsoft.com` and `teams.live.com`

Out of scope:

- native Teams desktop app integration

## Assumption 2: Native Captions Must Already Be Available

The extension is not generating speech-to-text itself.

Therefore:

- a participant must be in a Teams meeting where captions are available
- users may still be blocked by organizer or admin policy

## Assumption 3: DOM-Based Capture Is The Initial Implementation Path

Even though Teams has official caption-related capabilities, this phase assumes the extension captures visible live captions from the web meeting UI.

That means:

- Teams DOM inspection is mandatory
- selectors must be isolated in the Teams provider
- a future deeper integration can be considered later if needed

## Scope

## In Scope

- Teams Web provider
- Teams host permission updates
- Teams-specific session metadata extraction
- Teams-specific waiting-state guidance
- Teams-specific capture guidance modal content
- Teams manual QA checklist and troubleshooting notes

## Out Of Scope

- Teams CART API integration
- desktop app integration
- translated captions powered by Teams licensing features
- enterprise deployment or tenant admin onboarding docs

## Discovery Work Required Before Coding

This phase should start with a short reconnaissance task in a real Teams Web meeting.

Required observations:

1. URL patterns for:
   - pre-join lobby
   - active meeting
   - post-join navigation updates
2. caption container selector candidates
3. speaker selector candidates
4. text selector candidates
5. whether caption nodes are appended, replaced, or mutated in place
6. whether speaker names are always present
7. whether captions live inside iframes or ordinary DOM
8. whether there are accessibility-oriented attributes that are more stable than generated classes
9. what is the clearest user path to enable captions in Teams Web
10. what session metadata fields are realistically extractable:
   - title
   - meeting ID
   - thread ID
   - join URL fragments

The resulting notes should be added to this document or a provider-specific appendix once implementation begins.

## Proposed Provider Responsibilities

The Teams provider should own:

- matching Teams meeting URLs
- identifying if the current page is actually a meeting surface
- observing the caption area
- normalizing caption updates into shared `CaptionObservation` objects
- deriving `platform`, `providerLabel`, identifiers, `title`, and `sourceUrl`
- returning Teams-specific waiting-state guidance
- returning Teams-specific capture modal instructions

The provider should not own:

- translation requests
- overlay rendering logic
- caption history business rules
- editable translation UI

## Recommended Technical Design

## Provider Name

Recommended platform ID:

```ts
"microsoft-teams"
```

This is clearer than generic values like `"teams"` once history and future analytics become platform-aware.

## Session Metadata Strategy

Recommended Teams session metadata:

```ts
{
  platform: "microsoft-teams",
  providerLabel: "Microsoft Teams Web",
  title: "<meeting title if available>",
  sourceUrl: window.location.href,
  identifiers: {
    meetingId?: "<best available browser-safe identifier>",
    threadId?: "<best available thread or conversation identifier>"
  }
}
```

Priority order for stored identifiers:

1. explicit meeting identifier from URL query or path
2. thread or conversation identifier if exposed
3. stable DOM or page metadata field
4. fallback deterministic hash-safe string if the URL is too large or unstable

The specific extraction rule should be documented inside the provider once discovered.

## Caption Observation Strategy

Potential node behavior to validate:

- single live caption line that mutates
- rolling list of entries
- grouped speaker blocks
- separate caption pane that opens when enabled

Recommended implementation pattern:

- keep a `WeakMap` or equivalent provider-local tracking structure
- reuse the finalization approach proven in Meet where possible
- emit normalized observations without leaking Teams DOM details into shared code

## Empty-State Messaging

Recommended Teams waiting copy:

- title: `Waiting for captions...`
- body: `Turn on live captions in Microsoft Teams to start capturing text`

This copy can be refined after real QA confirms the most common failure mode.

## Capture Guidance Modal Content

The Teams provider should supply modal content that is short, direct, and realistic under meeting pressure.

Recommended initial content direction:

- modal title: `Enable Capture In Microsoft Teams`
- modal body: `MeetCaptioner can start once Teams live captions are turned on in this browser meeting`
- step 1: open the meeting controls
- step 2: open `More actions`
- step 3: turn on `Live captions`
- troubleshooting hint: if captions are unavailable, the organizer or admin may have disabled them

The exact labels should be verified against the current Teams Web UI during implementation.

## File Impact Forecast

Likely files to add:

- `entrypoints/content/providers/microsoft-teams.ts`

Likely files to change:

- `entrypoints/content/providers/types.ts`
- `entrypoints/content/providers/registry.ts`
- `entrypoints/content/render.ts`
- `entrypoints/content/history-service.ts`
- `wxt.config.ts`
- `README.md`
- `entrypoints/popup/App.tsx`
- `entrypoints/options/App.tsx`
- `entrypoints/meeting-history/use-history.ts`
- `entrypoints/meeting-history/components/session-list.tsx`

## Implementation Steps

## Step 1: Reconnaissance And Selector Notes

Deliverables:

- documented Teams meeting URL patterns
- documented caption DOM strategy
- initial selector candidates
- initial capture-guide copy verified against the real UI

Practical output:

- add inline comments in provider code only where selector intent is not obvious
- update this phase doc with concrete selector notes if they prove stable enough to preserve

## Step 2: Add Teams Host Permission And URL Matching

Deliverables:

- Teams domains added to manifest host permissions
- provider registry recognizes Teams meeting pages

Validation:

- Teams meeting pages initialize the content runtime
- non-meeting Microsoft pages do not show the overlay

## Step 3: Implement Teams Caption Observer

Deliverables:

- Teams provider can capture speaker and text
- caption updates appear in shared overlay

Validation:

- captions update as the meeting progresses
- no runaway duplication
- empty texts are ignored

Current implementation note:

- an initial heuristic Teams Web caption observer has been added and activated
- the observer uses semantic and accessibility-oriented selector heuristics rather than hardcoded stable Teams DOM contracts
- live validation against a real Teams Web meeting is still required before treating the provider as production-stable

## Step 4: Finalization And Update Semantics

Deliverables:

- Teams provider works correctly whether Teams mutates existing caption nodes or appends new ones
- finalized captions trigger translation as expected

Validation:

- in-progress caption changes do not create unnecessary duplicates
- speaker handoffs become separate caption items

## Step 5: Teams Session Metadata Integration

Deliverables:

- history entries from Teams clearly identify platform and meeting ID
- display title is captured when possible
- Teams-specific identifiers are stored when safely available

Validation:

- Teams sessions save and render in history
- sessions are distinguishable from Meet sessions
- Teams sessions are searchable by provider and metadata once history search enhancements land

## Step 6: Teams Capture Guidance Modal

Deliverables:

- Teams provider exposes provider-specific capture guide content
- modal instructions are understandable for a real user in a live meeting

Validation:

- joining a Teams browser meeting shows or makes available Teams guidance
- the steps match actual current UI labels closely enough to follow
- after enabling captions, capture begins normally

## Step 7: Troubleshooting Copy And Product Surface Updates

Deliverables:

- popup and options wording expanded from Google Meet-only text where appropriate
- documentation notes mention Teams Web support if the provider is stable enough

Important:

- only update public-facing claims after real-world manual validation passes

## Testing Strategy

## Minimum Technical Validation

- `pnpm build`
- load unpacked extension in Chrome
- use an actual Teams Web meeting

## Manual QA Checklist

### Startup

- join a Teams meeting in the browser
- verify overlay appears only on actual meeting pages
- verify no duplicate overlays after navigation or page refresh
- verify the Teams capture guidance modal is available

### Guidance

- verify the modal title and instructions clearly reference Microsoft Teams
- verify the user can dismiss the modal for the session
- verify waiting-state fallback guidance remains available in the overlay if captions stay off

### Capture

- turn live captions on
- verify captions appear in overlay
- verify multiple speakers produce readable separation
- verify partial caption updates do not spam duplicates

### Translation

- enable translation
- verify finalized captions are translated
- change target language
- verify existing Teams captions retranslate correctly

### Persistence

- leave the meeting
- open history
- verify the Teams session is present
- verify title and identifier are reasonable

### Search And Filter

- once provider-aware history UI lands, verify Teams sessions can be filtered independently
- verify search can find the Teams session by title, provider label, and stored identifiers where available

### Regression

- repeat one Google Meet smoke test after Teams changes land

## Risks

## Risk 1: Teams Uses Volatile Generated Classes

Mitigation:
- prefer semantic or accessibility attributes where possible
- keep selectors isolated and easy to patch

## Risk 2: Captions Live In A Late-Loaded Pane

Mitigation:
- design provider bootstrap to poll or re-check until the caption pane exists
- preserve cleanup when captions are turned off

## Risk 3: Speaker Attribution Is Incomplete

Mitigation:
- support fallback speaker labels such as `Unknown`
- document accuracy limits if Teams visually omits speaker names in some modes

## Exit Criteria

- Teams Web meetings can display captured captions in the overlay
- translation works on finalized Teams captions
- Teams sessions save into history with platform identity
- Teams guidance modal content is available and accurate enough for real use
- Google Meet baseline still passes smoke testing

## Progress Log

## 2026-03-25

- activated the Teams Web provider in the runtime registry
- added heuristic caption observation scaffolding for Teams Web
- added Teams metadata extraction helpers for `meetingId`, `threadId`, and title normalization
- kept Zoom Web as a planned provider only

## Current Execution State

- Provider activated: Yes
- Metadata extraction implemented: Yes
- Caption observer implemented: Yes
- Real browser validation completed: Yes
- Remaining risk level: Medium
- Recommended next action: keep Teams Web in maintenance mode and only make targeted fixes if future QA reveals new DOM regressions

## Recommended Commit Breakdown

1. `feat: add teams host permissions and provider registration`
2. `feat: implement teams web caption observation`
3. `feat: add teams capture guidance content`
4. `feat: persist teams session metadata in history`
5. `docs: expand product copy for teams web support`

## Recommended Next Action After Phase Completion

Begin Zoom Web App provider work and validate whether provider contract changes are still unnecessary.
