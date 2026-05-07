export const PROJECT_PLATFORMS = [
  "TikTok",
  "Reels",
  "Shorts",
  "Facebook",
  "Shopee",
] as const;

export const PROJECT_VIDEO_TYPES = [
  "text_to_video",
  "image_to_video",
  "start_end_image_to_video",
] as const;

export const PROJECT_STATUSES = [
  "draft",
  "brief_ready",
  "script_ready",
  "rendering",
  "completed",
  "archived",
] as const;

export type ProjectPlatform = (typeof PROJECT_PLATFORMS)[number];
export type ProjectVideoType = (typeof PROJECT_VIDEO_TYPES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type ProjectRecord = {
  id: string;
  user_id: string;
  title: string;
  platform: ProjectPlatform;
  video_type: ProjectVideoType;
  duration: number;
  style: string | null;
  language: string;
  status: ProjectStatus;
  brief: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  userId: string;
  title: string;
  platform: ProjectPlatform;
  videoType: ProjectVideoType;
  duration: number;
  style: string | null;
  language: string;
  status: ProjectStatus;
  brief: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ScriptRecord = {
  id: string;
  project_id: string;
  title: string | null;
  idea: string | null;
  product_type: string | null;
  content: string | null;
  hook: string | null;
  problem: string | null;
  solution: string | null;
  target_audience: string | null;
  voiceover: string | null;
  cta: string | null;
  generation_input: Record<string, unknown>;
  generated_output: Record<string, unknown>;
  provider: string | null;
  model: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};

export type SceneRecord = {
  id: string;
  project_id: string;
  scene_order: number;
  duration_seconds: number | null;
  visual_description: string | null;
  camera_angle: string | null;
  camera_movement: string | null;
  subject_action: string | null;
  background: string | null;
  lighting: string | null;
  voiceover: string | null;
  on_screen_text: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PromptRecord = {
  id: string;
  project_id: string;
  scene_id: string | null;
  prompt_type: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type ProjectAssetRecord = {
  id: string;
  project_id: string;
  asset_type: string;
  file_name: string | null;
  file_url: string | null;
  mime_type: string | null;
  created_at: string;
};

export type RenderJobRecord = {
  id: string;
  project_id: string;
  scene_id: string | null;
  prompt_id: string | null;
  status: string;
  provider: string | null;
  provider_job_id: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GeneratedVideoRecord = {
  id: string;
  project_id: string;
  render_job_id: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ProjectDetail = {
  project: Project;
  script: ScriptRecord | null;
  scenes: SceneRecord[];
  prompts: PromptRecord[];
  assets: ProjectAssetRecord[];
  renderJobs: RenderJobRecord[];
  generatedVideos: GeneratedVideoRecord[];
};

export type ProjectTab =
  | "brief"
  | "script"
  | "scenes"
  | "prompts"
  | "assets"
  | "render"
  | "export";

export const PROJECT_TABS: ProjectTab[] = [
  "brief",
  "script",
  "scenes",
  "prompts",
  "assets",
  "render",
  "export",
];

export function isProjectTab(value: string): value is ProjectTab {
  return PROJECT_TABS.includes(value as ProjectTab);
}
