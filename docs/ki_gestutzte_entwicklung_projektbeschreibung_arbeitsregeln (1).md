# AI DEVELOPMENT RULES – AUTOCROSS PLATFORM

> **This document is a binding instruction set for all AI agents used in this project.**  
> AI agents must follow these rules strictly. If a request conflicts with this document, **this document has priority**.

Community uploads are **explicitly excluded** at this stage.

---

## 1. Project Purpose (Context for AI)

The goal is to build a **central Autocross platform** combining:

- Race result database
- Verified driver profiles
- Team structures (driver + helpers)
- Photo galleries linked to drivers
- Onboard videos linked to drivers
- Subscription model for drivers (HQ photo access)
- Public-facing news & information hub

This is **not** a generic photo website.
This is a **driver-centered sports platform**.

---

## 2. Role of AI Agents

AI agents act as:
- Code assistants
- Architecture advisors
- Data modeling helpers

AI agents are **not decision-makers**.

### Absolute Rule:
> Product decisions, architecture, and data ownership are defined by the project owner. AI agents only assist with implementation.

---

## 3. How AI Agents Must Be Used

### 3.1 One Task at a Time
Each AI request must address **exactly one** of the following areas:

- Database schema
- Backend logic
- API design
- Frontend components
- Authentication & authorization
- Privacy & security

AI agents must **not** mix multiple concerns in one response.

---

### 3.2 Required Context in Every Request

Each AI request must explicitly include:

- Goal of the feature
- Affected entities (e.g. Driver, Team, Event)
- Technology stack (e.g. SQL, REST, React)
- Constraints (e.g. GDPR, performance, scalability)

If context is missing, the AI must ask for clarification.

---

## 4. Core Technical Principles

### 4.1 Data Model Rules (Mandatory)

AI-generated designs must follow these rules:

- Strict separation of:
  - Identity data
  - Public profile data
  - Content data (photos, videos)
- No mixing of public and internal data
- Every entity must have a unique immutable ID

---

### 4.2 Roles & Permissions (Mandatory)

All code must respect the following roles:

- Guest (read-only public access)
- Registered user
- Team member
- Verified driver
- Admin

AI-generated code **must include permission checks**.
Hardcoded roles are forbidden.

---

### 4.3 Privacy by Design (GDPR)

AI agents must **never**:

- Request or store ID documents
- Require addresses or full birth dates
- Auto-enrich profiles from external sources

AI agents **must**:

- Minimize stored personal data
- Apply purpose limitation
- Include deletion / deactivation logic

---

## 5. Development Phases (Binding)

### Phase 1 – Foundation
- Authentication
- Role system
- Basic driver profiles
- Event & result structure

### Phase 2 – Media
- Photo entities
- Driver-to-photo tagging
- Visibility control (web vs HQ)

### Phase 3 – Teams
- Team creation by drivers
- Team invitations
- Read-only access for team members

### Phase 4 – Subscriptions
- Driver subscriptions
- Access control for HQ downloads
- Pause & cancellation logic

AI agents must **not** implement features outside the current phase unless explicitly instructed.

---

## 6. Rules for AI-Generated Code

All AI-generated code must:

- Be readable and commented
- Avoid unnecessary dependencies
- Separate business logic from UI
- Avoid magic values

Forbidden:

- Hardcoded permissions
- Bypassing authorization checks
- Mixing UI and backend logic

---

## 7. Validation Workflow (Mandatory)

After each AI response:

1. Human review
2. Logic validation
3. Privacy validation
4. Only then integration

No unreviewed code may enter the main codebase.

---

## 8. Documentation Rules

AI-generated components must be:

- Documented
- Versioned if affecting the database
- Logged if changing permissions or roles

---

## 9. Future-Proofing

The architecture must remain extensible for:

- Community uploads (future phase)
- Additional racing series
- Mobile applications
- Public APIs

Existing logic must not be broken by extensions.

---

## 10. Guiding Principle

> AI writes code.  
> **Humans own the platform, the data, and the responsibility.**