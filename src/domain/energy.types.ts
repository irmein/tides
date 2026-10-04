export type MoodSignal = 'CHARGED' | 'STEADY' | 'DRAINED' | 'OVERLOADED';

export type FrictionTag = 'BREEZE' | 'FINE' | 'DRAG';

export interface BatteryCheckIn {
  id: string; // UUID v4
  timestamp: string; // ISO 8601
  date: string; // YYYY-MM-DD
  batteryLevel: number; // 0 - 100
  moodSignal: MoodSignal;
  frictionTags?: FrictionTag[];
  source: 'ARRIVAL_SLIDER' | 'MIDDAY_CHECK' | 'MANUAL';
  note?: string;
}

export interface VitalFourMetrics {
  weekStarting: string; // YYYY-MM-DD
  avgArrivalBattery: number; // 0 - 100
  joyFocusRatio: number; // Ratio >= 1.0 indicates healthy recovery
  frictionDragPercent: number; // % of tasks tagged as 'DRAG'
  zombieDayCount: number; // Days where battery <= 35%
}
