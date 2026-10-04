# Tides — Architectural Blueprint & System Design

> **Document Version:** 1.0.0  
> **Status:** APPROVED FOR IMPLEMENTATION  
> **Target Audience:** Systems Architects, Frontend Engineers, UX Designers  
> **Core Tenet:** A 6th-grader should be able to operate Tides with 1–2 tactile taps in under 10 seconds; the system adapts underneath without manual configuration.

---

## 1. System Vision & Persona Archetypes

Tides is an adaptive, offline-first personal energy-pacing PWA designed specifically for middle schoolers (ages 10–13). Traditional task managers fail children because:
1. They require high executive function to plan, estimate, and categorize.
2. They induce guilt through accumulating backlogs.
3. They ignore the child's dynamic neuro-physiological battery level after a 7-hour school day.

### Persona 1: The Child ("Nia", 11 y/o, 6th Grader)
* **Context:** Walks through the front door exhausted from school, sports, and social dynamics.
* **Attention Span:** 5–10 seconds before throwing backpack and grabbing snacks or screen.
* **Interaction Need:** Big tactile buttons, zero keyboard typing, springy responsive physics, high-contrast zone visuals (Focus, Reset, Joy).
* **Guilt Resilience:** If a task slips, the system auto-quiets it instead of showing red overdue alarms.

### Persona 2: The Parent / Guide ("Rohith")
* **Context:** Wants visibility into chronic overload and burnout patterns without nagging.
* **Interaction Need:** Weekly retrospective radar charts, calibration thresholds, transparent rule explanation ("Why did Tides truncate homework tonight?").

---

## 2. High-Level Architecture & Topological Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT RUNTIME (PWA)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  [UI Layer: Mobile / Tablet Standalone Mode]                                │
│    ├── 10s Arrival Slider (Radial / Haptic Dial)                            │
│    ├── 3-Zone Tactile Timeline (Focus: Deep Blue, Reset: Sage, Joy: Amber)  │
│    ├── Task Sorter (🔴 Must / 🟡 Next / 🟢 Later)                            │
│    └── Task Sprint Runner & Single-Tap Tag Reflection (Breeze/Fine/Drag)   │
├─────────────────────────────────────────────────────────────────────────────┤
│  [State & Reactive Layer (Zustand)]                                         │
│    ├── useEnergyStore       <─── Real-time battery & check-in state         │
│    ├── useScheduleStore     <─── Computed 3-zone allocations & current zone  │
│    ├── useTaskStore         <─── Filtered task queue & active sprint        │
│    └── useEngineStore       <─── Rule results, audit log & trigger overrides│
├─────────────────────────────────────────────────────────────────────────────┤
│  [Plug-and-Play Adaptive Rule Engine]                                       │
│    ├── Evaluation Pipeline (Priority & Conflict Resolution)                 │
│    ├── Plugins: BatteryMvp, ZombieDay, JoyRatioCap, StaticDecay             │
│    └── Extension Points: SportsPractice, ExamCrunch, SleepDeficit           │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Offline-First Storage Engine (Dexie.js / IndexedDB)]                       │
│    ├── Table: energy_logs       (Historical battery check-ins & mood)       │
│    ├── Table: tasks             (Prioritized items & decay counters)        │
│    ├── Table: schedules         (Daily generated & overridden 3-zones)      │
│    ├── Table: rule_audit_logs   (Historical triggers & reasoning trail)     │
│    └── Table: user_settings     (Base limits, school calendar, thresholds)  │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Service Worker Layer (Workbox via vite-plugin-pwa)]                        │
│    ├── Cache-First: App Shell, Google Fonts, Audio Assets                   │
│    ├── Network-First / Stale-While-Revalidate: Sync endpoints               │
│    └── BackgroundSyncQueue: Outbox for parent sync / cloud backup           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Async TLS Sync)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│               OPTIONAL CLOUD SYNC LAYER (Cloudflare Worker / Supabase)      │
│  ├── Ingestion Endpoint (`/api/v1/sync/events`)                             │
│  ├── Weekly Vital 4 Digest Generator                                        │
│  └── Multi-device pairing (Parent phone <-> Kid tablet)                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Domain Models & Schemas

### 3.1 Energy & Battery Domain (`src/domain/energy.types.ts`)

```typescript
export type MoodSignal = 'CHARGED' | 'STEADY' | 'DRAINED' | 'OVERLOADED';

export type FrictionTag = 'BREEZE' | 'FINE' | 'DRAG';

export interface BatteryCheckIn {
  id: string; // UUID v4
  timestamp: string; // ISO 8601
  date: string; // YYYY-MM-DD
  batteryLevel: number; // 0 - 100
  moodSignal: MoodSignal;
  frictionTags?: FrictionTag[];
  source: 'ARRIVAL_SLIDER' | 'MIDDAY_CHECK' | 'MANUAL';
}

export interface VitalFourMetrics {
  weekStarting: string; // YYYY-MM-DD
  avgArrivalBattery: number; // 0 - 100
  joyFocusRatio: number; // Ratio >= 1.0 indicates healthy recovery
  frictionDragPercent: number; // % of tasks tagged as 'DRAG'
  zombieDayCount: number; // Days where battery <= 35%
}
```

### 3.2 Schedule & 3-Zone Domain (`src/domain/schedule.types.ts`)

The schedule divides the child's afternoon/evening into three immutable zones:
1. **Focus (Deep Blue):** High cognitive load (homework, math, projects). Hard-capped to prevent exhaustion.
2. **Reset (Sage):** Nervous system down-regulation (snack, walk, shower, quiet play, lego, stretching).
3. **Joy (Amber):** Non-negotiable play, games, hobbies, reading for pleasure. Protected from being consumed by homework overflow.

```typescript
export type ZoneType = 'FOCUS' | 'RESET' | 'JOY';

export interface ZoneBlock {
  id: string;
  zone: ZoneType;
  startMinutesFromMidnight: number; // e.g. 960 = 16:00 (4:00 PM)
  durationMinutes: number;
  label: string;
  isLocked: boolean; // Overrides cannot shrink locked zones below minimums
  colorToken: {
    primary: string;
    background: string;
    border: string;
    glow: string;
  };
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  totalAvailableMinutes: number;
  zones: ZoneBlock[];
  isMvpMode: boolean; // True if battery < 30% triggered fail-safe
  overrideReason?: string;
  lastCalculatedAt: string;
}
```

### 3.3 Task Domain (`src/domain/task.types.ts`)

```typescript
export type TaskPriority = 'MUST_DO' | 'NEXT_UP' | 'LATER';

export interface Task {
  id: string;
  title: string;
  category: 'SCHOOL' | 'CHORE' | 'PERSONAL';
  priority: TaskPriority; // 🔴 Must, 🟡 Next, 🟢 Later
  estimatedMinutes: number; // Suggested default: 15 mins for 6th graders
  actualMinutesSpent: number;
  status: 'INBOX' | 'ACTIVE' | 'COMPLETED' | 'SUNSET';
  createdAt: string;
  lastTouchedAt: string;
  daysUntouched: number; // Incremented daily by background worker
  completedAt?: string;
  postTaskReflection?: FrictionTag;
}
```

---

## 4. Local Offline Storage & IndexedDB Design (Dexie.js)

Dexie.js provides reactive bindings, fast index queries, and transactional safety directly inside the browser sandbox.

### 4.1 Dexie Database Definition (`src/storage/db.ts`)

```typescript
import Dexie, { Table } from 'dexie';
import { BatteryCheckIn } from '../domain/energy.types';
import { DaySchedule } from '../domain/schedule.types';
import { Task } from '../domain/task.types';

export interface RuleAuditLog {
  id: string;
  timestamp: string;
  ruleId: string;
  ruleName: string;
  actionType: string;
  payload: Record<string, any>;
  reason: string;
}

export interface UserSettings {
  id: string; // 'current'
  batteryMvpThreshold: number; // Default: 30
  minimumJoyMinutes: number; // Default: 45
  defaultFocusBlockMinutes: number; // Default: 20
  afternoonStartMinutes: number; // Default: 930 (15:30)
  bedtimeMinutes: number; // Default: 1260 (21:00)
}

export class TidesDatabase extends Dexie {
  energy_logs!: Table<BatteryCheckIn, string>;
  schedules!: Table<DaySchedule, string>;
  tasks!: Table<Task, string>;
  rule_audit_logs!: Table<RuleAuditLog, string>;
  settings!: Table<UserSettings, string>;

  constructor() {
    super('TidesDB');
    this.version(1).stores({
      energy_logs: 'id, date, timestamp, batteryLevel',
      schedules: 'date',
      tasks: 'id, priority, status, lastTouchedAt, daysUntouched',
      rule_audit_logs: 'id, timestamp, ruleId',
      settings: 'id',
    });
  }
}

export const db = new TidesDatabase();
```

---

## 5. Extensible Plugin-Based Rule Engine

### 5.1 Architecture & Contract

The rule engine decouples business heuristics from UI components. Any trigger—from low battery to seasonal sports leagues—is implemented as a pure, testable rule plugin.

```
                 ┌──────────────────────────────┐
                 │      EvaluationContext       │
                 │ ──────────────────────────── │
                 │ - todayBattery: number       │
                 │ - recentLogs: BatteryCheckIn │
                 │ - activeTasks: Task[]        │
                 │ - currentSchedule: Schedule  │
                 │ - userSettings: Settings     │
                 └──────────────┬───────────────┘
                                │
                                ▼
                 ┌──────────────────────────────┐
                 │       RuleEngine (Hub)       │
                 │ ──────────────────────────── │
                 │ 1. Sort rules by Priority    │
                 │ 2. Execute evaluate(ctx)     │
                 │ 3. Collect triggers          │
                 │ 4. Resolve conflicts         │
                 │ 5. Emit state mutations      │
                 └──────────────┬───────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│ BatteryMvpRule    │ │ ZombieDayRule     │ │ JoyRatioCapRule   │
│ Priority: 100     │ │ Priority: 80      │ │ Priority: 60      │
│ (Safety Fail-Safe)│ │ (Habit Shield)    │ │ (Rest Balance)    │
└───────────────────┘ └───────────────────┘ └───────────────────┘
```

### 5.2 Core Types (`src/engine/rules/base.rule.ts`)

```typescript
import { BatteryCheckIn } from '../../domain/energy.types';
import { DaySchedule } from '../../domain/schedule.types';
import { Task } from '../../domain/task.types';
import { UserSettings } from '../../storage/db';

export interface EvaluationContext {
  todayBattery: number; // 0 - 100
  recentLogs: BatteryCheckIn[]; // Past 14-21 days of logs
  activeTasks: Task[];
  currentSchedule: DaySchedule;
  settings: UserSettings;
}

export type RuleActionType =
  | 'OVERRIDE_TODAY'
  | 'MUTATE_WEEK'
  | 'DECOMPOSE_TASK'
  | 'AUTO_SUNSET';

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  priority: number; // 1-100 (100 = Critical safety override)
  actionType: RuleActionType;
  payload: Record<string, any>;
  reason: string;
}

export interface AdaptiveRule {
  id: string;
  name: string;
  priority: number;
  evaluate: (ctx: EvaluationContext) => RuleResult | null;
}
```

### 5.3 Concrete Rules Catalog

#### Rule 1: Battery MVP Fail-Safe (`src/engine/rules/batteryMvp.rule.ts`)
* **Trigger:** Child arrives home with battery $\le 30\%$.
* **Action:** Truncates Focus zone to max 20 minutes (or single Must-Do task). Diverts remaining homework time into Reset & Joy. Protects emotional baseline for the next school day.

```typescript
import { AdaptiveRule } from './base.rule';

export const BatteryMvpRule: AdaptiveRule = {
  id: 'battery-mvp-fail-safe',
  name: 'Enforce MVP on Critical Battery',
  priority: 100, // Highest priority override
  evaluate: ({ todayBattery, currentSchedule, settings }) => {
    const threshold = settings.batteryMvpThreshold || 30;
    if (todayBattery <= threshold) {
      return {
        ruleId: 'battery-mvp-fail-safe',
        ruleName: 'Enforce MVP on Critical Battery',
        triggered: true,
        priority: 100,
        actionType: 'OVERRIDE_TODAY',
        payload: {
          isMvpMode: true,
          maxFocusMinutes: 20,
          allowedPriorities: ['MUST_DO'],
          reallocateZone: 'RESET',
          autoShiftMinutes: 40,
        },
        reason: `Battery at ${todayBattery}% (<= ${threshold}%): Auto-switched to MVP Mode. Only 1 urgent task allowed; 40 mins transferred to Reset.`,
      };
    }
    return null;
  },
};
```

#### Rule 2: Zombie Day Pattern Detector (`src/engine/rules/zombieDay.rule.ts`)
* **Trigger:** Detects that a specific day of the week (e.g., Thursdays) has experienced battery $\le 35\%$ for 2 consecutive weeks (e.g., after-school band + double PE).
* **Action:** Proactively caps afternoon Focus block at 30 minutes before the child even logs their battery.

```typescript
import { AdaptiveRule } from './base.rule';

export const ZombieDayRule: AdaptiveRule = {
  id: 'zombie-day-detector',
  name: 'Recurring Zombie Day Mitigation',
  priority: 80,
  evaluate: ({ recentLogs }) => {
    if (!recentLogs || recentLogs.length < 10) return null;
    
    const todayDayOfWeek = new Date().getDay(); // 0-6
    const matchingWeekdays = recentLogs.filter(log => {
      const d = new Date(log.date);
      return d.getDay() === todayDayOfWeek;
    });

    if (matchingWeekdays.length >= 2) {
      const lastTwo = matchingWeekdays.slice(-2);
      const isChronicLow = lastTwo.every(l => l.batteryLevel <= 35);
      if (isChronicLow) {
        return {
          ruleId: 'zombie-day-detector',
          ruleName: 'Recurring Zombie Day Mitigation',
          triggered: true,
          priority: 80,
          actionType: 'OVERRIDE_TODAY',
          payload: {
            isShieldedDay: true,
            maxFocusMinutes: 30,
            recommendedResetMinutes: 45,
          },
          reason: 'Pattern detected: Past 2 weeks showed depleted energy on this weekday. Proactively shielding afternoon schedule.',
        };
      }
    }
    return null;
  },
};
```

#### Rule 3: Joy-Ratio Floor Protection (`src/engine/rules/joyRatioCap.rule.ts`)
* **Trigger:** Focus allocation threatens to reduce Joy zone below minimum configured threshold (e.g. 45 minutes) or $\text{Joy}:\text{Focus} < 0.75$.
* **Action:** Interlocks the schedule; flags parent review rather than expanding work hours into bedtime.

```typescript
import { AdaptiveRule } from './base.rule';

export const JoyRatioCapRule: AdaptiveRule = {
  id: 'joy-ratio-cap',
  name: 'Joy Zone Floor Protection',
  priority: 90,
  evaluate: ({ currentSchedule, settings }) => {
    const minJoy = settings.minimumJoyMinutes || 45;
    const joyBlock = currentSchedule.zones.find(z => z.zone === 'JOY');
    
    if (joyBlock && joyBlock.durationMinutes < minJoy) {
      return {
        ruleId: 'joy-ratio-cap',
        ruleName: 'Joy Zone Floor Protection',
        triggered: true,
        priority: 90,
        actionType: 'OVERRIDE_TODAY',
        payload: {
          enforcedJoyMinutes: minJoy,
          curtailFocusToFit: true,
        },
        reason: `Joy zone cannot fall below ${minJoy} minutes. Clamping focus work to preserve recovery space.`,
      };
    }
    return null;
  },
};
```

#### Rule 4: 21-Day Guilt-Free Static Decay (`src/engine/rules/staticDecay.rule.ts`)
* **Trigger:** An item in 🟢 Later or 🟡 Next has sat untouched without sprint execution for 21 days.
* **Action:** Automatically archives/sunsets the item with status `'SUNSET'`. Eliminates the psychological paralysis of accumulating lists.

```typescript
import { AdaptiveRule } from './base.rule';

export const StaticDecayRule: AdaptiveRule = {
  id: 'static-decay-sunset',
  name: 'Guilt-Free 21-Day Auto-Decay',
  priority: 50,
  evaluate: ({ activeTasks }) => {
    const decayedTasks = activeTasks.filter(
      t => t.status !== 'COMPLETED' && t.status !== 'SUNSET' && t.daysUntouched >= 21
    );

    if (decayedTasks.length > 0) {
      return {
        ruleId: 'static-decay-sunset',
        ruleName: 'Guilt-Free 21-Day Auto-Decay',
        triggered: true,
        priority: 50,
        actionType: 'AUTO_SUNSET',
        payload: {
          taskIds: decayedTasks.map(t => t.id),
        },
        reason: `${decayedTasks.length} task(s) untouched for 21+ days auto-sunsetted to prevent cognitive clutter.`,
      };
    }
    return null;
  },
};
```

---

## 6. Service Worker & PWA Caching Topology

To deliver instant launch when walking in the door with spotty Wi-Fi:

1. **App Shell Architecture:** HTML, CSS, bundled JavaScript, SVGs, and web fonts are cached using `CacheFirst`.
2. **Offline Mutation Queue:** Check-in inputs and task status changes are committed synchronously to Dexie.js; an asynchronous Workbox `BackgroundSync` queue replays payloads to the remote backend if online.
3. **No External CDN Dependencies:** All fonts (e.g. Outfit / Fredoka) and animation vectors are bundled in `/public` to guarantee 0ms cold-start offline.

---

## 7. Security, Privacy & Kid-Safety (COPPA Compliance)

1. **Local-First Zero Tracker Stance:** No third-party ad pixels, analytics trackers, or social SDKs.
2. **Encrypted Local Storage:** Sensitive journal notes or friction logs remain strictly on-device.
3. **Family Link Authorization:** Device-to-device synchronization uses short pairing codes (ECDH public key exchange) with end-to-end encrypted payloads.
