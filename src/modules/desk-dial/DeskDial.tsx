import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Coffee, Gamepad2, ShieldAlert, Sparkles, Clock } from 'lucide-react';
import { useScheduleStore } from './schedule.store';
import { useEngineStore } from '../../engine/engine.store';
import { triggerHaptic } from '../../shared/haptics';
import { sounds } from '../../shared/soundEffects';

interface DeskDialProps {
  onSelectZone?: (zone: 'FOCUS' | 'RESET' | 'JOY') => void;
}

export const DeskDial: React.FC<DeskDialProps> = ({ onSelectZone }) => {
  const { currentSchedule, activeZoneId } = useScheduleStore();
  const { settings } = useEngineStore();

  const totalMinutes = currentSchedule.zones.reduce((acc, z) => acc + z.durationMinutes, 0) || 165;

  const getZoneIcon = (zoneType: string) => {
    switch (zoneType) {
      case 'FOCUS':
        return <Brain className="w-5 h-5 text-blue-400" />;
      case 'RESET':
        return <Coffee className="w-5 h-5 text-emerald-400" />;
      case 'JOY':
        return <Gamepad2 className="w-5 h-5 text-amber-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getZoneGlowClass = (zoneType: string) => {
    switch (zoneType) {
      case 'FOCUS':
        return 'border-blue-500/60 bg-blue-950/40 text-blue-300';
      case 'RESET':
        return 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300';
      case 'JOY':
        return 'border-amber-500/60 bg-amber-950/40 text-amber-300';
      default:
        return 'border-slate-800 bg-slate-900 text-slate-400';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900/90 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Afternoon Rhythm
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight font-heading">
            The 3-Zone Desk Dial
          </h2>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-xs font-medium text-slate-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m total</span>
        </div>
      </div>

      {/* Safety Override Banner if MVP or Shield Active */}
      <AnimatePresence>
        {currentSchedule.isMvpMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-start gap-2.5 text-rose-200 text-xs"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">MVP Fail-Safe Active for {settings.childName}</span>
              <p className="text-rose-300/90 leading-tight">
                Focus shrunk to 20m. Extra time moved to Reset to protect sleep & tomorrow.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tactile Segmented Bar Slider */}
      <div className="relative h-14 w-full bg-slate-950 rounded-2xl p-1.5 flex gap-1.5 border border-slate-800 overflow-hidden shadow-inner">
        {currentSchedule.zones.map((zone) => {
          const widthPercent = (zone.durationMinutes / totalMinutes) * 100;
          const isFocus = zone.zone === 'FOCUS';
          const isReset = zone.zone === 'RESET';
          const isJoy = zone.zone === 'JOY';

          let bgGrad = 'from-blue-600 to-indigo-700';
          let borderCol = 'border-blue-400/40';
          if (isReset) {
            bgGrad = 'from-emerald-600 to-teal-700';
            borderCol = 'border-emerald-400/40';
          } else if (isJoy) {
            bgGrad = 'from-amber-500 to-orange-600';
            borderCol = 'border-amber-400/40';
          }

          return (
            <motion.div
              key={zone.id}
              layout
              transition={{ type: 'spring', stiffness: 260, damping: 25 }}
              onClick={() => {
                triggerHaptic('light');
                sounds.playClick(400);
                if (onSelectZone) onSelectZone(zone.zone);
              }}
              style={{ width: `${widthPercent}%` }}
              className={`relative h-full rounded-xl bg-gradient-to-r ${bgGrad} border ${borderCol} flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 overflow-hidden group`}
            >
              <span className="text-[11px] font-bold text-white uppercase tracking-wider truncate px-1">
                {zone.durationMinutes}m
              </span>
              <span className="text-[9px] font-medium text-white/80 uppercase truncate px-1">
                {zone.zone}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Detailed Zone Cards */}
      <div className="grid grid-cols-3 gap-2.5 mt-5">
        {currentSchedule.zones.map((zone) => {
          const cardStyle = getZoneGlowClass(zone.zone);
          return (
            <div
              key={zone.id}
              onClick={() => {
                triggerHaptic('light');
                sounds.playClick(440);
                if (onSelectZone) onSelectZone(zone.zone);
              }}
              className={`p-3 rounded-2xl border flex flex-col items-center text-center cursor-pointer transition-all hover:border-slate-500 ${cardStyle}`}
            >
              <div className="p-2 bg-slate-900/60 rounded-xl mb-2">
                {getZoneIcon(zone.zone)}
              </div>
              <span className="text-xs font-bold block truncate w-full font-heading">
                {zone.label}
              </span>
              <span className="text-lg font-extrabold text-white mt-0.5">
                {zone.durationMinutes}
                <span className="text-xs font-normal text-slate-400 ml-0.5">min</span>
              </span>
              <span className="text-[10px] text-slate-400 mt-1">
                {zone.zone === 'FOCUS' && '1 Must-Do Goal'}
                {zone.zone === 'RESET' && 'Snack & Breath'}
                {zone.zone === 'JOY' && 'Protected Fun'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
