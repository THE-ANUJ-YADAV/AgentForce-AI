# AgentForce AI: Autonomous Multi-Agent Business Workforce

> Enterprise-grade autonomous multi-agent platform for orchestrating end-to-end business operations across CRM intelligence, task scheduling, personalized outbound communications, and human-in-the-loop governance.

---

## 1. Executive Summary & Objective

Modern businesses lose countless hours triaging inbound leads, updating CRM systems, scheduling follow-up deadlines, drafting outreach emails, and synchronizing work across fragmented tools.

**AgentForce AI** solves this problem by deploying an autonomous five-agent workforce that:
1. Decomposes unstructured natural-language requests into structured execution plans.
2. Coordinates specialized agents with discrete privileges and real executable tools.
3. Automatically deduplicates CRM contacts and scores leads.
4. Resolves relative business dates (e.g., "Friday", "next Monday") deterministically in IST (`Asia/Kolkata`).
5. Drafts context-aware personalized emails with Gemini (or deterministic template fallback).
6. Halts high-stakes outbound communications behind an interactive **Human-in-the-Loop Approval Gate**.
7. Provides self-healing isolated step retries and full audit trail logging.

---

## 2. Five-Agent Architecture

| Agent | Role | Authorized Executable Tools | Core Responsibilities |
|---|---|---|---|
| **Planner Agent** | Strategic Planning & Goal Decomposition | `callGemini()`, `validatePlan()`, `planWithFallback()` | Parses natural-language requests, validates against authorized schema, assigns dependencies. |
| **Supervisor Agent** | Workforce Orchestrator & Governance | `requestApproval()`, `executeApprovedAction()`, `retryStep()`, `writeActivityLog()` | Coordinates workflow lifecycle, enforces dependencies, gates outbound emails, handles retries. |
| **CRM Agent** | Customer Relationship & Lead Intelligence | `findContact()`, `createContact()`, `updateContact()` | Deduplicates contacts by email or name/company, calculates lead scores, updates profiles. |
| **Task Agent** | Workforce Operations & Task Scheduling | `createTask()`, `resolveDate()` | Resolves relative date phrases into strict IST dates, schedules follow-up tasks, handles outages. |
| **Email Agent** | Communications & Outbound Messaging | `generateEmailDraft()`, `callGemini()` | Synthesizes CRM data to craft tailored outreach emails; strictly staged for approval. |

### Allowed Action Schema & Dependency Hierarchy

```
[Natural Language Request]
           │
           ▼
   [Planner Agent] ──▶ Generates Structured Plan
           │
           ▼
  [Supervisor Agent] ──▶ Coordinates Step Execution
           │
           ├── Step 1: CRM Agent (create_contact) ────────── [No Prerequisites]
           │         │
           │         ├─▶ Step 2: Task Agent (create_task) ─── [Depends on Step 1]
           │         │
           │         └─▶ Step 3: Email Agent (draft_email) ── [Depends on Step 1]
           │                   │
           │                   ▼
           └─ Step 4: Supervisor (request_email_approval) ─── [Depends on Step 3]
                               │
                      [Human Decision]
                      ├── APPROVE ──▶ Simulated Dispatch & Workflow Completed
                      └── REJECT  ──▶ Transmission Blocked & Step Rejected
```

---

## 3. Technology Stack & Ports

- **Frontend**: React 18, Vite 6, Tailwind CSS (Light Theme only), Lucide React.
  - Port: `http://localhost:5173`
  - Dev Proxy: `/api` forwarded to `http://localhost:5000`
- **Backend**: Node.js v24+, Express.js (ES Modules), REST APIs, CORS.
  - Port: `http://localhost:5000`
- **AI Engine**: Google Gemini API via official `@google/genai` SDK (`gemini-2.5-flash`).
  - Strict 15-second timeout with **zero-failure deterministic fallback**.
  - Operates 100% out-of-the-box without an API key!
- **Data Layer**: File-backed persistent database (`server/data/agentforce.db.json`) preserving contacts, tasks, workflows, approvals, and logs across server restarts.
- **Outbound Email Engine**: Nodemailer supporting SMTP or auto-generated Ethereal test accounts with live preview URLs.

---

## 4. Setup & Running Instructions (Windows PowerShell)

> **Important**: In Windows PowerShell, use `;` instead of `&&` for chaining commands.

### Prerequisites
- Node.js v18+ (Node.js v24 recommended)
- npm v9+

### Environment Configuration (Optional)
To enable real Gemini AI inference, copy `server/.env.example` to `server/.env` and insert your key. If omitted, the application seamlessly runs in deterministic fallback mode.

```powershell
# In PowerShell:
Copy-Item "server\.env.example" "server\.env"
```

Content of `server/.env`:
```ini
PORT=5000
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
CLIENT_ORIGIN=http://localhost:5173
```

---

### Terminal 1: Start Backend Server

```powershell
cd "c:\Users\Anuj\Desktop\AgentForce AI\server" ; npm start
```

*Server starts on `http://localhost:5000` with active CORS and health endpoints.*

---

### Terminal 2: Start Frontend Client

```powershell
cd "c:\Users\Anuj\Desktop\AgentForce AI\client" ; npm run dev
```

*Frontend dev server starts on `http://localhost:5173`.*

Open your browser to: **`http://localhost:5173`**

---

## 5. Demonstration Script for Hackathon Judges

### Demo 1: The Happy Path Workflow (Rahul Sharma)
1. In the top navigation bar, click **+ New Workflow**.
2. Click the one-click button: **Rahul Sharma (Happy Path)**.
   - Text loaded: *"Add Rahul Sharma from ABC Technologies to CRM, create a follow-up task for Friday, and prepare a personalized product demo email."*
3. Click **Dispatch Workflow**.
4. Observe the live multi-agent execution pipeline:
   - **Step 1 (CRM Agent)**: Creates new contact `Rahul Sharma` at `ABC Technologies` with lead score `70`.
   - **Step 2 (Task Agent)**: Resolves "Friday" to `2026-10-30` (`Asia/Kolkata` IST) and creates task *"Follow up with Rahul Sharma from ABC Technologies"*.
   - **Step 3 (Email Agent)**: Generates a tailored product demonstration email draft.
   - **Step 4 (Supervisor)**: Enters `Awaiting Approval` and displays the inline Approval Card.
5. In the approval card, inspect the proposed recipient, subject, and body.
6. Click **Approve & Dispatch Email (Simulated)**.
7. The status updates to **Completed**, and the summary confirms all 4 steps succeeded.

---

### Demo 2: Contact Deduplication Guarantee
1. Click **+ New Workflow** again and re-submit the identical Rahul Sharma request.
2. In the execution pipeline, observe Step 1:
   - CRM Agent identifies existing contact `Rahul Sharma` (`rahul.sharma@abctechnologies.example`).
   - Rather than creating a duplicate, CRM Agent executes `updateContact()` and reports `updated`.
3. Check the **CRM & Leads** page: exactly **one** record exists for Rahul Sharma.

---

### Demo 3: Failure Demo & Isolated Step Retry
1. Click **+ New Workflow**.
2. Click the one-click button: **FailCorp Demo (Step Failure & Retry)**.
   - Text loaded: *"Add Test User from FailCorp (fail@test.com) to CRM, create a follow-up task for Friday, and prepare a product demo email."*
3. Click **Dispatch Workflow**.
4. Observe that:
   - CRM contact and email draft succeed.
   - **create_task** fails intentionally on attempt #1 with *"Task service temporarily unavailable"*.
   - Workflow status stays at `running` or `partially_completed`, and the step displays a red **Retry Step** button.
5. Click **Retry Step**:
   - The Task Agent re-executes attempt #2, recovers successfully, and marks the step **Completed**.
   - No duplicate contacts or duplicate tasks are created!

---

### Demo 4: Human-in-the-Loop Rejection
1. On any workflow awaiting approval (or in the dedicated **Approval Queue** page), click **Reject Action**.
2. The step status transitions to **Rejected**, email dispatch is halted, and the rejection reason is logged to the audit trail.
3. Attempting to approve an already-resolved approval returns HTTP `409 Conflict` (idempotent protection).

---

### Demo 5: Real-time Inspection, Filterable Logs & State Reset
1. **Activity Logs**: Filter by agent (e.g., `Task Agent`) or status (`failed`). Click any row to inspect structured JSON payloads and click **Copy JSON**.
2. **Tasks Page**: Change a task's status from `Open` to `In Progress` using the dropdown; verify immediate backend persistence.
3. **Settings Page**: Review server time (`Asia/Kolkata`), Gemini key status, and active AI mode.
4. Click **Reset Demo Data** and confirm: all dynamic records are cleared and seed data is restored.

---

## 6. Backend API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns server health, IST time, active AI mode, and busy agents |
| `POST` | `/api/workflows` | Accepts `{ request }`, plans and launches async multi-agent pipeline (201) |
| `GET` | `/api/workflows` | Retrieves all workflows |
| `GET` | `/api/workflows/:id` | Retrieves single workflow with all step payloads and summary |
| `POST` | `/api/workflows/:id/steps/:stepId/retry` | Re-executes an isolated failed step (max 3 attempts) |
| `GET` | `/api/tasks` | Lists all follow-up tasks |
| `PATCH` | `/api/tasks/:id` | Updates task status (`open`, `in_progress`, `completed`) |
| `GET` | `/api/crm` | Lists CRM contacts with lead score and last activity |
| `GET` | `/api/approvals` | Lists pending and historical human approval requests |
| `POST` | `/api/approvals/:id/approve` | Approves outbound communication and records simulated dispatch |
| `POST` | `/api/approvals/:id/reject` | Rejects outbound communication and halts transmission |
| `GET` | `/api/logs` | Fetches chronological system activity logs |
| `POST` | `/api/admin/reset` | Resets state store to seed data |

---

## 7. Verification & Automated Test Suites

To run unit and integration tests:

```powershell
# 1. Run dateService unit tests
cd "server" ; npm test

# 2. Run end-to-end Phase 1 checkpoint (happy path, deduplication, approvals, retries, 409 conflict, admin reset)
node test/checkpointPhase1.js
```
