# 🏗 1️⃣ High-Level System Design

Since the requirement mentions **microservices**, I would NOT build everything in one monolith. I’d split responsibilities clearly.

## Recommended Microservices Architecture

### 1. API Gateway

- Single entry point for frontend
- Handles:
    - Authentication validation (JWT verification)
    - Routing to services
    - Rate limiting (optional)
    - Logging

### 2. Auth Service

- Handles:
    - Login
    - JWT generation
    - Password hashing
    - Role-based access control

### 3. Employee Service

- Handles:
    - Employee master data (CRUD)
    - HR-only operations

### 4. Attendance Service

- Handles:
    - WFH attendance submission
    - Upload photo metadata
    - Prevent duplicate attendance
    - View attendance

### 5. File Service (Optional but recommended)

- Handles:
    - Upload image
    - Store in S3 / MinIO
    - Return image URL

---

## Architecture Diagram (Conceptually)

```
React App
   ↓
API Gateway (NestJS)
   ↓
-------------------------
| Auth Service          |
| Employee Service      |
| Attendance Service    |
| File Service          |
-------------------------
   ↓
MySQL + Object Storage
```

---

# 🗃 2️⃣ Database Design (Proper Structure)

We design this relationally and normalized.

---

## 🔐 1. users table (Authentication)

```sql
users (
  idBIGINT PK AUTO_INCREMENT,
  emailVARCHAR(255)UNIQUENOT NULL,
  password_hashVARCHAR(255)NOT NULL,
  role            ENUM('employee','hr_admin')NOT NULL,
  is_activeBOOLEANDEFAULTTRUE,
  created_at      DATETIME,
  updated_at      DATETIME
)
```

Reason:

- Separate authentication from employee profile.
- Makes system extensible (future roles possible).

---

## 👤 2. employees table (Master Data)

```sql
employees (
  idBIGINT PK AUTO_INCREMENT,
  user_idBIGINTUNIQUE,
  employee_codeVARCHAR(50)UNIQUENOT NULL,
  full_nameVARCHAR(255)NOT NULL,
  departmentVARCHAR(100),
  positionVARCHAR(100),
  join_dateDATE,
  created_at      DATETIME,
  updated_at      DATETIME,FOREIGN KEY (user_id)REFERENCES users(id)
)
```

Reason:

- 1-to-1 relation with user.
- HR can manage employee independently of login logic.

---

## 🕒 3. attendances table

```sql
attendances (
  idBIGINT PK AUTO_INCREMENT,
  employee_idBIGINTNOT NULL,
  attendance_dateDATENOT NULL,
  check_in_time   DATETIMENOT NULL,
  photo_urlVARCHAR(500),
  status          ENUM('submitted','approved','rejected')DEFAULT'submitted',
  created_at      DATETIME,
  updated_at      DATETIME,FOREIGN KEY (employee_id)REFERENCES employees(id),UNIQUE(employee_id, attendance_date)
)
```

Reason:

- Unique constraint prevents double attendance same day.
- Status allows future approval workflow.

---

## 🗂 Optional: attendance_logs (if needed)

If you want audit trail:

```sql
attendance_logs (
  idBIGINT PK,
  attendance_idBIGINT,
  action ENUM('created','approved','rejected'),
  action_byBIGINT,
  created_at DATETIME
)
```

---

# 🔐 3️⃣ Authentication Design

Use:

- JWT (access token)
- Password hashed using bcrypt

Flow:

1. User login
2. Auth Service validates credentials
3. Returns JWT
4. React stores in memory or httpOnly cookie
5. Each request sends Authorization: Bearer <token>

RBAC:

- employee → can submit attendance & view own
- hr_admin → CRUD employee + view all attendance

---

# 📦 4️⃣ API Design

## Auth Service

```
POST/auth/loginPOST/auth/register (optional)
```

---

## Employee Service (HR only)

```
POST   /employees
GET    /employees
GET    /employees/:id
PUT    /employees/:id
DELETE /employees/:id
```

---

## Attendance Service

Employee:

```
POST   /attendances/checkin
GET    /attendances/me
```

HR:

```
GET    /attendances
GET    /attendances?date=2026-02-11
```

---

# 🖼 5️⃣ Photo Upload Design

DO NOT store image in MySQL.

Store:

- In S3 / MinIO
- Save only URL in database

Flow:

1. Employee submits attendance
2. Upload image to File Service
3. File Service returns image URL
4. Attendance service saves photo_url

---

# 🧠 6️⃣ Microservices Communication

Since using NestJS:

Option A (Simpler for test):

- Use HTTP communication between services

Option B (More advanced):

- Use message broker (RabbitMQ)
- Event-based communication

Example:

- AttendanceCreated → emit event
- HR notification service listens

---

# ⚛️ 7️⃣ Frontend (React Design)

## Pages

### Public

- Login page

### Employee

- Dashboard
- Check-in page
- Attendance history

### HR Admin

- Employee Management
- Attendance Monitoring

---

## Component Structure

```
/componentsButton.jsxInput.jsxModal.jsxTable.jsxAttendanceCard.jsx
```

Use:

- Axios for API
- React Query (recommended)
- Context or Redux for auth

---

# 🔄 8️⃣ Data Flow Example (Check-in)

1. Employee login
2. Click "Check In"
3. Capture:
    - Current date
    - Current time
    - Upload image
4. POST /attendances/checkin
5. Backend:
    - Validate token
    - Check if already checked in today
    - Save record
6. Return success

---

# 🧩 9️⃣ Important Production Considerations

### 1. Prevent Fake Time

Do NOT trust frontend time.

Backend should:

```tsx
const now =newDate();
```

---

### 2. Prevent Double Check-in

Use:

```sql
UNIQUE(employee_id, attendance_date)
```

---

### 3. Security

- Validate file type
- Limit file size
- Sanitize inputs
- Use DTO validation in NestJS

---

### 4. Indexing

Add index:

```sql
INDEX idx_attendance_date (attendance_date)
INDEX idx_employee_id (employee_id)
```

For fast HR queries.

---

# 📈 10️⃣ Scalability Strategy

- Stateless services
- Store session in JWT
- Can scale horizontally
- Use load balancer
- Move MySQL to managed service later

---

# 🎯 If This Was My Final Architecture

| Layer | Technology |
| --- | --- |
| Frontend | React + Axios + React Query |
| API Gateway | NestJS |
| Microservices | NestJS |
| Database | MySQL |
| Cache (optional) | Redis |
| File Storage | S3 / MinIO |
| Auth | JWT + bcrypt |
| Deployment | Docker + Docker Compose |

---

# 💡 Why This Design is Senior-Level

Because it:

- Separates concerns
- Uses proper normalization
- Avoids storing images in DB
- Uses RBAC
- Prevents duplicate attendance
- Scales horizontally
- Follows microservices principle

---

If you want, I can now:

- Show you actual folder structure for NestJS microservices
- Show entity + DTO implementation
- Or simulate how interviewer would question this design

Which direction do you want to go?