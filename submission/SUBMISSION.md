*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)*

# Tides: Tactile After-School Energy Pacing for My 11-Year-Old Daughter

---

## What I Built

I built **Tides** for my 11-year-old daughter, **Nia**, who just started 6th grade.

Entering middle school is an immense sensory, physical, and cognitive leap. Every afternoon around 3:30 PM, Nia walks through the front door carrying an oversized backpack and an empty mental battery after 7 hours of changing classrooms, navigating social dynamics, noisy cafeterias, and intense physical education. 

Whenever we tried traditional task managers or homework tracking apps, they made things worse:
1. **High executive function barrier:** Asking a drained 11-year-old to type task titles, configure due dates, and estimate minute durations creates immediate resistance and friction.
2. **Guilt and anxiety spirals:** When a 6th-grader falls behind, traditional apps flash red overdue badges and warning exclamation marks, creating avoidance and shame.
3. **Homework bloat eating into sleep:** Without strict boundaries, 20 minutes of math expands into the evening, pushing out her playtime, dinner, and bedtime.

**Tides** is an adaptive, offline-first personal energy-pacing Progressive Web App (PWA) designed to solve this in under 10 seconds:

* **10-Second Arrival Check-In:** Nia opens the app on her phone or tablet, sees *"How full is your tank, Nia?"*, and drags a single fluid, spring-physics slider. Releasing her finger triggers a satisfying haptic pulse and automatically logs her battery level. Zero "Submit" buttons, zero typing.
* **The 3-Zone Desk Dial:** Her afternoon is visually mapped into three tactile zones:
  * 🔵 **Focus (Deep Blue):** High cognitive work (homework, math). Hard-capped to prevent exhaustion.
  * 🟢 **Reset (Sage):** Nervous system down-regulation (snack, walk, shower, quiet Lego time).
  * 🟡 **Joy (Amber):** Non-negotiable play, drawing, games, and reading for fun.
* **Pluggable Adaptive Rule Engine:** If Nia logs an arrival battery $\le 30\%$, Tides instantly triggers the **Battery MVP Fail-Safe**—shrinking focus to 20 minutes (only 1 Must-Do task allowed) and shifting 40 minutes into Reset. It also detects recurring fatigue patterns (e.g., **Zombie Thursdays** from double-PE and band) to proactively shield her schedule.
* **Frictionless Task Sorter & 15m Sprint Runner:** Large tactile cards with single-tap stamps: 🔴 **Must Do**, 🟡 **Next Up**, and 🟢 **Later**. She taps "Start Sprint", focuses through a distraction-free 15-minute countdown, and finishes with confetti and 3 tactile reflection chips: **🟢 Breeze**, **🟡 Fine**, or **🔴 Drag**.
* **Guilt-Free 21-Day Static Decay:** Tasks parked in "Later" that sit untouched for 21 days are auto-sunsetted without alarming notifications.
* **Parent Dashboard for Rohith:** Gives me visibility into Nia's weekly **Vital 4 Metrics** (Average Arrival Tank, Joy:Focus Ratio, Task Drag Rate, and Zombie Days) with rule calibration controls and an audit trail explaining why Tides adjusted her schedule.

---

## Demo

* **Live Demo URL:** [https://tides-go8j.onrender.com/](https://tides-go8j.onrender.com/) *(or run locally via `npm run dev` at `http://localhost:5173/`)*
* **Architecture Blueprint & Specs:** Included directly in the repository under [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md) and [`docs/IMPLEMENTATION_NOTES.md`](docs/IMPLEMENTATION_NOTES.md).

### Visual Walkthrough

#### 1. Nia's Arrival Tank & The 10-Second Slider
When Nia arrives home, she adjusts the fluid slider with spring physics and tactile haptic feedback. If battery drops $\le 30\%$, the **MVP Fail-Safe** activates automatically:
![Nia Arrival Tank Check-In](https://raw.githubusercontent.com/irmein/tides/main/docs/assets/arrival-checkin.png)

#### 2. The Tactile 3-Zone Desk Dial & Task Sorter
Afternoon time is distributed dynamically across Focus, Reset, and Joy. Nia can prioritize her work in under 15 seconds with single-tap 🔴/🟡/🟢 stamps:
![Tactile 3-Zone Desk Dial and Task Triage](https://raw.githubusercontent.com/irmein/tides/main/docs/assets/desk-dial-triage.png)

#### 3. Rohith's Parent Dashboard & Vital 4 Metrics
A bird's-eye view of chronic burnout risks, weekly joy-to-focus balance, and live rule audit trails:
![Parent Retrospective Dashboard](https://raw.githubusercontent.com/irmein/tides/main/docs/assets/parent-dashboard.png)

---

## Code

The complete source code is open-source and hosted on GitHub:
**[https://github.com/irmein/tides](https://github.com/irmein/tides)**

### Key Code Highlight: The Extensible Rule Pipeline

Tides avoids spaghetti `if-else` business logic by using a pluggable, priority-driven rule engine. Here is the contract and the **Battery MVP Rule**:

```typescript
// src/engine/rules/base.rule.ts
export interface EvaluationContext {
  todayBattery: number; // 0 - 100%
  recentLogs: BatteryCheckIn[]; // Past 14-21 days of logs
  activeTasks: Task[];
  currentSchedule: DaySchedule;
  settings: UserSettings;
}

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  priority: number; // 1-100 (100 = Critical safety override)
  actionType: 'OVERRIDE_TODAY' | 'MUTATE_WEEK' | 'DECOMPOSE_TASK' | 'AUTO_SUNSET';
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

```typescript
// src/engine/rules/batteryMvp.rule.ts
export const BatteryMvpRule: AdaptiveRule = {
  id: 'battery-mvp-fail-safe',
  name: 'Enforce MVP on Critical Battery',
  priority: 100, // Highest priority override
  evaluate: ({ todayBattery, settings }) => {
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
        reason: `Battery at ${todayBattery}% (<= ${threshold}%): Switched to MVP Mode. Only 1 urgent task allowed; Focus shrunk to 20m and 40m transferred to Reset.`,
      };
    }
    return null;
  },
};
```

---

## How I Built It

Tides was built from the ground up prioritizing speed, instant offline access, and tactile kid ergonomics:

### 1. Technology Stack
* **Framework:** React 19 + TypeScript + Vite for instant bundling and minimal footprint.
* **Offline-First Reactive Database:** **Dexie.js (IndexedDB)**. Every check-in, task status, and schedule adjustment is written synchronously to local device storage. The app works flawlessly on airplane mode or spotty home Wi-Fi.
* **PWA & Cache Strategy:** **`vite-plugin-pwa` + Workbox**. The application shell, typography, and SVGs are precached via `CacheFirst`.
* **State Management:** **Zustand** micro-stores (`useEnergyStore`, `useScheduleStore`, `useTaskStore`, `useEngineStore`) cleanly decoupled from UI rendering.
* **Tactile Physics & Motion:** **Framer Motion** hydraulic spring configurations (`stiffness: 300`, `damping: 24`), Web Vibration API haptics, and pure HTML5 Web Audio API sound synthesis (zero external audio network requests).
* **Styling:** Tailwind CSS with custom luminescent CSS variable tokens for the 3 zones.

### 2. AI Agent Pair Programming
The entire architecture, domain models, rule engine, and components were pair-programmed using the **Google Antigravity IDE** and autonomous agent harness:
* Fast prototyping of tactile ergonomics (verifying thumb touch zones and 64px tap targets).
* End-to-end browser subagent automated testing with video session capture.
* Structured architectural blueprinting in markdown prior to writing production code.

---

## Why Does Open Innovation Matter?

When designing technology for children—especially around mental health, daily energy, and school stress—**open innovation is not optional; it is fundamental.**

1. **Child Privacy & Zero Commercial Telemetry (COPPA Compliance):**
   Commercial children's educational apps frequently harvest analytics, device identifiers, and behavioral profiles. With Tides, all neuro-physiological data, daily mood tags, and schedule friction logs stay strictly inside Nia's device IndexedDB sandbox. There are no tracking scripts, ad SDKs, or cloud analytics.
2. **Freedom from Gamified Dark Patterns:**
   Many commercial study apps rely on streak pressure, red warning notifications, and monetization popups that trigger anxiety in young kids. An open-source, local-first app allows us to prioritize emotional safety: auto-sunsetting tasks without guilt badges and protecting playtime over homework bloat.
3. **Extensibility for Diverse Neurotypes:**
   Every child's brain regulates energy differently. Because Tides is built around a pluggable open rule engine, parents, teachers, and developers can contribute open heuristic modules:
   * Rules for ADHD hyperfocus and executive function resets.
   * Seasonal sports practice exhaustion mitigations.
   * Exam season pace shields and sleep deficit protectors.

Open innovation made it possible to build a calm, respectful tool that serves a child's well-being rather than a tech company's engagement metrics.

---

## My Agent Session

This project was architected, implemented, and verified with the help of an autonomous AI agent in the Antigravity IDE:

```markdown
{% raw %}{% agent_session 4bc093b2-1a41-445c-9a11-efd2a777e451 %}{% endraw %}
```

*(Session transcript includes architectural blueprints, Dexie.js database schema migrations, rule engine unit evaluations, and automated browser walkthrough recordings).*

---

## Prize Categories

* **Primary Track:** Build for a Friend / Loved One *(Built specifically for my 11-year-old daughter, Nia, to protect her after-school energy and joy).*
* **Special Categories:**
  * Best Offline-First / PWA Experience
  * Best Open Innovation & Human-Centered Design
