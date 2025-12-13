# AGENT INSTRUCTION – COMPUTE CHAMPIONSHIP RESULTS (TL / DRCV LOGIC)

> **This instruction is binding.**  
> The AI agent must follow it exactly.  
> The goal is to compute correct championship results from race results that may include TL (day license) drivers.

---

## 1. Purpose

Compute **championship rankings and points** from existing `race_results` while respecting license rules:

- TL (Tageslizenz) drivers:
  - Count for *sporting results* (positions, wins, podiums)
  - Do **NOT** receive championship points
  - Do **NOT** block championship points for licensed drivers

- DRCV drivers:
  - Receive championship positions and points
  - May be shifted forward if TL drivers finish ahead

The agent must not modify race order history.

---

## 2. Preconditions (Mandatory)

The agent must confirm:

1. `race_results` contains one row per driver per event/class
2. `license_type` exists in `race_results` with values:
   - `DRCV`
   - `TL`
3. `championship_points` column exists in `race_results`

If any condition is not met:
> **STOP AND ASK FOR CLARIFICATION**

---

## 3. Conceptual Model (Must Be Understood)

There are **two parallel result interpretations**:

1. **Sporting result**  
   → Based on raw finishing order (rank)

2. **Championship result**  
   → Derived from sporting result **after filtering TL drivers**

The agent must never overwrite or reinterpret sporting results.

---

## 4. Championship Eligibility Rules

### 4.1 Eligibility Flag

If present, use:
- `championship_eligible = TRUE | FALSE`

Rules:
- If `championship_eligible = FALSE` → driver receives 0 championship points
- If column does not exist → assume TRUE for DRCV drivers

TL drivers are always treated as `championship_eligible = FALSE`.

---

## 5. Ranking Logic (Per Event + Class)

The agent must compute championship ranking **per event and per class** using the following steps:

### Step 1 – Select Sporting Results
```sql
SELECT *
FROM race_results
WHERE event_id = :event_id
  AND class_id = :class_id
ORDER BY rank ASC;
```

---

### Step 2 – Filter Championship Drivers

From the ordered list:
- Keep only rows where `license_type = 'DRCV'`
- AND `championship_eligible = TRUE`

Preserve original order.

---

### Step 3 – Assign Championship Positions

Assign championship positions sequentially:

- First eligible driver → championship_position = 1
- Second eligible driver → championship_position = 2
- etc.

TL drivers are skipped, not ranked.

---

## 6. Championship Points Assignment

Points must be assigned **based on championship_position**, not sporting rank.

Example mapping (configurable):

| Championship Position | Points |
|----------------------|--------|
| 1 | 9 |
| 2 | 7 |
| 3 | 6 |
| 4 | 5 |
| 5 | 4 |
| 6 | 3 |
| 7 | 2 |
| 8 | 1 |

The agent must NOT hardcode this table unless explicitly instructed.

---

## 7. Writing Results Back

The agent may ONLY update:

- `championship_points`

The agent must NOT:
- modify `rank`
- modify `points`
- modify driver or event data

Example update:
```sql
UPDATE race_results
SET championship_points = :points
WHERE id = :race_result_id;
```

TL drivers must always receive:
```text
championship_points = 0
```

---

## 8. Validation Queries (Mandatory)

### 8.1 Per-Event Validation
```sql
SELECT
  driver_id,
  rank AS sporting_rank,
  license_type,
  championship_points
FROM race_results
WHERE event_id = :event_id
ORDER BY rank;
```

Expected:
- TL drivers present
- TL drivers have 0 championship points
- DRCV drivers have shifted points

---

### 8.2 Season Consistency Check
```sql
SELECT driver_id, SUM(championship_points)
FROM race_results
GROUP BY driver_id;
```

Verify that:
- No TL driver has championship points
- Known season totals match official standings

---

## 9. Frontend Contract (Read-Only)

The agent must assume:

- Frontend will display:
  - Sporting position
  - Championship position (derived)
- TL drivers may appear in race views
- TL drivers must NOT appear in championship rankings

The agent must NOT modify frontend code.

---

## 10. Final Rule

> If championship rules differ between classes or seasons:
> **STOP. DO NOT GENERALIZE. ASK.**

Correct championship computation has higher priority than completeness or speed.

