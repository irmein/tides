import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { BatteryCharging, BatteryLow, BatteryMedium, BatteryFull, Sparkles, ShieldAlert, Check } from 'lucide-react';
import { useEnergyStore } from './energy.store';
import { useEngineStore } from '../../engine/engine.store';
import { MoodSignal } from '../../domain/energy.types';
import { triggerHaptic } from '../../shared/haptics';
import { sounds } from '../../shared/soundEffects';

interface ArrivalSliderProps {
  onCheckInCompleted?: () => void;
}

export const ArrivalSlider: React.FC<ArrivalSliderProps> = ({ onCheckInCompleted }) => {
  const { todayBattery, setBattery, isCheckInCompletedToday } = useEnergyStore();
  const { runEvaluation, settings } = useEngineStore();

  const [sliderVal, setSliderVal] = useState<number>(todayBattery || 70);
  const [selectedMood, setSelectedMood] = useState<MoodSignal>('STEADY');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [justSaved, setJustSaved] = useState<boolean>(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Sync internal slider if changed from store
  useEffect(() => {
    setSliderVal(todayBattery);
  }, [todayBattery]);

  // Determine state labels and color palette based on battery level
  const isCritical = sliderVal <= (settings.batteryMvpThreshold || 30);
  const isHigh = sliderVal >= 66;

  const getTierInfo = () => {
    if (isCritical) {
      return {
        label: 'Low Fuel — MVP Shield Active',
        desc: 'Homework is capped to 20m so you can rest and recharge.',
        color: 'from-rose-500 via-red-500 to-amber-500',
        glow: 'shadow-[0_0_40px_rgba(244,63,94,0.5)]',
        accentBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        icon: <BatteryLow className="w-8 h-8 text-rose-400 animate-pulse" />,
      };
    }
    if (isHigh) {
      return {
        label: 'Charged Up & In The Flow',
        desc: 'Great energy to dive into your #1 focus goal!',
        color: 'from-blue-500 via-cyan-400 to-teal-400',
        glow: 'shadow-[0_0_40px_rgba(59,130,246,0.5)]',
        accentBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        icon: <BatteryFull className="w-8 h-8 text-cyan-400" />,
      };
    }
    return {
      label: 'Steady Afternoon Pace',
      desc: 'Balanced rhythm with time for snack, focus, and play.',
      color: 'from-emerald-500 via-teal-500 to-cyan-500',
      glow: 'shadow-[0_0_40px_rgba(16,185,129,0.5)]',
      accentBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: <BatteryMedium className="w-8 h-8 text-emerald-400" />,
    };
  };

  const tier = getTierInfo();

  // Commit on release (zero submit button needed)
  const handleCommit = async (val: number, mood: MoodSignal = selectedMood) => {
    sounds.playClick(isCritical ? 320 : 540);
    triggerHaptic(isCritical ? 'warning' : 'success');

    await setBattery(val, mood);
    await runEvaluation();

    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2200);

    if (onCheckInCompleted) {
      setTimeout(onCheckInCompleted, 600);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateFromPointer(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    updateFromPointer(e);
    handleCommit(sliderVal);
  };

  const updateFromPointer = (e: React.PointerEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const pct = Math.round((x / rect.width) * 100);
    const clamped = Math.max(5, Math.min(100, pct));
    setSliderVal(clamped);

    // Audio click feedback on drag
    if (Math.abs(clamped - sliderVal) >= 5) {
      sounds.playClick(300 + clamped * 4);
      triggerHaptic('light');
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto p-6 bg-slate-900/90 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Dynamic ambient background glow */}
      <div
        className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-30 transition-all duration-700 pointer-events-none ${
          isCritical ? 'bg-rose-600' : isHigh ? 'bg-cyan-500' : 'bg-emerald-500'
        }`}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            After-School Arrival
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight font-heading">
            How full is your tank, {settings.childName}?
          </h2>
        </div>
        <div className={`p-3 rounded-2xl border ${tier.accentBg}`}>
          {tier.icon}
        </div>
      </div>

      {/* Big Tactile Battery Gauge Display */}
      <div className="flex items-baseline justify-center gap-2 my-6">
        <motion.span
          key={sliderVal}
          initial={{ scale: 0.95, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-7xl font-extrabold tracking-tighter text-white font-heading"
        >
          {sliderVal}
        </motion.span>
        <span className="text-2xl font-bold text-slate-400">%</span>
      </div>

      {/* Visual Feedback Tier */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-200 border border-slate-700 mb-1">
          {isCritical && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
          {isHigh && <Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
          {tier.label}
        </div>
        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
          {tier.desc}
        </p>
      </div>

      {/* Big Thumb-Friendly Tactile Fluid Track (64px height) */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setIsDragging(false)}
        className="relative h-16 w-full bg-slate-950/80 rounded-2xl border-2 border-slate-800/80 p-1.5 cursor-pointer touch-none select-none flex items-center shadow-inner group"
      >
        {/* Fill level */}
        <motion.div
          className={`h-full rounded-xl bg-gradient-to-r ${tier.color} transition-all duration-75 ${tier.glow}`}
          style={{ width: `${sliderVal}%` }}
        />

        {/* Thumb dial button */}
        <motion.div
          animate={{ scale: isDragging ? 1.15 : 1 }}
          className="absolute top-1 bottom-1 w-14 bg-white rounded-xl shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing border border-slate-200 transform -translate-x-1/2"
          style={{ left: `${Math.max(7, Math.min(93, sliderVal))}%` }}
        >
          <div className="flex gap-0.5">
            <span className="w-1 h-5 bg-slate-400 rounded-full" />
            <span className="w-1 h-5 bg-slate-300 rounded-full" />
          </div>
        </motion.div>
      </div>

      {/* Quick Mood Signal Chips (Single Tap) */}
      <div className="mt-6 pt-5 border-t border-slate-800/80">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2 text-center">
          Tap Your Mood (Optional)
        </span>
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              { id: 'CHARGED', label: '⚡ Electric', bg: 'hover:bg-cyan-500/20' },
              { id: 'STEADY', label: '🌿 Steady', bg: 'hover:bg-emerald-500/20' },
              { id: 'DRAINED', label: '😴 Heavy', bg: 'hover:bg-amber-500/20' },
              { id: 'OVERLOADED', label: '🌪️ Fried', bg: 'hover:bg-rose-500/20' },
            ] as const
          ).map((m) => {
            const isSelected = selectedMood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedMood(m.id);
                  triggerHaptic('light');
                  sounds.playClick(480);
                  handleCommit(sliderVal, m.id);
                }}
                className={`py-2 px-1 text-xs font-medium rounded-xl border transition-all text-center ${
                  isSelected
                    ? 'bg-slate-700 text-white border-cyan-400 shadow-md scale-105'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 ' + m.bg
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Instant Auto-Commit indicator */}
      {justSaved && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-4 p-2.5 bg-emerald-500/20 border border-emerald-500/50 rounded-xl flex items-center justify-center gap-2 text-emerald-300 text-xs font-semibold"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          Tank logged & schedule adjusted!
        </motion.div>
      )}
    </div>
  );
};
