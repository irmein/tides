import { create } from 'zustand';
import { RuleResult } from './rules/base.rule';
import { RuleEngine } from './RuleEngine';
import { db, UserSettings } from '../storage/db';
import { useEnergyStore } from '../modules/checkin/energy.store';
import { useScheduleStore } from '../modules/desk-dial/schedule.store';
import { useTaskStore } from '../modules/triage/task.store';

interface EngineState {
  activeRuleResults: RuleResult[];
  isEvaluating: boolean;
  settings: UserSettings;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  runEvaluation: () => Promise<RuleResult[]>;
}

export const useEngineStore = create<EngineState>((set, get) => ({
  activeRuleResults: [],
  isEvaluating: false,
  settings: {
    id: 'current',
    childName: 'Nia',
    parentName: 'Rohith',
    batteryMvpThreshold: 30,
    minimumJoyMinutes: 45,
    defaultFocusBlockMinutes: 20,
    afternoonStartMinutes: 930,
    bedtimeMinutes: 1260,
  },

  loadSettings: async () => {
    const s = await db.settings.get('current');
    if (s) {
      set({ settings: s });
    }
  },

  updateSettings: async (partial: Partial<UserSettings>) => {
    const updated = { ...get().settings, ...partial };
    await db.settings.put(updated);
    set({ settings: updated });
    // Re-evaluate on settings change
    await get().runEvaluation();
  },

  runEvaluation: async (): Promise<RuleResult[]> => {
    set({ isEvaluating: true });
    try {
      const energyStore = useEnergyStore.getState();
      const scheduleStore = useScheduleStore.getState();
      const taskStore = useTaskStore.getState();
      const settings = get().settings;

      const recentLogs = await db.energy_logs.orderBy('date').reverse().limit(21).toArray();
      const activeTasks = await db.tasks.toArray();

      const results = await RuleEngine.evaluate({
        todayBattery: energyStore.todayBattery,
        recentLogs,
        activeTasks,
        currentSchedule: scheduleStore.currentSchedule,
        settings,
      });

      set({ activeRuleResults: results, isEvaluating: false });

      // Apply effects to schedule store
      await scheduleStore.applyRuleResults(results);

      // Apply task-level effects (like static decay auto-sunset)
      for (const res of results) {
        if (res.actionType === 'AUTO_SUNSET' && res.payload.taskIds) {
          for (const taskId of res.payload.taskIds) {
            await taskStore.sunsetTask(taskId);
          }
        }
      }

      return results;
    } catch (err) {
      console.error('Failed to run RuleEngine evaluation:', err);
      set({ isEvaluating: false });
      return [];
    }
  },
}));
