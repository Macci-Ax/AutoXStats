# AGENT INSTRUCTION – USER PROFILE EDIT (SELF-SERVICE)

> **This instruction is binding.**  
> The AI agent must follow it exactly.  
> Goal: Implement user-owned profile editing with clear separation between private data, public data, and system-managed data.

---

## 1. Purpose

Implement a **self-service user profile system** that allows logged-in users to:

- Edit their own profile information
- Control what information is publicly visible
- Prepare the foundation for future features (event participation, subscriptions, team membership)

The system must NOT allow users to modify system-owned or sport-related data.

---

## 2. Core Principles (Mandatory)

1. A user may edit **only their own profile**
2. Profile data is distinct from authentication data
3. Public visibility is **explicitly controlled** by the user
4. No sport or result data is user-editable

---

## 3. Data Model Requirements

### 3.1 User Profile Entity

The agent must implement or extend a user profile model with the following fields:

- user_id (FK to users.id)
- display_name
- bio (optional)
- avatar_image_id (optional)
- social_instagram (optional)
- social_facebook (optional)
- social_youtube (optional)

---

### 3.2 Visibility Settings

Visibility must be stored **per field**, not globally.

Required visibility flags:

- is_display_name_public
- is_bio_public
- is_social_public

Rules:
- Default visibility = FALSE
- Public display is opt-in

---

## 4. Backend API Rules (Mandatory)

### 4.1 Get Own Profile

```
GET /api/profile/me
```

Returns:
- Full profile data for the logged-in user

Authentication required.

---

### 4.2 Update Own Profile

```
PUT /api/profile/me
```

Rules:
- Only update allowed profile fields
- Ignore or reject unknown fields
- Never accept `user_id` from client

---

## 5. Access Control Rules

The agent must enforce:

- A user can never read or write another user’s private profile data
- Public profile data may be read by anyone
- Profile updates require authentication

---

## 6. Public Profile Representation

When exposing a public user profile:

- Include only fields with visibility flag = TRUE
- Exclude email, role, and internal IDs

The agent must ensure no accidental data leakage.

---

## 7. Frontend Behavior Rules

### 7.1 Profile Edit Page

The profile edit UI must:

- Load data from `/api/profile/me`
- Allow editing of allowed fields only
- Provide clear toggles for public visibility

---

### 7.2 Public Profile Page

The public profile page must:

- Display only public fields
- Clearly separate profile info from driver stats

---

## 8. Forbidden Actions (Non-Negotiable)

The agent must NOT:

- Allow editing of email or password here
- Allow editing of role
- Allow editing of driver, event, or result data
- Store profile data in authentication tables

---

## 9. Validation Checklist (Agent Must Execute)

Before completion, verify:

1. User can edit own profile
2. Changes persist correctly
3. Visibility toggles work as expected
4. Public profile exposes only allowed fields
5. No other user’s data is accessible

---

## Final Rule

> The user profile belongs to the user, but the platform controls structure and integrity.

If any shortcut risks data leakage or privilege escalation:
> **STOP. FIX. DO NOT CONTINUE.**

