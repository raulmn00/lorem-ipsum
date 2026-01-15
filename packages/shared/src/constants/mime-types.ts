export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.heic',
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const THUMBNAIL_SIZE = {
  width: 300,
  height: 300,
} as const;
