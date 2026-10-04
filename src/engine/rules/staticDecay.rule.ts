import { AdaptiveRule } from './base.rule';

export const StaticDecayRule: AdaptiveRule = {
  id: 'static-decay-sunset',
  name: 'Guilt-Free 21-Day Auto-Decay',
  priority: 50,
  evaluate: ({ activeTasks }) => {
    const decayedTasks = activeTasks.filter(
      (t) => t.status !== 'COMPLETED' && t.status !== 'SUNSET' && t.daysUntouched >= 21
    );

    if (decayedTasks.length > 0) {
      return {
        ruleId: 'static-decay-sunset',
        ruleName: 'Guilt-Free 21-Day Auto-Decay',
        triggered: true,
        priority: 50,
        actionType: 'AUTO_SUNSET',
        payload: {
          taskIds: decayedTasks.map((t) => t.id),
          taskTitles: decayedTasks.map((t) => t.title),
        },
        reason: `${decayedTasks.length} task(s) untouched for 21+ days auto-sunsetted to prevent cognitive clutter.`,
      };
    }
    return null;
  },
};
