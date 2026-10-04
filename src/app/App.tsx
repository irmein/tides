import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Waves,
  Wifi,
  WifiOff,
  User,
  SlidersHorizontal,
  Sparkles,
  Shield,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { initializeSeedDataIfEmpty } from '../storage/seedData';
import { useEnergyStore } from '../modules/checkin/energy.store';
import { useScheduleStore } from '../modules/desk-dial/schedule.store';
import { useTaskStore } from '../modules/triage/task.store';
import { useEngineStore } from '../engine/engine.store';
import { ArrivalSlider } from '../modules/checkin/ArrivalSlider';
import { DeskDial } from '../modules/desk-dial/DeskDial';
import { TaskSorter } from '../modules/triage/TaskSorter';
import { SprintRunner } from '../modules/triage/SprintRunner';
import { ReflectionChips } from '../modules/triage/ReflectionChips';
import { ParentRetrospective } from '../modules/retrospective/ParentRetrospective';
import { Task } from '../domain/task.types';
import { FrictionTag } from '../domain/energy.types';
import { triggerHaptic } from '../shared/haptics';
import { sounds } from '../shared/soundEffects';

export const App: React.FC = () => {
  const { loadTodayStatus, setBattery } = useEnergyStore();
  const { loadSchedule, generateDefaultSchedule } = useScheduleStore();
  const { loadTasks, completeTaskWithReflection } = useTaskStore();
  const { loadSettings, runEvaluation, settings } = useEngineStore();

  const [activeTab, setActiveTab] = useState<'KID' | 'PARENT'>('KID');
  const [sprintTask, setSprintTask] = useState<Task | null>(null);
  const [reflectionTask, setReflectionTask] = useState<Task | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Initial load
  useEffect(() => {
    async function init() {
      await initializeSeedDataIfEmpty();
      await loadSettings();
      await loadTodayStatus();
      await loadTasks();
      await loadSchedule();
      await runEvaluation();
      setIsReady(true);
    }
    init();

    // Track online/offline status
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleStartSprint = (task: Task) => {
    setSprintTask(task);
  };

  const handleFinishSprint = () => {
    if (sprintTask) {
      setReflectionTask(sprintTask);
      setSprintTask(null);
    }
  };

  const handleSelectReflection = async (tag: FrictionTag) => {
    if (reflectionTask) {
      await completeTaskWithReflection(reflectionTask.id, tag);
      await runEvaluation();
      setReflectionTask(null);
    }
  };

  // Quick preset test buttons to test the rule engine
  const handleSimulateBattery = async (level: number) => {
    triggerHaptic('medium');
    sounds.playClick(level <= 30 ? 300 : 600);
    await setBattery(level);
    await runEvaluation();
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Waves className="w-12 h-12 text-blue-500 animate-bounce" />
        <span className="text-sm font-semibold tracking-wider font-heading">
          Setting up Tides on-device...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-lg mx-auto pb-24 selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <header className="px-5 pt-4 pb-2 flex items-center justify-between sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-emerald-500 to-amber-500 p-0.5 shadow-md shadow-blue-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Waves className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight font-heading leading-none">
              Tides
            </h1>
            <span className="text-[10px] text-slate-400">Energy & Focus Pacing</span>
          </div>
        </div>

        {/* Offline indicator & Persona Switcher */}
        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 border ${
              isOnline
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/40'
                : 'bg-amber-950/50 text-amber-400 border-amber-500/40'
            }`}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isOnline ? 'Offline-Ready' : 'Offline Mode'}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              sounds.playClick(activeTab === 'KID' ? 520 : 440);
              setActiveTab(activeTab === 'KID' ? 'PARENT' : 'KID');
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 active:scale-95 transition-all flex items-center gap-1 text-xs"
            title="Switch Persona"
          >
            <User className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline font-bold">
              {activeTab === 'KID' ? settings.childName : settings.parentName}
            </span>
          </button>
        </div>
      </header>

      {/* Quick Test / Rule Trigger Tray (For testing the rules in 1 tap) */}
      <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-900 flex items-center justify-between overflow-x-auto gap-2 no-scrollbar">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
          Rule Triggers:
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleSimulateBattery(25)}
            className="text-[10px] px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 active:scale-95 transition-all flex items-center gap-1"
          >
            <Shield className="w-3 h-3 text-rose-400" />
            <span>Simulate &le;30% (MVP)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimulateBattery(85)}
            className="text-[10px] px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 active:scale-95 transition-all flex items-center gap-1"
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>Simulate 85% (High)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimulateBattery(55)}
            className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 active:scale-95 transition-all"
          >
            Steady 55%
          </button>
        </div>
      </div>

      {/* Main Dynamic Viewport */}
      <main className="flex-1 px-4 py-5 flex flex-col gap-6">
        <AnimatePresence mode="wait">
          {/* Active Sprint Timer Overlay */}
          {sprintTask ? (
            <motion.div
              key="sprint-mode"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="my-auto"
            >
              <SprintRunner
                task={sprintTask}
                onFinishSprint={handleFinishSprint}
                onCancelSprint={() => setSprintTask(null)}
              />
            </motion.div>
          ) : reflectionTask ? (
            /* Reflection Chips Modal */
            <motion.div
              key="reflection-mode"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="my-auto"
            >
              <ReflectionChips
                taskTitle={reflectionTask.title}
                onSelectTag={handleSelectReflection}
              />
            </motion.div>
          ) : activeTab === 'KID' ? (
            /* NIA'S FLOW: Arrival Slider -> 3-Zone Desk Dial -> Task Triage */
            <motion.div
              key="kid-flow"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col gap-6"
            >
              {/* Step 1: 10s Arrival Slider */}
              <ArrivalSlider />

              {/* Step 2: 3-Zone Desk Dial */}
              <DeskDial />

              {/* Step 3: Tactile Task Sorter */}
              <TaskSorter onStartSprint={handleStartSprint} />
            </motion.div>
          ) : (
            /* ROHITH'S VIEW: Parent Retrospective & Calibration */
            <motion.div
              key="parent-flow"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <ParentRetrospective />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Tactile Thumb Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-slate-950/90 border-t border-slate-900 backdrop-blur-xl px-6 py-2.5 flex items-center justify-around z-40">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            sounds.playClick(activeTab === 'KID' ? 440 : 540);
            setActiveTab('KID');
            setSprintTask(null);
            setReflectionTask(null);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all active:scale-95 ${
            activeTab === 'KID'
              ? 'text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Waves className="w-5 h-5" />
          <span className="text-[11px] font-heading">{settings.childName}'s Flow</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            sounds.playClick(activeTab === 'PARENT' ? 440 : 540);
            setActiveTab('PARENT');
            setSprintTask(null);
            setReflectionTask(null);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all active:scale-95 ${
            activeTab === 'PARENT'
              ? 'text-purple-400 font-bold bg-purple-950/40 border border-purple-500/30 shadow-md shadow-purple-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="text-[11px] font-heading">{settings.parentName}'s Hub</span>
        </button>
      </nav>
    </div>
  );
};
