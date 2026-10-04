# Tides — Implementation Notes & Engineering Guide

> **Document Version:** 1.0.0  
> **Companion Document:** [BLUEPRINT.md](file:///Users/rohithtp/mine/home/workspaces/tides/docs/BLUEPRINT.md)  
> **Focus:** Tactile UX Engineering, Framer Motion Physics, State Orchestration, and PWA Setup

---

## 1. 6th-Grader Interaction Design System

### 1.1 Tactile Ergonomics & Target Sizing
A typical 6th-grader interacts with mobile devices using single-thumb sweeps or two-handed index tapping. 
* **Minimum Touch Target:** $64 \times 64\text{px}$ (exceeds WCAG 44px standard).
* **Dead Zone:** Top $15\%$ of screen is strictly informational; all primary actions live in the bottom $45\%$ **Thumb Zone**.
* **Zero Typing Rule:** Onboarding, arrival check-in, triage, and task sprints require zero keyboard popups. All entries use sliders, toggles, and pre-baked icon chips.

### 1.2 Tactile Color Tokens (The 3 Zones)

```css
:root {
  /* Zone 1: Focus (Deep Space & Electric Blue) - Stimulates attention without anxiety */
  --zone-focus-primary: #2563eb;
  --zone-focus-bg: #1e293b;
  --zone-focus-glow: rgba(37, 99, 235, 0.4);
  --zone-focus-border: #3b82f6;

  /* Zone 2: Reset (Sage & Earth Green) - Parasympathetic down-regulation */
  --zone-reset-primary: #10b981;
  --zone-reset-bg: #064e3b;
  --zone-reset-glow: rgba(16, 185, 129, 0.35);
  --zone-reset-border: #34d399;

  /* Zone 3: Joy (Sun Amber & Tangerine) - Dopamine reward & protected fun */
  --zone-joy-primary: #f59e0b;
  --zone-joy-bg: #78350f;
  --zone-joy-glow: rgba(245, 158, 11, 0.4);
  --zone-joy-border: #fbbf24;

  /* UI Canvas */
  --canvas-dark: #0f172a;
  --card-surface: #1e293b;
  --card-active: #334155;
}
```

---

## 2. Arrival Check-In: The 10-Second Radial/Vertical Slider

When Nia opens the app at 3:30 PM, the home screen displays a single prompt:  
**"How full is your tank?"**

### 2.1 Framer Motion Spring Configuration
The slider must feel hydraulic yet bouncy:

```typescript
export const sliderSpringConfig = {
  type: 'spring',
  stiffness: 300,
  damping: 24,
  mass: 0.8,
};
```

### 2.2 Visual Haptic Steps
* **0% - 30% (Critical Drain):** Sluggish crimson glow, battery icon shakes slightly, subtitle reads *"Low fuel. Tonight is MVP mode."*
* **31% - 65% (Steady Flow):** Warm amber/sage blend, subtitle reads *"Steady after school. Normal pacing."*
* **66% - 100% (High Energy):** Bright cyan-blue glow with gentle particle sparkles, subtitle reads *"Ready to power through!"*

### 2.3 Single-Release Auto-Commit
* Releasing the thumb triggers an immediate Web Vibration API pulse: `navigator.vibrate([15, 30, 15])`.
* Automatically commits the `batteryLevel` to `useEnergyStore` and triggers `RuleEngine.evaluate()`.
* **Zero "Submit" button.** The gesture itself is the confirmation.

---

## 3. The Tactile Desk Dial Component

The Desk Dial is an interactive 3-zone visual ring or segmented horizontal pill slider showing Nia's entire afternoon at a glance:

```
[====== FOCUS (45m) ======][=== RESET (30m) ===][======== JOY (60m) ========]
▲ Current Time: 4:15 PM (In Focus Zone - 18m remaining)
```

### 3.1 Adaptive Shrink & Expansion Transitions
When `BatteryMvpRule` triggers, the zones animate smoothly:
* Focus contracts from 60m down to 20m using `framer-motion` layout animations (`layoutId="zone-focus"`).
* Reset expands by +40m with a gentle green shimmer.
* A micro-banner toasts: *"🛡️ MVP Mode activated: Focus shrunk to protect your sleep."*

---

## 4. Task Triage & The 15-Minute Sprint Runner

### 4.1 🔴/🟡/🟢 Single-Tap Sorter
Tasks are displayed as large tactile cards with 3 colored circular stamp buttons:
* 🔴 **Must:** The 1 non-negotiable item for today (e.g. "Math Worksheet p.42").
* 🟡 **Next:** Worth doing if energy remains.
* 🟢 **Later:** Parked without guilt.

### 4.2 Sprint Runner (Child-Safe Focus Timer)
* Default sprint: **15 minutes** (recommended cognitive ceiling for middle schoolers before a reset pulse).
* Full-screen distraction-free circle with a countdown arc.
* Giant physical-feeling button: **"Done Early"** or **"Take a Breath"**.

### 4.3 Frictionless Post-Task Reflection (The 3 Chips)
The second a sprint ends, 3 tactile buttons appear on screen:

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   BREEZE     │   │     FINE     │   │     DRAG     │
│     🟢       │   │      🟡      │   │      🔴      │
└──────────────┘   └──────────────┘   └──────────────┘
```

* **Single tap** logs the friction level.
* If Nia taps **DRAG 🔴**, the engine notes this friction tag for that subject. If Math receives 3 consecutive "DRAG" tags, the parent retrospective flags potential curriculum friction or tutoring opportunity.

---

## 5. Zustand State Store Implementations

### 5.1 Energy Store (`src/modules/checkin/energy.store.ts`)

```typescript
import { create } from 'zustand';
import { BatteryCheckIn, MoodSignal } from '../../domain/energy.types';
import { db } from '../../storage/db';

interface EnergyState {
  todayBattery: number;
  moodSignal: MoodSignal;
  isCheckInCompletedToday: boolean;
  setBattery: (level: number, mood?: MoodSignal) => Promise<void>;
  loadTodayStatus: () => Promise<void>;
}

export const useEnergyStore = create<EnergyState>((set) => ({
  todayBattery: 75,
  moodSignal: 'STEADY',
  isCheckInCompletedToday: false,

  setBattery: async (level: number, mood: MoodSignal = 'STEADY') => {
    const todayStr = new Date().toISOString().split('T')[0];
    const log: BatteryCheckIn = {
      id: crypto.randomUUID(),
      date: todayStr,
      timestamp: new Date().toISOString(),
      batteryLevel: level,
      moodSignal: mood,
      source: 'ARRIVAL_SLIDER',
    };

    // 1. Optimistic local state
    set({ todayBattery: level, moodSignal: mood, isCheckInCompletedToday: true });

    // 2. Persist to Dexie
    await db.energy_logs.put(log);
  },

  loadTodayStatus: async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLog = await db.energy_logs.where('date').equals(todayStr).first();
    if (todayLog) {
      set({
        todayBattery: todayLog.batteryLevel,
        moodSignal: todayLog.moodSignal,
        isCheckInCompletedToday: true,
      });
    }
  },
}));
```

### 5.2 Task Store (`src/modules/triage/task.store.ts`)

```typescript
import { create } from 'zustand';
import { Task, TaskPriority, FrictionTag } from '../../domain/task.types';
import { db } from '../../storage/db';

interface TaskState {
  tasks: Task[];
  activeTask: Task | null;
  loadTasks: () => Promise<void>;
  updatePriority: (id: string, priority: TaskPriority) => Promise<void>;
  completeTaskWithReflection: (id: string, reflection: FrictionTag) => Promise<void>;
  sunsetTask: (id: string) => Promise<void>;
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
      tasks: get().tasks.map((t) => (t.id === id ? { ...t, priority, lastTouchedAt: now, daysUntouched: 0 } : t)),
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
        t.id === id ? { ...t, status: 'COMPLETED', completedAt: now, postTaskReflection: reflection } : t
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
}));
```

---

## 6. The Rule Engine Runner (`src/engine/RuleEngine.ts`)

```typescript
import { AdaptiveRule, EvaluationContext, RuleResult } from './rules/base.rule';
import { BatteryMvpRule } from './rules/batteryMvp.rule';
import { ZombieDayRule } from './rules/zombieDay.rule';
import { JoyRatioCapRule } from './rules/joyRatioCap.rule';
import { StaticDecayRule } from './rules/staticDecay.rule';
import { db } from '../storage/db';

export class RuleEngine {
  private static registeredRules: AdaptiveRule[] = [
    BatteryMvpRule,
    ZombieDayRule,
    JoyRatioCapRule,
    StaticDecayRule,
  ];

  /** Register additional 3rd-party or specialized rule plugins */
  public static registerRule(rule: AdaptiveRule): void {
    if (!this.registeredRules.some((r) => r.id === rule.id)) {
      this.registeredRules.push(rule);
      this.registeredRules.sort((a, b) => b.priority - a.priority); // Higher priority first
    }
  }

  /** Run evaluation against all active rules */
  public static async evaluate(ctx: EvaluationContext): Promise<RuleResult[]> {
    const triggeredResults: RuleResult[] = [];

    // Evaluate in priority order
    for (const rule of this.registeredRules) {
      try {
        const result = rule.evaluate(ctx);
        if (result && result.triggered) {
          triggeredResults.push(result);

          // Write to audit trail
          await db.rule_audit_logs.put({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            ruleId: result.ruleId,
            ruleName: result.ruleName,
            actionType: result.actionType,
            payload: result.payload,
            reason: result.reason,
          });

          // If a critical priority 100 rule fired (like Battery MVP), apply immediate hard-stop
          if (rule.priority >= 100) {
            break;
          }
        }
      } catch (err) {
        console.error(`Rule ${rule.id} failed evaluation:`, err);
      }
    }

    return triggeredResults;
  }
}
```

---

## 7. Vite PWA & Workbox Configuration (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'Tides — Energy & Focus Pacing',
        short_name: 'Tides',
        description: 'Tactile, low-friction energy pacing for after-school rhythms.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
});
```

---

## 8. Implementation Roadmap (Phased Delivery)

| Phase | Milestone Deliverables | Verification Criteria |
| :--- | :--- | :--- |
| **Phase 1: Foundation** | Vite + React + Tailwind + Dexie DB init | DB initializes in browser without network; tables created. |
| **Phase 2: Tactile Check-In** | 10s arrival battery slider with Framer Motion spring physics | Slider updates Zustand store & IndexedDB on finger release. |
| **Phase 3: Rule Pipeline** | RuleEngine evaluator + 4 core rules with unit tests | Battery $\le 30$ truncates focus zone; 21-day task auto-sunsets. |
| **Phase 4: Desk Dial & Triage** | 3-Zone dial component + 🔴/🟡/🟢 task sorter & sprint runner | Nia sorts 3 homework items in under 15 seconds. |
| **Phase 5: PWA & Offline Hardening** | `vite-plugin-pwa`, ServiceWorker cache-first, install prompt | App loads in airplane mode with 0 network latency. |
| **Phase 6: Family Retrospective** | Vital 4 weekly radar chart + calibration settings | Rohith can inspect weekly joy-focus balance & zombie day alerts. |
