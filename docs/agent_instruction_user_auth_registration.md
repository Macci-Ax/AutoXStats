# AGENT INSTRUCTION – USER REGISTRATION & LOGIN (VITE + REACT + EXPRESS)

> **This instruction is binding.**  
> The AI agent must follow it exactly.  
> Goal: Implement secure user registration and login as the foundation for user-owned profiles.

---

## 1. Purpose

Implement a **basic but production-safe user authentication system** that allows:

- User registration
- User login
- Persistent sessions
- Future extension to profile management and subscriptions

This system must coexist with existing ADMIN authentication and must not weaken admin security.

---

## 2. Core Principles (Mandatory)

1. Security over convenience
2. Minimal feature set (no social login, no password reset)
3. Users may only access their own account data
4. Authentication logic lives exclusively in the backend

---

## 3. User Model Requirements

The existing `users` table must support:

- id (UUID or TEXT)
- email (unique)
- password_hash
- role (`ADMIN` | `USER`)
- created_at

Rules:
- Default role for registrations = `USER`
- Roles must never be settable by the client

---

## 4. Backend Endpoints (Required)

### 4.1 Register User

```
POST /api/auth/register
```

Behavior:
- Accept email + password
- Validate email format
- Enforce password minimum length
- Hash password with bcrypt
- Create user with role `USER`

Must reject:
- Duplicate email
- Weak passwords

---

### 4.2 Login User

```
POST /api/auth/login
```

Behavior:
- Validate credentials
- Compare password using bcrypt
- Create session (HTTP-only cookie)
- Store in session:
  - userId
  - role

---

### 4.3 Logout User

```
POST /api/auth/logout
```

Behavior:
- Destroy session
- Clear cookie

---

### 4.4 Current User

```
GET /api/auth/me
```

Returns:
- authenticated: boolean
- user: { id, email, role } | null

This endpoint is the single source of truth for frontend auth state.

---

## 5. Session Handling Rules

The agent must:
- Use server-side sessions (express-session)
- Use HTTP-only cookies
- Never expose password hashes

The agent must NOT:
- Use JWT in localStorage
- Trust client-provided user IDs

---

## 6. Frontend Integration (React)

### 6.1 Auth State Loading

On app startup:
- Fetch `/api/auth/me`
- Store result in auth context

---

### 6.2 Registration Page

Requirements:
- Email field
- Password field
- Password confirmation
- Error handling

No role selection
No extra profile fields

---

### 6.3 Login Page

Requirements:
- Email field
- Password field
- Error handling

---

## 7. Access Control Rules

- Logged-out users may:
  - view public pages
  - register
  - login

- Logged-in users may:
  - access their own profile (future)
  - logout

- Users must not access admin routes

---

## 8. Validation Checklist (Agent Must Execute)

Before completion, verify:

1. User can register
2. User can log in
3. Session persists across reloads
4. `/api/auth/me` reflects correct state
5. USER cannot access ADMIN APIs

---

## 9. Security Constraints (Non-Negotiable)

The agent must NOT:
- Allow role escalation
- Allow editing other users
- Store sensitive data client-side

---

## Final Rule

> This authentication layer is the foundation for all user-owned features.

If any shortcut weakens isolation between users:
> **STOP. FIX. DO NOT CONTINUE.**

