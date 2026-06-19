# Task Manager API

A production-ready task management system built with Node.js, Express, and PostgreSQL. Teams can be created, members invited with specific roles, tasks assigned and tracked through a complete workflow, and users notified automatically via email when tasks are assigned or updated.

## Live Demo

Base URL: `https://your-deployed-url.railway.app`

> Test the API directly using the endpoints documented below.

## Features

- JWT-based authentication with access and refresh token rotation
- Team creation with automatic admin assignment to creator
- Role-based access control across three roles — admin, manager, member
- Invite team members by email with assignable roles
- Full task lifecycle management — create, assign, update, track status
- Task status workflow — todo, in-progress, review, done
- File attachments on tasks with type and size validation
- Automated email notifications on task assignment and status changes
- Cursor-based pagination for task listings
- Filtering tasks by status, priority, and assignee
- Database transactions ensuring data consistency
- MVC architecture with clean separation of concerns
- Docker support for consistent local development

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Node.js | Runtime environment |
| Express 4 | Web framework |
| PostgreSQL | Primary database |
| bcrypt | Password hashing |
| JSON Web Tokens | Authentication |
| Multer | File upload handling |
| Nodemailer | Email notifications |
| Docker | Containerization |

## Project Structure

task-manager-api/

├── src/

│   ├── config/

│   │   └── db.js                  # PostgreSQL connection pool

│   ├── controllers/

│   │   ├── authController.js      # Register, login, refresh, logout

│   │   ├── teamController.js      # Team and membership management

│   │   └── taskController.js      # Task CRUD, attachments, notifications

│   ├── middleware/

│   │   ├── auth.js                # JWT verification

│   │   ├── validate.js            # Input validation

│   │   └── upload.js              # Multer file upload configuration

│   ├── models/

│   │   ├── userModel.js           # User database queries

│   │   ├── teamModel.js           # Team and membership queries

│   │   └── taskModel.js           # Task and attachment queries

│   ├── routes/

│   │   ├── authRoutes.js

│   │   ├── teamRoutes.js

│   │   └── taskRoutes.js

│   └── utils/

│       └── sendEmail.js           # Nodemailer email templates

├── uploads/                       # Uploaded file storage

├── app.js                         # Express app setup and entry point

├── docker-compose.yml

├── Dockerfile

├── .env.example

└── package.json

## Getting Started

### Prerequisites

- Node.js v18 or higher
- PostgreSQL 14 or higher
- A Gmail account with an App Password for email notifications
- npm

### Installation

**Step 1 — Clone the repository**

```bash
git clone https://github.com/yourusername/task-manager-api.git
cd task-manager-api
```

**Step 2 — Install dependencies**

```bash
npm install
```

**Step 3 — Set up environment variables**

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_manager
DB_USER=postgres
DB_PASSWORD=your_postgres_password

JWT_ACCESS_SECRET=your_long_random_access_secret
JWT_REFRESH_SECRET=your_long_random_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

BCRYPT_ROUNDS=12

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=Task Manager <your_gmail_address@gmail.com>

MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads/
```

> Email notifications require a Gmail App Password, not your regular password. Generate one at myaccount.google.com under Security → 2-Step Verification → App passwords.

**Step 4 — Set up the database**

Connect to PostgreSQL and run:

```sql
CREATE DATABASE task_manager;
\c task_manager

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password      VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE teams (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  owner_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE team_members (
  id          SERIAL PRIMARY KEY,
  team_id     INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(20) NOT NULL DEFAULT 'member',
  joined_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE TABLE tasks (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'todo',
  priority      VARCHAR(20) NOT NULL DEFAULT 'medium',
  due_date      TIMESTAMP,
  team_id       INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by    INTEGER NOT NULL REFERENCES users(id),
  assigned_to   INTEGER REFERENCES users(id),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE task_attachments (
  id            SERIAL PRIMARY KEY,
  task_id       INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  filename      VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size     INTEGER NOT NULL,
  mime_type     VARCHAR(100) NOT NULL,
  uploaded_by   INTEGER NOT NULL REFERENCES users(id),
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_team_id     ON tasks(team_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status      ON tasks(status);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
```

**Step 5 — Start the server**

```bash
npm run dev
```

Server runs at `http://localhost:3000`

---

### Docker Setup (Alternative)

Run the entire stack with one command:

```bash
docker compose up
```

This starts the API server and PostgreSQL together.

---

## API Documentation

### Authentication Endpoints

---

#### Register


## Getting Started

### Prerequisites

- Node.js v18 or higher
- PostgreSQL 14 or higher
- A Gmail account with an App Password for email notifications
- npm

### Installation

**Step 1 — Clone the repository**

```bash
git clone https://github.com/yourusername/task-manager-api.git
cd task-manager-api
```

**Step 2 — Install dependencies**

```bash
npm install
```

**Step 3 — Set up environment variables**

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_manager
DB_USER=postgres
DB_PASSWORD=your_postgres_password

JWT_ACCESS_SECRET=your_long_random_access_secret
JWT_REFRESH_SECRET=your_long_random_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

BCRYPT_ROUNDS=12

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=Task Manager <your_gmail_address@gmail.com>

MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads/
```

> Email notifications require a Gmail App Password, not your regular password. Generate one at myaccount.google.com under Security → 2-Step Verification → App passwords.

**Step 4 — Set up the database**

Connect to PostgreSQL and run:

```sql
CREATE DATABASE task_manager;
\c task_manager

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password      VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE teams (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  owner_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE team_members (
  id          SERIAL PRIMARY KEY,
  team_id     INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(20) NOT NULL DEFAULT 'member',
  joined_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE TABLE tasks (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'todo',
  priority      VARCHAR(20) NOT NULL DEFAULT 'medium',
  due_date      TIMESTAMP,
  team_id       INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by    INTEGER NOT NULL REFERENCES users(id),
  assigned_to   INTEGER REFERENCES users(id),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE task_attachments (
  id            SERIAL PRIMARY KEY,
  task_id       INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  filename      VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size     INTEGER NOT NULL,
  mime_type     VARCHAR(100) NOT NULL,
  uploaded_by   INTEGER NOT NULL REFERENCES users(id),
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_team_id     ON tasks(team_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status      ON tasks(status);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
```

**Step 5 — Start the server**

```bash
npm run dev
```

Server runs at `http://localhost:3000`

---

### Docker Setup (Alternative)

Run the entire stack with one command:

```bash
docker compose up
```

This starts the API server and PostgreSQL together.

---

## API Documentation

### Authentication Endpoints

---

#### Register

Request body:

```json
{
  "name": "Rahul Singh",
  "email": "rahul@example.com",
  "password": "password123"
}
```

Success response `201`:

```json
{
  "message": "Account created successfully",
  "user": {
    "id": 1,
    "name": "Rahul Singh",
    "email": "rahul@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "accessExpiresIn": "15 minutes"
  }
}
```

---

#### Login

Request body:

```json
{
  "email": "rahul@example.com",
  "password": "password123"
}
```

---

#### Get My Profile

---

#### Refresh Token

Request body:

```json
{
  "refreshToken": "eyJhbGci..."
}
```

---

#### Logout

Request body:

```json
{
  "refreshToken": "eyJhbGci..."
}
```

---

### Team Endpoints

All team endpoints require authentication.

---

#### Create a Team

Request body:

```json
{
  "name": "Engineering Team",
  "description": "Main product development team"
}
```

Success response `201`:

```json
{
  "message": "Team created successfully",
  "team": {
    "id": 1,
    "name": "Engineering Team",
    "description": "Main product development team",
    "owner_id": 1,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

> The creator is automatically added as an admin member of the team.

---

#### Get My Teams

Success response `200`:

```json
{
  "count": 2,
  "teams": [
    {
      "id": 1,
      "name": "Engineering Team",
      "description": "Main product development team",
      "role": "admin",
      "member_count": 3,
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

#### Get Team Details

Success response `200`:

```json
{
  "team": {
    "id": 1,
    "name": "Engineering Team",
    "description": "Main product development team",
    "owner_id": 1,
    "created_at": "2024-01-15T10:30:00.000Z",
    "members": [
      {
        "userId": 1,
        "name": "Rahul Singh",
        "email": "rahul@example.com",
        "role": "admin",
        "joinedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

#### Invite a Member

> Requires admin role.

Request body:

```json
{
  "email": "priya@example.com",
  "role": "manager"
}
```

Available roles: `admin`, `manager`, `member`

---

#### Update a Member's Role

> Requires admin role.

Request body:

```json
{
  "role": "admin"
}
```

---

#### Remove a Member

> Requires admin role. You cannot remove yourself.

---

#### Delete a Team

> Requires team ownership.

---

### Task Endpoints

All task endpoints require authentication and team membership.

---

#### Create a Task

Request body:

```json
{
  "title": "Build the login page",
  "description": "Create a responsive login UI with validation",
  "priority": "high",
  "dueDate": "2024-12-31",
  "assignedTo": 2
}
```

Available priorities: `low`, `medium`, `high`, `urgent`

Success response `201`:

```json
{
  "message": "Task created successfully",
  "task": {
    "id": 1,
    "title": "Build the login page",
    "description": "Create a responsive login UI with validation",
    "status": "todo",
    "priority": "high",
    "due_date": "2024-12-31T00:00:00.000Z",
    "team_id": 1,
    "created_by": 1,
    "assigned_to": 2,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

> Only admins and managers can assign tasks to other members. Assigning a task automatically sends an email notification to the assignee.

---

#### Get All Tasks in a Team

Query parameters:

| Parameter | Description | Example |
|-----------|-------------|---------|
| status | Filter by status | `?status=in-progress` |
| priority | Filter by priority | `?priority=high` |
| assignedTo | Filter by assignee user ID | `?assignedTo=2` |
| cursor | Pagination cursor — ID of last item seen | `?cursor=15` |
| limit | Number of results per page | `?limit=20` |

Success response `200`:

```json
{
  "count": 2,
  "nextCursor": 14,
  "tasks": [
    {
      "id": 16,
      "title": "Build the login page",
      "status": "in-progress",
      "priority": "high",
      "due_date": "2024-12-31T00:00:00.000Z",
      "created_by": { "id": 1, "name": "Rahul Singh" },
      "assigned_to": { "id": 2, "name": "Priya Sharma" },
      "attachment_count": "1"
    }
  ]
}
```

---

#### Get One Task

Returns full task details including all attachments.

---

#### Update a Task

Request body:

```json
{
  "title": "Build the login page - updated",
  "description": "Updated description",
  "status": "in-progress",
  "priority": "urgent",
  "dueDate": "2024-12-25",
  "assignedTo": 3
}
```

> Admins and managers can update any task. Members can only update tasks assigned to them. Only admins and managers can reassign tasks.

---

#### Update Task Status

Request body:

```json
{
  "status": "done"
}
```

Available statuses: `todo`, `in-progress`, `review`, `done`

> Any team member can update status. The task creator receives an email notification when status changes.

---

#### Delete a Task

> Requires admin, manager, or task creator permissions.

---

#### Upload a File Attachment

Form field: `file`

Accepted file types: JPEG, PNG, GIF, PDF, plain text, Word documents

Maximum file size: 5MB

Success response `201`:

```json
{
  "message": "File uploaded successfully",
  "attachment": {
    "id": 1,
    "task_id": 1,
    "filename": "1705318200000-123456789-design-mockup.png",
    "original_name": "design mockup.png",
    "file_size": 245678,
    "mime_type": "image/png",
    "uploaded_by": 1,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Error Response Format

All errors follow this consistent structure:

```json
{
  "error": "Error Type",
  "message": "Human readable explanation"
}
```

---

### HTTP Status Codes Used

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created successfully |
| 400 | Bad request or validation failed |
| 401 | Unauthorized — login required |
| 403 | Forbidden — insufficient role or permission |
| 404 | Resource not found |
| 409 | Conflict — duplicate resource |
| 500 | Internal server error |

---

## Role-Based Access Control

| Action | Admin | Manager | Member |
|--------|:-----:|:-------:|:------:|
| Create team | ✓ | ✓ | ✓ |
| Invite members | ✓ | ✗ | ✗ |
| Remove members | ✓ | ✗ | ✗ |
| Change member roles | ✓ | ✗ | ✗ |
| Delete team | ✓ (owner only) | ✗ | ✗ |
| Create task | ✓ | ✓ | ✓ |
| Assign task to others | ✓ | ✓ | ✗ |
| Update any task | ✓ | ✓ | ✗ |
| Update own assigned task | ✓ | ✓ | ✓ |
| Update task status | ✓ | ✓ | ✓ |
| Delete task | ✓ | ✓ | only if creator |

---

## Email Notifications

The API sends automated email notifications for two events:

1. **Task assignment** — sent to the assignee when a task is created or reassigned to them
2. **Status change** — sent to the task creator when someone else updates the task status

Emails are sent asynchronously and never block the API response. If email delivery fails, the error is logged but the request still succeeds.

---

## Database Design Notes

The `team_members` table is a junction table implementing a many-to-many relationship between `users` and `teams`. A single user can belong to multiple teams, and each team can have multiple members, each with an independent role per team.

Team creation uses a database transaction to ensure the team record and the creator's admin membership record are created atomically — both succeed or both roll back.

---

## Security

- Passwords hashed with bcrypt at cost factor 12
- JWT access tokens expire in 15 minutes
- Refresh tokens stored in database and deleted on logout
- Parameterized queries used throughout — no SQL injection possible
- Role checks enforced on every team and task mutation
- File upload type and size restrictions enforced server-side
- Uploaded filenames sanitized and randomized to prevent path traversal

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_NAME | Database name | task_manager |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | yourpassword |
| JWT_ACCESS_SECRET | Secret for access tokens | random 32+ char string |
| JWT_REFRESH_SECRET | Secret for refresh tokens | different random string |
| JWT_ACCESS_EXPIRES | Access token expiry | 15m |
| JWT_REFRESH_EXPIRES | Refresh token expiry | 7d |
| BCRYPT_ROUNDS | bcrypt cost factor | 12 |
| EMAIL_HOST | SMTP host | smtp.gmail.com |
| EMAIL_PORT | SMTP port | 587 |
| EMAIL_USER | Sender email address | yourgmail@gmail.com |
| EMAIL_PASS | Gmail App Password | 16-character app password |
| EMAIL_FROM | Display name and email | Task Manager <you@gmail.com> |
| MAX_FILE_SIZE | Max upload size in bytes | 5242880 |
| UPLOAD_PATH | File storage directory | uploads/ |

---

## What I Learned Building This

This project was built as a second project following a URL Shortener API, specifically to learn concepts the first project did not cover:

- Many-to-many database relationships using junction tables
- Implementing role-based access control at the database query level
- Sending transactional emails from a backend service
- Handling file uploads with validation and storage management
- Database transactions for atomic multi-table operations
- Cursor-based pagination as an alternative to offset pagination

---

## Author

**Your Name**
- GitHub: [@devanshjaincampaign-tech](https://github.com/devanshjaincampaign-tech)
- LinkedIn: [Devansh Jain](https://www.linkedin.com/in/devansh-jain-314208375/)
- Email: devanshjaincampaign@gmail.com

---

## License

This project is open source and available under the [MIT License](LICENSE).