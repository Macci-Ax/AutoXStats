# AGENT INSTRUCTION – CLASS EVENT CALENDAR (WHICH EVENTS COUNT)

> **This instruction is binding.**  
> The AI agent must follow it exactly.  
> The goal is to define which events count for which class and discipline, and to use this information for championship and Streicher calculations.

---

## 1. Purpose

Create and maintain a **class-specific event calendar** that defines:

- Which events are valid for a given class
- For which discipline (Klasse / Endlauf / Langstrecke / Super Cup)

This calendar is the **single source of truth** for:
- Championship point calculation
- Streicher (dropped results)
- "Missed event" detection

An event that does NOT exist in this calendar **must never** generate a missed race or Streicher.

---

## 2. Preconditions (Mandatory)

The agent must confirm:

1. `events` table exists and is populated
2. `classes` table exists and is populated
3. Championship season is known

If any precondition is not met:
> **STOP AND ASK FOR CLARIFICATION**

---

## 3. Required Table (Create If Missing)

```sql
CREATE TABLE IF NOT EXISTS class_events (
  class_id   TEXT NOT NULL,
  event_id   TEXT NOT NULL,
  discipline TEXT NOT NULL CHECK (discipline IN (
    'klasse',
    'endlauf',
    'langstrecke',
    'supercup'
  )),
  is_counting BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (class_id, event_id, discipline),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (event_id) REFERENCES events(id)
);
```

---

## 4. How to Populate class_events

### 4.1 Primary Rule (No Guessing)

An entry in `class_events` must only be created if there is **explicit evidence** that:

- the class was officially run at the event
- for the given discipline

Allowed evidence sources:
- Official event result PDFs
- Championship standings tables

Forbidden:
- Guessing based on other classes
- Assuming "all classes run everywhere"

---

### 4.2 Population Logic

For each:
- event
- class
- discipline

Perform the following:

1. Check if an official result PDF exists
2. OR check if the championship standings contain a column for this event

If YES → insert into `class_events`
If NO  → do not insert anything

---

### 4.3 Example Inserts

```sql
INSERT INTO class_events (class_id, event_id, discipline)
VALUES ('klasse_01', 'herbern_2025', 'klasse');
```

```sql
INSERT INTO class_events (class_id, event_id, discipline)
VALUES ('klasse_01', 'eppe_2025', 'langstrecke');
```

In this example:
- Eppe counts for Langstrecke
- Eppe does NOT count for Klasse 01

---

## 5. Usage Rules (Mandatory)

### 5.1 Championship Calculation

When computing championship results:

- Only consider events present in `class_events`
- Filter by matching `class_id` AND `discipline`

---

### 5.2 Streicher Calculation

When computing Streicher:

- Only events present in `class_events` are eligible
- Missed events are only created for events listed in `class_events`

If an event is not listed:
> It must be ignored completely.

---

## 6. Validation Queries (Mandatory)

### 6.1 Class Event Coverage
```sql
SELECT class_id, discipline, COUNT(*) AS events
FROM class_events
GROUP BY class_id, discipline;
```

### 6.2 Missing Results Check
```sql
SELECT ce.class_id, ce.event_id, ce.discipline
FROM class_events ce
LEFT JOIN race_results rr
  ON rr.event_id = ce.event_id
 AND rr.class_id = ce.class_id
WHERE rr.id IS NULL;
```

Expected:
- Missing results only for genuine non-starters
- No rows for classes that did not run the event

---

## 7. Frontend Contract (Read-Only)

The frontend must be able to:

- Distinguish between:
  - "Event not run by this class"
  - "Event run, but driver did not start"

The agent must NOT modify frontend code.

---

## 8. Final Rule

> The class event calendar is authoritative.

If an event is not explicitly listed for a class and discipline:
- It does not exist for championship logic.

If any ambiguity exists:
> **STOP. DO NOT GUESS. ASK.**

