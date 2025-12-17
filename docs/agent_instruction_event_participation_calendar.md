# AGENT INSTRUCTION – EVENT PARTICIPATION & PERSONAL CALENDAR

> **This instruction is binding.**  
> The AI agent must follow it exactly.  
> Goal: Allow users to mark participation in upcoming events and provide a personal calendar with optional public visibility.

---

## 1. Purpose

Implement a **user-centric event participation system** that:

- Allows users to mark participation in events
- Generates a personalized calendar view
- Allows users to control whether participation is publicly visible
- Does NOT represent official race registration or entry lists

This feature is informational and community-oriented only.

---

## 2. Core Principles (Mandatory)

1. Event participation is **voluntary and non-binding**
2. Participation belongs to the **User**, not the Driver entity
3. Participation does NOT imply race entry or results
4. Visibility is opt-in and controlled by the user

---

## 3. Data Model Requirements

### 3.1 Event Participation Entity

The agent must implement a new entity with at least:

- id
- user_id (FK → users.id)
- physical_event_id (FK → physical_events.id)
- is_public (boolean)
- created_at

Rules:
- One user may participate in an event only once
- Participation is allowed only for upcoming or running events

---

## 4. Backend API Rules (Mandatory)

### 4.1 Mark Participation

```
POST /api/events/:eventId/participation
```

Behavior:
- Requires authentication
- Creates participation entry for the logged-in user
- Defaults `is_public = false`

Must reject:
- Duplicate participation
- Invalid event IDs

---

### 4.2 Update Participation Visibility

```
PUT /api/events/:eventId/participation
```

Behavior:
- Requires authentication
- Allows toggling `is_public`
- User may only update their own participation

---

### 4.3 Remove Participation

```
DELETE /api/events/:eventId/participation
```

Behavior:
- Requires authentication
- Removes the user’s participation record

---

### 4.4 Get Own Participations

```
GET /api/calendar/me
```

Returns:
- List of upcoming events the user participates in
- Sorted by event date

Authentication required.

---

## 5. Access Control Rules

The agent must enforce:

- Users can create, update, or delete only their own participation
- Users cannot modify participation of others
- Anonymous users cannot participate

---

## 6. Frontend Behavior Rules

### 6.1 Event Page

For logged-in users:
- Show button: "Teilnehmen" / "Teilnahme entfernen"
- Show visibility toggle: "Öffentlich anzeigen"

For logged-out users:
- Show prompt to log in

---

### 6.2 Personal Calendar Page

The personal calendar page must:

- Show only the logged-in user’s participations
- Display event title, date, and location
- Be accessible only to the user

---

### 6.3 Public Profile Integration

If `is_public = true`:
- Display upcoming events on the user’s public profile

If `is_public = false`:
- Do not expose participation publicly

---

## 7. Forbidden Behavior (Non-Negotiable)

The agent must NOT:

- Treat participation as official race entry
- Expose private participations publicly
- Allow editing of other users’ participation
- Attach participation to Driver entities

---

## 8. Validation Checklist (Agent Must Execute)

Before completion, verify:

1. User can mark participation
2. User can remove participation
3. Calendar shows correct upcoming events
4. Visibility toggle works correctly
5. Public profile shows only opted-in events

---

## Final Rule

> Event participation is a **personal planning tool**, not a sporting record.

If any implementation blurs this distinction:
> **STOP. FIX. DO NOT CONTINUE.**

