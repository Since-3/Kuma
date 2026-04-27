import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/src/app/api/upload/avatar/route";

vi.mock("@/src/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/src/lib/prisma", () => ({
  prisma: {
    employee: { findUnique: vi.fn() },
  },
}));

import { createAdminClient } from "@/src/lib/supabase/admin";
import { prisma } from "@/src/lib/prisma";

const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn().mockReturnValue({
  data: { publicUrl: "https://example.com/avatars/emp-1/photo.jpg" },
});
const mockStorageBucket = { upload: mockUpload, getPublicUrl: mockGetPublicUrl };
const mockAdminClient = { storage: { from: vi.fn().mockReturnValue(mockStorageBucket) } };

const validEmployee = {
  id: "emp-1",
  isOnboarded: false,
  onboardingTokenExpiry: new Date(Date.now() + 3600000),
};

beforeEach(() => {
  vi.mocked(createAdminClient).mockReturnValue(mockAdminClient as never);
  vi.mocked(prisma.employee.findUnique).mockReset();
  mockUpload.mockReset();
  mockUpload.mockResolvedValue({ data: { path: "employees/emp-1/photo.jpg" }, error: null });
});

function makeImageFile(name = "photo.jpg", type = "image/jpeg", sizeBytes = 1024): File {
  const content = new Uint8Array(sizeBytes);
  const file = new File([content], name, { type });
  // Ensure arrayBuffer() is available (jsdom File may lack it in Node.js test env)
  if (typeof file.arrayBuffer !== "function") {
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => content.buffer,
    });
  }
  return file;
}

// jsdom's multipart body parser drops File.type, so we mock formData() directly
// to return a FormData containing the original File object unchanged.
function makeRequest(file: File | null, token: string | null): Request {
  const req = new Request("http://localhost/api/upload/avatar", { method: "POST" });

  req.formData = async () => {
    const fd = {
      get(key: string) {
        if (key === "file") return file;
        if (key === "token") return token;
        return null;
      },
    } as unknown as FormData;
    return fd;
  };

  return req;
}

describe("POST /api/upload/avatar", () => {
  it("gibt 400 zurück wenn Datei fehlt", async () => {
    const res = await POST(makeRequest(null, "valid-token"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Datei und Token erforderlich");
  });

  it("gibt 400 zurück wenn Token fehlt", async () => {
    const res = await POST(makeRequest(makeImageFile(), null));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Datei und Token erforderlich");
  });

  it("gibt 401 zurück bei ungültigem Token", async () => {
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(null);

    const res = await POST(makeRequest(makeImageFile(), "invalid-token"));
    expect(res.status).toBe(401);
  });

  it("gibt 401 zurück bei bereits abgeschlossenem Onboarding", async () => {
    vi.mocked(prisma.employee.findUnique).mockResolvedValue({
      ...validEmployee,
      isOnboarded: true,
    } as never);

    const res = await POST(makeRequest(makeImageFile(), "valid-token"));
    expect(res.status).toBe(401);
  });

  it("gibt 401 zurück bei abgelaufenem Token", async () => {
    vi.mocked(prisma.employee.findUnique).mockResolvedValue({
      ...validEmployee,
      onboardingTokenExpiry: new Date(Date.now() - 1000),
    } as never);

    const res = await POST(makeRequest(makeImageFile(), "valid-token"));
    expect(res.status).toBe(401);
  });

  it("gibt 400 zurück bei nicht-Bilddatei", async () => {
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(validEmployee as never);

    const pdfFile = new File(["pdf content"], "doc.pdf", { type: "application/pdf" });
    const res = await POST(makeRequest(pdfFile, "valid-token"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Bilddateien");
  });

  it("gibt 400 zurück bei zu großer Datei (>5MB)", async () => {
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(validEmployee as never);

    const bigFile = makeImageFile("big.jpg", "image/jpeg", 6 * 1024 * 1024);
    const res = await POST(makeRequest(bigFile, "valid-token"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("5MB");
  });

  it("gibt 201 und publicUrl zurück bei Erfolg", async () => {
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(validEmployee as never);

    const res = await POST(makeRequest(makeImageFile(), "valid-token"));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.publicUrl).toContain("https://");
  });
});
