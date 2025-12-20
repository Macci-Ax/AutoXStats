# AGENT INSTRUCTION – EMAIL VERIFICATION WITH RESEND

> **This instruction is binding.**  
> The AI agent must follow it exactly.  
> Goal: Implement email verification for user registration using the Resend email service.

---

## 1. Purpose

Add **email verification** to the existing user registration flow in order to:

- Prevent mass fake account creation
- Ensure ownership of email addresses
- Keep the platform safe without adding user friction

The solution must integrate cleanly with the existing Vite + React + Express authentication system.

---

## 2. Core Principles (Mandatory)

1. Users may not log in before email verification
2. Verification must be token-based and time-limited
3. Email delivery must be reliable and minimal
4. No marketing or tracking content in verification emails

---

## 3. Data Model Changes (Required)

The agent must extend the existing `users` table with the following fields:

- email_verified BOOLEAN DEFAULT FALSE
- email_verification_token TEXT
- email_verification_expires_at TIMESTAMP

Rules:
- Tokens must be single-use
- Tokens must be deleted after successful verification

---

## 4. Resend Setup

### 4.1 Environment Variables

The agent must use environment variables:

- `RESEND_API_KEY`
- `APP_BASE_URL` (e.g. https://example.com)

No secrets may be hard-coded.

---

### 4.2 Resend Client Initialization

Backend must initialize Resend using the official SDK:

```js
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
```

---

## 5. Registration Flow Changes

### 5.1 On User Registration

When handling:
```
POST /api/auth/register
```

The agent must:

1. Create user with `email_verified = false`
2. Generate a secure random verification token
3. Set `email_verification_expires_at` (recommended: 24h)
4. Send verification email via Resend
5. Prevent immediate login

---

### 5.2 Verification Email Content

The email must:

- Be plain text or very simple HTML
- Contain exactly one verification link
- Clearly explain why verification is required

Verification link format:
```
${APP_BASE_URL}/verify-email?token=XYZ
```

---

## 6. Email Verification Endpoint

### 6.1 Backend Endpoint

```
GET /api/auth/verify-email?token=XYZ
```

Behavior:

- Look up user by token
- Validate token existence and expiry
- Set `email_verified = true`
- Remove verification token and expiry
- Redirect to login page with success message

---

## 7. Login Flow Enforcement

During:
```
POST /api/auth/login
```

The agent must:

- Reject login if `email_verified = false`
- Return clear error message:
  "Please verify your email address first"

---

## 8. Frontend Integration (Minimal)

### 8.1 Registration Feedback

After registration:
- Show message:
  "Please check your email to verify your account"

---

### 8.2 Verify Email Page

Frontend route:
```
/verify-email
```

Behavior:
- Read token from query string
- Call backend verification endpoint
- Display success or error message

---

## 9. Security & Abuse Protection

The agent must:

- Rate-limit registration endpoint
- Never expose verification tokens in logs
- Never allow re-use of tokens

---

## 10. Validation Checklist (Agent Must Execute)

Before completion, verify:

1. Registration sends a verification email
2. Login blocked until verification
3. Verification link activates account
4. Token cannot be reused
5. Expired tokens are rejected

---

## Final Rule

> Email verification is mandatory for all non-admin users.

If verification can be bypassed:
> **STOP. FIX. DO NOT DEPLOY.**

