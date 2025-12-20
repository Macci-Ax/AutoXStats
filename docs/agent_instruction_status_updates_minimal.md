# AGENT INSTRUCTION – MINIMAL STATUS UPDATES (COMMUNITY MICRO-POSTS)

> **This instruction is binding.**  
> The AI agent must follow it exactly.  
> Goal: Implement a very limited, low-risk status update feature to increase community engagement without turning the platform into a social network.

---

## 1. Purpose

Implement **short personal status updates** that allow users to:

- Share brief thoughts or impressions (e.g. excitement before events, reflections after weekends)
- Increase platform activity and user identity
- Add lightweight, human context to profiles and driver pages

This feature must remain intentionally limited.

---

## 2. Core Principles (Non-Negotiable)

1. This is **not** a social network
2. No interaction mechanics (likes, comments, reposts)
3. Chronological display only
4. Text-only, no links, no media
5. Minimal moderation surface

If any feature pushes this toward a social feed:
> **STOP. DO NOT IMPLEMENT.**

---

## 3. Data Model Requirements

### 3.1 Status Update Entity

The agent must implement a new entity with at least:

- id
- user_id (FK → users.id)
- driver_id (optional FK → drivers.id)
- content (text)
- created_at

Rules:
- `content` length must be limited to **250–500 characters** (configurable)
- Content must be plain text only
- URLs must be rejected or stripped

---

## 4. Backend Rules (Mandatory)

### 4.1 Create Status Update

```
POST /api/status
```

Behavior:
- Requires authentication
- Accepts text content only
- Validates max length
- Rejects content containing URLs or HTML

---

### 4.2 Get Status Updates

Endpoints:

```
GET /api/status/user/:userId
GET /api/status/driver/:driverId
```

Behavior:
- Returns status updates in **reverse chronological order**
- Read-only

---

### 4.3 Delete Own Status Update (Optional)

```
DELETE /api/status/:id
```

Rules:
- User may delete only their own status updates
- No editing after creation

---

## 5. Visibility Rules

- Status updates are **always public**
- Visibility cannot be toggled per update
- Users control visibility indirectly by choosing whether to post

---

## 6. Frontend Behavior Rules

### 6.1 Profile Page

- Display user’s status updates chronologically
- Newest first
- Clearly timestamped

---

### 6.2 Driver Page (If Linked)

If a user is linked to a driver profile:
- Display the same status updates on the driver page

No duplication of data.

---

### 6.3 Posting UI

- Single multiline text field
- Character counter
- Submit button
- No previews, no embeds

---

## 7. Forbidden Features (Strict)

The agent must NOT implement:

- Likes
- Comments
- Replies
- Reposts / shares
- Mentions (@)
- Hashtags
- Links
- Media uploads

---

## 8. Moderation & Safety (Minimal)

The agent must:
- Store content server-side only
- Allow admins to delete any status update manually (admin tool)

Automated moderation is out of scope.

---

## 9. Validation Checklist (Agent Must Execute)

Before completion, verify:

1. User can create a status update
2. Character limit is enforced
3. URLs are rejected or stripped
4. Updates appear chronologically on profile
5. No interaction options exist

---

## Final Rule

> Status updates are a **personal micro-diary**, not a conversation.

If any interaction mechanics are added:
> **STOP. REVERT. DO NOT SHIP.**

