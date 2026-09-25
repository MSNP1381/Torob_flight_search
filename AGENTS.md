# Torob Flight Search & BuyO — Agent Handbook (`AGENTS.md`)

This document is the primary reference and guide for AI coding assistants and developers working in the **Torob Flight Search / BuyO** repository.

---

## 1. System Overview

This repository is a full-stack flight meta-search, price comparison, and booking aggregation platform designed for the Iranian aviation market. It integrates with major ticket providers (such as Alibaba, FlyToday, and SafarMarket), aggregates real-time offers by canonical grouping keys, and ranks flights using a **Multi-Criteria Weight Matrix Algorithm**.

### Key Tech Stack
- **Frontend:** React 18, TypeScript, Vite, Ant Design 5 (RTL + Persian `fa_IR`), Tailwind CSS, Recharts.
- **Backend Service:** Express + TypeScript (`server.ts`, `server/routes/api.ts`, `server/services/`).
- **Database / Cache:** SQLite (`data/buyo.sqlite`) via `better-sqlite3` for sessions, credentials, cookies, and history.
- **Python Backend Services:** FastAPI / Python 3.12+ modular monolith (detailed in [`agents/AGENTS.md`](file:///c:/Users/mnp/Documents/Projects/Torob_flight_search/agents/AGENTS.md)).

---

## 2. Smart Matrix Ranking Algorithm ($S = X \cdot W$)

The system ranks flight cards using linear algebra matrix multiplication:
$$S = X \cdot W$$

Where:
- **$X \in \mathbb{R}^{N \times 8}$**: Session-normalized flight feature matrix ($N$ flights, $8$ criteria).
- **$W \in \mathbb{R}^{8 \times 1}$**: Normalized importance weight vector ($\sum_{j=1}^8 W_j = 1.0$).
- **$S \in \mathbb{R}^{N \times 1}$**: Resulting utility score vector, clamped to $[0.0, 1.0]$ and rounded to 4 decimal places.

### 2.1 The 8 Feature Columns ($X$)
1. **Price Utility ($x_0$):** Inverted relative min-max score. Cheapest flight receives $1.0$, most expensive receives $0.0$.
2. **Duration Utility ($x_1$):** Inverted relative min-max score. Fastest flight receives $1.0$, slowest receives $0.0$.
3. **Stops Utility ($x_2$):** Non-stop flight $= 1.0$, $1$ stop $= 0.6$, $2+$ stops $= 0.2$.
4. **Circadian Time-of-Day Utility ($x_3$):** Prime day hours ($08:00 - 12:00$ and $16:00 - 20:00$) $= 1.0 - 0.95$. Red-eye flights ($00:00 - 05:59$) $= 0.20$.
5. **Baggage Allowance Utility ($x_4$):** Normalized to session maximum ($20 - 30\text{ kg}$). Handles Persian and Latin digits.
6. **Systemic vs Charter Policy Trust ($x_5$):** Systemic tickets $= 1.0$, Charter tickets $= 0.45$ (penalizing cancellation and sudden reschedule risks).
7. **Airline Class & Reliability ($x_6$):** Quality evaluation coefficient ($1.0$ default baseline).
8. **Provider Competition Score ($x_7$):** Reward for aggregator depth ($\min(1.0, \text{providerCount} / 4)$).

### 2.2 Ready Persona Weight Profiles ($W$)
- **Best Deal (`bestDeal` - Default):** Balanced weights ($35\%$ price, $20\%$ duration, $15\%$ stops, $10\%$ time, $8\%$ baggage, $5\%$ systemic, $4\%$ airline, $3\%$ competition).
- **Business Traveler (`business`):** Minimizes travel time and layovers ($35\%$ duration, $25\%$ stops, $18\%$ daytime schedule, only $5\%$ price).
- **Student / Budget (`student`):** Prioritizes lowest price and baggage allowance ($52\%$ price, $20\%$ baggage, $8\%$ duration).
- **Family Traveler (`family`):** Dynamically scales with kid and adult counts. Stops are heavily penalized ($25\% - 35\%$), daytime schedule and baggage weights scale with total passengers, systemic ticket preference increases.
- **Fastest Path (`fastest`):** Strictly prioritizes shortest flight time ($50\%$ duration, $30\%$ direct routes).

---

## 3. 4-Tier Score Color Scale (Blue → Green → Yellow → Red)

To give users instant visual clarity on flight quality, scores are color-coded in both the flight cards and drawer interfaces:

| Color Tier | Color Code / AntD Tag | Score Range | Meaning | Visual Indicator |
|---|---|---|---|---|
| **Blue (آبی)** | `#2563eb` / `'blue'` | $\ge 80\%$ (or Top Rank 1) | **عالی و برتر (Excellent)** | Top tier recommendation, `🏆 برترین` badge |
| **Green (سبز)** | `#16a34a` / `'green'` | $65\% - 79\%$ | **خوب و به‌صرفه (Good)** | Highly suitable option, balanced quality |
| **Yellow (زرد / طلایی)** | `#d97706` / `'gold'` | $50\% - 64\%$ | **متوسط (Average)** | Moderate utility, trade-offs present |
| **Red (قرمز)** | `#dc2626` / `'red'` | $< 50\%$ | **پایین (Low)** | Heavy penalties (e.g. charter, red-eye, layover) |

### Implementation Reference
- [`src/algo.ts`](file:///c:/Users/mnp/Documents/Projects/Torob_flight_search/src/algo.ts): Contains `getScoreBadgeColor()`, `rankFlightCards()`, and `computeFlightScores()`.
- [`src/components/FlightCardItem.tsx`](file:///c:/Users/mnp/Documents/Projects/Torob_flight_search/src/components/FlightCardItem.tsx): Renders score tags using the 4-tier palette.
- [`src/components/search/FlightSortToolbar.tsx`](file:///c:/Users/mnp/Documents/Projects/Torob_flight_search/src/components/search/FlightSortToolbar.tsx): Renders the interactive color legend.

---

## 4. Sorting Protocol

1. **Default Sorting:** The default sort for search results is always **`Algorithmic`** (Smart Matrix Ranking).
2. **Descending Order:** Flights are sorted strictly in descending order of their matrix score ($S$).
3. **Deterministic Tie-Breaking:**
   - If two flights have identical matrix scores, break ties by **lower total price** (`totalPrice`).
   - If prices are also equal, break ties by **shorter flight duration** (`durationMinutes`).
4. **Interactive Weight Drawer:** In [`src/components/algo/WeightMatrixDrawer.tsx`](file:///c:/Users/mnp/Documents/Projects/Torob_flight_search/src/components/algo/WeightMatrixDrawer.tsx), users can switch persona profiles, customize family member counts, inspect weight vectors, and click **«اعمال و مرتب‌سازی هوشمند نتایج»** to immediately re-rank the search results.

---

## 5. Development & Code Quality Guidelines

1. **Number and Currency Formatting:**
   - Always distinguish Rials (`IRR`) from Tomans (`IRT` $= \text{IRR} / 10$).
   - Use [`src/utils/formatters.ts`](file:///c:/Users/mnp/Documents/Projects/Torob_flight_search/src/utils/formatters.ts) (`formatToman`, `formatRial`) for display strings with Persian numerals.
2. **Persian Text and Input Parsing:**
   - Always normalize Persian/Arabic digits (`۰-۹`, `٠-٩`) to ASCII (`0-9`) when parsing baggage, duration, or price strings.
   - Use `Select-String -Encoding utf8` when searching Persian terms in PowerShell.
3. **RTL and Theming:**
   - Maintain seamless RTL layout support with Ant Design `ConfigProvider direction="rtl"`.
   - Ensure color contrast and dark mode classes (`dark:`) are always maintained for both light and dark themes.
4. **Backend Rules:**
   - Follow [`agents/AGENTS.md`](file:///c:/Users/mnp/Documents/Projects/Torob_flight_search/agents/AGENTS.md) for backend state machines, payment flows, and SQLite/PostgreSQL schema patterns.
