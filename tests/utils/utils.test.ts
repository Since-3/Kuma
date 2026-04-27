import { describe, it, expect } from "vitest";
import { cn } from "@/src/lib/utils";

describe("cn", () => {
  it("gibt eine einzelne Klasse zurück", () => {
    expect(cn("px-4")).toBe("px-4");
  });

  it("kombiniert mehrere Klassen", () => {
    expect(cn("px-4", "py-2", "text-sm")).toBe("px-4 py-2 text-sm");
  });

  it("überschreibt konfliktive Tailwind-Klassen (twMerge)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("ignoriert falsy-Werte (clsx)", () => {
    expect(cn("px-4", false && "text-red", undefined, null as never, "py-2")).toBe("px-4 py-2");
  });

  it("verarbeitet bedingte Objekte", () => {
    expect(cn({ "px-4": true, "py-2": false, "text-sm": true })).toBe("px-4 text-sm");
  });

  it("verarbeitet Arrays", () => {
    expect(cn(["px-4", "py-2"])).toBe("px-4 py-2");
  });

  it("gibt leeren String bei keinen Argumenten zurück", () => {
    expect(cn()).toBe("");
  });

  it("gibt leeren String bei nur falsy-Werten zurück", () => {
    expect(cn(false, undefined, null as never)).toBe("");
  });
});
