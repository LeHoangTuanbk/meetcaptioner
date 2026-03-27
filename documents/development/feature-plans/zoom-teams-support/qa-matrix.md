# Multi-Provider QA Matrix

## Document Purpose

This document defines the repeatable manual QA matrix for MeetCaptioner across all currently supported browser meeting providers.

It is intended to be used before release and whenever significant changes land in provider detection, caption capture, translation, or history storage.

## Metadata

- Status: Ready
- Related initiative: [zoom-teams-support.md](../zoom-teams-support.md)
- Related phase: [phase-4-productization-and-qa.md](./phase-4-productization-and-qa.md)
- Last updated: 2026-03-27

## Supported Browser Providers

- Google Meet
- Microsoft Teams Web
- Zoom Web App

## Common Preconditions

- latest unpacked extension build loaded from `.output/chrome-mv3`
- API provider configured if translation testing is required
- clean browser profile or known local storage state when testing history behavior

## Core Matrix

| Area | Google Meet | Microsoft Teams Web | Zoom Web App |
| --- | --- | --- | --- |
| Provider detection only on real meeting pages | Required | Required | Required |
| No false activation on generic home pages | Required | Required | Required |
| Capture guide shown when captions are off | Required | Required | Required |
| Native captions can be enabled and guide becomes non-blocking | Required | Required | Required |
| Captions appear in overlay | Required | Required | Required |
| Speaker names captured | Required | Required | Best effort |
| Long transcript does not overwrite earlier turns incorrectly | Required | Required | Required |
| Translation toggle works | Required | Required | Required |
| Target-language switch retriggers translation | Required | Required | Required |
| Session persists into meeting history | Required | Required | Required |
| History shows provider and metadata | Required | Required | Required |
| Leaving meeting auto-closes overlay | Required | Required | Required |

## Google Meet Checklist

- open a real Google Meet URL
- confirm overlay appears only inside the meeting
- confirm guide appears before native captions are enabled
- confirm guide disappears after captions are enabled
- verify speaker identification remains stable
- verify caption order remains correct during speaker switches
- leave the meeting and confirm overlay closes

## Microsoft Teams Web Checklist

- confirm no overlay appears on `teams.live.com/v2/` generic surfaces
- open a scheduled meeting and confirm overlay activates
- open a direct call and confirm overlay activates
- confirm guide appears before live captions are enabled
- confirm caption capture works once captions are enabled
- verify speaker detection quality
- verify history title, identifier, and provider metadata
- leave the meeting and confirm overlay closes

## Zoom Web App Checklist

- confirm no duplicate overlays appear
- confirm shell pages do not keep an idle overlay while the meeting frame captures
- enable Zoom subtitles and verify real subtitle capture
- verify rolling subtitle behavior does not erase earlier turns incorrectly
- verify speaker labeling is at least stable enough for conversation follow-up
- verify history stores provider and fallback identifier data
- leave the meeting and confirm overlay closes

## Regression Notes

- whenever a provider-specific fix lands, rerun at least one smoke test on the other two providers
- if transcript ordering changes, always recheck history output and not just live overlay output
- if metadata extraction changes, recheck both history detail and history search behavior

## Sign-Off Template

- Google Meet smoke pass: Completed during implementation
- Microsoft Teams Web smoke pass: Completed during implementation
- Zoom Web App smoke pass: Completed during implementation
- Translation smoke pass: Completed during implementation
- History smoke pass: Completed during implementation
- Release-ready: Ready for final product review
