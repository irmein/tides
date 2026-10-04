export type ZoneType = 'FOCUS' | 'RESET' | 'JOY';

export interface ZoneColorToken {
  primary: string;
  background: string;
  border: string;
  glow: string;
}

export interface ZoneBlock {
  id: string;
  zone: ZoneType;
  startMinutesFromMidnight: number; // e.g. 960 = 16:00 (4:00 PM)
  durationMinutes: number;
  label: string;
  isLocked: boolean; // Overrides cannot shrink locked zones below minimums
  colorToken: ZoneColorToken;
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  totalAvailableMinutes: number;
  zones: ZoneBlock[];
  isMvpMode: boolean; // True if battery < 30% triggered fail-safe
  overrideReason?: string;
  lastCalculatedAt: string;
}
