# TaskFlow — Smart TODO List Application

TaskFlow is a full-stack productivity and task management web application built with **React**, **TypeScript**, **Tailwind CSS**, **Node.js**, **Express.js**, and **Supabase (PostgreSQL)**.

---

## Features

- **Full CRUD Operations**: Create, read, edit, complete/restore, and delete tasks with validation and confirmation dialogs.
- **Dashboard Analytics**: Live counters for Total, Pending, Completed, and Overdue tasks, an animated completion progress bar, quick task capture, and recent tasks overview.
- **Search, Filtering & Sorting**: Search tasks by title, description, or category; filter by status (`All`, `Pending`, `Completed`, `Overdue`) and priority (`Low`, `Medium`, `High`); sort by due date, creation date, or priority in ascending or descending order.
- **Completed Tasks Archive**: Dedicated view to review finished tasks, restore any task back to pending, or bulk-clear completed items.
- **Light & Dark Themes**: Instant theme switching persisted in browser storage.
- **Profile & Task Defaults**: Configure display name, email, role, default priority, and default category in Settings.
- **Toast Notifications & Loading States**: Non-intrusive success/error feedback and skeleton loading states across all operations.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion |
| Backend | Node.js, Express.js, TypeScript (`tsx`) |
| Database | Supabase PostgreSQL (`@supabase/supabase-js`), with automatic local disk fallback (`data/taskflow-store.json`) if Supabase credentials are unset |

---

## Supabase Database Setup

1. Create a free project at [https://supabase.com](https://supabase.com).
2. Open **SQL Editor** in your Supabase Dashboard.
3. Paste and run the contents of [`supabase/schema.sql`](./supabase/schema.sql) to create the `tasks` and `settings` tables, indexes, `updated_at` triggers, and Row Level Security.
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY`
5. Add both values to your `.env` file (or the AI Studio **Secrets** panel). Credentials are read strictly on the Express server and never sent to the browser.

### `tasks` Table Schema

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key (`gen_random_uuid()`) |
| `title` | `text` | Required, max 200 chars |
| `description` | `text` | Default `''`, max 2000 chars |
| `priority` | `text` | `'low' \| 'medium' \| 'high'` |
| `category` | `text` | Default `'General'`, max 60 chars |
| `due_date` | `timestamptz` | Optional due date |
| `completed` | `boolean` | Default `false` |
| `created_at` | `timestamptz` | Auto-managed |
| `updated_at` | `timestamptz` | Auto-updated via trigger |

---

## REST API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/tasks` | Create a new task |
| `GET` | `/api/tasks` | Get all tasks (supports `?search=`, `?status=`, `?priority=`, `?category=`, `?sortBy=`, `?sortOrder=`) |
| `GET` | `/api/tasks/:id` | Get a single task by UUID |
| `PUT` | `/api/tasks/:id` | Update task fields (`title`, `description`, `priority`, `category`, `dueDate`, `completed`) |
| `PATCH` | `/api/tasks/:id/complete` | Toggle or explicitly set task completion status (`{ "completed": true | false }`) |
| `DELETE` | `/api/tasks/:id` | Delete a single task |
| `DELETE` | `/api/tasks/completed` | Delete all completed tasks |
| `GET` | `/api/settings` | Fetch workspace profile & default task settings |
| `PUT` | `/api/settings` | Update workspace profile & default task settings |

---

## Windows 11 Local Installation Instructions

### 1. Install Node.js
- Download the Node.js LTS (v20 or v22) Windows installer from [https://nodejs.org](https://nodejs.org) with **Add to PATH** checked.
- Verify in **PowerShell**:
  ```powershell
  node -v
  npm -v
  ```

### 2. Install Dependencies
```powershell
cd C:\path\to\taskflow
npm install
```

### 3. Configure Supabase Environment Variables
```powershell
Copy-Item .env.example .env
notepad .env
```

Set your Supabase credentials inside `.env`:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3000
```

### 4. Run the Schema in Supabase
Open your Supabase project's **SQL Editor**, paste the contents of `supabase/schema.sql`, and click **Run**.

### 5. Start the Application
```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Production Build (Optional)
```powershell
npm run build
$env:NODE_ENV="production"
npm start
```
