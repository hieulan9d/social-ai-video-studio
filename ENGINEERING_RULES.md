# SOCIAL AI VIDEO STUDIO - Engineering Rules

## Purpose

These rules are mandatory for future developers and AI agents working on this codebase.

This product handles:

- user money
- user credits
- AI-generated content
- planned video rendering workloads
- private user assets

Treat correctness, traceability, and user isolation as first-order requirements.

## Non-Negotiable Product Rules

1. Never store credits in `localStorage`, session storage, cookies, or any client-side cache as the source of truth.
2. Credits must only be stored and mutated in the database.
3. Wallet balance must always be read from the database.
4. Payment success must only be confirmed through verified webhook processing.
5. Return URLs must never grant credits.
6. The same payment must never credit the wallet twice.
7. Every credit mutation must create a durable `credit_transactions` record.
8. API keys, service-role credentials, payment secrets, and provider tokens must never be exposed to frontend code.
9. All Veo rendering must run backend-side only.
10. Refund credits when a platform-owned generation or render step fails after deduction.

## Security Rules

1. Protect user isolation at every database query boundary.
2. Prevent cross-user data leaks in queries, actions, route handlers, and file access.
3. Never trust client-provided `userId`, `walletId`, or ownership identifiers without server-side verification.
4. Use authenticated server-side context to resolve the acting user.
5. Do not expose internal payment metadata, webhook secrets, or provider signatures to the client.
6. Do not store sensitive secrets in repository files.
7. Do not log secrets or raw authorization headers.
8. All asset access must be scoped so users cannot read another user's private project files.

## Credit and Payment Rules

1. Use database-side transaction logic for credit mutations.
2. Prevent race conditions with row locking or transactional RPCs.
3. Payment records must be created with `pending` status before checkout redirect.
4. Webhook handling must be idempotent.
5. A completed payment must be marked as credited exactly once.
6. Payment status transitions must be auditable and persisted.
7. Do not update wallet balances directly from frontend actions.
8. Use provider abstraction for payment integrations.
9. Placeholder providers must fail safely and must never simulate success outside explicit mock flow.
10. Always preserve the rule:
   payment verified -> payment marked success -> credits added -> transaction recorded

## AI Generation Rules

1. Use provider abstraction for all AI integrations.
2. Do not couple business logic directly to one vendor SDK across the codebase.
3. All AI outputs must be stored as structured JSON or mapped from structured JSON before persistence.
4. Never persist unstructured AI blobs as the only source of truth for script, scene, or prompt data.
5. Deduct credits before generation begins when the product policy requires prepaid usage.
6. Refund credits if generation fails after deduction.
7. Keep generation inputs and outputs auditable where useful for debugging and support.
8. Vietnamese user input is allowed, but Veo prompts must be generated in English.
9. Prompt generation must preserve product consistency instructions when product assets exist.

## Veo and Render Architecture Rules

1. All Veo render creation must happen on the backend.
2. Never call Veo APIs directly from the browser.
3. Use a queue system for render jobs.
4. Treat rendering as asynchronous, retryable background work.
5. Persist provider job IDs and render states in `render_jobs`.
6. Persist output references in `generated_videos`.
7. Refund credits if a paid render step fails due to provider or platform failure and no usable output is produced.
8. Support idempotent retry behavior for render orchestration.
9. Render status must be observable from the project detail UI through database state, not ephemeral memory.

## Data Architecture Rules

1. The database is the source of truth for business state.
2. Add migrations for all schema changes.
3. Do not make silent schema drift changes outside migrations.
4. Preserve referential integrity between projects, assets, scripts, scenes, prompts, render jobs, and generated videos.
5. Use clear ownership fields such as `user_id` and `project_id`.
6. Prefer append-only audit records for money and credits.
7. Do not delete financial history to hide state transitions.
8. Use typed server-side mapping layers between raw records and app models.

## Asset Storage Rules

1. User assets must be stored in cloud storage, not in browser memory as durable state.
2. Asset paths should be namespaced by user and project.
3. Product images and logos should be treated as consistency-critical inputs.
4. Do not assume uploaded assets are safe; validate file type and size.
5. Never trust client-supplied file metadata without server-side checks.

## Application Architecture Rules

1. Follow modular architecture by domain.
2. Put reusable domain logic under `src/lib/<domain>`.
3. Keep UI components separate from billing logic, provider logic, and persistence logic.
4. Use provider abstraction pattern for external services.
5. Do not place complex business rules directly inside page components.
6. Prefer server actions or route handlers for authenticated write operations.
7. Keep business workflows composable and testable.
8. Avoid tightly coupling UI state to financial or render state.

## Scalability Rules

1. Design new features so they can move to workers without major rewrites.
2. Do not assume rendering or generation is synchronous long term.
3. Expect large projects to contain many scenes, prompts, assets, and render jobs.
4. Prefer idempotent backend operations.
5. Avoid architectures that require frontend polling hacks as the only status mechanism.
6. Build with retry safety in mind.
7. Separate provider-specific failure handling from domain-level workflow rules.

## Coding Rules

1. Do not overwrite working code unless the task explicitly requires it.
2. Preserve existing abstractions when extending features.
3. Add new migrations instead of rewriting old ones unless the project explicitly chooses squash/rebuild.
4. Keep environment variable access centralized.
5. Use strict typing for domain objects.
6. Avoid magic strings for statuses, provider names, and video modes when shared constants can exist.
7. Keep credit, payment, and render operations explicit and traceable.
8. When adding a new provider, create an interface implementation instead of branching logic everywhere.

## Operational Rules For Future AI Agents

1. Read the existing source before changing architecture.
2. Check current migrations before adding tables or columns.
3. Respect the current phase ordering of the product roadmap.
4. Do not invent frontend-only shortcuts that violate wallet or payment guarantees.
5. If a flow charges credits, define the refund path before shipping it.
6. If a flow handles user assets, define ownership and access control before shipping it.
7. If a flow talks to an external provider, create an abstraction first.
8. If a feature can create duplicate side effects, make it idempotent before release.
9. If state matters across sessions, persist it server-side.
10. Optimize for correctness first, then ergonomics, then polish.

## Release Gate Checklist

Before shipping any feature, verify:

- data ownership is enforced
- secrets stay server-side
- credits are correct
- payment side effects are idempotent
- AI output is structured
- failure paths are handled
- refund paths are defined where needed
- migrations exist
- provider abstraction is preserved
- the feature fits the long-term render pipeline
