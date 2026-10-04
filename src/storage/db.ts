import Dexie, { type Table } from 'dexie';
import { BatteryCheckIn } from '../domain/energy.types';
import { DaySchedule } from '../domain/schedule.types';
import { Task } from '../domain/task.types';

export interface RuleAuditLog {
  id: string;
  timestamp: string;
  ruleId: string;
  ruleName: string;
  actionType: string;
  payload: Record<string, any>;
  reason: string;
}

export interface UserSettings {
  id: string; // 'current'
  childName: string;
  parentName: string;
  batteryMvpThreshold: number; // Default: 30
  minimumJoyMinutes: number; // Default: 45
  defaultFocusBlockMinutes: number; // Default: 20
  afternoonStartMinutes: number; // Default: 930 (15:30)
  bedtimeMinutes: number; // Default: 1260 (21:00)
}

export class TidesDatabase extends Dexie {
  energy_logs!: Table<BatteryCheckIn, string>;
  schedules!: Table<DaySchedule, string>;
  tasks!: Table<Task, string>;
  rule_audit_logs!: Table<RuleAuditLog, string>;
  settings!: Table<UserSettings, string>;

  constructor() {
    super('TidesDB');
    this.version(1).stores({
      energy_logs: 'id, date, timestamp, batteryLevel',
      schedules: 'date',
      tasks: 'id, priority, status, lastTouchedAt, daysUntouched',
      rule_audit_logs: 'id, timestamp, ruleId',
      settings: 'id',
    });
  }
}

export const db = new TidesDatabase();
