# AGENT IMPLEMENTATION PLAN – ADMIN AUTH & EDITOR ACCESS (Next.js)

> **This plan is binding for the AI agent.**  
> Goal: Implement secure ADMIN-only access to the Result Editor in a Next.js application.

---

## 0. Scope & Constraints

### In Scope
- Authentication via NextAuth (Credentials Provider)
- Role-based access control (ADMIN)
- Protection of:
  - Editor pages
  - Editor-related API routes

### Out of Scope
- User self-registration
- Password reset flows
- OAuth providers (Google, GitHub, etc.)
- UI redesign

The agent must NOT add features beyond this scope.

---

## 1. Preconditions (Agent Must Verify)

Before coding, confirm:

1. Project uses **Next.js** (App Router or Pages Router)
2. Database contains a `users` table with:
   - email
   - password_hash
   - role
3. A single ADMIN user exists

If any item is missing:
> **STOP AND ASK FOR CLARIFICATION**

---

## 2. Dependency Setup

### 2.1 Install Required Packages

```bash
npm install next-auth bcrypt
```

The agent must not install additional auth libraries.

---

## 3. NextAuth Configuration

### 3.1 Create Auth Route

**App Router**:
- `/app/api/auth/[...nextauth]/route.ts`

**Pages Router**:
- `/pages/api/auth/[...nextauth].ts`

---

### 3.2 Configure Credentials Provider

Rules:
- Authenticate using email + password
- Compare passwords using bcrypt
- Load role from database

Returned user object MUST include:
- id
- email
- role

---

### 3.3 Session & JWT Callbacks

The agent must:
- Store `role` in JWT
- Expose `role` on `session.user`

The agent must NOT:
- Trust role from client input
- Store secrets in the frontend

---

## 4. Server-Side Page Protection (Mandatory)

### 4.1 Protect Editor Page

For `/editor` route:

- Load session using `getServerSession`
- Check `session.user.role === 'ADMIN'`

If check fails:
- Redirect to `/login` OR return 404

Client-side checks alone are forbidden.

---

## 5. API Route Protection (Critical)

For all API routes that:
- create
- update
- delete

race results or championship data:

The agent must:
- Load server session
- Enforce `ADMIN` role
- Return HTTP 403 if unauthorized

No exception allowed.

---

## 6. Frontend Visibility Rules (UX Only)

The agent may:
- Hide the "Editor" navigation item for non-ADMIN users

The agent must:
- Treat this as cosmetic only
- Never rely on frontend checks for security

---

## 7. Login Page

### 7.1 Minimal Login UI

Requirements:
- Email input
- Password input
- Uses `signIn('credentials')`

No registration link
No password recovery

---

## 8. Validation Checklist (Agent Must Execute)

After implementation, verify:

1. Anonymous user cannot access `/editor`
2. Logged-in USER (non-admin) receives 403 or redirect
3. ADMIN can:
   - load editor page
   - call editor APIs
4. Direct API calls without session are rejected

If any test fails:
> **FIX BEFORE PROCEEDING**

---

## 9. Security Rules (Non-Negotiable)

The agent must NOT:
- Store roles in localStorage
- Expose password hashes
- Allow client-defined roles
- Skip server-side checks

---

## 10. Completion Criteria

Implementation is complete when:

- Editor is inaccessible without ADMIN role
- All editor-related mutations are protected
- No additional auth features were added

---

## Final Rule

> Security correctness has higher priority than speed or convenience.

If unsure:
> **STOP. ASK. DO NOT ASSUME.**