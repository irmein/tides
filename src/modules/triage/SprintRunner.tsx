import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, CheckCircle2, Wind, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task } from '../../domain/task.types';
import { triggerHaptic } from '../../shared/haptics';
import { sounds } from '../../shared/soundEffects';

interface SprintRunnerProps {
  task: Task;
  onFinishSprint: () => void;
  onCancelSprint: () => void;
}

export const SprintRunner: React.FC<SprintRunnerProps> = ({
  task,
  onFinishSprint,
  onCancelSprint,
}) => {
  const initialSeconds = (task.estimatedMinutes || 15) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  // Countdown timer loop
  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining]);

  const handleComplete = () => {
    setIsRunning(false);
    triggerHaptic('success');
    sounds.playSuccess();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#fbbf24'],
      });
    } catch {
      // Confetti fallback
    }
    onFinishSprint();
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const progressPercent = 1 - secondsRemaining / initialSeconds;

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900/95 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-2xl text-center">
      {/* Task in Focus */}
      <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 block mb-1">
        Current Sprint Target
      </span>
      <h3 className="text-xl font-bold text-white mb-6 font-heading">
        {task.title}
      </h3>

      {/* Circular Timer Visual */}
      <div className="relative w-52 h-52 mx-auto flex items-center justify-center mb-6">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            className="stroke-slate-800"
            strokeWidth="8"
            fill="transparent"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="44"
            className="stroke-blue-500"
            strokeWidth="8"
            strokeDasharray={276}
            strokeDashoffset={276 * (1 - progressPercent)}
            strokeLinecap="round"
            fill="transparent"
            transition={{ duration: 0.5 }}
          />
        </svg>

        {/* Time remaining text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-extrabold text-white tracking-tighter font-heading">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className="text-xs text-slate-400 mt-1 font-medium">
            {isRunning ? 'Stay in the flow' : 'Timer paused'}
          </span>
        </div>
      </div>

      {/* Big Tactile Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            sounds.playClick(440);
            setIsRunning(!isRunning);
          }}
          className="h-14 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold rounded-2xl border border-slate-700 flex items-center justify-center gap-2 transition-all"
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 text-amber-400" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 text-emerald-400" />
              <span>Resume</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleComplete}
          className="h-14 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Done Early!</span>
        </button>
      </div>

      {/* Cancel or Take a breath button */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          onCancelSprint();
        }}
        className="text-xs text-slate-400 hover:text-slate-200 font-medium py-2 transition-colors"
      >
        Exit sprint without saving
      </button>
    </div>
  );
};
