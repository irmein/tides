import { create } from 'zustand';
import { BatteryCheckIn, MoodSignal } from '../../domain/energy.types';
import { db } from '../../storage/db';

interface EnergyState {
  todayBattery: number;
  moodSignal: MoodSignal;
  isCheckInCompletedToday: boolean;
  recentLogs: BatteryCheckIn[];
  setBattery: (level: number, mood?: MoodSignal) => Promise<void>;
  loadTodayStatus: () => Promise<void>;
}

export const useEnergyStore = create<EnergyState>((set) => ({
  todayBattery: 70,
  moodSignal: 'STEADY',
  isCheckInCompletedToday: false,
  recentLogs: [],

  setBattery: async (level: number, mood: MoodSignal = 'STEADY') => {
    const todayStr = new Date().toISOString().split('T')[0];
    const log: BatteryCheckIn = {
      id: crypto.randomUUID(),
      date: todayStr,
      timestamp: new Date().toISOString(),
      batteryLevel: level,
      moodSignal: mood,
      source: 'ARRIVAL_SLIDER',
    };

    // Optimistically update state
    set({
      todayBattery: level,
      moodSignal: mood,
      isCheckInCompletedToday: true,
    });

    // Save to Dexie
    await db.energy_logs.put(log);

    // Refresh recent logs
    const all = await db.energy_logs.orderBy('date').reverse().limit(21).toArray();
    set({ recentLogs: all });
  },

  loadTodayStatus: async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLog = await db.energy_logs.where('date').equals(todayStr).first();
    const recent = await db.energy_logs.orderBy('date').reverse().limit(21).toArray();

    if (todayLog) {
      set({
        todayBattery: todayLog.batteryLevel,
        moodSignal: todayLog.moodSignal,
        isCheckInCompletedToday: true,
        recentLogs: recent,
      });
    } else {
      set({
        recentLogs: recent,
      });
    }
  },
}));
