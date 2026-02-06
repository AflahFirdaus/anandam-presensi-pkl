/**
 * Konstanta shift per tipe hari.
 * Senin–Jumat, Sabtu, Minggu/Hari Libur.
 */

export type ScheduleType = "WEEKDAY" | "SATURDAY" | "SUNDAY" | "HOLIDAY";

export interface ShiftOption {
  jam_masuk: string; // "08:00"
  jam_pulang: string; // "16:00"
  label: string; // "08:00 - 16:00"
}

/** Senin - Jumat: 8-16, 10-18, 13-21 */
export const WEEKDAY_SHIFTS: ShiftOption[] = [
  { jam_masuk: "08:00", jam_pulang: "16:00", label: "08:00 - 16:00" },
  { jam_masuk: "10:00", jam_pulang: "18:00", label: "10:00 - 18:00" },
  { jam_masuk: "13:00", jam_pulang: "21:00", label: "13:00 - 21:00" },
];

/** Sabtu: 8-15, 10-17, 13-21 */
export const SATURDAY_SHIFTS: ShiftOption[] = [
  { jam_masuk: "08:00", jam_pulang: "15:00", label: "08:00 - 15:00" },
  { jam_masuk: "10:00", jam_pulang: "17:00", label: "10:00 - 17:00" },
  { jam_masuk: "13:00", jam_pulang: "21:00", label: "13:00 - 21:00" },
];

/** Minggu */
export const SUNDAY_SHIFTS: ShiftOption[] = [
  { jam_masuk: "10:00", jam_pulang: "19:00", label: "10:00 - 19:00" },
];

/** Hari Libur */
export const HOLIDAY_SHIFTS: ShiftOption[] = [
  { jam_masuk: "10:00", jam_pulang: "19:00", label: "10:00 - 19:00" },
];

export const SCHEDULE_LABELS: Record<ScheduleType, string> = {
  WEEKDAY: "Senin - Jumat",
  SATURDAY: "Sabtu",
  SUNDAY: "Minggu / Hari Libur",
  HOLIDAY: "Hari Libur",
};

export function getShiftsByScheduleType(type: ScheduleType): ShiftOption[] {
  switch (type) {
    case "WEEKDAY":
      return WEEKDAY_SHIFTS;
    case "SATURDAY":
      return SATURDAY_SHIFTS;
    case "SUNDAY":
      return SUNDAY_SHIFTS;
    case "HOLIDAY":
      return HOLIDAY_SHIFTS;
    default:
      return WEEKDAY_SHIFTS;
  }
}
