# Collision Detection Specs

## Purpose

Prevent duplicate team responses by identifying outbound draft candidates that
match or closely resemble an existing draft in the same review batch.

## Scope

- Release tier: V1
- Audience: team
- Folder ownership: `tools/v1/team/collision-detection/`

This is a self-contained tooling workspace. Do not wire this tool into the main
app, routing, inbox architecture, wallet core, Stellar core, database schema, or
design system unless a future integration issue explicitly allows it.

## Primary Review Flow

1. A reviewer opens a batch of candidate outbound replies.
2. The tool compares normalized subject, recipient, and body signals.
3. The tool flags exact duplicates as blocked.
4. The tool flags near duplicates for human review.
5. The tool leaves distinct replies available for normal review.

## Testable Cases

- Exact body duplicate with extra whitespace.
- Near duplicate with a shortened sentence.
- Same subject but different recipient and different body.
- Missing body content.
- Same recipient with a distinct follow-up message.

## Required Issue Categories

- Architecture
- Feature
- UI and accessibility
- Security and performance
- Testing and documentation

## Non-Goals

- No production email sending.
- No mailbox ingestion.
- No wallet, Stellar, database, route, or design-system changes.
- No cross-folder imports.
