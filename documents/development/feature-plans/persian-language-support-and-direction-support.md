# Persian Language Support And Direction Support

## Document Purpose

This document stores the full execution context for introducing Persian (`fa`) language support and static direction support into MeetCaptioner.

This document is intentionally written before implementation work begins so the feature scope, technical decisions, execution phases, risks, and progress state remain preserved in-repo.

## Metadata

- Feature status: Planned
- Branch: `feature/add-persian-language-and-direction-support`
- Repository state when document created: Clean working tree
- Created on: 2026-03-24
- Primary implementation language for product UI: Existing English UI, with added Persian target language support
- Planning language: Persian user context, technical terminology kept in English where clearer

## Executive Summary

This feature request contains two separate but related implementation tracks:

1. Persian language support
2. Static direction support based on language metadata

These two tracks must be treated as separate concerns.

Persian language support means the extension can target Persian as a translation language in all relevant parts of the product flow.

Direction support means the UI can statically apply `rtl` or `ltr` behavior based on the configured language metadata, rather than relying on browser auto-detection or the text content itself.

The implementation goal is not only to add Persian to a dropdown, but to make the full translation workflow aware of Persian and to make the translated text render in an expected, stable, and maintainable direction.

## Feature Separation

## Idea A: Persian Language Support

This idea is only about adding Persian as a supported target language.

Expected product effect:

- Users can choose Persian as the target translation language
- Translation prompts can refer to Persian as a known target language
- History and exported content can contain Persian text without special-case failures

This idea does not automatically solve RTL rendering quality.

## Idea B: Static Direction Support

This idea is only about applying a stable text direction based on language metadata.

Expected product effect:

- When a target language is RTL, translated text surfaces should render with RTL direction
- When a target language is LTR, translated text surfaces should render with LTR direction
- Direction should be driven by static language configuration, not by heuristics on the current text

This idea must remain valid even for future RTL languages beyond Persian.

## Why This Feature Is Justified

## Product Justification

- Persian is a common translation target for users who need live meeting assistance
- Persian without RTL support creates an incomplete and lower-quality experience
- Static direction support reduces visual instability in mixed-language strings containing English terms, URLs, numbers, and abbreviations

## Technical Justification

- The project already has a language catalog and target-language-driven translation flow
- The current architecture can support Persian with low-to-medium implementation effort
- Direction support can be added in a reusable way and later extended to other RTL languages

## Maintainability Justification

- The codebase currently duplicates language definitions across multiple entrypoints
- Adding Persian directly into each copy would work short-term, but would increase drift risk
- This feature is a strong opportunity to define a single shared language metadata source

## Current State Analysis

## What Exists Today

- Translation target languages are defined in multiple places:
  - `entrypoints/background/constants/index.ts`
  - `entrypoints/content/constants.ts`
  - `entrypoints/options/components/constants.ts`
- Translation prompts map language code to language name in the background layer
- Overlay language selection is driven from the content layer
- Options page has its own language constants, even though current settings UI does not actively expose target language selection there
- Translation UI exists in:
  - overlay translated caption block
  - overlay translation edit textarea
  - history session detail view

## What Is Missing Today

- Persian (`fa`) is not present in the supported language catalog
- There is no shared language metadata object with direction information
- There is no UI-level direction handling for translation surfaces
- There is no explicit utility for resolving direction from language code

## Known Structural Weaknesses In Current Code

### Duplicate language definitions

Language data is duplicated across multiple modules. This increases the chance of partial updates and inconsistent behavior.

### UI not designed for RTL-aware rendering

The UI currently renders translated text as generic text blocks without stable `dir` handling.

### Direction is currently implicit

The current implementation relies on default browser behavior and CSS flow, which is not enough for a polished Persian experience.

## Implementation Goals

## Primary Goals

- Add Persian as a supported target language
- Add static direction metadata to the language model
- Apply static direction handling anywhere translated text is displayed or edited
- Keep the implementation maintainable and reusable

## Secondary Goals

- Reduce duplication in language configuration
- Establish a path for future RTL language support
- Preserve current behavior for LTR languages

## Non-Goals

- Full localization of the product UI into Persian
- Translation quality tuning specific to Persian prompts beyond current generic prompt strategy
- Dynamic text-direction detection based on actual text content
- Redesign of the full visual system
- Multi-platform support for Teams or Zoom

## Key Product Decisions

## Decision 1: Persian Support And Direction Support Are Separate Tracks

Persian support will not be treated as a substitute for direction support.

Direction support must be built as language-metadata infrastructure, not as a one-off Persian-only patch.

## Decision 2: Direction Will Be Static By Language Type

Direction will be derived from the configured target language metadata.

Planned behavior:

- `rtl` for languages explicitly marked as RTL
- `ltr` for languages explicitly marked as LTR

No runtime text inspection will be used as the primary mechanism.

## Decision 3: Direction Should Be Applied To Translation Surfaces, Not Original Captions

Original captions come from meeting speech and may be in any language. Their direction should remain unchanged unless a future feature defines a different behavior.

Static direction support in this feature will target translated output surfaces first.

## Decision 4: Shared Language Metadata Is Preferred

The preferred implementation is to introduce a shared language metadata module that contains:

- language code
- display name
- direction

This will replace repeated hardcoded language lists where practical.

## Proposed Technical Design

## Shared Language Metadata

Introduce a shared language catalog module that becomes the source of truth for language-related metadata.

Proposed shape:

```ts
type LanguageDirection = "ltr" | "rtl";

type LanguageOption = {
  code: string;
  name: string;
  direction: LanguageDirection;
};
```

Minimum required entries:

- existing supported languages with `ltr`
- Persian with `rtl`

Future-safe optional entries:

- any future RTL languages can be added without changing UI logic

## Direction Resolver Utility

Introduce a small utility to resolve direction from a language code.

Expected responsibilities:

- return `rtl` or `ltr`
- provide safe fallback to `ltr` for unknown codes

This keeps UI components from embedding language-specific conditionals.

## Direction Application Model

Direction will be applied statically using the target language selected in settings or overlay.

Expected examples:

- translated caption block in overlay uses target-language direction
- translation edit textarea uses target-language direction
- history translation cells use the stored or active translation language direction strategy defined in implementation

If session-level translation direction is not stored in history records, the initial implementation may use the current app language metadata only for live surfaces and default history translation blocks to `auto` or to the current target language if acceptable. This needs explicit implementation handling.

## Scope Of Direction Application

## In Scope

- Overlay translated text block
- Overlay translation edit textarea
- Any translation-specific wrapper elements
- History translation display cells
- Any translation placeholder text that visually sits in translation surfaces if needed

## Out Of Scope Unless Discovered Necessary During Implementation

- Original caption column
- Popup static instructional text
- General application layout mirroring
- Full-page RTL layout inversion

## File-Level Impact Forecast

## Most Likely New Files

- `documents/development/feature-plans/persian-language-support-and-direction-support.md`
- One new shared language metadata module
- One new direction helper utility if not combined with the language module

## Most Likely Updated Files

- `entrypoints/background/constants/index.ts`
- `entrypoints/background/utils.ts`
- `entrypoints/content/constants.ts`
- `entrypoints/content/render.ts`
- `entrypoints/content/caption-ui.ts`
- `entrypoints/content/overlay/header.ts`
- `entrypoints/options/components/constants.ts`
- `entrypoints/history/components/session-detail.tsx`

## Possible Additional Updates

- content CSS files if direction-aware styling needs explicit selectors
- shared types if language metadata is formalized centrally

## Data Model Considerations

## Minimum Data Requirement

Persian support itself does not require schema migration because language selection already exists as `targetLanguage`.

## Direction Metadata Requirement

Direction can be derived from language code and does not require persistence if language metadata is centralized.

## Optional Future Improvement

If historical translation rendering must remain accurate independent of current settings, a future improvement could store the translation target language or direction per caption or per meeting session.

This is not required for the first implementation unless history UX reveals a correctness gap.

## Execution Phases

## Phase 0: Planning And Context Preservation

- Status: Completed
- Goal: Record scope, rationale, implementation direction, and progress context in-repo
- Outputs:
  - This document
  - Feature branch creation

## Phase 1: Establish Shared Language Metadata

- Status: Planned
- Goal: Create a single reusable language metadata source
- Technical tasks:
  - define language entry type with `code`, `name`, and `direction`
  - include Persian entry with `rtl`
  - migrate current language consumers to use the shared source where practical
- Expected value:
  - eliminates language drift
  - makes direction logic reusable

## Phase 2: Add Persian As A Supported Target Language

- Status: Planned
- Goal: Make Persian available end-to-end as a translation target
- Technical tasks:
  - expose Persian in overlay language selector
  - expose Persian in any other relevant language list consumers
  - ensure prompt builder resolves Persian name correctly
  - validate the code path for translation requests with `targetLanguage = "fa"`
- Expected value:
  - Persian becomes a valid product-level translation destination

## Phase 3: Add Static Direction Infrastructure

- Status: Planned
- Goal: Resolve UI direction from language metadata
- Technical tasks:
  - implement a direction resolver
  - define the UI contract for translation surfaces
  - define default fallback behavior for unknown languages
- Expected value:
  - direction logic becomes explicit and maintainable

## Phase 4: Apply Direction To Live Translation Surfaces

- Status: Planned
- Goal: Make the live overlay render Persian translations correctly
- Technical tasks:
  - apply `dir` to translated text container
  - apply `dir` to translation edit textarea
  - check placeholder and loading states inside translation containers
  - confirm no regression for LTR languages

## Phase 5: Apply Direction To History Surfaces

- Status: Planned
- Goal: Keep translation reading experience consistent outside the live overlay
- Technical tasks:
  - identify all history translation display nodes
  - apply static direction handling there
  - verify mixed content readability

## Phase 6: Verification, Cleanup, And Documentation Update

- Status: Planned
- Goal: Confirm correctness and reduce future maintenance cost
- Technical tasks:
  - run build
  - perform targeted code review
  - remove dead constants if shared source replaces them
  - update README only if product-facing behavior needs documentation refresh

## Technical Acceptance Criteria

## Persian Language Support Acceptance Criteria

- `fa` is available as a selectable target language
- translation prompt building resolves Persian correctly by language name
- selecting Persian does not break the live translation flow
- build succeeds without type regressions

## Direction Support Acceptance Criteria

- translated overlay content uses static `rtl` for Persian
- translation edit textarea uses static `rtl` for Persian
- translated overlay content remains `ltr` for existing LTR languages
- history translation display renders with the intended static direction behavior
- no language-specific `if (lang === "fa")` hacks are scattered across multiple components when a shared metadata approach can solve the problem

## UX Acceptance Criteria

- Persian text is visually readable in live overlay
- mixed Persian and English technical terms remain understandable
- direction does not unexpectedly flip original captions
- no obvious layout collapse appears in minimized or normal overlay mode

## Testing Strategy

## Functional Tests

- select Persian in overlay and trigger live translation
- switch between Persian and English target languages during a session
- use manual translate on an existing caption when Persian is selected
- edit a Persian translation in the textarea
- open history and inspect saved Persian translations

## Visual Tests

- overlay translation line with pure Persian text
- overlay translation line with Persian plus English acronyms
- overlay translation line with Persian plus numbers and URLs
- history detail translation column with Persian
- minimized overlay state

## Regression Tests

- OpenAI path still works for English
- Anthropic path still works for English
- language dropdown remains stable
- build output remains valid

## Risk Register

## Risk 1: Partial Language Update

Description:
Persian may be added in one place but not in all existing language definitions.

Mitigation:
Move toward a shared source of truth instead of patching duplicated lists independently.

## Risk 2: Incomplete Direction Coverage

Description:
Direction may be applied in the live overlay but not in history or edit mode.

Mitigation:
Track every translation surface explicitly and validate each one.

## Risk 3: Mixed-Language Rendering Artifacts

Description:
Persian text mixed with English technical vocabulary can still look awkward even with static RTL.

Mitigation:
Use explicit `dir` at the correct element level and verify visually with realistic mixed strings.

## Risk 4: Over-Scoping Into Full RTL Layout

Description:
Attempting full RTL layout inversion could expand scope and delay delivery.

Mitigation:
Keep scope focused on translation surfaces unless a blocker is discovered.

## Risk 5: History Direction Ambiguity

Description:
History rendering may not know the original target language used when the translation was created if language metadata is not persisted per session.

Mitigation:
Evaluate during implementation whether current-state direction is sufficient or whether a small persistence enhancement is needed.

## Assumptions

- The user wants Persian as a target translation language, not a full product localization
- Direction should be static and language-driven
- Direction support is required across the project where translated text is rendered
- Current architecture should remain extension-first and not introduce backend services

## Open Questions To Revisit During Implementation

- Should history translation direction be derived from current settings or persisted per saved session?
- Should translation placeholders like `...` inherit direction styling or remain neutral?
- Should the shared language metadata live in a neutral shared directory or be colocated with one existing layer and imported from others?

## Recommended Implementation Order

1. Add shared language metadata
2. Migrate existing language consumers
3. Add Persian language entry
4. Add direction resolver
5. Apply direction to overlay translation surfaces
6. Apply direction to history surfaces
7. Build and verify

## Progress Log

## 2026-03-24

- Created feature branch `feature/add-persian-language-and-direction-support`
- Completed codebase onboarding for this feature area
- Documented current architecture, scope, decisions, and phased execution plan
- No source implementation changes started yet

## Current Execution State

- Branch ready: Yes
- Context document ready: Yes
- Implementation started: No
- Blocking unknowns: None at planning stage
- Recommended next action: Start Phase 1 by introducing shared language metadata and direction metadata

## Definition Of Done

This feature is considered complete when:

- Persian is selectable as a target language
- static direction support exists as reusable metadata-driven logic
- translation surfaces render with correct direction where required
- the project builds successfully
- the code remains maintainable and does not duplicate direction logic unnecessarily

