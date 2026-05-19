/**
 * AI KOL System — Public API
 *
 * Usage:
 * ```typescript
 * import {
 *   WorkspaceService, KolService, CampaignService,
 *   ScriptEngine, ConsistencyEngine, OrchestratorEngine
 * } from '@/modules/ai-kol-system';
 * ```
 */

// Services (primary API)
export {
  WorkspaceService,
  KolService,
  CampaignService,
  PromptMemoryService,
  ReferenceSheetService,
  AssetService,
  AvatarGenerationService,
  AvatarStorageService,
  IdentityLockService,
} from './services';

// KOL DNA Service (Phase 2)
export { KolDnaService } from './services/kol-dna.service';
export type { KolDnaProfile } from './services/kol-dna.service';

// Avatar providers
export { NanoBananaProvider, GeminiImageProvider, getDefaultAvatarProvider } from './providers';
export type { AvatarProvider } from './providers';

// Engines (Phase 4-10)
export {
  ScriptEngine,
  ScenePlanner,
  PromptInjectionEngine,
  ImageEngine,
  VideoEngine,
  ConsistencyEngine,
  QaEngine,
  TimelineEngine,
  OrchestratorEngine,
} from './engines';

// Types
export type * from './types';

// Engine types
export type {
  ScriptGenerationInput,
  GeneratedScript,
  GeneratedScene,
  ImageGenerationInput,
  ImageGenerationResult,
  VideoGenerationInput,
  VideoGenerationResult,
  VeoPromptStructure,
  ConsistencyProfile,
  PromptTransformResult,
  QaReport,
  QaScore,
  RepairAction,
  TimelineState,
  TimelineScene,
  PipelineJob,
  PipelineStage,
  PipelineConfig,
  PipelineResult,
} from './engines';

// Events
export { kolEventBus } from './events';
export type { KolSystemEventType, KolSystemEvent, EventHandler } from './events';

// Utilities
export { mapWorkspace, mapKolMaster, mapCampaign } from './utils/mappers';
export { validateRequired, validateUUID, validateSlug, createSlug } from './utils/validation';
export { formatError } from './utils/errors';
export type { FormattedError } from './utils/errors';

// Cached accessors (React server cache — deduplicates within same request)
export {
  getCachedWorkspaces,
  getCachedKol,
  getCachedWorkspaceKols,
  getCachedKolCampaigns,
  getCachedCampaign,
  getCachedIdentityLock,
  getCachedDnaProfile,
} from './services/cached';
