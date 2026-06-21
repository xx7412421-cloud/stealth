# Grammar Cleaner Specs

## Purpose

Correct grammar and writing issues in individual email drafts while preserving
the original meaning and leaving the user in control before anything is sent.

## Contributor Boundary

All work for this tool must stay in:

`tools/v1/individual/grammar-cleaner/`

The tool is a self-contained V1 workspace. Do not wire it into the main app,
routing, inbox architecture, wallet core, Stellar core, database schema, or
shared design system unless a future integration issue explicitly allows it.

## Recommended Internal Structure

- `components/`
- `services/`
- `hooks/`
- `tests/`
- `docs/`

## Required Issue Categories

- Architecture
- Feature
- UI and accessibility
- Security and performance
- Testing and documentation

## UI Expectations

- Accept a draft email body and show an empty state before input.
- Expose a local preview flow with loading, error, and success states.
- Label every interactive control.
- Use native keyboard-accessible controls.
- Announce status changes through a single live region.
- Keep the result reviewable and focusable before any future send integration.
