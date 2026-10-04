# 🌊 Tides — Adaptive After-School Energy & Focus Pacing

> **Tactile, low-friction, offline-first personal energy-pacing PWA designed for middle schoolers (ages 10–13).**  
> *Built with ❤️ for my 11-year-old daughter, Nia.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-46E3B7?style=flat-square&logo=render&logoColor=white)](https://tides-go8j.onrender.com/)
[![Offline First](https://img.shields.io/badge/Storage-IndexedDB%20(Dexie.js)-10b981?style=flat-square)](https://dexie.org)
[![PWA Ready](https://img.shields.io/badge/PWA-Workbox%20CacheFirst-3b82f6?style=flat-square)](https://vite-pwa-org.netlify.app)
[![Zero Trackers](https://img.shields.io/badge/Privacy-COPPA%20Compliant%20%7C%200%20Trackers-purple?style=flat-square)](#privacy--coppa-compliance)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber?style=flat-square)](LICENSE)

---

## 💡 The Core Problem

Entering middle school is an immense sensory and cognitive cliff. Every afternoon at 3:30 PM, 6th-graders walk through the front door with an empty mental battery after 7 hours of changing classrooms, social pressures, noisy hallways, and intense PE.

Traditional task apps fail kids because:
1. **High executive function friction:** Typing titles, due dates, and minute estimates induces immediate avoidance.
2. **Guilt spirals:** Red overdue badges and warning exclamation marks trigger shame and shutdown.
3. **Homework bloat eating sleep:** Homework expands into the evening, stealing protected playtime and bedtime.

**Tides** flips this paradigm: **low-friction on the outside, adaptive intelligence on the inside.**

---

## ✨ Features & Tactile Ergonomics

* 🔋 **10-Second Arrival Slider:** One vertical/radial fluid spring slider: *"How full is your tank, Nia?"* Finger release auto-commits and reconfigures the afternoon in under 3 seconds. Zero "Submit" buttons, zero typing.
* 🕒 **Tactile 3-Zone Desk Dial:** Segmented visual bar dividing the afternoon into:
  * 🔵 **Focus (Deep Blue):** High cognitive work. Hard-capped to prevent exhaustion.
  * 🟢 **Reset (Sage):** Snack, quiet breathing, shower, and down-regulation.
  * 🟡 **Joy (Amber):** Non-negotiable play, games, hobbies, and reading for fun.
* 🛡️ **Pluggable Adaptive Rule Engine:**
  * **Battery MVP Fail-Safe (Priority 100):** If arrival battery $\le 30\%$, drops focus to 20m, allows strictly 1 Must-Do task, and moves 40m into Reset.
  * **Zombie Day Detector (Priority 80):** Proactively detects recurring weekday drain (e.g. Thursday double-PE + band) and shields the afternoon.
  * **Joy Ratio Floor (Priority 90):** Guarantees a minimum 45m play floor that homework cannot expand into.
  * **Guilt-Free 21-Day Static Decay (Priority 50):** Tasks in Later/Next untouched for 21 days gracefully auto-sunset with zero guilt badges.
* ⏱️ **15-Minute Sprint Runner & Reflection Chips:** Distraction-free circular countdown with confetti completion and single-tap friction reflection (**🟢 Breeze**, **🟡 Fine**, **🔴 Drag**).
* 👨‍👧 **Parent Calibration Hub (Rohith):** Weekly **Vital 4 Metrics** (Avg Arrival Tank, Joy:Focus Ratio, Task Drag Rate, Zombie Days) with rule calibration sliders and a live rule audit trail.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript + Vite |
| **Tactile Physics & Motion** | Framer Motion (spring physics) + Web Vibration API + Web Audio API synthesizer |
| **Local Client Database** | Dexie.js (Reactive IndexedDB) — 100% on-device |
| **PWA & Offline Tooling** | `vite-plugin-pwa` + Workbox (`CacheFirst` app shell) |
| **State Management** | Zustand (decoupled micro-stores) |
| **Styling** | Tailwind CSS v4 + Custom luminescent zone CSS variables |

---

## 🚀 Quick Start

### Prerequisites
* Node.js $\ge 18$
* npm $\ge 9$

### Install & Run Locally
```bash
# Clone the repository
git clone https://github.com/irmein/tides.git
cd tides

# Install dependencies
npm install

# Start local dev server
npm run dev
```

Open **`http://localhost:5173/`** in your browser.

### Build Production PWA
```bash
npm run build
npm run preview
```

---

## 🔒 Privacy & COPPA Compliance

Tides operates under a **Strict Local-First Privacy Stance**:
* **Zero telemetry, trackers, or commercial ad SDKs.**
* All check-in logs, mood signals, and school tasks remain strictly inside the local browser IndexedDB sandbox.
* 100% functional without an internet connection.

---

## 📖 Documentation

* [Architectural Blueprint](docs/BLUEPRINT.md)
* [Tactile UX Implementation Notes](docs/IMPLEMENTATION_NOTES.md)
* [Hacktoberfest Submission Entry](submission/SUBMISSION.md)

---

## 📄 License

MIT © [Rohith](https://github.com/rohithtp)
