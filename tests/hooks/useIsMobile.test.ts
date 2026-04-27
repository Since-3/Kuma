import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "@/src/hooks/use-mobile";

const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

function setWindowWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: width < 768,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      dispatchEvent: vi.fn(),
    }),
  });
}

beforeEach(() => {
  mockAddEventListener.mockClear();
  mockRemoveEventListener.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useIsMobile", () => {
  it("gibt true zurück bei schmaler Viewport-Breite (<768px)", () => {
    setWindowWidth(500);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("gibt false zurück bei breiter Viewport-Breite (>=768px)", () => {
    setWindowWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("gibt false zurück genau bei 768px", () => {
    setWindowWidth(768);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("registriert einen Event-Listener auf matchMedia", () => {
    setWindowWidth(500);
    renderHook(() => useIsMobile());
    expect(mockAddEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("entfernt den Event-Listener beim Unmount", () => {
    setWindowWidth(500);
    const { unmount } = renderHook(() => useIsMobile());
    unmount();
    expect(mockRemoveEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
