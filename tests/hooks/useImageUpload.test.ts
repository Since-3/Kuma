import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useImageUpload } from "@/src/hooks/useImageUpload";

vi.mock("@/src/lib/supabase/storage", () => ({
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  generateFilePath: vi.fn().mockReturnValue("users/user-1/1234567890.jpg"),
}));

import { uploadFile, deleteFile } from "@/src/lib/supabase/storage";

const defaultOptions = { bucket: "avatars" as const };

function makeFile(name = "photo.jpg", type = "image/jpeg", sizeBytes = 1024): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

beforeEach(() => {
  vi.mocked(uploadFile).mockReset();
  vi.mocked(deleteFile).mockReset();
});

describe("useImageUpload", () => {
  it("gibt initialen State zurück", () => {
    const { result } = renderHook(() => useImageUpload(defaultOptions));
    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.progress).toBe(0);
  });

  it("lehnt ungültigen MIME-Type ab und setzt error", async () => {
    const { result } = renderHook(() => useImageUpload(defaultOptions));
    const pdfFile = new File(["pdf"], "doc.pdf", { type: "application/pdf" });

    await act(async () => {
      await expect(result.current.upload(pdfFile, "user-1")).rejects.toThrow();
    });

    expect(result.current.error).toContain("Ungültiger Dateityp");
    expect(result.current.isUploading).toBe(false);
  });

  it("lehnt Datei über maximaler Größe ab und setzt error", async () => {
    const { result } = renderHook(() => useImageUpload({ ...defaultOptions, maxSizeMB: 1 }));
    const bigFile = makeFile("big.jpg", "image/jpeg", 2 * 1024 * 1024);

    await act(async () => {
      await expect(result.current.upload(bigFile, "user-1")).rejects.toThrow();
    });

    expect(result.current.error).toContain("groß");
    expect(result.current.isUploading).toBe(false);
  });

  it("setzt isUploading auf false nach erfolgreichem Upload", async () => {
    vi.mocked(uploadFile).mockResolvedValue({
      path: "users/user-1/photo.jpg",
      publicUrl: "https://example.com/photo.jpg",
    });

    const { result } = renderHook(() => useImageUpload(defaultOptions));
    const file = makeFile();

    let url: string;
    await act(async () => {
      url = await result.current.upload(file, "user-1");
    });

    expect(url!).toBe("https://example.com/photo.jpg");
    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.progress).toBe(100);
  });

  it("setzt error bei fehlgeschlagenem Upload", async () => {
    vi.mocked(uploadFile).mockRejectedValue(new Error("Netzwerkfehler"));

    const { result } = renderHook(() => useImageUpload(defaultOptions));

    await act(async () => {
      await expect(result.current.upload(makeFile(), "user-1")).rejects.toThrow("Netzwerkfehler");
    });

    expect(result.current.error).toBe("Netzwerkfehler");
    expect(result.current.isUploading).toBe(false);
  });

  it("ruft deleteFile mit korrektem Pfad auf", async () => {
    vi.mocked(deleteFile).mockResolvedValue(undefined);

    const { result } = renderHook(() => useImageUpload(defaultOptions));

    await act(async () => {
      await result.current.remove("users/user-1/old-photo.jpg");
    });

    expect(deleteFile).toHaveBeenCalledWith("avatars", "users/user-1/old-photo.jpg");
    expect(result.current.error).toBeNull();
  });

  it("setzt error wenn delete fehlschlägt", async () => {
    vi.mocked(deleteFile).mockRejectedValue(new Error("Löschen fehlgeschlagen"));

    const { result } = renderHook(() => useImageUpload(defaultOptions));

    await act(async () => {
      await expect(result.current.remove("some/path.jpg")).rejects.toThrow();
    });

    expect(result.current.error).toBe("Löschen fehlgeschlagen");
  });

  it("akzeptiert konfigurierbare erlaubte MIME-Types", async () => {
    const { result } = renderHook(() =>
      useImageUpload({ ...defaultOptions, allowedTypes: ["image/png"] })
    );

    const jpegFile = makeFile("photo.jpg", "image/jpeg");

    await act(async () => {
      await expect(result.current.upload(jpegFile, "user-1")).rejects.toThrow();
    });

    expect(result.current.error).toContain("Ungültiger Dateityp");
  });
});
