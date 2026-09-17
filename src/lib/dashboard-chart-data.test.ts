import { describe, expect, it } from "vitest";
import {
  buildAttendanceTrend,
  buildAttendanceTrendFromResumen,
  buildConfirmandoStatusCounts,
  buildPendingRequirements,
  type AttendanceResumenPoint,
} from "@/lib/dashboard-chart-data";

describe("buildPendingRequirements", () => {
  it("counts overlapping requirements, excludes baja, and keeps zero categories", () => {
    const result = buildPendingRequirements([
      {
        status: "activo",
        has_baptism: false,
        has_communion: false,
        padrino_id: null,
        dni: " ",
        direccion: "Calle 1",
        contacto_padres: "111",
      },
      {
        status: "confirmado",
        has_baptism: true,
        has_communion: false,
        padrino_id: "padrino-1",
        dni: "123",
        direccion: "Calle 2",
        contacto_padres: null,
      },
      {
        status: "baja",
        has_baptism: false,
        has_communion: false,
        padrino_id: null,
        dni: null,
        direccion: null,
        contacto_padres: null,
      },
    ]);

    expect(result).toEqual([
      { key: "baptism", label: "Bautismo pendiente", value: 1 },
      { key: "communion", label: "Comunión pendiente", value: 2 },
      { key: "padrino", label: "Padrino pendiente", value: 1 },
      { key: "documentation", label: "Datos incompletos", value: 2 },
    ]);
    expect(buildPendingRequirements([]).map((category) => category.value)).toEqual([0, 0, 0, 0]);
  });
});

describe("buildConfirmandoStatusCounts", () => {
  it("returns stable labeled categories and counts, including zeros", () => {
    expect(
      buildConfirmandoStatusCounts([
        { status: "activo" },
        { status: "apto" },
        { status: "activo" },
        { status: "baja" },
        { status: "apto" },
      ]),
    ).toEqual([
      { key: "activo", label: "Activo", value: 2 },
      { key: "apto", label: "Apto", value: 2 },
      { key: "confirmado", label: "Confirmado", value: 0 },
      { key: "baja", label: "Baja", value: 1 },
    ]);
  });
});

describe("buildAttendanceTrend", () => {
  it("sorts the latest eight recorded meetings and excludes future or unrecorded meetings", () => {
    const meetings = Array.from({ length: 11 }, (_, index) => ({
      id: `meeting-${String(index + 1).padStart(2, "0")}`,
      fecha: `2026-01-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`,
      titulo: `Meeting ${index + 1}`,
    })).reverse();
    const attendance = meetings
      .filter((meeting) => meeting.id !== "meeting-10")
      .flatMap((meeting) => [
        { charla_id: meeting.id, presente: true },
        { charla_id: meeting.id, presente: meeting.id === "meeting-09" },
        { charla_id: meeting.id, presente: false },
      ]);

    const result = buildAttendanceTrend(meetings, attendance, new Date("2026-01-10T12:00:00.000Z"));

    expect(result.map((point) => point.key)).toEqual([
      "meeting-02",
      "meeting-03",
      "meeting-04",
      "meeting-05",
      "meeting-06",
      "meeting-07",
      "meeting-08",
      "meeting-09",
    ]);
    expect(result.at(-1)).toEqual({
      key: "meeting-09",
      date: "2026-01-09T12:00:00.000Z",
      label: "9 ene",
      title: "Meeting 9",
      present: 2,
      absent: 1,
      total: 3,
      attendancePercentage: 67,
    });
    expect(result.some((point) => point.key === "meeting-10")).toBe(false);
    expect(result.some((point) => point.key === "meeting-11")).toBe(false);
  });
});

describe("buildAttendanceTrendFromResumen", () => {
  const resumenItem = (
    overrides: Partial<AttendanceResumenPoint> = {},
  ): AttendanceResumenPoint => ({
    charla_id: "charla-1",
    titulo: "Charla 1",
    fecha: "2026-01-01T12:00:00.000Z",
    total_confirmandos: 3,
    presentes: 2,
    ausentes: 1,
    ...overrides,
  });

  it("keeps the latest eight, sorted chronological ascending", () => {
    const resumen = Array.from({ length: 11 }, (_, index) =>
      resumenItem({
        charla_id: `charla-${String(index + 1).padStart(2, "0")}`,
        titulo: `Charla ${index + 1}`,
        fecha: `2026-01-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`,
      }),
    ).reverse();

    const result = buildAttendanceTrendFromResumen(resumen, new Date("2026-01-11T12:00:00.000Z"));

    expect(result.map((point) => point.key)).toEqual([
      "charla-04",
      "charla-05",
      "charla-06",
      "charla-07",
      "charla-08",
      "charla-09",
      "charla-10",
      "charla-11",
    ]);
    expect(result.map((point) => point.date)).toEqual(
      ["04", "05", "06", "07", "08", "09", "10", "11"].map((day) => `2026-01-${day}T12:00:00.000Z`),
    );
  });

  it("excludes future and zero-attendance charlas", () => {
    const resumen = [
      resumenItem({
        charla_id: "past",
        titulo: "Past",
        fecha: "2026-01-02T12:00:00.000Z",
      }),
      resumenItem({
        charla_id: "future",
        titulo: "Future",
        fecha: "2026-02-01T12:00:00.000Z",
      }),
      resumenItem({
        charla_id: "empty",
        titulo: "Empty",
        fecha: "2026-01-03T12:00:00.000Z",
        total_confirmandos: 0,
        presentes: 0,
        ausentes: 0,
      }),
    ];

    const result = buildAttendanceTrendFromResumen(resumen, new Date("2026-01-15T12:00:00.000Z"));

    expect(result.map((point) => point.key)).toEqual(["past"]);
  });

  it("computes attendance percentage and maps every field", () => {
    const result = buildAttendanceTrendFromResumen([
      resumenItem({
        charla_id: "charla-a",
        titulo: "Charla A",
        fecha: "2026-01-09T12:00:00.000Z",
        total_confirmandos: 4,
        presentes: 2,
        ausentes: 2,
      }),
    ]);

    expect(result).toEqual([
      {
        key: "charla-a",
        date: "2026-01-09T12:00:00.000Z",
        label: "9 ene",
        title: "Charla A",
        present: 2,
        absent: 2,
        total: 4,
        attendancePercentage: 50,
      },
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(buildAttendanceTrendFromResumen([])).toEqual([]);
  });
});
