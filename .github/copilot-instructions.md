# Task Management Application - Workspace Instructions

## Project Overview

**Type**: Enterprise Portfolio Management System — compiled distribution package

**Source Code Repositories**:
- Frontend: `c:\Users\cyborg\taskmanagement-ui` (React 19, Create React App)
- Backend: `c:\Users\cyborg\TaskManagement.API` (.NET 10, ASP.NET Core)

**Distribution Package** (this folder): `c:\Users\cyborg\TaskManagement-Handoff`
- Pre-built executable: `TaskManagement.API.exe`
- Pre-bundled React assets in `wwwroot/`
- Ready-to-run, no build step required

**What it is**: A professional portfolio/program/project management system with:
- **Hierarchical work breakdown**: Organization → Portfolio → Programme → Project → Task → SubTasks
- **Resource management**: Track people, skills, allocations, and costs
- **Enterprise scheduling**: Budget tracking, overhead costs, critical path, task dependencies
- **Team collaboration**: User assignments, permissions, team tracking
- **Analytics**: Dashboard, reports, progress tracking
- **Full CRUD API**: RESTful backend with Swagger documentation

## Tech Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| **Frontend** | React 19 + React Router 7 | SPA with 5 main pages; Axios for HTTP; Create React App (builds to `wwwroot/` on compile) |
| **Backend** | ASP.NET Core 10 (.NET 10) | In-process IIS hosting; EF Core 10 with SQL Server; JWT-ready; CORS configured |
| **Database** | SQL Server | Instance: `localhost\SQLEXPRESS`; auto-migrations on start; schema from EF Core Code-First |
| **Hosting Model** | AspNetCoreModuleV2 (IIS) | Single exe, hybrid mode: API at `/api/*` + SPA fallback to `index.html` |
| **Development** | npm + Visual Studio / VS Code | Frontend on port 3000, Backend on port 5267 |

## Domain Model

### Hierarchical Structure (Work Breakdown)
```
Organization (top-level container)
  └─ Portfolio (strategic grouping)
       └─ Programme (initiative/release)
            └─ Project (deliverable)
                 └─ TaskItem (work unit)
                      └─ SubTasks (nested work)
```

### Core Entities

| Entity | Purpose | Key Fields |
|--------|---------|-----------|
| **Organization** | Enterprise container | Top-level hierarchy |
| **Portfolio** | Strategic grouping under Organization | Groups related programmes |
| **Programme** | Initiative/release/theme | Contains projects |
| **Project** | Deliverable | StartDate, EndDate, Status, Priority, CalculatedEndDate (critical path) |
| **TaskItem** | Work unit (leaf node) | Name, Status, Priority, Assigned to User, Parent task (subtasks), Dependencies, Budget (BAC), Overhead Costs, Planned Work % |
| **User** | People (SSN-keyed) | FirstName, LastName, Roles (comma-separated), ResourceAllocations |
| **Resource** | Work or material resources | Designation, ResourceType, MaxUnits, UnitCost |
| **ResourceAllocation** | Link: User ↔ Resource | Tracks skill/capability assignments |
| **ProgrammeAllocation** | Link: Resource ↔ Programme | Programme-level resource budgeting |
| **Attachment** | Files on tasks | Weak entity, cascade delete with task |
| **Requirement** | Task requirements | Links to TaskItem |
| **Progress** | Historical snapshots | Tracks task progress over time |

### Key Relationships
- **Cascade deletions**: Organization → Portfolio → Programme → Project → TaskItem → **Attachments/Progress**
- **Soft deletions**: TaskItem subtasks (ParentTaskId), user assignments preserve referential integrity
- **Unique constraints**: User.SSN (external identity key)
- **Task dependencies**: PredecessorTaskId for critical path analysis

## Project Repositories

### Backend: `c:\Users\cyborg\TaskManagement.API` (.NET 10)
```
TaskManagement.API/
├── Controllers/                # API endpoints (CRUD, REST)
│   ├── OrganizationsController
│   ├── PortfoliosController
│   ├── ProgrammesController
│   ├── ProjectsController
│   ├── TasksController
│   ├── UsersController
│   └── ResourcesController
├── Models/                     # EF Core entities (12 models)
│   ├── Organization, Portfolio, Programme, Project, TaskItem
│   ├── User, Resource, ResourceAllocation, ProgrammeAllocation
│   ├── Attachment, Progress, Requirement
├── Data/
│   ├── AppDbContext.cs         # EF Core DbContext with all relationships
│   ├── DataSeeder.cs           # Sample data (auto-run on first start)
├── Migrations/                 # EF Core schema versions
├── Program.cs                  # Service registration, CORS, middleware
├── appsettings.json            # Connection string, logging
├── TaskManagement.API.http     # REST testing file
└── TaskManagement.API.csproj   # Project format: .NET 10
```

**Key configuration**:
- Connection string: `Server=localhost\SQLEXPRESS;Database=TaskManagementDB;Trusted_Connection=True;TrustServerCertificate=True`
- CORS policy: `http://localhost:3000` (React dev server)
- EF Core: SQL Server with automatic migrations on `app.Run()`
- Swagger: Only enabled in `IsDevelopment()`

**API Structure**:
- Base URL: `http://localhost:5267/api`
- All endpoints mapped: `/api/Organizations`, `/api/Portfolios`, `/api/Programmes`, `/api/Projects`, `/api/Tasks`, `/api/Users`, `/api/Resources`
- Default SPA fallback: `app.MapFallbackToFile("index.html")`

### Frontend: `c:\Users\cyborg\taskmanagement-ui` (React 19)
```
taskmanagement-ui/
├── src/
│   ├── pages/                  # React components (5 pages)
│   │   ├── Dashboard.js
│   │   ├── Projects.js
│   │   ├── Tasks.js
│   │   ├── TeamMembers.js
│   │   ├── Reports.js
│   ├── routes/
│   │   └── AppRoutes.js        # React Router DOM configuration
│   ├── services/
│   │   ├── api.js              # Axios client + endpoint mapping
│   │   └── localStorageApi.js  # LocalStorage fallback
│   ├── App.js
│   ├── index.js
├── public/
│   ├── index.html
│   └── manifest.json (PWA)
├── build/                      # Production bundle (created by `npm run build`)
├── package.json                # React 19, react-router-dom 7, axios, react-scripts 5
├── .git/                       # Version control
└── start-app.bat               # Launch dev server on port 3000
```

**Key configuration**:
- Dev server port: `3000`
- Backend URL: `http://localhost:5267/api`
- Builds to: `build/` (then copied to backend's `wwwroot/` for packaging)
- CRA build optimizes for production (minified, hashed assets)
- React Router maps pages to URL paths: `/`, `/projects`, `/tasks`, `/team`, `/reports`

**API Integration**:
- `api.js` maps endpoints and handles request/response normalization
- Uses endpoint aliases (`/TeamMembers` → `/Users`)
- Automatically normalizes task/project IDs between frontend and backend models

## Development Workflow

### Frontend Development (React UI Loop)
```bash
cd c:\Users\cyborg\taskmanagement-ui
npm start                    # Starts dev server on http://localhost:3000 with hot reload
npm run build               # Builds optimized bundle to `build/` folder
```

**Typical dev loop**:
1. Open browser to `http://localhost:3000`
2. Edit React components in `src/pages/` or `src/services/`
3. Save triggers hot reload (HMR)
4. Backend must be running separately on port 5267

### Backend Development (.NET API)
```bash
cd c:\Users\cyborg\TaskManagement.API
dotnet run                  # Starts API on http://localhost:5267
```

**Or from Visual Studio**:
- Open `TaskManagement.API.sln`
- Press `F5` to debug
- Swagger available at `http://localhost:5267/swagger/ui`

### Building & Packaging Distribution
**Frontend build** (creates static assets):
```bash
cd c:\Users\cyborg\taskmanagement-ui
npm run build               # Outputs to `build/` folder
# Copy `build/*` to backend's `wwwroot/`
```

**Backend publish** (creates self-contained .exe):
```bash
cd c:\Users\cyborg\TaskManagement.API
dotnet publish -c Release -r win-x64 --self-contained
# Output: bin/Release/net10.0/win-x64/publish/
```

**Packaging for handoff**:
1. Backend publish output → `TaskManagement-Handoff/app/`
2. Frontend build output → `TaskManagement-Handoff/app/wwwroot/`
3. Batch scripts start the .exe on port 5267
4. React routes handled by SPA fallback in `web.config`

### Prerequisites
- **Windows x64** (required)
- **SQL Server** with SQLEXPRESS instance running
- Connection string in `app\appsettings.json` must match your SQL Server instance

### Running the App

| Task | Command | Notes |
|------|---------|-------|
| **Start** | Double-click `start-taskmanagement.bat` | Runs API, opens browser at http://localhost:5267 |
| **Stop** | Double-click `stop-taskmanagement.bat` | Kills processes on port 5267 |
| **Terminal Start** | `cd app && .\TaskManagement.API.exe` | Manual start without browser redirect |

### First Run Behavior
On first run:
1. **Database migrations** auto-run (creates/updates schema)
2. **Sample data** seeded if database empty
3. **App** opens at `http://localhost:5267` with React UI

## Configuration

### Database Connection String

**Location**: `app\appsettings.json` → `ConnectionStrings.DefaultConnection`

**Current Default**:
```
Server=localhost\SQLEXPRESS;Database=TaskManagementDB;Trusted_Connection=True;TrustServerCertificate=True;
```

**To change SQL Server instance** (before first run):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR-SERVER\\SQLEXPRESS;Database=TaskManagementDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

**Common instance names**:
- `localhost\SQLEXPRESS` — local default
- `.\SQLEXPRESS` — current machine
- `DESKTOP-NAME\SQLEXPRESS` — named instance on this machine
- `192.168.1.100\SQLEXPRESS` — remote server

### Port Configuration

**Current port**: 5267

**To change** (in `start-taskmanagement.bat` and `app\web.config`):
- Edit `start-taskmanagement.bat` line: `set ASPNETCORE_URLS=http://localhost:5267`
- Edit `app\web.config` if changed but must restart

## Project Structure

```
TaskManagement-Handoff/
├── app/                                    # Pre-built binaries
│   ├── TaskManagement.API.exe             # Main executable (API + SPA hosts here)
│   ├── TaskManagement.API.pdb             # Debug symbols
│   ├── web.config                         # IIS config for AspNetCore hosting
│   ├── appsettings.json                   # App config (connection strings, logging)
│   ├── appsettings.Development.json       # Dev-only config
│   ├── wwwroot/                           # React frontend static assets
│   │   ├── index.html                     # Entry point
│   │   ├── manifest.json                  # PWA manifest
│   │   └── static/                        # JS/CSS bundles
│   └── *.dll                              # .NET runtime dependencies
├── start-taskmanagement.bat                # Launch script (runs .exe + opens browser)
├── stop-taskmanagement.bat                 # Kill script (stops processes on :5267)
└── INSTALL.md                              # Original setup guide
```

## Common Operations

### Check if Running
```powershell
# Check if port 5267 is listening
netstat -ano | findstr :5267
```

### View Logs
- **Logs location**: `app\logs\` (if configured)
- **Current mode**: stdout logging disabled in `web.config`
- **To enable**: Set `stdoutLogEnabled="true"` in `web.config`

### Reset Database
1. Drop or truncate tables/database in SQL Server
2. Restart app with `start-taskmanagement.bat`
3. Migrations auto-run, sample data re-seeds

### Debug Issues
- **Port conflict**: Kill process on 5267 or change port
- **Database connection fails**: Verify SQL Server is running, connection string is valid
- **Can't connect to app**: Check if port 5267 is accessible (firewall, etc.)
- **Blank page/404**: Check `wwwroot/` static assets exist

## Deployment Notes

### What's Included
✅ Pre-built executable  
✅ All runtime dependencies (.dll files)  
✅ React frontend (static)  
✅ Batch scripts for start/stop  
❌ No source code  
❌ No Node.js (not needed)  
❌ No .NET SDK required  

### Swagger/API Documentation
- **Only available** in Development mode (`appsettings.Development.json`)
- **Not available** by default (Production mode UI-only)
- To access: Modify config or run `start-taskmanagement.bat DEBUG` variant

### Requirements for Other PCs
- Windows x64
- SQL Server installed and running
- Matching SQL Server instance name (edit `appsettings.json` if needed)
- Port 5267 available (or configure new port)

## Security & Best Practices

| Consideration | Details |
|---------------|---------|
| **Connection String** | Uses Trusted_Connection (Windows Auth). Requires same domain/account. |
| **Migrations** | Auto-apply on app start. Ensure backup before first run. |
| **Sample Data** | Seeded only if DB empty. Safe to clear before deployment. |
| **Logging** | Adjust `Logging.LogLevel` in `appsettings.json` for production |
| **HTTPS** | Currently HTTP only. Add certificate if deploying externally. |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 5267 in use | Run `stop-taskmanagement.bat` or change port in batch script |
| Can't connect to SQL Server | Verify instance name in `appsettings.json`, SQL Server is running |
| Blank page after start | Check `wwwroot/` exists, browser cache cleared, port accessible |
| App crashes on start | Check logs, verify all .dll dependencies present in `app/` |
| Database locked errors | Multiple instances running on same DB. Ensure only one `.exe` process. |

## Agent Guidance

When assisting with this workspace:

1. **Assumption**: This is a **handoff/deployment package**, not a source repository
2. **Edit constraints**: No source code to modify. Only configuration files:
   - `app\appsettings.json` (connection strings, logging)
   - `start-taskmanagement.bat` (port, environment vars)
   - `stop-taskmanagement.bat` (if needed)
3. **Starting point**: Always verify SQL Server is running before troubleshooting app issues
4. **Database changes**: If user needs schema/data changes, they must edit via app UI or SQL tools (source code not available)
5. **Port/host changes**: Document in batch scripts AND `web.config` for consistency

## API & Frontend Quick Reference

### Core API Endpoints (`/api/`)
- `GET/POST /Organizations` — Top-level container
- `GET/POST /Portfolios` — Strategic groupings
- `GET/POST /Programmes` — Initiatives/releases
- `GET/POST /Projects` — Deliverables
- `GET/POST /Tasks` — Work units (TaskItem)
- `GET/POST /Users` — People (SSN-keyed) or `/TeamMembers` alias
- `GET/POST /Resources` — Material/work resources

### Frontend Pages (React Router)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Dashboard | Overview & KPIs |
| `/projects` | Projects | Project CRUD & planning |
| `/tasks` | Tasks | Task management & dependencies |
| `/team` | TeamMembers | User assignments & allocations |
| `/reports` | Reports | Analytics & progress tracking |

### Frontend-Backend Integration Notes
- **API Normalization**: Frontend's `api.js` handles ID mapping (`taskId` ↔ `taskItemId`)
- **Endpoint Aliases**: `/TeamMembers` → `/Users` transparent translation
- **CORS**: Backend allows `localhost:3000` in development
- **Fallback**: SPA fallback ensures all React routes work from root URL

## Architecture Patterns

### Hierarchical Cascade Design
- Deletion cascades: Organization → Portfolio → Programme → Project → TaskItem → Attachments
- SubTasks: ParentTaskId (NoAction cascade to avoid circular deletion)
- Progress snapshots and Requirements preserved with cascade

### Enterprise Features
- **Budget tracking**: BAC (Budget at Completion), Overhead Costs per task
- **Scheduling**: StartDate, EndDate, PredecessorTaskId (task dependencies), CalculatedEndDate
- **Resource allocation**: User assignments, skill/capability mapping, programme budgets
- **Progress tracking**: Snapshots, PlannedWork%, ProgressSnapshots collection

### Data Persistence
- EF Core Code-First migrations
- Auto-migration on app startup (`app.Run()` calls `dbContext.Database.Migrate()`)
- DataSeeder populates sample data if empty
- SSN (Social Security Number) as unique identifier for User

## Dependencies & External Services

| Service | Version | Purpose |
|---------|---------|---------|
| SQL Server SQLEXPRESS | Any | Database |
| .NET Runtime | 10.0 | Included in publish |
| Node.js (frontend dev only) | 18+ | npm dependencies |
| npm packages | See package.json | React, Router, Axios, etc. |

## Related Documentation

- [INSTALL.md](../INSTALL.md) — Original setup instructions
- SQL Server Connection Strings: [docs.microsoft.com/sql/drivers/jdbc/building-the-connection-url](https://docs.microsoft.com/sql/drivers/jdbc/building-the-connection-url)
- ASP.NET Core Configuration: [docs.microsoft.com/aspnet/core/fundamentals/configuration](https://docs.microsoft.com/aspnet/core/fundamentals/configuration)
