# KidsPay

KidsPay is a mobile-first PWA that turns a family task-and-reward routine into a simple weekly system of accountability, progress, and payout. The product was designed to replace a manual household process with a clearer digital flow: set up the child profile, define tasks, track completion during the week, and close the week with a final amount to receive.

This project was built as an MVP with a strong product-design angle. The central hypothesis is that the parent experience drives adoption: if setup feels slow or confusing, the child never reaches the checklist. Because of that, the onboarding and task configuration flows are treated as the most critical parts of the product.

## Product Vision

The app supports two complementary usage modes:

- Child mode focused on daily execution, motivation, and visual progress.
- Parent mode focused on configuration, weekly review, and payout control.

The MVP concentrates on one primary loop:

`configure -> register -> close week -> pay`

The experience is intentionally lightweight:

- one child profile
- local-first persistence
- simple mode switch between child and parent
- no complex auth or cross-device sync in the MVP

## Main Features

- Guided 3-step onboarding with child name, avatar/photo, weekly goal, and tithe/savings percentage
- Option to start from a prebuilt task template (`Modelo Samuel`) or create tasks from scratch
- Parent task management with category, task type, credit/debit values, activation toggle, and editing
- Child checklist grouped by category with real-time weekly balance updates
- Visual progress toward the weekly goal
- Weekly closing flow with summary of credits, debits, reading bonus, tithe deduction, and final payout
- Local history of closed weeks stored in the browser
- Installable PWA foundation for mobile use

## Why This Is Portfolio-Worthy

This project is not just a CRUD interface. It demonstrates product thinking translated into implementation:

- Clear user segmentation: one interface for the child, another for the parent
- Business rules encoded in the UI: task types affect credits, debits, and weekly outcome differently
- Local-first architecture: browser persistence with IndexedDB for an app-like experience without a backend
- Strong MVP scoping: intentional restrictions to validate the core family workflow before adding complexity
- UX-led development: onboarding, progress feedback, and weekly celebration were designed as activation and retention levers

## User Journey

### 1. Onboarding

The first-use flow captures:

- child identity
- weekly earning goal
- tithe/savings percentage
- starting template choice

The objective is to get a parent fully configured in a couple of minutes.

### 2. Child Mode

The child sees:

- daily tasks grouped by category
- current weekly balance
- progress toward the weekly goal
- visual feedback when tasks are checked

This mode is optimized for clarity and momentum during the week.

### 3. Parent Mode

The parent can:

- update profile settings
- create and edit tasks
- enable or disable tasks
- review the week summary
- register book-reading bonuses
- calculate the final amount after tithe/savings

## Task Model

The app supports five task types, each with different behavior in the reward system:

- `habito`
- `obrigatorio`
- `so_penalidade`
- `so_credito`
- `simbolico`

This structure allows the same checklist UI to represent different household rules while keeping the interaction model simple.

## Tech Stack

- React 19
- Vite 8
- React Router
- Tailwind CSS 4
- IndexedDB via `idb`
- `vite-plugin-pwa`

## Project Structure

```text
src/
  components/
    config/
    shared/
  data/
  lib/
  pages/
```

Key areas:

- [`src/pages/Onboarding.jsx`](c:/workspacePython/imersaoClaude/kidspay/src/pages/Onboarding.jsx): first-use setup flow
- [`src/pages/ChildMode.jsx`](c:/workspacePython/imersaoClaude/kidspay/src/pages/ChildMode.jsx): daily checklist and progress experience
- [`src/pages/ParentMode.jsx`](c:/workspacePython/imersaoClaude/kidspay/src/pages/ParentMode.jsx): profile, task management, and weekly closing
- [`src/lib/db.js`](c:/workspacePython/imersaoClaude/kidspay/src/lib/db.js): IndexedDB persistence layer
- [`src/lib/calculations.js`](c:/workspacePython/imersaoClaude/kidspay/src/lib/calculations.js): weekly calculation rules
- [`src/data/samuel-template.js`](c:/workspacePython/imersaoClaude/kidspay/src/data/samuel-template.js): starter task template

## Running Locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

Docker local on `http://localhost:8080`:

```bash
docker compose -f docker-compose.local.yml up --build
```

This local Docker flow disables the PWA service worker on purpose so browser cache does not mask onboarding and routing changes during validation.

## MVP Scope

Current intentional constraints:

- single child profile
- Portuguese-first interface
- local browser storage only
- no push notifications
- no multi-device sync
- no protected PIN for switching between parent and child modes

These constraints are deliberate. The goal of the MVP is to validate usage frequency, weekly completion, and parent retention before introducing operational complexity.

## Product Design Reference

This implementation is based on the approved MVP design spec:

- [`docs/superpowers/specs/2026-03-28-kidspay-mvp-design.md`](c:/workspacePython/imersaoClaude/docs/superpowers/specs/2026-03-28-kidspay-mvp-design.md)

## Next Steps

Natural evolution paths for the product include:

- achievement badges and streak systems
- richer weekly history and analytics
- multi-child support
- authentication and cloud sync
- push reminders and family engagement loops

## Author Notes

KidsPay was built as a product-oriented frontend case study: an MVP shaped by behavior design, local-first persistence, and mobile usage patterns. The focus is not only on shipping screens, but on encoding a real family routine into a usable and motivating digital experience.
