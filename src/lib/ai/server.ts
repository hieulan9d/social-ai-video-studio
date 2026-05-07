import "server-only";

import { getAITextProvider } from "@/lib/ai/providers";
import type {
  FullGeneratedScript,
  GeneratedScript,
  ScriptGenerationInput,
} from "@/lib/ai/types";

export async function generateFullScript(
  input: ScriptGenerationInput,
): Promise<FullGeneratedScript> {
  const provider = getAITextProvider();
  const generatedScript = await provider.generateScript(input);
  const scriptWithoutScenes: Omit<GeneratedScript, "scenes"> = {
    videoTitle: generatedScript.videoTitle,
    hook: generatedScript.hook,
    targetAudience: generatedScript.targetAudience,
    problem: generatedScript.problem,
    solution: generatedScript.solution,
    productService: generatedScript.productService,
    cta: generatedScript.cta,
    voiceover: generatedScript.voiceover,
  };

  const scenes =
    generatedScript.scenes.length > 0
      ? generatedScript.scenes
      : await provider.generateSceneBreakdown({
          script: scriptWithoutScenes,
          context: input,
        });

  const prompts = await Promise.all(
    scenes.map((scene) =>
      provider.generatePrompt({
        scene,
        context: input,
        script: scriptWithoutScenes,
      }),
    ),
  );

  return {
    ...scriptWithoutScenes,
    scenes,
    prompts,
  };
}

export async function generatePromptForScene(input: {
  scene: FullGeneratedScript["scenes"][number];
  context: ScriptGenerationInput;
  script: Omit<GeneratedScript, "scenes">;
  consistencyInstruction?: string;
}) {
  const provider = getAITextProvider();

  return provider.generatePrompt({
    scene: input.scene,
    context: input.context,
    script: input.script,
    consistencyInstruction: input.consistencyInstruction,
  });
}
