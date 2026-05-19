/**
 * AI KOL System — Event Type Definitions
 * Used for internal event bus to enable orchestration-ready architecture.
 */

export type KolSystemEventType =
  // Workspace events
  | 'workspace.created'
  | 'workspace.updated'
  | 'workspace.deleted'
  // KOL events
  | 'kol.created'
  | 'kol.updated'
  | 'kol.activated'
  | 'kol.archived'
  | 'kol.deleted'
  // KOL DNA events
  | 'kol.identity_dna.updated'
  | 'kol.visual_anchor.created'
  | 'kol.visual_anchor.updated'
  | 'kol.voice_dna.updated'
  // Outfit events
  | 'kol.outfit.created'
  | 'kol.outfit.updated'
  | 'kol.outfit.deleted'
  // Reference sheet events
  | 'kol.reference_sheet.created'
  | 'kol.reference_sheet.updated'
  | 'kol.reference_sheet.deleted'
  // Prompt memory events
  | 'kol.prompt_memory.created'
  | 'kol.prompt_memory.updated'
  | 'kol.prompt_memory.deleted'
  // Campaign events
  | 'campaign.created'
  | 'campaign.updated'
  | 'campaign.status_changed'
  | 'campaign.deleted'
  // Campaign production events
  | 'campaign.script.generated'
  | 'campaign.scene.created'
  | 'campaign.scene.updated'
  | 'campaign.prompt.generated'
  | 'campaign.video.queued'
  | 'campaign.video.completed'
  | 'campaign.video.failed'
  | 'campaign.qa.completed'
  | 'campaign.qa.repair_triggered';

export type KolSystemEvent<T = unknown> = {
  type: KolSystemEventType;
  payload: T;
  metadata: {
    userId: string;
    workspaceId?: string;
    kolId?: string;
    campaignId?: string;
    timestamp: string;
    correlationId?: string;
  };
};

export type EventHandler<T = unknown> = (event: KolSystemEvent<T>) => void | Promise<void>;
