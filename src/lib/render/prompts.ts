export const IMAGE_TO_VIDEO_MOTION_STYLES = [
  "cinematic_zoom",
  "orbit",
  "product_reveal",
  "parallax",
  "handheld",
  "luxury_ad",
] as const;

export const START_END_TRANSITION_STYLES = [
  "cinematic_morph",
  "speed_ramp",
  "three_d_orbit",
  "product_transformation",
  "before_after",
  "light_sweep",
] as const;

export type ImageToVideoMotionStyle =
  (typeof IMAGE_TO_VIDEO_MOTION_STYLES)[number];
export type StartEndTransitionStyle =
  (typeof START_END_TRANSITION_STYLES)[number];

export const imageToVideoMotionLabels: Record<ImageToVideoMotionStyle, string> = {
  cinematic_zoom: "Cinematic zoom",
  orbit: "Orbit",
  product_reveal: "Product reveal",
  parallax: "parallax",
  handheld: "Handheld",
  luxury_ad: "Luxury ad",
};

export const startEndTransitionLabels: Record<StartEndTransitionStyle, string> = {
  cinematic_morph: "Cinematic morph",
  speed_ramp: "Speed ramp",
  three_d_orbit: "3D orbit",
  product_transformation: "Biến đổi sản phẩm",
  before_after: "Before/after",
  light_sweep: "Light sweep",
};

const motionInstructions: Record<ImageToVideoMotionStyle, string> = {
  cinematic_zoom:
    "Use a slow cinematic push-in with subtle depth, premium lighting shifts, and stable image identity.",
  orbit:
    "Create a smooth orbiting camera move around the main subject with realistic perspective and coherent background depth.",
  product_reveal:
    "Animate the image as a polished commercial product reveal with elegant lighting, stable packaging, and hero framing.",
  parallax:
    "Create layered parallax motion with foreground and background depth while preserving the source image identity.",
  handheld:
    "Use natural handheld social-ad camera motion with realistic micro-movements and believable energy.",
  luxury_ad:
    "Create a premium luxury advertising motion treatment with refined camera movement, glossy highlights, and elegant pacing.",
};

const transitionInstructions: Record<StartEndTransitionStyle, string> = {
  cinematic_morph:
    "Create a smooth cinematic morph with believable intermediate motion and no abrupt subject jumps.",
  speed_ramp:
    "Use a premium speed-ramp transition with dynamic pacing, controlled acceleration, and a polished final settle.",
  three_d_orbit:
    "Create a controlled 3D orbit between the two frames, preserving spatial continuity and product geometry.",
  product_transformation:
    "Show a refined commercial product transformation from the starting frame into the final hero frame.",
  before_after:
    "Build a clear before-after transformation with emotional progression and realistic continuity.",
  light_sweep:
    "Use an elegant light sweep that reveals the end frame while preserving the same subject and brand identity.",
};

export function isImageToVideoMotionStyle(
  value: string,
): value is ImageToVideoMotionStyle {
  return IMAGE_TO_VIDEO_MOTION_STYLES.includes(
    value as ImageToVideoMotionStyle,
  );
}

export function isStartEndTransitionStyle(
  value: string,
): value is StartEndTransitionStyle {
  return START_END_TRANSITION_STYLES.includes(
    value as StartEndTransitionStyle,
  );
}

export function buildImageToVideoPrompt({
  motionStyle,
  optionalPrompt,
}: {
  motionStyle: ImageToVideoMotionStyle;
  optionalPrompt?: string;
}) {
  return [
    "Animate the uploaded reference image into a short, photorealistic social ad video.",
    motionInstructions[motionStyle],
    "Preserve the original subject, product shape, logo placement, typography, colors, facial identity if present, and overall composition.",
    optionalPrompt?.trim()
      ? `Additional creative direction: ${optionalPrompt.trim()}`
      : null,
    "Avoid changing brand marks, labels, product geometry, face identity, or adding random text.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildStartEndTransitionPrompt({
  transitionStyle,
  optionalPrompt,
}: {
  transitionStyle: StartEndTransitionStyle;
  optionalPrompt?: string;
}) {
  return [
    "Create a short, photorealistic start-end image transition video for a social ad.",
    "The first frame must match the uploaded start image exactly, and the final frame must match the uploaded end image exactly.",
    transitionInstructions[transitionStyle],
    "Preserve subject consistency, product identity, packaging shape, logo placement, typography, brand colors, face identity if present, and material details across the entire transition.",
    optionalPrompt?.trim()
      ? `Additional creative direction: ${optionalPrompt.trim()}`
      : null,
    "Avoid sudden identity jumps, alternate branding, random text, warped products, distorted faces, subtitles, or watermarks.",
  ]
    .filter(Boolean)
    .join(" ");
}
