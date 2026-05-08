export const CAMERA_ANGLE_OPTIONS = [
  {
    id: "center",
    label: "Giữa",
    promptHint: "centered camera, straight-on composition",
  },
  {
    id: "left",
    label: "Trái",
    promptHint: "camera positioned to the left side of the subject",
  },
  {
    id: "right",
    label: "Phải",
    promptHint: "camera positioned to the right side of the subject",
  },
  {
    id: "high",
    label: "Cao",
    promptHint: "high-angle shot from above",
  },
  {
    id: "low",
    label: "Thấp",
    promptHint: "low-angle shot from below",
  },
  {
    id: "close",
    label: "Gần hơn",
    promptHint: "closer framing, tighter camera distance",
  },
  {
    id: "far",
    label: "Xa hơn",
    promptHint: "wider framing, farther camera distance",
  },
] as const;

export type CameraAngle = (typeof CAMERA_ANGLE_OPTIONS)[number]["id"];

const CAMERA_ANGLE_PROMPTS: Record<CameraAngle, string> = CAMERA_ANGLE_OPTIONS.reduce(
  (accumulator, option) => {
    accumulator[option.id] = option.promptHint;
    return accumulator;
  },
  {} as Record<CameraAngle, string>,
);

export function isCameraAngle(value: string): value is CameraAngle {
  return CAMERA_ANGLE_OPTIONS.some((option) => option.id === value);
}

export function applyCameraAngleToPrompt(prompt: string, cameraAngle?: CameraAngle | null) {
  const normalizedPrompt = prompt.trim();

  if (!cameraAngle) {
    return normalizedPrompt;
  }

  const promptHint = CAMERA_ANGLE_PROMPTS[cameraAngle];

  if (!promptHint) {
    return normalizedPrompt;
  }

  return `${normalizedPrompt}\n\nCamera angle: ${promptHint}.`;
}
