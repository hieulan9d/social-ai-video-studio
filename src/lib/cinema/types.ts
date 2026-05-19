export type CinemaStep = "brief" | "scenes" | "takes" | "timeline" | "export";

export const CINEMA_STEPS: { key: CinemaStep; label: string }[] = [
  { key: "brief", label: "Brief & Style" },
  { key: "scenes", label: "Scenes" },
  { key: "takes", label: "Takes" },
  { key: "timeline", label: "Timeline" },
  { key: "export", label: "Export" },
];

export type CinemaAspectRatio = "16:9" | "21:9" | "9:16" | "1:1";

export type CinemaStyle = {
  id: string;
  name: string;
  description: string;
  promptModifier: string;
};

export const CINEMA_STYLES: CinemaStyle[] = [
  {
    id: "film-noir",
    name: "Film Noir",
    description: "Tối, contrast cao, bóng đổ mạnh",
    promptModifier: "film noir style, high contrast, deep shadows, dramatic lighting, black and white tones",
  },
  {
    id: "warm-commercial",
    name: "Warm Commercial",
    description: "Ấm áp, sáng, thân thiện",
    promptModifier: "warm commercial style, golden hour lighting, soft warm tones, inviting atmosphere, professional advertising look",
  },
  {
    id: "luxury-premium",
    name: "Luxury Premium",
    description: "Sang trọng, vàng đen, elegant",
    promptModifier: "luxury premium style, gold and black palette, elegant composition, high-end product photography feel, sophisticated lighting",
  },
  {
    id: "minimal-clean",
    name: "Minimal Clean",
    description: "Tối giản, trắng, ít chi tiết",
    promptModifier: "minimal clean style, white background, simple composition, negative space, modern aesthetic",
  },
  {
    id: "cinematic-drama",
    name: "Cinematic Drama",
    description: "Ánh sáng tự nhiên, bokeh, điện ảnh",
    promptModifier: "cinematic dramatic style, natural lighting, shallow depth of field, anamorphic lens flare, film grain, movie-like composition",
  },
  {
    id: "neon-urban",
    name: "Neon Urban",
    description: "Đô thị, neon, cyberpunk",
    promptModifier: "neon urban style, cyberpunk aesthetic, neon lights, rain-slicked streets, vibrant colors against dark backgrounds",
  },
  {
    id: "vintage-retro",
    name: "Vintage Retro",
    description: "Cổ điển, film grain, màu pastel",
    promptModifier: "vintage retro style, film grain, faded colors, pastel tones, 70s/80s aesthetic, analog photography feel",
  },
  {
    id: "epic-cinematic",
    name: "Epic Cinematic",
    description: "Hoành tráng, wide shot, ánh sáng kịch tính",
    promptModifier: "epic cinematic style, wide establishing shots, dramatic sky, volumetric lighting, IMAX quality, blockbuster movie feel",
  },
];

export type CinemaProjectStatus =
  | "draft"
  | "scenes_ready"
  | "rendering_takes"
  | "takes_ready"
  | "assembling"
  | "exporting"
  | "completed";

export type CinemaProject = {
  id: string;
  userId: string;
  title: string;
  brief: string;
  styleId: string;
  aspectRatio: CinemaAspectRatio;
  duration: number;
  status: CinemaProjectStatus;
  settings: CinemaProjectSettings;
  createdAt: string;
  updatedAt: string;
};

export type CinemaProjectSettings = {
  takesPerScene: number;
  quality: "standard" | "high" | "4k";
  moodReferences: string[];
  musicUrl: string | null;
  colorGrading: string | null;
};

export type CinemaScene = {
  id: string;
  projectId: string;
  sceneOrder: number;
  durationSeconds: number;
  visualDescription: string;
  cameraAngle: string;
  cameraMovement: string;
  lighting: string;
  mood: string;
  voiceover: string;
  onScreenText: string;
  selectedTakeId: string | null;
  createdAt: string;
};

export type CinemaTakeStatus = "queued" | "rendering" | "completed" | "failed";

export type CinemaTake = {
  id: string;
  sceneId: string;
  projectId: string;
  takeNumber: number;
  prompt: string;
  status: CinemaTakeStatus;
  outputUrl: string | null;
  thumbnailUrl: string | null;
  creditCost: number;
  providerJobId: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export type CinemaTransition = "cut" | "fade" | "dissolve" | "wipe" | "zoom";

export type CinemaTimelineItem = {
  id: string;
  projectId: string;
  sceneId: string;
  takeId: string;
  order: number;
  transition: CinemaTransition;
  textOverlay: string | null;
  createdAt: string;
};

export type CinemaExportOptions = {
  quality: "standard" | "high" | "4k";
  includeSubtitles: boolean;
  includeMusic: boolean;
  musicUrl: string | null;
  colorGrading: string | null;
  watermark: boolean;
};
