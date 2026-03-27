# Release 2.3.0 Draft

## Summary

MeetCaptioner now supports browser-based caption capture across:

- Google Meet
- Microsoft Teams Web
- Zoom Web App

This release also generalizes meeting history so sessions from multiple providers can be stored, filtered, searched, and reviewed in one place.

## Highlights

- Added Microsoft Teams Web caption capture support
- Added Zoom Web App caption capture support
- Added provider-aware meeting history metadata and filtering
- Added provider-specific capture guidance overlays
- Improved browser-only product messaging and documentation
- Stopped overriding `chrome://history/`; meeting history now opens as an internal extension page

## Notes

- Native desktop Zoom and native desktop Teams apps are not supported
- Caption availability still depends on each meeting platform exposing visible native captions or live transcription
- Speaker attribution in Zoom Web App may still require refinement depending on layout and subtitle surface behavior

## Recommended QA Before Release

- Google Meet smoke pass
- Microsoft Teams Web smoke pass
- Zoom Web App smoke pass
- Translation smoke pass
- Meeting history smoke pass
