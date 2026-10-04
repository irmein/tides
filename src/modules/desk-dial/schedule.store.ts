import { create } from 'zustand';
import { DaySchedule, ZoneBlock } from '../../domain/schedule.types';
import { RuleResult } from '../../engine/rules/base.rule';
import { db } from '../../storage/db';

export const FOCUS_COLOR = {
  primary: '#2563eb',
  background: '#1e293b',
  border: '#3b82f6',
  glow: 'rgba(37, 99, 235, 0.4)',
};

export const RESET_COLOR = {
  primary: '#10b981',
  background: '#064e3b',
  border: '#34d399',
  glow: 'rgba(16, 185, 129, 0.35)',
};

export const JOY_COLOR = {
  primary: '#f59e0b',
  background: '#78350f',
  border: '#fbbf24',
  glow: 'rgba(245, 158, 11, 0.4)',
};

interface ScheduleState {
  currentSchedule: DaySchedule;
  activeZoneId: string | null;
  loadSchedule: () => Promise<void>;
  generateDefaultSchedule: (batteryLevel: number) => DaySchedule;
  applyRuleResults: (results: RuleResult[]) => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  currentSchedule: {
    date: new Date().toISOString().split('T')[0],
    totalAvailableMinutes: 180, // 3:30 PM to 6:30 PM core block
    isMvpMode: false,
    lastCalculatedAt: new Date().toISOString(),
    zones: [
      {
        id: 'zone-focus',
        zone: 'FOCUS',
        startMinutesFromMidnight: 930, // 3:30 PM
        durationMinutes: 45,
        label: 'Focus Sprint',
        isLocked: false,
        colorToken: FOCUS_COLOR,
      },
      {
        id: 'zone-reset',
        zone: 'RESET',
        startMinutesFromMidnight: 975, // 4:15 PM
        durationMinutes: 30,
        label: 'Brain Reset',
        isLocked: false,
        colorToken: RESET_COLOR,
      },
      {
        id: 'zone-joy',
        zone: 'JOY',
        startMinutesFromMidnight: 1005, // 4:45 PM
        durationMinutes: 60,
        label: 'Joy & Play',
        isLocked: true,
        colorToken: JOY_COLOR,
      },
    ],
  },
  activeZoneId: 'zone-focus',

  generateDefaultSchedule: (batteryLevel: number): DaySchedule => {
    const todayStr = new Date().toISOString().split('T')[0];
    const totalAvail = 165; // Total afternoon minutes (e.g. 2h45m)
    let focusMin = 45;
    let resetMin = 30;
    let joyMin = 60;
    let isMvp = false;

    if (batteryLevel <= 30) {
      // Critical battery: shrink focus to 20, expand reset to 60, keep joy at 60
      focusMin = 20;
      resetMin = 60;
      joyMin = 60;
      isMvp = true;
    } else if (batteryLevel <= 55) {
      focusMin = 35;
      resetMin = 45;
      joyMin = 60;
    } else {
      focusMin = 50;
      resetMin = 30;
      joyMin = 65;
    }

    const zones: ZoneBlock[] = [
      {
        id: 'zone-focus',
        zone: 'FOCUS',
        startMinutesFromMidnight: 930,
        durationMinutes: focusMin,
        label: isMvp ? 'MVP Micro-Sprint' : 'Focus Zone',
        isLocked: false,
        colorToken: FOCUS_COLOR,
      },
      {
        id: 'zone-reset',
        zone: 'RESET',
        startMinutesFromMidnight: 930 + focusMin,
        durationMinutes: resetMin,
        label: 'Reset & Recharge',
        isLocked: false,
        colorToken: RESET_COLOR,
      },
      {
        id: 'zone-joy',
        zone: 'JOY',
        startMinutesFromMidnight: 930 + focusMin + resetMin,
        durationMinutes: joyMin,
        label: 'Joy & Play Floor',
        isLocked: true,
        colorToken: JOY_COLOR,
      },
    ];

    return {
      date: todayStr,
      totalAvailableMinutes: totalAvail,
      zones,
      isMvpMode: isMvp,
      lastCalculatedAt: new Date().toISOString(),
    };
  },

  loadSchedule: async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const saved = await db.schedules.get(todayStr);
    if (saved) {
      set({ currentSchedule: saved });
    }
  },

  applyRuleResults: async (results: RuleResult[]) => {
    let schedule = { ...get().currentSchedule };

    for (const r of results) {
      if (r.actionType === 'OVERRIDE_TODAY') {
        const payload = r.payload;
        if (payload.isMvpMode) {
          schedule.isMvpMode = true;
          schedule.overrideReason = r.reason;
          schedule.zones = schedule.zones.map((z) => {
            if (z.zone === 'FOCUS') {
              return { ...z, durationMinutes: payload.maxFocusMinutes || 20, label: 'MVP Focus' };
            }
            if (z.zone === 'RESET') {
              return { ...z, durationMinutes: z.durationMinutes + (payload.autoShiftMinutes || 25) };
            }
            return z;
          });
        } else if (payload.isShieldedDay) {
          schedule.overrideReason = r.reason;
          schedule.zones = schedule.zones.map((z) => {
            if (z.zone === 'FOCUS') {
              return { ...z, durationMinutes: Math.min(z.durationMinutes, payload.maxFocusMinutes || 25) };
            }
            if (z.zone === 'RESET') {
              return { ...z, durationMinutes: Math.max(z.durationMinutes, payload.recommendedResetMinutes || 45) };
            }
            return z;
          });
        }
      }
    }

    set({ currentSchedule: schedule });
    await db.schedules.put(schedule);
  },
}));
