import { BatteryCheckIn } from '../../domain/energy.types';
import { DaySchedule } from '../../domain/schedule.types';
import { Task } from '../../domain/task.types';
import { UserSettings } from '../../storage/db';

export interface EvaluationContext {
  todayBattery: number; // 0 - 100
  recentLogs: BatteryCheckIn[]; // Past 14-21 days of logs
  activeTasks: Task[];
  currentSchedule: DaySchedule;
  settings: UserSettings;
}

export type RuleActionType =
  | 'OVERRIDE_TODAY'
  | 'MUTATE_WEEK'
  | 'DECOMPOSE_TASK'
  | 'AUTO_SUNSET';

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  priority: number; // 1-100 (100 = Critical safety override)
  actionType: RuleActionType;
  payload: Record<string, any>;
  reason: string;
}

export interface AdaptiveRule {
  id: string;
  name: string;
  priority: number;
  evaluate: (ctx: EvaluationContext) => RuleResult | null;
}
