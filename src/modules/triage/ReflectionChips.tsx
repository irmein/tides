import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { FrictionTag } from '../../domain/energy.types';
import { triggerHaptic } from '../../shared/haptics';
import { sounds } from '../../shared/soundEffects';

interface ReflectionChipsProps {
  taskTitle: string;
  onSelectTag: (tag: FrictionTag) => void;
}

export const ReflectionChips: React.FC<ReflectionChipsProps> = ({
  taskTitle,
  onSelectTag,
}) => {
  const handleTag = (tag: FrictionTag) => {
    triggerHaptic(tag === 'DRAG' ? 'warning' : 'success');
    sounds.playClick(tag === 'BREEZE' ? 660 : tag === 'FINE' ? 520 : 350);
    onSelectTag(tag);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 bg-slate-900/95 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-2xl text-center max-w-md mx-auto"
    >
      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
        <Sparkles className="w-6 h-6" />
      </div>

      <h3 className="text-xl font-bold text-white font-heading">
        Sprint Completed!
      </h3>
      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto line-clamp-2">
        "{taskTitle}"
      </p>

      <span className="text-xs font-semibold text-slate-300 block mt-5 mb-3">
        How did this feel to work on? (Single Tap)
      </span>

      {/* The 3 Big Tactile Chips */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => handleTag('BREEZE')}
          className="h-20 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/60 hover:bg-emerald-900/50 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 group shadow-lg"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">🟢</span>
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
            Breeze
          </span>
          <span className="text-[10px] text-emerald-400/80">Felt light</span>
        </button>

        <button
          type="button"
          onClick={() => handleTag('FINE')}
          className="h-20 rounded-2xl bg-amber-950/40 border-2 border-amber-500/60 hover:bg-amber-900/50 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 group shadow-lg"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">🟡</span>
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            Fine
          </span>
          <span className="text-[10px] text-amber-400/80">Normal work</span>
        </button>

        <button
          type="button"
          onClick={() => handleTag('DRAG')}
          className="h-20 rounded-2xl bg-rose-950/40 border-2 border-rose-500/60 hover:bg-rose-900/50 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 group shadow-lg"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">🔴</span>
          <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
            Drag
          </span>
          <span className="text-[10px] text-rose-400/80">Felt hard</span>
        </button>
      </div>
    </motion.div>
  );
};
