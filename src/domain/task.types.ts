import { FrictionTag } from './energy.types';

export type TaskPriority = 'MUST_DO' | 'NEXT_UP' | 'LATER';

export interface Task {
  id: string;
  title: string;
  category: 'SCHOOL' | 'CHORE' | 'PERSONAL';
  priority: TaskPriority; // 🔴 Must, 🟡 Next, 🟢 Later
  estimatedMinutes: number; // Default 15 mins for 6th graders
  actualMinutesSpent: number;
  status: 'INBOX' | 'ACTIVE' | 'COMPLETED' | 'SUNSET';
  createdAt: string;
  lastTouchedAt: string;
  daysUntouched: number;
  completedAt?: string;
  postTaskReflection?: FrictionTag;
}
