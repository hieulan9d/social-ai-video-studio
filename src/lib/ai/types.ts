import type { ProjectPlatform } from "@/lib/projects/types";

export type ScriptGenerationInput = {
  platform: ProjectPlatform;
  duration: number;
  style: string;
  language: string;
  productType: string;
  idea: string;
};

export type GeneratedScene = {
  sceneNumber: number;
  durationSeconds: number;
  visualDescription: string;
  cameraAngle: string;
  cameraMovement: string;
  subjectAction: string;
  background: string;
  lighting: string;
  voiceScript: string;
  onScreenText: string;
  notes: string;
};

export type GeneratedPrompt = {
  sceneOrder: number;
  promptType: "veo";
  content: string;
};

export type GeneratedScript = {
  videoTitle: string;
  hook: string;
  targetAudience: string;
  problem: string;
  solution: string;
  productService: string;
  cta: string;
  voiceover: string;
  scenes: GeneratedScene[];
};

export type FullGeneratedScript = GeneratedScript & {
  prompts: GeneratedPrompt[];
};
