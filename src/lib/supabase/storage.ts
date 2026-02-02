import { createClient } from "./client";

export type StorageBucket = "avatars" | "course-images" | "documents";

interface UploadOptions {
  bucket: StorageBucket;
  path: string;
  file: File;
  upsert?: boolean;
}

interface UploadResult {
  path: string;
  publicUrl: string;
}

/**
 * Uploads a file to Supabase Storage
 */
export async function uploadFile({
  bucket,
  path,
  file,
  upsert = true,
}: UploadOptions): Promise<UploadResult> {
  const supabase = createClient();

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert,
    cacheControl: "3600",
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return {
    path: data.path,
    publicUrl,
  };
}

/**
 * Deletes a file from Supabase Storage
 */
export async function deleteFile(bucket: StorageBucket, path: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Gets the public URL for a file
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const supabase = createClient();

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

/**
 * Generates a unique file path with timestamp
 */
export function generateFilePath(userId: string, fileName: string, folder?: string): string {
  const timestamp = Date.now();
  const extension = fileName.split(".").pop();
  const basePath = folder ? `${folder}/${userId}` : userId;

  return `${basePath}/${timestamp}.${extension}`;
}
