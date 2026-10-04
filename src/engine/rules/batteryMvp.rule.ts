import { AdaptiveRule } from './base.rule';

export const BatteryMvpRule: AdaptiveRule = {
  id: 'battery-mvp-fail-safe',
  name: 'Enforce MVP on Critical Battery',
  priority: 100, // Highest priority override
  evaluate: ({ todayBattery, settings }) => {
    const threshold = settings.batteryMvpThreshold || 30;
    if (todayBattery <= threshold) {
      return {
        ruleId: 'battery-mvp-fail-safe',
        ruleName: 'Enforce MVP on Critical Battery',
        triggered: true,
        priority: 100,
        actionType: 'OVERRIDE_TODAY',
        payload: {
          isMvpMode: true,
          maxFocusMinutes: 20,
          allowedPriorities: ['MUST_DO'],
          reallocateZone: 'RESET',
          autoShiftMinutes: 40,
        },
        reason: `Battery at ${todayBattery}% (<= ${threshold}%): Switched to MVP Mode. Only 1 urgent task allowed; Focus shrunk to 20m and 40m transferred to Reset.`,
      };
    }
    return null;
  },
};
