import type { PromptMemoryType, JsonData } from './common.types';

/**
 * Resolved prompt memory ready for injection into generation pipeline.
 * This is the runtime representation after loading from DB.
 */
export type ResolvedPromptMemory = {
  id: string;
  kolId: string;
  memoryType: PromptMemoryType;
  name: string;
  promptData: JsonData;
  priority: number;
};

/**
 * Prompt injection context — assembled from multiple memories
 * before being passed to generation engines.
 */
export type PromptInjectionContext = {
  visualAnchor: JsonData | null;
  productLock: JsonData | null;
  voiceLock: JsonData | null;
  negativePompt: JsonData | null;
  consistencyLock: JsonData | null;
  stylePresets: JsonData[];
  cameraPresets: JsonData[];
  customMemories: JsonData[];
};

/**
 * Prompt assembly result — final structured prompt
 * ready for AI generation.
 */
export type AssembledPrompt = {
  basePrompt: string;
  injections: PromptInjectionContext;
  finalPrompt: string;
  metadata: {
    memoryIds: string[];
    assembledAt: string;
    version: number;
  };
};
