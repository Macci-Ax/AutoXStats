# AGENT IMPLEMENTATION PLAN – ADMIN AUTH & EDITOR ACCESS (Vite + React + Express)

> **This plan is binding for the AI agent.**  
> Goal: Implement secure ADMIN-only access to the Result Editor in a Vite + React frontend with an Express backend.

---

## 0. Scope & Constraints

### In Scope
- Authentication via Express backend
- Session-based authentication (HTTP-only cookies)
- Role-based access control (ADMIN)
- Protection of:
  - Result Editor UI
  - All result-editing API routes

### Out of Scope
- User self-registration
- Password reset
- OAuth / social login
- UI redesign

The agent must NOT add features beyond this scope.

---

## 1. Preconditions (Agent Must Verify)

Before implementation, verify:

1. Frontend uses **Vite + React**
2. Backend uses **Express**
3. Database contains a `users` table with:
   - id
   - email
   - password_hash
   - role (ADMIN | USER)
4. At least one ADMIN user exists in DB

If any item is missing:
> **STOP AND ASK FOR CLARIFICATION**

---

## 2. Dependency Setup

### 2.1 Backend Dependencies

```bash
npm install express-session bcrypt cookie-parser
```

Optional (recommended for production):
```bash
npm install connect-pg-simple
```

The agent must NOT install JWT libraries unless explicitly instructed.

---

## 3. Backend Authentication Implementation

### 3.1 Session Setup (Express)

The agent must:
- Configure `express-session`
- Use HTTP-only cookies
- Disable client-side access to session data

Session config rules:
- `httpOnly: true`
- `sameSite: 'lax'`
- `secure: false` (local dev only)

---

### 3.2 Login Endpoint

Create:
```
POST /api/auth/login
```

Rules:
- Accept email + password
- Validate user against DB
- Compare password using bcrypt
- Store in session:
  - userId
  - role

Do NOT store:
- password
- password_hash

---

### 3.3 Logout Endpoint

Create:
```
POST /api/auth/logout
```

Rules:
- Destroy session
- Clear auth cookie

---

### 3.4 Session Status Endpoint

Create:
```
GET /api/auth/me
```

Returns:
- authenticated: boolean
- user: { id, email, role } | null

This endpoint is the single source of truth for frontend auth state.

---

## 4. Role-Based Access Control (Backend – Mandatory)

### 4.1 ADMIN Middleware

Create middleware:
```js
requireAdmin(req, res, next)
```

Rules:
- Reject if no session
- Reject if role !== 'ADMIN'
- Return HTTP 403

---

### 4.2 Protect Editor APIs

Apply `requireAdmin` to all routes that:
- create
- update
- delete

race results, standings, events, or championships.

No exceptions allowed.

---

## 5. Frontend Authentication Handling (React)

### 5.1 Auth State Management

The agent must:
- Load `/api/auth/me` on app start
- Store auth state in React context or global store

The frontend must NEVER:
- Infer auth state locally
- Store roles in localStorage

---

### 5.2 Route Protection (Editor Page)

For `/editor` route:

Rules:
- If `auth.loading` → show loader
- If `!auth.authenticated` → redirect to `/login`
- If `role !== 'ADMIN'` → show "No access"

This is UX only; backend security is mandatory.

---

## 6. Navigation Visibility Rules

The agent may:
- Hide "Editor" menu item for non-ADMIN users

The agent must:
- Treat this as cosmetic
- Never rely on it for security

---

## 7. Login Page (Frontend)

### Requirements
- Email input
- Password input
- POST to `/api/auth/login`
- Handle errors gracefully

No registration UI
No password recovery

---

## 8. Validation Checklist (Agent Must Execute)

After implementation, verify:

1. Anonymous user cannot access Editor UI
2. Anonymous user cannot call editor APIs
3. USER role receives HTTP 403
4. ADMIN can edit results
5. Session persists across page reloads

If any check fails:
> **FIX BEFORE PROCEEDING**

---

## 9. Security Rules (Non-Negotiable)

The agent must NOT:
- Use JWT in localStorage
- Expose roles to unauthenticated clients
- Allow client-controlled roles
- Skip middleware checks

---

## 10. Completion Criteria

Implementation is complete when:

- Editor access is ADMIN-only
- All mutations are protected server-side
- Frontend correctly reflects auth state

---

## Final Rule

> Backend authorization is the single source of truth.

If unsure:
> **STOP. ASK. DO NOT ASSUME.**