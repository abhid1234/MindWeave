import { Storage } from '@google-cloud/storage';

const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME;

// Lazy singleton — only created when GCS is actually used
let _storage: Storage | null = null;
function getStorage(): Storage {
  if (!_storage) {
    _storage = new Storage(); // Uses Application Default Credentials on Cloud Run
  }
  return _storage;
}

/**
 * Returns true when GCS is configured (i.e. GCS_BUCKET_NAME env var is set).
 * When false, callers should fall back to local filesystem (dev only).
 */
export function isGCSConfigured(): boolean {
  return !!GCS_BUCKET_NAME;
}

/**
 * Upload a buffer to GCS. Objects are publicly readable via uniform
 * bucket-level access (allUsers → storage.objectViewer), so no
 * per-object makePublic() call is needed.
 * Returns the public URL.
 */
export async function uploadToGCS(
  objectPath: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const bucket = getStorage().bucket(GCS_BUCKET_NAME!);
  const file = bucket.file(objectPath);

  await file.save(buffer, {
    contentType,
    resumable: false, // files are ≤10 MB, skip resumable overhead
  });

  return getPublicUrl(objectPath);
}

/**
 * Delete an object from GCS. Idempotent — ignores 404.
 */
export async function deleteFromGCS(objectPath: string): Promise<void> {
  const bucket = getStorage().bucket(GCS_BUCKET_NAME!);
  try {
    await bucket.file(objectPath).delete();
  } catch (err: unknown) {
    // Ignore "not found" — the object may already be gone
    if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 404) {
      return;
    }
    throw err;
  }
}

/**
 * Build the public URL for a GCS object.
 */
export function getPublicUrl(objectPath: string): string {
  return `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${objectPath}`;
}

/**
 * Extract the GCS object path from either:
 *  - A full GCS public URL: https://storage.googleapis.com/{bucket}/uploads/...
 *  - A legacy /api/files/{userId}/{filename} path
 *
 * Returns the object path (e.g. "uploads/{userId}/{filename}") or null if unparseable.
 */
export function extractGCSObjectPath(filePath: string): string | null {
  if (!filePath) return null;

  // Full GCS URL
  if (filePath.startsWith('https://storage.googleapis.com/')) {
    const url = new URL(filePath);
    // pathname is /{bucket}/{objectPath...}
    const parts = url.pathname.split('/');
    // parts[0] = '', parts[1] = bucket, parts[2..] = object path segments
    if (parts.length >= 3) {
      return parts.slice(2).join('/');
    }
    return null;
  }

  // Legacy /api/files/{userId}/{filename}
  const legacyPrefix = '/api/files/';
  if (filePath.startsWith(legacyPrefix)) {
    const rest = filePath.slice(legacyPrefix.length); // "{userId}/{filename}"
    return `uploads/${rest}`;
  }

  return null;
}
