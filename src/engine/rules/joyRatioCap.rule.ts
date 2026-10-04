import { AdaptiveRule } from './base.rule';

export const JoyRatioCapRule: AdaptiveRule = {
  id: 'joy-ratio-cap',
  name: 'Joy Zone Floor Protection',
  priority: 90,
  evaluate: ({ currentSchedule, settings }) => {
    const minJoy = settings.minimumJoyMinutes || 45;
    const joyBlock = currentSchedule.zones.find((z) => z.zone === 'JOY');

    if (joyBlock && joyBlock.durationMinutes < minJoy) {
      return {
        ruleId: 'joy-ratio-cap',
        ruleName: 'Joy Zone Floor Protection',
        triggered: true,
        priority: 90,
        actionType: 'OVERRIDE_TODAY',
        payload: {
          enforcedJoyMinutes: minJoy,
          curtailFocusToFit: true,
        },
        reason: `Joy zone cannot fall below ${minJoy} minutes. Homework time clamped to protect play and recovery.`,
      };
    }
    return null;
  },
};
