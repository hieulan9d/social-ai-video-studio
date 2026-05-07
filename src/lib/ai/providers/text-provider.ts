import type {
  GeneratedPrompt,
  GeneratedScene,
  GeneratedScript,
  ScriptGenerationInput,
} from "@/lib/ai/types";

export interface AITextProvider {
  readonly name: string;
  readonly model: string;
  generateScript(input: ScriptGenerationInput): Promise<GeneratedScript>;
  generateSceneBreakdown(input: {
    script: Omit<GeneratedScript, "scenes">;
    context: ScriptGenerationInput;
  }): Promise<GeneratedScene[]>;
  generatePrompt(input: {
    scene: GeneratedScene;
    context: ScriptGenerationInput;
    script: Omit<GeneratedScript, "scenes">;
    consistencyInstruction?: string;
  }): Promise<GeneratedPrompt>;
}
