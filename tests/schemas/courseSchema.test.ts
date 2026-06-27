import { describe, it, expect } from "vitest";
import { courseSchema, publishedCourseSchema } from "@/src/modules/courses/schemas/course-schema";

describe("courseSchema (Draft)", () => {
  it("akzeptiert komplett leere Daten (Entwurf)", () => {
    const result = courseSchema.safeParse({ isStandingOrder: false });
    expect(result.success).toBe(true);
  });

  it("akzeptiert leere String-Felder", () => {
    const result = courseSchema.safeParse({
      name: "",
      date: "",
      timeFrom: "",
      timeTo: "",
      isStandingOrder: false,
    });
    expect(result.success).toBe(true);
  });

  it("lehnt timeFrom >= timeTo ab", () => {
    const result = courseSchema.safeParse({
      isStandingOrder: false,
      timeFrom: "14:00",
      timeTo: "10:00",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("timeTo");
  });

  it("akzeptiert valide Zeitspanne", () => {
    const result = courseSchema.safeParse({
      isStandingOrder: false,
      timeFrom: "09:00",
      timeTo: "10:30",
    });
    expect(result.success).toBe(true);
  });
});

const validPublishedCourse = {
  name: "Yoga Grundlagen",
  sport: ["Yoga"],
  level: "Anfänger",
  date: "2026-05-01",
  timeFrom: "09:00",
  timeTo: "10:30",
  trainers: ["trainer-1"],
  room: "raum-1",
  description: "Einführungskurs",
  maxParticipants: 15,
  price: 19.99,
  isStandingOrder: false,
};

describe("publishedCourseSchema", () => {
  it("akzeptiert vollständig valide Kursdaten", () => {
    const result = publishedCourseSchema.safeParse(validPublishedCourse);
    expect(result.success).toBe(true);
  });

  it("lehnt fehlenden Kursnamen ab", () => {
    const result = publishedCourseSchema.safeParse({ ...validPublishedCourse, name: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("name");
  });

  it("lehnt leeres Sport-Array ab", () => {
    const result = publishedCourseSchema.safeParse({ ...validPublishedCourse, sport: [] });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("sport");
  });

  it("lehnt leeres Trainer-Array ab", () => {
    const result = publishedCourseSchema.safeParse({ ...validPublishedCourse, trainers: [] });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("trainers");
  });

  it("lehnt maxParticipants über 100 ab", () => {
    const result = publishedCourseSchema.safeParse({
      ...validPublishedCourse,
      maxParticipants: 101,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("maxParticipants");
  });

  it("lehnt maxParticipants unter 1 ab", () => {
    const result = publishedCourseSchema.safeParse({ ...validPublishedCourse, maxParticipants: 0 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("maxParticipants");
  });

  it("lehnt Preis über 9999.99 ab", () => {
    const result = publishedCourseSchema.safeParse({ ...validPublishedCourse, price: 10000 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("price");
  });

  it("lehnt negativen Preis ab", () => {
    const result = publishedCourseSchema.safeParse({ ...validPublishedCourse, price: -1 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("price");
  });

  it("lehnt timeFrom >= timeTo ab", () => {
    const result = publishedCourseSchema.safeParse({
      ...validPublishedCourse,
      timeFrom: "11:00",
      timeTo: "09:00",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("timeTo");
  });

  it("lehnt Dauerauftrag ohne Häufigkeit ab", () => {
    const result = publishedCourseSchema.safeParse({
      ...validPublishedCourse,
      isStandingOrder: true,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("frequency");
  });

  it("akzeptiert Dauerauftrag mit Häufigkeit", () => {
    const result = publishedCourseSchema.safeParse({
      ...validPublishedCourse,
      isStandingOrder: true,
      frequency: "weekly",
      endDate: "2026-12-31",
    });
    expect(result.success).toBe(true);
  });

  it("lehnt individuelle Häufigkeit ohne Wochentage ab", () => {
    const result = publishedCourseSchema.safeParse({
      ...validPublishedCourse,
      isStandingOrder: true,
      frequency: "custom",
      endDate: "2026-12-31",
      weekdays: [],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("weekdays");
  });

  it("akzeptiert individuelle Häufigkeit mit Wochentagen", () => {
    const result = publishedCourseSchema.safeParse({
      ...validPublishedCourse,
      isStandingOrder: true,
      frequency: "custom",
      endDate: "2026-12-31",
      weekdays: ["Montag", "Mittwoch"],
    });
    expect(result.success).toBe(true);
  });
});
