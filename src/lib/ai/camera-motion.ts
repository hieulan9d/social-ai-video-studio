export const CAMERA_MOTION_OPTIONS = [
  {
    id: "push-in",
    label: "Di chuyển ra trước",
    promptHint: "camera dolly in toward the subject",
  },
  {
    id: "pull-back",
    label: "Di chuyển lùi ra xa",
    promptHint: "camera dolly out away from the subject",
  },
  {
    id: "orbit-right-to-left",
    label: "Xoay quanh từ phải sang trái",
    promptHint: "camera orbiting around the subject from right to left",
  },
  {
    id: "pan-right",
    label: "Quay phải",
    promptHint: "camera panning to the right",
  },
  {
    id: "orbit-up",
    label: "Xoay quanh lên",
    promptHint: "camera orbiting upward around the subject",
  },
  {
    id: "orbit-down",
    label: "Xoay quanh thấp",
    promptHint: "camera orbiting downward around the subject",
  },
  {
    id: "push-in-zoom-out",
    label: "Đưa camera vào gần và thu nhỏ",
    promptHint: "camera moving closer while zooming out",
  },
  {
    id: "pull-back-zoom-in",
    label: "Đưa camera ra xa và phóng to",
    promptHint: "camera moving farther away while zooming in",
  },
] as const;

export type CameraMotion = (typeof CAMERA_MOTION_OPTIONS)[number]["id"];

const CAMERA_MOTION_PROMPTS: Record<CameraMotion, string> = CAMERA_MOTION_OPTIONS.reduce(
  (accumulator, option) => {
    accumulator[option.id] = option.promptHint;
    return accumulator;
  },
  {} as Record<CameraMotion, string>,
);

export function isCameraMotion(value: string): value is CameraMotion {
  return CAMERA_MOTION_OPTIONS.some((option) => option.id === value);
}

export function applyCameraMotionToPrompt(prompt: string, cameraMotion?: CameraMotion | null) {
  const normalizedPrompt = prompt.trim();

  if (!cameraMotion) {
    return normalizedPrompt;
  }

  const promptHint = CAMERA_MOTION_PROMPTS[cameraMotion];

  if (!promptHint) {
    return normalizedPrompt;
  }

  return `${normalizedPrompt}\nCamera movement: ${promptHint}.`;
}
