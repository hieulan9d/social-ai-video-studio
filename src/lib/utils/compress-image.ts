/**
 * Client-side image compression utility.
 * Compresses images before upload to reduce bandwidth and speed up uploads.
 *
 * Uses Canvas API — works in all modern browsers.
 */

export type CompressOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, default 0.8
  type?: string; // output mime type, default "image/jpeg"
};

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.82,
  type: "image/jpeg",
};

/**
 * Compress an image File, returning a new smaller File.
 * If the image is already small enough, returns the original.
 */
export async function compressImage(
  file: File,
  options?: CompressOptions
): Promise<File> {
  // Skip non-image files
  if (!file.type.startsWith("image/")) return file;

  // Skip already small files (< 200KB)
  if (file.size < 200 * 1024) return file;

  // Skip SVGs and GIFs (can't compress with canvas)
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;

  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = calculateDimensions(
      bitmap.width,
      bitmap.height,
      opts.maxWidth,
      opts.maxHeight
    );

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await canvas.convertToBlob({
      type: opts.type,
      quality: opts.quality,
    });

    // Only use compressed version if it's actually smaller
    if (blob.size >= file.size) return file;

    const ext = opts.type === "image/jpeg" ? ".jpg" : ".png";
    const newName = file.name.replace(/\.[^.]+$/, ext);

    return new File([blob], newName, { type: opts.type });
  } catch {
    // If compression fails, return original
    return file;
  }
}

/**
 * Compress multiple files in parallel.
 */
export async function compressImages(
  files: File[],
  options?: CompressOptions
): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, options)));
}

function calculateDimensions(
  origWidth: number,
  origHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = origWidth;
  let height = origHeight;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  return { width, height };
}
