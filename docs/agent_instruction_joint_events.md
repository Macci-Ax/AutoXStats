# AGENT INSTRUCTION – JOINT EVENTS (MULTI-CHAMPIONSHIP SUPPORT)

> **This instruction is binding.**  
> The AI agent must follow it exactly.  
> Goal: Extend the Event system to support race weekends where multiple championships participate simultaneously, each with independent results.

---

## 1. Purpose

Implement support for **joint events**, where:

- One real-world race weekend exists
- Multiple championships (e.g. WACV, DRCV, NWDAV) participate
- Each championship has its **own results, classes, standings**
- Media (posters, galleries) is shared

This must work without duplicating events or media.

---

## 2. Core Principle (Non-Negotiable)

> **Separate the physical event from championship participation.**

- A *Physical Event* represents the real-world weekend
- A *Championship Event* represents one championship’s sporting context

Results must NEVER be attached directly to a Physical Event.

---

## 3. Data Model Overview

### 3.1 Physical Event (Parent)

Represents the actual race weekend.

Required fields:
- id
- title
- start_date
- end_date
- location
- description (optional)
- status (upcoming | running | finished)

Rules:
- A Physical Event may exist without any results
- A Physical Event may host multiple championships

---

### 3.2 Championship Event (Child)

Represents one championship’s participation in a Physical Event.

Required fields:
- id
- physical_event_id
- championship_id
- has_results (boolean)

Rules:
- Each Championship Event belongs to exactly one Physical Event
- A Physical Event may have 1..n Championship Events
- All race_results MUST reference a Championship Event

---

## 4. Results & Classes Rules

- Classes, race_results, points, Streicher, TL-logic apply **per Championship Event**
- No result data may exist without a Championship Event
- Championship Events are the sole anchor for standings

---

## 5. Media Rules (Critical)

- Images (posters, announcements, galleries) attach ONLY to Physical Events
- Media must never be duplicated per championship
- Championship Events must reference shared media via the Physical Event

---

## 6. Admin Workflow

Admins must be able to:

1. Create a Physical Event
2. Attach one or more Championship Events to it
   - Select championship (WACV, DRCV, NWDAV, etc.)
   - Set has_results true/false per championship
3. Upload images once (Physical Event level)
4. Enter results per Championship Event

The agent must NOT:
- Force results for every championship
- Duplicate Physical Events for joint weekends

---

## 7. Frontend Behavior Rules

### 7.1 Event Overview Page

Public event page shows:
- Event info (from Physical Event)
- Images/posters
- Tabs or sections per Championship Event

Example:
- Eppe 2025
  - Tab: WACV
  - Tab: DRCV

---

### 7.2 Results Visibility

- Results tab shown only if `has_results = true`
- Championships without results must clearly state:
  "No results tracked for this championship"

---

## 8. Integrity Constraints

The agent must enforce:

- No race_results without a valid Championship Event
- No Championship Event without a Physical Event
- Physical Event deletion blocked if dependent data exists (or requires explicit confirmation)

---

## 9. Validation Checklist (Agent Must Execute)

Before completion, verify:

1. One Physical Event can host multiple championships
2. Results are isolated per championship
3. Media appears once and is shared
4. Single-championship events still work without special cases
5. No duplicated events exist for joint weekends

---

## Final Rule

> Joint events must feel like **one event** to users, but behave like **multiple events** in data.

If any implementation mixes these layers:
> **STOP. REFACTOR. DO NOT PATCH.**