import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Heart, AlertOctagon, Sparkles, Sliders, History, Calendar, Check } from 'lucide-react';
import { db, RuleAuditLog } from '../../storage/db';
import { useEngineStore } from '../../engine/engine.store';
import { useScheduleStore } from '../desk-dial/schedule.store';
import { triggerHaptic } from '../../shared/haptics';
import { sounds } from '../../shared/soundEffects';

export const ParentRetrospective: React.FC = () => {
  const { settings, updateSettings, runEvaluation } = useEngineStore();
  const { currentSchedule } = useScheduleStore();

  const [auditLogs, setAuditLogs] = useState<RuleAuditLog[]>([]);
  const [stats, setStats] = useState({
    avgBattery: 62,
    joyFocusRatio: 1.3,
    dragPercent: 18,
    zombieCount: 2,
    totalLogs: 14,
  });
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    loadRetrospectiveData();
  }, []);

  const loadRetrospectiveData = async () => {
    // 1. Fetch recent audit logs
    const logs = await db.rule_audit_logs.orderBy('timestamp').reverse().limit(6).toArray();
    setAuditLogs(logs);

    // 2. Fetch energy check-ins
    const energyEntries = await db.energy_logs.toArray();
    if (energyEntries.length > 0) {
      const avg = Math.round(
        energyEntries.reduce((sum, e) => sum + e.batteryLevel, 0) / energyEntries.length
      );
      const lowDays = energyEntries.filter((e) => e.batteryLevel <= 35).length;

      // 3. Fetch completed tasks with reflections
      const completedTasks = await db.tasks.where('status').equals('COMPLETED').toArray();
      const dragTasks = completedTasks.filter((t) => t.postTaskReflection === 'DRAG').length;
      const dragRate = completedTasks.length > 0
        ? Math.round((dragTasks / completedTasks.length) * 100)
        : 15;

      // Calculate Joy to Focus ratio from current schedule
      const focusMin = currentSchedule.zones.find((z) => z.zone === 'FOCUS')?.durationMinutes || 45;
      const joyMin = currentSchedule.zones.find((z) => z.zone === 'JOY')?.durationMinutes || 60;
      const ratio = Number((joyMin / focusMin).toFixed(2));

      setStats({
        avgBattery: avg,
        joyFocusRatio: ratio,
        dragPercent: dragRate,
        zombieCount: lowDays,
        totalLogs: energyEntries.length,
      });
    }
  };

  const handleUpdateThreshold = async (newVal: number) => {
    triggerHaptic('medium');
    sounds.playClick(440);
    await updateSettings({ batteryMvpThreshold: newVal });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleUpdateMinJoy = async (newVal: number) => {
    triggerHaptic('medium');
    sounds.playClick(460);
    await updateSettings({ minimumJoyMinutes: newVal });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900/90 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Parent Overview & Calibration
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight font-heading">
            {settings.parentName}'s Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pacing insights & safety controls for {settings.childName} (11 y/o)
          </p>
        </div>
        <div className="p-3 bg-purple-500/20 text-purple-300 rounded-2xl border border-purple-500/40">
          <ShieldCheck className="w-6 h-6" />
        </div>
      </div>

      {/* The Vital 4 Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* 1. Average Battery */}
        <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400">Avg Arrival Tank</span>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-white font-heading">
              {stats.avgBattery}%
            </span>
          </div>
          <span className="text-[10px] text-emerald-400">Past 14 school days</span>
        </div>

        {/* 2. Joy to Focus Ratio */}
        <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400">Joy : Focus Ratio</span>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-amber-400 font-heading">
              {stats.joyFocusRatio}x
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Target ≥ 1.0x (healthy rest)</span>
        </div>

        {/* 3. Drag Friction Rate */}
        <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400">Task Drag Rate</span>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-rose-400 font-heading">
              {stats.dragPercent}%
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Tasks tagged 🔴 Drag</span>
        </div>

        {/* 4. Zombie Days */}
        <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400">Zombie Days (Drain)</span>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-cyan-400 font-heading">
              {stats.zombieCount}
            </span>
            <span className="text-xs text-slate-400">days</span>
          </div>
          <span className="text-[10px] text-cyan-400/80">Thursday PE/Band pattern</span>
        </div>
      </div>

      {/* Calibration Controls */}
      <div className="mb-6 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <Sliders className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Rule Calibration for {settings.childName}
          </span>
        </div>

        {/* Battery MVP Threshold Slider */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300">MVP Fail-Safe Threshold</span>
            <span className="font-bold text-rose-400">≤ {settings.batteryMvpThreshold}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="45"
            step="5"
            value={settings.batteryMvpThreshold}
            onChange={(e) => handleUpdateThreshold(Number(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block mt-0.5">
            If arrival battery drops at or below this level, focus is capped to 20m.
          </span>
        </div>

        {/* Joy Zone Floor */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300">Protected Joy Floor</span>
            <span className="font-bold text-amber-400">{settings.minimumJoyMinutes} min</span>
          </div>
          <input
            type="range"
            min="30"
            max="90"
            step="15"
            value={settings.minimumJoyMinutes}
            onChange={(e) => handleUpdateMinJoy(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Homework cannot expand into this time; non-negotiable play is guaranteed.
          </span>
        </div>

        {savedToast && (
          <div className="mt-2 text-center text-xs text-emerald-400 flex items-center justify-center gap-1">
            <Check className="w-3.5 h-3.5" /> Setting updated & re-evaluated!
          </div>
        )}
      </div>

      {/* Rule Audit Trail ("Why did Tides adjust Nia's schedule?") */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Rule Engine Audit Trail
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Live Triggers</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-3 bg-slate-950/40 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-800">
            No rules fired today yet. Pacing is in steady state.
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 bg-slate-950/90 rounded-xl border border-slate-800 text-xs flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 text-[11px] truncate">
                    {log.ruleName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">{log.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
