import { db, UserSettings } from './db';
import { BatteryCheckIn } from '../domain/energy.types';
import { Task } from '../domain/task.types';

export const defaultSettings: UserSettings = {
  id: 'current',
  childName: 'Nia',
  parentName: 'Rohith',
  batteryMvpThreshold: 30,
  minimumJoyMinutes: 45,
  defaultFocusBlockMinutes: 20,
  afternoonStartMinutes: 930, // 3:30 PM (15:30)
  bedtimeMinutes: 1260, // 9:00 PM (21:00)
};

export async function initializeSeedDataIfEmpty(): Promise<void> {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.put(defaultSettings);
  }

  const taskCount = await db.tasks.count();
  if (taskCount === 0) {
    const now = new Date().toISOString();
    const sampleTasks: Task[] = [
      {
        id: 'task-1',
        title: 'Math Worksheet (Page 42 - Fractions)',
        category: 'SCHOOL',
        priority: 'MUST_DO',
        estimatedMinutes: 15,
        actualMinutesSpent: 0,
        status: 'ACTIVE',
        createdAt: now,
        lastTouchedAt: now,
        daysUntouched: 0,
      },
      {
        id: 'task-2',
        title: 'Science Ecosystem Diagram draft',
        category: 'SCHOOL',
        priority: 'NEXT_UP',
        estimatedMinutes: 15,
        actualMinutesSpent: 0,
        status: 'ACTIVE',
        createdAt: now,
        lastTouchedAt: now,
        daysUntouched: 1,
      },
      {
        id: 'task-3',
        title: 'Read 2 chapters of Percy Jackson',
        category: 'PERSONAL',
        priority: 'NEXT_UP',
        estimatedMinutes: 20,
        actualMinutesSpent: 0,
        status: 'ACTIVE',
        createdAt: now,
        lastTouchedAt: now,
        daysUntouched: 0,
      },
      {
        id: 'task-4',
        title: 'Pack sports bag for tomorrow',
        category: 'CHORE',
        priority: 'LATER',
        estimatedMinutes: 10,
        actualMinutesSpent: 0,
        status: 'ACTIVE',
        createdAt: now,
        lastTouchedAt: now,
        daysUntouched: 2,
      },
      {
        id: 'task-5',
        title: 'Clean colored pencils drawer',
        category: 'CHORE',
        priority: 'LATER',
        estimatedMinutes: 15,
        actualMinutesSpent: 0,
        status: 'ACTIVE',
        createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
        lastTouchedAt: new Date(Date.now() - 22 * 86400000).toISOString(),
        daysUntouched: 22, // Will trigger 21-day auto-decay!
      },
    ];

    await db.tasks.bulkPut(sampleTasks);
  }

  const energyCount = await db.energy_logs.count();
  if (energyCount === 0) {
    const historicalLogs: BatteryCheckIn[] = [];
    const today = new Date();

    // Generate past 14 days of realistic middle-school data
    for (let i = 14; i >= 1; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay(); // 0 is Sunday, 4 is Thursday

      let battery = 60 + Math.floor(Math.sin(i) * 20);
      let mood: 'CHARGED' | 'STEADY' | 'DRAINED' | 'OVERLOADED' = 'STEADY';

      // Simulate recurring Thursday drain (e.g. Band + PE day) to demonstrate Zombie Day rule
      if (dayOfWeek === 4) {
        battery = 25 + Math.floor(Math.random() * 8);
        mood = 'DRAINED';
      } else if (dayOfWeek === 1) { // Monday fatigue
        battery = 45;
        mood = 'STEADY';
      } else if (dayOfWeek === 5) { // Friday excitement
        battery = 85;
        mood = 'CHARGED';
      }

      historicalLogs.push({
        id: `seed-log-${i}`,
        date: dateStr,
        timestamp: `${dateStr}T15:35:00.000Z`,
        batteryLevel: battery,
        moodSignal: mood,
        frictionTags: battery < 35 ? ['DRAG'] : ['FINE'],
        source: 'ARRIVAL_SLIDER',
      });
    }

    await db.energy_logs.bulkPut(historicalLogs);
  }
}
