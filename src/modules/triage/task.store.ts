import { create } from 'zustand';
import { Task, TaskPriority } from '../../domain/task.types';
import { FrictionTag } from '../../domain/energy.types';
import { db } from '../../storage/db';

interface TaskState {
  tasks: Task[];
  activeTask: Task | null;
  loadTasks: () => Promise<void>;
  updatePriority: (id: string, priority: TaskPriority) => Promise<void>;
  completeTaskWithReflection: (id: string, reflection: FrictionTag) => Promise<void>;
  sunsetTask: (id: string) => Promise<void>;
  addTask: (title: string, priority: TaskPriority, category?: 'SCHOOL' | 'CHORE' | 'PERSONAL') => Promise<void>;
  setActiveTask: (task: Task | null) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  activeTask: null,

  loadTasks: async () => {
    const all = await db.tasks.toArray();
    set({ tasks: all });
  },

  updatePriority: async (id: string, priority: TaskPriority) => {
    const now = new Date().toISOString();
    await db.tasks.update(id, { priority, lastTouchedAt: now, daysUntouched: 0 });
    set({
      tasks: get().tasks.map((t) =>
        t.id === id ? { ...t, priority, lastTouchedAt: now, daysUntouched: 0 } : t
      ),
    });
  },

  completeTaskWithReflection: async (id: string, reflection: FrictionTag) => {
    const now = new Date().toISOString();
    await db.tasks.update(id, {
      status: 'COMPLETED',
      completedAt: now,
      postTaskReflection: reflection,
      lastTouchedAt: now,
    });
    set({
      tasks: get().tasks.map((t) =>
        t.id === id
          ? { ...t, status: 'COMPLETED', completedAt: now, postTaskReflection: reflection }
          : t
      ),
      activeTask: null,
    });
  },

  sunsetTask: async (id: string) => {
    await db.tasks.update(id, { status: 'SUNSET' });
    set({
      tasks: get().tasks.map((t) => (t.id === id ? { ...t, status: 'SUNSET' } : t)),
    });
  },

  addTask: async (
    title: string,
    priority: TaskPriority = 'MUST_DO',
    category: 'SCHOOL' | 'CHORE' | 'PERSONAL' = 'SCHOOL'
  ) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      category,
      priority,
      estimatedMinutes: 15,
      actualMinutesSpent: 0,
      status: 'ACTIVE',
      createdAt: now,
      lastTouchedAt: now,
      daysUntouched: 0,
    };
    await db.tasks.put(newTask);
    set({ tasks: [newTask, ...get().tasks] });
  },

  setActiveTask: (task: Task | null) => {
    set({ activeTask: task });
  },
}));
