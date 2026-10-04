import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Clock, AlertTriangle, Sparkles, Check } from 'lucide-react';
import { useTaskStore } from './task.store';
import { useScheduleStore } from '../desk-dial/schedule.store';
import { useEngineStore } from '../../engine/engine.store';
import { Task, TaskPriority } from '../../domain/task.types';
import { triggerHaptic } from '../../shared/haptics';
import { sounds } from '../../shared/soundEffects';

interface TaskSorterProps {
  onStartSprint: (task: Task) => void;
}

export const TaskSorter: React.FC<TaskSorterProps> = ({ onStartSprint }) => {
  const { tasks, updatePriority, addTask } = useTaskStore();
  const { currentSchedule } = useScheduleStore();
  const { settings } = useEngineStore();

  const [newTitle, setNewTitle] = useState('');
  const [showInput, setShowInput] = useState(false);

  const activeTasks = tasks.filter((t) => t.status === 'ACTIVE');
  const mustTasks = activeTasks.filter((t) => t.priority === 'MUST_DO');
  const nextTasks = activeTasks.filter((t) => t.priority === 'NEXT_UP');
  const laterTasks = activeTasks.filter((t) => t.priority === 'LATER');

  const handlePriorityChange = async (taskId: string, newPriority: TaskPriority) => {
    triggerHaptic('light');
    sounds.playClick(newPriority === 'MUST_DO' ? 520 : newPriority === 'NEXT_UP' ? 440 : 380);
    await updatePriority(taskId, newPriority);
  };

  const handleQuickAdd = async (title: string, priority: TaskPriority = 'MUST_DO') => {
    if (!title.trim()) return;
    triggerHaptic('success');
    sounds.playClick(500);
    await addTask(title.trim(), priority);
    setNewTitle('');
    setShowInput(false);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900/90 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Task Triage
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight font-heading">
            {settings.childName}'s Tasks
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setShowInput(!showInput);
          }}
          className="h-10 px-3 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Goal</span>
        </button>
      </div>

      {/* Quick Add Form / Single-Tap Preset Chips */}
      {showInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-5 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-700/80"
        >
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Science reading..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd(newTitle)}
              className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
            />
            <button
              type="button"
              onClick={() => handleQuickAdd(newTitle)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold active:scale-95"
            >
              Add
            </button>
          </div>

          {/* 1-Tap Quick Suggestion Chips */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {['Math sheet', 'Science reading', 'Pack backpack', 'Clean desk'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleQuickAdd(preset)}
                className="text-[11px] bg-slate-800 text-slate-300 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 active:scale-95"
              >
                + {preset}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* MVP Mode notice */}
      {currentSchedule.isMvpMode && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-2 text-rose-300 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>MVP Mode: Keep strictly 1 🔴 Must task active tonight!</span>
        </div>
      )}

      {/* 🔴 MUST DO SECTION */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-500" />
            1. Must Do (Priority 🔴)
          </span>
          <span className="text-[11px] text-slate-400">
            {mustTasks.length === 1 ? 'Perfect (1 item)' : `${mustTasks.length} items`}
          </span>
        </div>

        {mustTasks.length === 0 ? (
          <div className="p-4 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-400">
            No Must-Do selected. Stamp 🔴 on an item below to focus!
          </div>
        ) : (
          mustTasks.map((t) => (
            <motion.div
              key={t.id}
              layout
              className="p-4 bg-slate-950/90 rounded-2xl border-2 border-rose-500/50 shadow-lg shadow-rose-500/10 mb-2 flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white">{t.title}</h4>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {t.estimatedMinutes} min sprint
                  </span>
                </div>

                {/* Priority Stamp Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handlePriorityChange(t.id, 'MUST_DO')}
                    className="w-7 h-7 rounded-lg bg-rose-500 text-white font-bold text-xs flex items-center justify-center shadow-md scale-105"
                  >
                    🔴
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePriorityChange(t.id, 'NEXT_UP')}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs flex items-center justify-center"
                  >
                    🟡
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePriorityChange(t.id, 'LATER')}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs flex items-center justify-center"
                  >
                    🟢
                  </button>
                </div>
              </div>

              {/* Start Focus Sprint Button */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('success');
                  sounds.playClick(600);
                  onStartSprint(t);
                }}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs shadow-md shadow-blue-500/30 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start 15m Sprint for this Task</span>
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* 🟡 NEXT UP SECTION */}
      <div className="mb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-sm shadow-amber-500" />
          2. Next Up (If Energy Remains 🟡)
        </span>

        {nextTasks.length === 0 ? (
          <div className="p-3 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-400">
            Empty. Stamp 🟡 on tasks below to line them up.
          </div>
        ) : (
          nextTasks.map((t) => (
            <motion.div
              key={t.id}
              layout
              className="p-3 bg-slate-950/70 rounded-xl border border-amber-500/30 mb-2 flex items-center justify-between"
            >
              <div>
                <h4 className="text-xs font-semibold text-slate-200">{t.title}</h4>
                <span className="text-[10px] text-slate-400">{t.estimatedMinutes}m</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePriorityChange(t.id, 'MUST_DO')}
                  className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs flex items-center justify-center"
                >
                  🔴
                </button>
                <button
                  type="button"
                  onClick={() => handlePriorityChange(t.id, 'NEXT_UP')}
                  className="w-7 h-7 rounded-lg bg-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-md scale-105"
                >
                  🟡
                </button>
                <button
                  type="button"
                  onClick={() => handlePriorityChange(t.id, 'LATER')}
                  className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs flex items-center justify-center"
                >
                  🟢
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* 🟢 LATER (Parked Without Guilt) */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500" />
          3. Later (Guilt-Free Parking 🟢)
        </span>

        {laterTasks.length === 0 ? (
          <div className="p-3 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-400">
            No parked items.
          </div>
        ) : (
          laterTasks.map((t) => (
            <motion.div
              key={t.id}
              layout
              className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 mb-2 flex items-center justify-between"
            >
              <div>
                <h4 className="text-xs font-medium text-slate-300">{t.title}</h4>
                {t.daysUntouched > 14 && (
                  <span className="text-[10px] text-amber-400/80">
                    Untouched {t.daysUntouched}d (Auto-sunsets at 21d)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePriorityChange(t.id, 'MUST_DO')}
                  className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs flex items-center justify-center"
                >
                  🔴
                </button>
                <button
                  type="button"
                  onClick={() => handlePriorityChange(t.id, 'NEXT_UP')}
                  className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs flex items-center justify-center"
                >
                  🟡
                </button>
                <button
                  type="button"
                  onClick={() => handlePriorityChange(t.id, 'LATER')}
                  className="w-7 h-7 rounded-lg bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-md scale-105"
                >
                  🟢
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
