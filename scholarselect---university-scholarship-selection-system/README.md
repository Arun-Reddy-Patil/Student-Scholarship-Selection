# ScholarSelect: Student Scholarship Selection System Using MERN Stack

An institutional full-stack MERN (MongoDB, Express.js, React.js, Node.js) web application designed for university financial aid offices to manage student scholarship applications, compute multidimensional priority scores, and select the optimal combination of students using the budget-constrained **0/1 Knapsack Optimization Algorithm**.

---

## 1. Architectural Overview

```
                        ┌──────────────────────────────────────────┐
                        │          React 19 Single Page App        │
                        │ (Tailwind CSS, Lucide, SVG Data Charts)  │
                        └────────────────────┬─────────────────────┘
                                             │ HTTP/JSON + JWT
                                             ▼
                        ┌──────────────────────────────────────────┐
                        │       Node.js + Express REST API         │
                        │    (JWT Auth, RBAC, Validation Engine)   │
                        └───────┬──────────────────────────┬───────┘
                                │                          │
                                ▼                          ▼
        ┌────────────────────────────────┐    ┌────────────────────────────────┐
        │  0/1 Knapsack DP Engine        │    │ MongoDB / Mongoose ODM Layer   │
        │  - Exact Dynamic Programming   │    │ - User, Student, Application   │
        │  - Deterministic Tie-Breaking  │    │ - Budget, Allocation Schemas   │
        │  - O(N·W) Complexity Guarantee │    │ - Persistent Store Engine      │
        └────────────────────────────────┘    └────────────────────────────────┘
```

---

## 2. Mathematical Formulation: 0/1 Knapsack Algorithm

Given $n$ candidate scholarship applicants, each applicant $i$ has:
- **Scholarship Cost ($w_i > 0$)**: The financial award requested by the student.
- **Priority Score ($v_i \ge 0$)**: The institutional merit & financial need evaluation metric ($0 \le v_i \le 100$).
- **Available Budget ($W$)**: The university endowment pool ceiling.

### Objective Function
$$\text{Maximize } Z = \sum_{i=1}^{n} v_i \cdot x_i$$

### Subject to Constraints
$$\sum_{i=1}^{n} w_i \cdot x_i \le W$$
$$x_i \in \{0, 1\} \quad \forall i \in \{1, \dots, n\}$$

### Multi-Objective Deterministic Tie-Breaking Policy
When two distinct applicant subsets yield identical total priority scores $\sum v_i$:
1. **Endowment Conservation**: The algorithm selects the combination with the **lower total cost** $\sum w_i$, preserving institutional funds.
2. **Deterministic Repeatability**: If total cost is also identical, candidates are ordered deterministically by ascending Student ID.

---

## 3. Database Schemas

### 1. User (`UserSchema`)
- `_id`: ObjectId
- `name`: String
- `email`: String (Unique, Indexed)
- `password`: Hashed String (bcrypt)
- `role`: Enum `['admin', 'student']`
- `studentId`: String (Optional, for students)
- `department`: String

### 2. Student (`StudentSchema`)
- `studentId`: String (Unique, e.g. `STU-2026-101`)
- `name`: String
- `email`: String (Unique)
- `department`: String
- `course`: String
- `academicYear`: String
- `gpa`: Number ($0.0 - 4.0$)
- `phone`: String
- `householdIncome`: Number
- `familyMembers`: Number

### 3. Scholarship Application (`ApplicationSchema`)
- `studentId`: String (Indexed)
- `studentName`: String
- `email`: String
- `department`: String
- `course`: String
- `academicYear`: String
- `cycleYear`: String (e.g. `2025-2026`)
- `scholarshipAmount`: Number ($w_i$)
- `priorityScore`: Number ($v_i$, $0-100$)
- `gpa`: Number
- `financialNeedScore`: Number ($0-50$)
- `meritScore`: Number ($0-50$)
- `reason`: String (Statement of Purpose)
- `status`: Enum `['Draft', 'Submitted', 'Under Review', 'Selected', 'Not Selected', 'Approved', 'Rejected']`
- `awardedAmount`: Number
- `decisionDate`: ISO Date String
- `reviewerNotes`: String

### 4. Scholarship Budget (`BudgetSchema`)
- `academicYear`: String (Unique)
- `title`: String
- `totalBudget`: Number
- `allocatedBudget`: Number
- `remainingBudget`: Number
- `isFinalized`: Boolean
- `history`: Array of `{ date, previousBudget, newBudget, changedBy, notes }`

### 5. Scholarship Allocation (`AllocationSchema`)
- `academicYear`: String
- `availableBudget`: Number
- `totalCost`: Number
- `remainingBudget`: Number
- `totalPriorityScore`: Number
- `budgetUtilizationRate`: Number
- `selectedStudents`: Array of applicant snapshots
- `unselectedStudents`: Array of unselected snapshots with rejection rationale
- `algorithm`: String (`0/1 Knapsack Dynamic Programming`)
- `algorithmVersion`: String
- `executionTimeMs`: Number
- `isFinalized`: Boolean

---

## 4. RESTful API Endpoints

### Authentication
- `POST /api/auth/register` — Register student or administrative user.
- `POST /api/auth/login` — Sign in and receive JWT token.
- `GET /api/auth/me` — Retrieve current authenticated user profile.
- `GET /api/auth/demo-accounts` — List preconfigured demo credentials.

### Students
- `GET /api/students` — List students with search, department filtering, and pagination.
- `GET /api/students/:id` — Get student details and linked applications.
- `POST /api/students` — Create new student record with unique ID validation.
- `PUT /api/students/:id` — Update student profile and sync application records.
- `DELETE /api/students/:id` — Delete student and cascade associated applications.

### Applications
- `GET /api/applications` — List applications (filtered by status and cycle; students only view their own).
- `GET /api/applications/:id` — Get application statement and score breakdown.
- `POST /api/applications` — Submit scholarship request with duplicate-cycle prevention.
- `PUT /api/applications/:id` — Update application details (student: draft edits; admin: score/status override).
- `DELETE /api/applications/:id` — Remove draft application.

### Budget Management
- `GET /api/budget` — Fetch active academic year budget and live requested/allocated balances.
- `POST /api/budget` — Establish new cycle budget pool.
- `PUT /api/budget/:id` — Revise budget with revision audit trail and awarded floor checks.

### Selection & Knapsack Optimization
- `POST /api/selection/run` — Execute 0/1 Knapsack algorithm with custom budget simulation.
- `GET /api/selection/results` — Fetch past allocation records.
- `GET /api/selection/results/:id` — Fetch specific allocation solution.
- `POST /api/selection/finalize` — Committee approval: commits awards and updates student application statuses.

### Reports & System Tests
- `GET /api/reports/selection` — Generate committee selection report.
- `GET /api/reports/selection/export` — Download institutional CSV spreadsheet.
- `GET /api/tests/run-suite` — Execute automated 8+ unit test validation suite.

---

## 5. Preconfigured Demo Accounts

| Role | Name | Email | Password | Details |
|---|---|---|---|---|
| **Administrator** | Dr. Eleanor Vance | `admin@university.edu` | `Admin@123456` | Aid Committee Chair; full budget, scoring, and optimization access |
| **Student** | Arun Reddy | `arun.student@university.edu` | `Student@123456` | STU-2026-101; Computer Science (Score: 90, Requested: $6,500) |
| **Student** | Sophia Rodriguez | `sophia.rodriguez@university.edu` | `Student@123456` | STU-2026-104; Biomedical Eng. (Score: 97, Requested: $7,500) |
| **Student** | Maya Lin | `maya.lin@university.edu` | `Student@123456` | STU-2026-102; Electrical Eng. (Score: 83, Requested: $8,000) |

---

## 6. How to Run the Application

```bash
# Install dependencies
npm install

# Start full-stack development server (Express + React Vite on port 3000)
npm run dev

# Run TypeScript lint verification
npm run lint

# Build for production
npm run build

# Start production server
npm start
```
