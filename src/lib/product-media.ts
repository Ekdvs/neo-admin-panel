import type { MediaType } from "@/types/productType";

export const MAX_FILES = 10;
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export const ACCEPT = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(",");

export const getMediaType = (file: File): MediaType | null => {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return "IMAGE";
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) return "VIDEO";
  return null;
};

export const validateMediaFile = (file: File): string | null => {
  const type = getMediaType(file);

  if (!type) return `${file.name}: Unsupported file type`;
  if (type === "IMAGE" && file.size > MAX_IMAGE_SIZE)
    return `${file.name}: Image must be under 10 MB`;
  if (type === "VIDEO" && file.size > MAX_VIDEO_SIZE)
    return `${file.name}: Video must be under 100 MB`;

  return null;
};

export const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`;