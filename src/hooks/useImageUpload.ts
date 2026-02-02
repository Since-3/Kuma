"use client";

import { useState } from "react";
import {
  uploadFile,
  deleteFile,
  generateFilePath,
  type StorageBucket,
} from "@/src/lib/supabase/storage";

interface UseImageUploadOptions {
  bucket: StorageBucket;
  maxSizeMB?: number;
  allowedTypes?: string[];
  folder?: string;
}

interface UseImageUploadReturn {
  upload: (file: File, userId: string) => Promise<string>;
  remove: (path: string) => Promise<void>;
  isUploading: boolean;
  error: string | null;
  progress: number;
}

const DEFAULT_MAX_SIZE_MB = 5;
const DEFAULT_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function useImageUpload({
  bucket,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  folder,
}: UseImageUploadOptions): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `Ungültiger Dateityp. Erlaubt: ${allowedTypes.join(", ")}`;
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Datei zu groß. Maximum: ${maxSizeMB}MB`;
    }

    return null;
  };

  const upload = async (file: File, userId: string): Promise<string> => {
    setError(null);
    setProgress(0);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      throw new Error(validationError);
    }

    setIsUploading(true);
    setProgress(10);

    try {
      const path = generateFilePath(userId, file.name, folder);
      setProgress(30);

      const result = await uploadFile({
        bucket,
        path,
        file,
        upsert: true,
      });

      setProgress(100);
      return result.publicUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload fehlgeschlagen";
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const remove = async (path: string): Promise<void> => {
    setError(null);

    try {
      await deleteFile(bucket, path);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Löschen fehlgeschlagen";
      setError(message);
      throw err;
    }
  };

  return {
    upload,
    remove,
    isUploading,
    error,
    progress,
  };
}
