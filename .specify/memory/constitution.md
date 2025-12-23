
<!--
Sync Impact Report
Version change: 2.0.0 → 2.1.0
Modified principles: Core Principle IV (Modern Web Stack Discipline) - Added Prisma ORM as mandatory database access layer
Added sections: Prisma ORM to Stack & Accessibility Requirements
Removed sections: None
Templates requiring updates:
  - plan-template.md (✅ updated)
  - spec-template.md (✅ updated)
  - tasks-template.md (✅ updated)
Follow-up TODOs: None
Rationale: Prisma ORM is now the standard database access layer for PostgreSQL. It provides type-safe queries, automatic migrations, excellent TypeScript integration, and is the recommended approach for Next.js + PostgreSQL projects. This change codifies existing best practice.
-->

# Doc-DB Constitution


## Core Principles

### I. User-Centric Document Access
The system MUST provide a clear, accessible interface for users to search, view, and archive documents (ordonnances, identité, factures, etc.). All features MUST be designed for simplicity and clarity.
*Rationale: Ensures the product delivers on its primary value proposition and is usable by all target users.*

### II. Accessibility (RGAA Compliance)
All user-facing features MUST comply with RGAA accessibility standards. Accessibility is non-negotiable and must be validated for every release.
*Rationale: Guarantees inclusivity and legal compliance for all users.*

### III. Test-Driven Development & Quality Gates
All business logic MUST be covered by Jest tests. Every feature MUST be tested with MCP Chrome DevTools. Linting MUST pass with Biome before merge. No code is considered done until these gates are met.
*Rationale: Prevents regressions, enforces quality, and ensures maintainability.*

### IV. Modern Web Stack Discipline
The stack is Next.js (deployed on Vercel), S3 for storage, PostgreSQL with Prisma ORM for data, Tailwind CSS and Headless UI for frontend. All code MUST use these technologies unless a justified exception is approved in writing.
*Rationale: Ensures consistency, maintainability, and leverages team expertise. Prisma provides type-safe database access and automatic migrations.*


### V. Independent, Incremental Delivery
Each user story/feature MUST be independently testable and deliver value on its own. Features are delivered incrementally, with each increment validated before proceeding.
*Rationale: Enables rapid feedback, reduces risk, and supports MVP-first delivery.*

### VI. Language and Style Discipline
All code MUST be written in English. All specifications (spec.md, user stories, requirements) MUST be written in French. No emoji are permitted in any code, documentation, or specifications.
*Rationale: Ensures clarity, consistency, and professionalism for all contributors and stakeholders.*


## Stack & Accessibility Requirements

- **Frontend**: Next.js, Tailwind CSS, Headless UI
- **Backend/Deployment**: Vercel
- **Storage**: S3
- **Database**: PostgreSQL with Prisma ORM
- **Accessibility**: RGAA compliance is mandatory for all user-facing features
- **Testing**: Jest for business logic, MCP Chrome DevTools for feature validation
- **Linting**: Biome

No other major frameworks or tools may be introduced without explicit approval and documentation of rationale.


## Development Workflow & Definition of Done

1. All business logic code MUST be covered by Jest tests.
2. Each feature MUST be validated with MCP Chrome DevTools.
3. Linting MUST pass with Biome before merge.
4. Accessibility (RGAA) MUST be checked for all user-facing changes.
5. Each user story/feature MUST be independently testable and deliver value.
6. Code review is required for all merges; reviewers MUST verify all above gates are met.
7. No feature is considered "done" until all above criteria are satisfied.


## Governance

- This constitution supersedes all other development practices and conventions.
- Amendments require documentation, team approval, and a migration plan if breaking changes are introduced.
- All PRs and reviews MUST verify compliance with the constitution and DoD.
- Any complexity or deviation from the stack or workflow must be justified and documented in the plan.
- Use this constitution as the primary reference for all runtime and development guidance.

**Version**: 2.1.0 | **Ratified**: 2025-12-22 | **Last Amended**: 2025-12-23
<!-- Version: 2.1.0 | Ratified: 2025-12-22 | Last Amended: 2025-12-23 -->
