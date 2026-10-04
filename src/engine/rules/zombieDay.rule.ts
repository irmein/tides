import { AdaptiveRule } from './base.rule';

export const ZombieDayRule: AdaptiveRule = {
  id: 'zombie-day-detector',
  name: 'Recurring Zombie Day Mitigation',
  priority: 80,
  evaluate: ({ recentLogs }) => {
    if (!recentLogs || recentLogs.length < 5) return null;

    const todayDayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday...
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = weekdayNames[todayDayOfWeek];

    // Filter logs for this specific weekday over previous weeks
    const matchingWeekdays = recentLogs.filter((log) => {
      const d = new Date(log.date);
      return d.getDay() === todayDayOfWeek;
    });

    if (matchingWeekdays.length >= 2) {
      const lastTwo = matchingWeekdays.slice(-2);
      const isChronicLow = lastTwo.every((l) => l.batteryLevel <= 35);
      if (isChronicLow) {
        return {
          ruleId: 'zombie-day-detector',
          ruleName: 'Recurring Zombie Day Mitigation',
          triggered: true,
          priority: 80,
          actionType: 'OVERRIDE_TODAY',
          payload: {
            isShieldedDay: true,
            maxFocusMinutes: 25,
            recommendedResetMinutes: 45,
            dayName: currentDayName,
          },
          reason: `Pattern detected: The past 2 ${currentDayName}s drained Nia's energy under 35%. Proactively shielding today's focus block.`,
        };
      }
    }
    return null;
  },
};
