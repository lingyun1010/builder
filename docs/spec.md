# Builder v1 spec

## Problem

Non-technical "vibe coders" can generate code but not run a disciplined process, so their apps break and nobody can review them. Builder runs the lingyun-project methodology for them behind a chat.

## v1 user story

A user signs up, adds their Anthropic API key, describes the app they want, and chats. The agent grills them in plain language (Think), writes the spec and tickets (Slice), builds each ticket with tests on its own branch (Build), has fresh reviewers check it (Pre-PR, Review), asks approval, merges, and deploys a Next.js + Supabase + Vercel app. The user never opens a terminal.

## Decisions

ADR 0001 scope, 0002 architecture, 0003 state, 0004 sandbox, 0005 evidence. Builder itself is built on Next.js + Supabase + Vercel (assumption, not yet an ADR).

## Out of scope for v1

Payments and quotas, other stacks, mobile apps, team accounts, a code state machine (revisit per ADR 0002).

## Slicing

Tracer bullet first (T001-T005): login to API key to chat to agent in a sandbox to reply. Then project repo and methodology (T006-T008), then Build and gates (T009-T012), then deploy and cleanup (T013-T014).
