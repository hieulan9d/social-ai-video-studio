import { createClient } from "@/lib/supabase/server";
import type {
  GeneratedVideoRecord,
  Project,
  ProjectAssetRecord,
  ProjectDetail,
  ProjectRecord,
  PromptRecord,
  RenderJobRecord,
  SceneRecord,
  ScriptRecord,
} from "@/lib/projects/types";

function mapProject(record: ProjectRecord): Project {
  return {
    id: record.id,
    userId: record.user_id,
    title: record.title,
    platform: record.platform,
    videoType: record.video_type,
    duration: record.duration,
    style: record.style,
    language: record.language,
    status: record.status,
    brief: record.brief,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export async function createProject(input: {
  userId: string;
  title: string;
  platform: ProjectRecord["platform"];
  videoType: ProjectRecord["video_type"];
  duration: number;
  style?: string | null;
  language: string;
  status?: ProjectRecord["status"];
  brief?: string | null;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: input.userId,
      title: input.title,
      platform: input.platform,
      video_type: input.videoType,
      duration: input.duration,
      style: input.style ?? null,
      language: input.language,
      status: input.status ?? "draft",
      brief: input.brief ?? null,
    })
    .select(
      "id, user_id, title, platform, video_type, duration, style, language, status, brief, created_at, updated_at",
    )
    .single<ProjectRecord>();

  if (error) {
    throw error;
  }

  return mapProject(data);
}

export async function getProjects(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, user_id, title, platform, video_type, duration, style, language, status, brief, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .returns<ProjectRecord[]>();

  if (error) {
    throw error;
  }

  return data.map(mapProject);
}

export async function getProjectById(projectId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, user_id, title, platform, video_type, duration, style, language, status, brief, created_at, updated_at",
    )
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle<ProjectRecord>();

  if (error) {
    throw error;
  }

  return data ? mapProject(data) : null;
}

export async function getProjectDetail(projectId: string, userId: string) {
  const project = await getProjectById(projectId, userId);

  if (!project) {
    return null;
  }

  const supabase = await createClient();
  const [
    scriptResult,
    scenesResult,
    promptsResult,
    assetsResult,
    renderJobsResult,
    generatedVideosResult,
  ] = await Promise.all([
    supabase
      .from("scripts")
      .select(
        "id, project_id, title, idea, product_type, content, hook, problem, solution, target_audience, voiceover, cta, generation_input, generated_output, provider, model, version, created_at, updated_at",
      )
      .eq("project_id", projectId)
      .maybeSingle<ScriptRecord>(),
    supabase
      .from("scenes")
      .select(
        "id, project_id, scene_order, duration_seconds, visual_description, camera_angle, camera_movement, subject_action, background, lighting, voiceover, on_screen_text, notes, created_at, updated_at",
      )
      .eq("project_id", projectId)
      .order("scene_order", { ascending: true })
      .returns<SceneRecord[]>(),
    supabase
      .from("prompts")
      .select("id, project_id, scene_id, prompt_type, content, created_at, updated_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })
      .returns<PromptRecord[]>(),
    supabase
      .from("project_assets")
      .select("id, project_id, asset_type, file_name, file_url, mime_type, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .returns<ProjectAssetRecord[]>(),
    supabase
      .from("render_jobs")
      .select(
        "id, project_id, scene_id, prompt_id, status, provider, provider_job_id, error_message, started_at, completed_at, created_at, updated_at",
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .returns<RenderJobRecord[]>(),
    supabase
      .from("generated_videos")
      .select(
        "id, project_id, render_job_id, file_url, thumbnail_url, duration_seconds, status, created_at, updated_at",
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .returns<GeneratedVideoRecord[]>(),
  ]);

  if (scriptResult.error) throw scriptResult.error;
  if (scenesResult.error) throw scenesResult.error;
  if (promptsResult.error) throw promptsResult.error;
  if (assetsResult.error) throw assetsResult.error;
  if (renderJobsResult.error) throw renderJobsResult.error;
  if (generatedVideosResult.error) throw generatedVideosResult.error;

  return {
    project,
    script: scriptResult.data,
    scenes: scenesResult.data,
    prompts: promptsResult.data,
    assets: assetsResult.data,
    renderJobs: renderJobsResult.data,
    generatedVideos: generatedVideosResult.data,
  } satisfies ProjectDetail;
}

export async function deleteProject(projectId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function updateProject(input: {
  projectId: string;
  userId: string;
  title?: string;
  status?: ProjectRecord["status"];
  brief?: string | null;
}) {
  const supabase = await createClient();
  const payload: Record<string, unknown> = {};

  if (typeof input.title !== "undefined") payload.title = input.title;
  if (typeof input.status !== "undefined") payload.status = input.status;
  if (typeof input.brief !== "undefined") payload.brief = input.brief;

  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", input.projectId)
    .eq("user_id", input.userId)
    .select(
      "id, user_id, title, platform, video_type, duration, style, language, status, brief, created_at, updated_at",
    )
    .single<ProjectRecord>();

  if (error) {
    throw error;
  }

  return mapProject(data);
}

export async function upsertScriptRecord(input: {
  projectId: string;
  title: string;
  idea: string;
  productType: string;
  content: string;
  hook: string;
  problem: string;
  solution: string;
  targetAudience: string;
  voiceover: string;
  cta: string;
  generationInput: Record<string, unknown>;
  generatedOutput: Record<string, unknown>;
  provider: string;
  model: string;
  version?: number;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scripts")
    .upsert({
      project_id: input.projectId,
      title: input.title,
      idea: input.idea,
      product_type: input.productType,
      content: input.content,
      hook: input.hook,
      problem: input.problem,
      solution: input.solution,
      target_audience: input.targetAudience,
      voiceover: input.voiceover,
      cta: input.cta,
      generation_input: input.generationInput,
      generated_output: input.generatedOutput,
      provider: input.provider,
      model: input.model,
      version: input.version ?? 1,
    })
    .select(
      "id, project_id, title, idea, product_type, content, hook, problem, solution, target_audience, voiceover, cta, generation_input, generated_output, provider, model, version, created_at, updated_at",
    )
    .single<ScriptRecord>();

  if (error) {
    throw error;
  }

  return data;
}

export async function replaceScenesForProject(
  projectId: string,
  scenes: Array<{
    sceneOrder: number;
    durationSeconds: number;
    visualDescription: string;
    cameraAngle: string;
    cameraMovement: string;
    subjectAction: string;
    background: string;
    lighting: string;
    voiceover: string;
    onScreenText: string;
    notes: string;
  }>,
) {
  const supabase = await createClient();
  const { error: deleteError } = await supabase
    .from("scenes")
    .delete()
    .eq("project_id", projectId);

  if (deleteError) {
    throw deleteError;
  }

  if (scenes.length === 0) {
    return [] as SceneRecord[];
  }

  const { data, error } = await supabase
    .from("scenes")
    .insert(
      scenes.map((scene) => ({
        project_id: projectId,
        scene_order: scene.sceneOrder,
        duration_seconds: scene.durationSeconds,
        visual_description: scene.visualDescription,
        camera_angle: scene.cameraAngle,
        camera_movement: scene.cameraMovement,
        subject_action: scene.subjectAction,
        background: scene.background,
        lighting: scene.lighting,
        voiceover: scene.voiceover,
        on_screen_text: scene.onScreenText,
        notes: scene.notes,
      })),
    )
    .select(
      "id, project_id, scene_order, duration_seconds, visual_description, camera_angle, camera_movement, subject_action, background, lighting, voiceover, on_screen_text, notes, created_at, updated_at",
    )
    .order("scene_order", { ascending: true })
    .returns<SceneRecord[]>();

  if (error) {
    throw error;
  }

  return data;
}

export async function replacePromptsForProject(
  projectId: string,
  prompts: Array<{
    sceneId: string | null;
    promptType: string;
    content: string;
  }>,
) {
  const supabase = await createClient();
  const { error: deleteError } = await supabase
    .from("prompts")
    .delete()
    .eq("project_id", projectId);

  if (deleteError) {
    throw deleteError;
  }

  if (prompts.length === 0) {
    return [] as PromptRecord[];
  }

  const { data, error } = await supabase
    .from("prompts")
    .insert(
      prompts.map((prompt) => ({
        project_id: projectId,
        scene_id: prompt.sceneId,
        prompt_type: prompt.promptType,
        content: prompt.content,
      })),
    )
    .select("id, project_id, scene_id, prompt_type, content, created_at, updated_at")
    .order("created_at", { ascending: true })
    .returns<PromptRecord[]>();

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertPromptRecord(input: {
  projectId: string;
  sceneId: string | null;
  promptType: string;
  content: string;
}) {
  const supabase = await createClient();

  if (input.sceneId) {
    const { data: existingPrompt, error: fetchError } = await supabase
      .from("prompts")
      .select("id")
      .eq("project_id", input.projectId)
      .eq("scene_id", input.sceneId)
      .eq("prompt_type", input.promptType)
      .maybeSingle<{ id: string }>();

    if (fetchError) {
      throw fetchError;
    }

    if (existingPrompt) {
      const { data, error } = await supabase
        .from("prompts")
        .update({
          content: input.content,
        })
        .eq("id", existingPrompt.id)
        .select("id, project_id, scene_id, prompt_type, content, created_at, updated_at")
        .single<PromptRecord>();

      if (error) {
        throw error;
      }

      return data;
    }
  }

  const { data, error } = await supabase
    .from("prompts")
    .insert({
      project_id: input.projectId,
      scene_id: input.sceneId,
      prompt_type: input.promptType,
      content: input.content,
    })
    .select("id, project_id, scene_id, prompt_type, content, created_at, updated_at")
    .single<PromptRecord>();

  if (error) {
    throw error;
  }

  return data;
}
