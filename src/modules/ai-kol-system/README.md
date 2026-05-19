# AI KOL System Module

## Overview

This module implements the **AI KOL Operating System** — a modular, scalable
architecture for managing AI-generated influencer content production pipelines.

This is NOT a simple AI video tool. This is an AI Content Factory.

## Architecture

```
src/modules/ai-kol-system/
├── database/migrations/         # SQL migrations for Supabase
├── types/                       # TypeScript type definitions
├── services/                    # Business logic layer
├── repositories/                # Data access layer
├── engines/                     # AI production engines
│   ├── script/                  # Phase 4: Script Engine
│   ├── image/                   # Phase 5: Image Generation
│   ├── video/                   # Phase 6: Video Generation (Veo)
│   ├── consistency/             # Phase 7: Consistency Engine
│   ├── qa/                      # Phase 8: QA/Validation
│   ├── timeline/                # Phase 9: Timeline Editor
│   └── orchestrator/            # Phase 10: Generation Orchestrator
├── events/                      # Internal event bus system
└── utils/                       # Shared utilities
```

## Design Principles

- **Database-first**: Schema drives the system, not UI
- **Consistency-first**: All data is structured, versioned, and auditable
- **Modular**: Each domain has its own service + repository + engine
- **Event-ready**: Internal event bus for orchestration
- **Soft delete**: No hard deletes, everything is recoverable
- **Versioning**: Critical entities support version history
- **Structured data**: All generation settings stored as JSON, never text

## Phases Implemented

| Phase | System | Status |
|-------|--------|--------|
| 1 | Core Foundation (DB, Types, Services) | ✅ |
| 2 | KOL DNA System | ✅ |
| 3 | Campaign/Project System | ✅ |
| 4 | Script Engine | ✅ |
| 5 | Image Generation Engine | ✅ |
| 6 | Video Generation Engine (Veo) | ✅ |
| 7 | Consistency Engine | ✅ |
| 8 | QA/Validation Engine | ✅ |
| 9 | Timeline Editor | ✅ |
| 10 | Generation Orchestrator | ✅ |

## Database (17 tables)

- `kol_workspaces` — Top-level workspace container
- `kol_masters` — KOL identity entity
- `kol_identity_dna` — Structured identity data
- `kol_visual_anchors` — Visual consistency (versioned)
- `kol_voice_dna` — Voice characteristics
- `kol_outfits` — Outfit library
- `kol_outfit_tags` — Outfit tagging
- `kol_reference_sheets` — Character/product/outfit sheets
- `kol_prompt_memories` — Reusable prompt components
- `kol_motion_styles` — Motion/animation presets
- `kol_campaigns` — Campaign/project system
- `kol_campaign_scripts` — Scripts (versioned)
- `kol_campaign_assets` — Campaign assets
- `kol_campaign_scenes` — Scene breakdown
- `kol_campaign_prompts` — Generation prompts (versioned)
- `kol_campaign_videos` — Generated videos
- `kol_campaign_qa_reports` — QA validation reports

## Usage

```typescript
import {
  // Services
  WorkspaceService,
  KolService,
  CampaignService,
  KolDnaService,
  PromptMemoryService,

  // Engines
  ScriptEngine,
  ConsistencyEngine,
  VideoEngine,
  QaEngine,
  OrchestratorEngine,

  // Events
  kolEventBus,
} from '@/modules/ai-kol-system';

// Initialize with Supabase client
const workspaceService = new WorkspaceService(supabase);
const kolService = new KolService(supabase);
const orchestrator = new OrchestratorEngine(supabase);

// Create a pipeline job
const job = orchestrator.createPipelineJob(campaignId, kolId, userId);

// Transform prompts through consistency engine
const consistency = new ConsistencyEngine(supabase);
const result = await consistency.transformPrompt(kolId, 'my prompt');
```

## Event System

The module uses an internal event bus for decoupled communication:

```typescript
import { kolEventBus } from '@/modules/ai-kol-system';

// Subscribe to events
kolEventBus.on('campaign.video.completed', async (event) => {
  // Trigger QA validation
});

kolEventBus.on('campaign.qa.repair_triggered', async (event) => {
  // Auto-repair failed scenes
});
```

## Pipeline Flow

```
Idea
  ↓
Project Setup
  ↓
Script Engine (AI generation + scene planning)
  ↓
Prompt Injection (consistency locks applied)
  ↓
Image Generation (reference sheets, assets)
  ↓
Asset Validation
  ↓
Veo Prompt Builder (structured prompts)
  ↓
Video Generation (Veo 3)
  ↓
QA Validation (scoring + issue detection)
  ↓
Auto Repair (regenerate failed elements)
  ↓
Export (final video assembly)
```
