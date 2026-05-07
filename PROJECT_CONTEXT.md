# SOCIAL AI VIDEO STUDIO - Project Context

## Overview

Social AI Video Studio is an AI SaaS platform for generating short-form social media videos at scale.

The product is designed for creators and businesses that need to produce high volumes of TikTok, Reels, Shorts, Facebook, and Shopee-ready videos without running a slow manual workflow across scriptwriting, shot planning, prompt writing, rendering, and editing.

Core business logic:

1. User tops up money.
2. System converts money into credits.
3. User spends credits on AI generation and, later, rendering.
4. The platform produces structured creative assets that move from idea to export.

The current product focus is on building a reliable AI production pipeline before adding full render automation.

## Why This Product Exists

The current short-form content workflow is fragmented:

- Ideas live in chat or notes.
- Scripts are written manually.
- Scenes are planned manually.
- Video prompts are inconsistent.
- Render jobs are slow and operationally messy.
- Asset consistency is hard, especially for product ads.

This product exists to turn that fragmented workflow into a single credit-based production system with structured stages:

Idea -> Script -> Scenes -> Prompts -> Render -> Export

The platform is especially valuable for Vietnamese and Southeast Asian commerce use cases, where ad velocity matters more than handcrafted long-form production.

## Product Vision

Long term, the product should become:

"Canva + CapCut + GPT + Veo for short-form commercial video production"

The vision is not just AI writing. It is a full production operating system for social content:

- Briefing
- Script generation
- Scene design
- Prompt generation
- Asset consistency
- Rendering orchestration
- Export and distribution

In mature form, the product should support both solo creators and agencies running high-volume content pipelines.

## Target Customers

Primary segments:

- TikTok sellers
- Ecommerce brands
- Performance marketing teams
- Social media agencies
- Video editors who want faster pre-production
- Local businesses

Business verticals currently prioritized:

- Beauty brands
- Healthcare brands
- Restaurants
- Salons
- Local service businesses

These users share the same pain:

- Need content fast
- Need repeatable output
- Need lower production cost
- Need social-first ad formats
- Need consistent product representation

## Revenue Model

The platform uses a prepaid top-up and credit consumption model.

Revenue flow:

1. User purchases a credit package.
2. Payment provider confirms payment through webhook.
3. Wallet is credited in the database.
4. User consumes credits for AI and rendering features.

Why this model fits:

- Easy for SMB users to understand
- Supports variable compute costs
- Maps well to AI generation and video render workloads
- Allows package-based upsell and future subscription overlays

Likely commercial model over time:

- Credit top-up for usage-based billing
- Optional recurring plans for predictable usage
- Agency tier with team and workflow features
- Enterprise pricing for high-volume render workloads

## Credit System Model

The wallet system is a core financial control, not a UI convenience feature.

Rules:

- Credits live only in the database.
- Wallet balance is always read from the database.
- Credit mutations are logged in `credit_transactions`.
- Credits are added only after verified payment webhook success.
- Credit deductions happen before AI work starts.
- Credits are refunded when generation or rendering fails under platform-owned failure conditions.

Current wallet-related entities:

- `profiles`
- `wallets`
- `credit_transactions`
- `credit_packages`
- `payments`

Current application behavior:

- New users automatically receive a wallet.
- Wallet balance is displayed in dashboard and wallet views.
- Payments are provider-abstracted.
- Webhooks are idempotent.
- Duplicate crediting must never happen for the same payment.

## Core Product Flow

The intended end-to-end workflow is:

1. User creates a project.
2. User chooses platform, video type, duration, style, and language.
3. User enters an idea or product brief.
4. OpenAI-compatible generation creates a Vietnamese ad script.
5. AI breaks the script into structured scenes.
6. AI generates one Veo-ready cinematic prompt per scene in English.
7. User uploads product or brand assets for consistency.
8. Backend submits render jobs to Google Veo.
9. System tracks job state and stores outputs.
10. Final video is exported with branding, subtitles, and delivery options.

Current completed pipeline:

- Project creation
- AI script generation
- Scene generation
- Prompt generation

Planned next pipeline stages:

- Asset upload
- Text-to-video rendering
- Image-to-video rendering
- Start/end image transition rendering
- Final video export

## Current Core Features

Completed:

- Next.js app foundation
- Supabase Auth
- Protected app routes
- Wallet and credit system
- Payment flow with webhook confirmation
- Project management
- Script generation
- Scene generation
- Veo prompt generation

In progress / planned:

- Asset upload and storage
- Google Veo rendering integration
- Render queue orchestration
- Export pipeline
- More complete payment providers

## Full AI Workflow

### 1. Script Generation

Input:

- Idea
- Platform
- Duration
- Style
- Product type
- Language

Output:

- Video title
- Hook
- Target audience
- Problem
- Solution
- Product/service section
- CTA
- Voiceover

Important constraint:

- Scripts are optimized for Vietnamese short-form social ads.
- Default content structure is:
  Hook -> Problem -> Solution -> Product/Service -> CTA

### 2. Scene Breakdown

Input:

- Existing script
- Target duration
- Platform
- Style

Output per scene:

- Scene number
- Duration
- Visual description
- Camera angle
- Camera movement
- Subject action
- Background
- Lighting
- Voiceover
- On-screen text
- Notes

### 3. Veo Prompt Generation

Input:

- Script
- Scene data
- Platform
- Style
- Product consistency context

Output per scene:

- A cinematic English prompt optimized for Google Veo 3

Prompt structure includes:

- Main subject
- Environment
- Action
- Camera movement
- Lighting
- Mood
- Realism level
- Product consistency instruction
- Negative instructions

### 4. Rendering

Planned render path:

- Backend creates render jobs
- Google Veo generates clips
- System tracks render status
- Failed renders trigger credit refund policy where appropriate
- Outputs are attached to the project

### 5. Export

Planned export path:

- Merge clips
- Add subtitles
- Add optional branding or logo
- Add optional music
- Produce final downloadable social video

## OpenAI / Codex Usage Strategy

The platform uses an OpenAI-compatible abstraction so the app is not tightly coupled to a single provider implementation.

Current AI provider responsibilities:

- Generate structured scripts
- Generate scene breakdowns
- Generate Veo prompts

Architecture principle:

- Business logic depends on interfaces
- Concrete providers are swappable
- All AI output should be returned in structured JSON-compatible form before persistence

Why this matters:

- Easier provider replacement
- Easier model upgrades
- Cleaner testing
- Safer fallback strategies

Codex usage inside engineering workflow:

- Scaffold modules quickly
- Maintain architectural consistency
- Write provider wrappers and internal tools
- Produce structured product documentation and prompt libraries

## Google Veo Integration Strategy

Google Veo is planned as the rendering backend, not as a frontend client-side integration.

Core strategy:

1. Store all project context server-side.
2. Build Veo prompts from structured scene data.
3. Attach asset consistency context when product imagery exists.
4. Submit render requests from backend only.
5. Persist provider job IDs and render states in `render_jobs`.
6. Save resulting clips or output references into `generated_videos`.
7. Use queue-based orchestration for retries, backoff, and long-running jobs.

Modes to support:

- Text to video
- Image to video
- Start image + end image transition video

Operational requirements for Veo:

- Never expose Veo credentials in frontend code
- Rendering must be asynchronous
- Jobs must be resumable and trackable
- Credit accounting must be tied to backend job lifecycle

## Technical Architecture

Current stack:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres

Current backend pattern:

- Route handlers for webhook endpoints
- Server actions for authenticated business actions
- `src/lib/*` modules for domain logic

Current architectural slices:

- `src/lib/auth`
- `src/lib/wallet`
- `src/lib/payments`
- `src/lib/projects`
- `src/lib/ai`
- `src/lib/scenes`
- `src/lib/prompts`
- `src/lib/supabase`

Important pattern already in use:

- Provider abstractions for payment and AI

Why this structure matters:

- Keeps provider-specific details isolated
- Makes future integrations cleaner
- Supports growth into queues, workers, and more complex job orchestration

## Database Architecture

Current migrated tables:

- `profiles`
- `wallets`
- `credit_transactions`
- `credit_packages`
- `payments`
- `projects`
- `project_assets`
- `scripts`
- `scenes`
- `prompts`
- `render_jobs`
- `generated_videos`

Key relationships:

- A user has one profile
- A user has one wallet
- A wallet has many credit transactions
- A user has many payments
- A user has many projects
- A project has many assets
- A project has one main script record
- A project has many scenes
- A project has many prompts
- A project has many render jobs
- A project has many generated videos

Design philosophy:

- Persist every important state transition
- Keep AI output structured
- Keep billing auditable
- Enforce user isolation with Supabase access controls and scoped queries

## Competitive Advantage

The product's advantage is not just "AI writes content."

The real moat is workflow compression plus commercial structure:

- End-to-end short-form ad pipeline
- Credit-based monetization built into product usage
- Structured scene and prompt generation
- Product consistency logic for commerce ads
- Multi-mode render roadmap
- Vietnamese-first social ad positioning

Many generic AI video tools stop at generation. This product is intended to manage the operational path from idea to usable ad asset.

## Future Roadmap

### Near-term roadmap

Phase 9:

- Asset upload
- Product image and logo support
- Storage conventions for brand consistency

Phase 10:

- Google Veo text-to-video render integration
- Render job creation
- Render job tracking

Phase 11:

- Image-to-video mode

Phase 12:

- Start image + end image transition mode

Phase 13:

- Final export workflow
- Clip merge
- Subtitles
- Branding layers
- Downloadable output

### Medium-term roadmap

- Queue workers for rendering
- Retry policy and failure analytics
- Team / agency workflows
- Template library by vertical
- Better payment provider coverage
- Usage analytics
- Admin operations tooling

### Long-term roadmap

- Auto publishing integrations
- Scheduling
- Bulk content generation
- Creative testing workflows
- Cross-channel asset repurposing

## What A New AI Engineer Should Internalize First

- This is a credit-backed workflow product, not just an AI demo.
- Wallet accuracy and payment correctness are as important as generation quality.
- Structured persistence matters more than pretty temporary output.
- All high-cost or sensitive operations belong on the backend.
- Veo integration must be asynchronous and queue-friendly.
- Product and brand consistency will be critical for ecommerce adoption.
- Every major feature should fit into the same pipeline:
  user intent -> structured generation -> persisted state -> render orchestration -> export
