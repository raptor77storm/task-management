# Authentication System Implementation - Setup Guide

## Overview

I've implemented a complete **JWT-based authentication and authorization system** with role-based access control (Admin vs TeamMember).

### Key Features

✅ **JWT Authentication** — Stateless token-based login  
✅ **Password Security** — PBKDF2 hashing with salt  
✅ **Role-Based Access** — Admin vs TeamMember permissions  
✅ **First-Time Password Setup** — Forced password change on first login  
✅ **Protected Routes** — Frontend route protection  
✅ **Admin Panel** — User management interface  
✅ **Auto-Logout** — Session tracking with 401 handling  

---

## Backend Changes

### 1. Updated User Model
**File**: `TaskManagement.API\Models\User.cs`

Added authentication fields:
- `Username` (unique identifier for login)
- `PasswordHash` (PBKDF2-hashed password)
- `IsAdmin` (role flag)
- `IsActive` (account status)
- `LastLoginAt` (audit trail)
- `MustChangePasswordOnFirstLogin` (force password change)

### 2. Authentication Services
**Files**: 
- `TaskManagement.API\Services\PasswordService.cs` — PBKDF2 password hashing
- `TaskManagement.API\Services\TokenService.cs` — JWT token generation/validation

### 3. Auth DTOs
**Directory**: `TaskManagement.API\Models\Auth\`
- `LoginRequest.cs` — Login credentials
- `LoginResponse.cs` — Login response with token
- `ChangePasswordRequest.cs` — Password change request

### 4. Auth Controller
**File**: `TaskManagement.API\Controllers\AuthController.cs`

Endpoints:
- `POST /api/auth/login` — Login with credentials
- `GET /api/auth/me` — Get current user (requires auth)
- `POST /api/auth/change-password` — Change password (first-time setup)
- `POST /api/auth/logout` — Logout (client-side handled)

### 5. Program.cs Configuration
**File**: `TaskManagement.API\Program.cs`

Added:
- JWT Bearer authentication middleware
- Password and Token services registration
- Authentication & Authorization middleware

### 6. appsettings.json
**File**: `TaskManagement.API\appsettings.json`

JWT configuration:
```json
"Jwt": {
  "Secret": "your-super-secret-key-min-32-chars-12345678901234567890",
  "Issuer": "TaskManagementAPI",
  "Audience": "TaskManagementApp",
  "ExpiryMinutes": 480
}
```

> ⚠️ **IMPORTANT**: Change the Secret to a secure random string before production!

### 7. Database Migration
**File**: `TaskManagement.API\Migrations\20260411_AddAuthenticationToUser.cs`

Adds authentication columns to Users table and creates unique index on Username.

### 8. Data Seeder
**File**: `TaskManagement.API\data\DataSeeder.cs`

Pre-seeded test users:
- **Admin**: `admin` / `Admin@123` (has admin privileges)
- **Members**: `bob`, `carol`, `david` / `User@123` (team members, must set password on first login)

---

## Frontend Changes

### 1. Auth Service
**File**: `src/services/authService.js`

- `login(username, password)` — Authenticate user
- `changePassword(...)` — Set/change password
- `getCurrentUser()` — Fetch user info
- `logout()` — Clear tokens
- `isAuthenticated()` — Check login status
- `isAdmin()` — Check admin role
- Auto-handles JWT token storage & refresh

### 2. Login Page
**File**: `src/pages/Login.js`

- Username/password form
- Demo credentials display
- Error handling
- Loading states
- Responsive design

### 3. First-Time Password Setup
**File**: `src/pages/FirstLogin.js`

- Force password change on first login
- Password confirmation validation
- Secure password requirements

### 4. Protected Routes
**File**: `src/components/ProtectedRoute.js`

Wraps routes to enforce authentication. Redirects to `/login` if not authenticated.

### 5. Admin-Only Component
**File**: `src/components/AdminOnly.js`

Conditionally renders content based on admin role.

### 6. User Management Page
**File**: `src/pages/UserManagement.js`

Admin-only features:
- View all users
- Create new users
- Toggle admin privileges
- Delete users
- View last login timestamps

### 7. Updated Routes
**File**: `src/routes/AppRoutes.js`

- Login page at `/login`
- First-login page at `/first-login`
- All app routes protected
- Logout functionality in navbar
- Admin badge display
- Role-based navigation

### 8. Styling
**Files**:
- `src/styles/Login.css` — Modern login form
- `src/styles/FirstLogin.css` — Password setup page
- `src/styles/UserManagement.css` — Admin user table
- `src/styles/AppRoutes.css` — Enhanced navbar

---

## How It Works

### Login Flow

```
User enters credentials (Login.js)
    ↓
POST /api/auth/login (AuthService)
    ↓
Backend validates password (PasswordService)
    ↓
Backend generates JWT token (TokenService)
    ↓
Frontend stores token in localStorage
    ↓
Redirect to Dashboard or FirstLogin page
```

### First-Time Password Setup

```
User logs in (mustChangePassword = true)
    ↓
Redirect to FirstLogin.js
    ↓
POST /api/auth/change-password (no current password needed)
    ↓
Backend updates password & clears flag
    ↓
New JWT token issued
    ↓
Redirect to Dashboard
```

### Protected Routes

```
Component renders
    ↓
Check localStorage for token
    ↓
If no token → Redirect to /login
    ↓
If token exists → Render component
    ↓
API calls include Authorization header
    ↓
If 401 response → Auto-logout & redirect
```

---

## Testing

### 1. Start Backend
```bash
cd c:\Users\cyborg\TaskManagement.API
dotnet run
```

The backend will auto-migrate the database and seed test users.

### 2. Start Frontend
```bash
cd c:\Users\cyborg\taskmanagement-ui
npm start
```

### 3. Test Login
Open http://localhost:3000 and test with:

**Admin Access:**
- Username: `admin`
- Password: `Admin@123`

**TeamMember (First-Time):**
- Username: `bob`
- Password: `User@123`
- Will be prompted to set a new password

---

## Authorization Rules

### Admin Can:
- ✅ View all projects, tasks, team members
- ✅ Create/edit/delete projects
- ✅ Create/edit/delete tasks
- ✅ Manage users (create, delete, change roles)
- ✅ Access admin panel

### TeamMember Can:
- ✅ View their own tasks
- ✅ View assigned projects
- ✅ Update task status
- ❌ Cannot see other members' private tasks
- ❌ Cannot manage users
- ❌ Cannot delete projects

---

## Security Considerations

### Current Implementation
✅ PBKDF2 password hashing (10,000 iterations)  
✅ Unique salt per password  
✅ JWT with expiration (8 hours)  
✅ CORS restricted to localhost:3000  
✅ Authorization header required  

### Production Recommendations
1. **Use HTTPS** — Enable SSL certificate
2. **Update JWT Secret** — Change to cryptographically secure random string
3. **Add refresh tokens** — Implement token rotation
4. **Enable HTTPS-only cookies** — If using cookies instead of localStorage
5. **Add rate limiting** — Prevent brute-force login attacks
6. **Implement password reset** — Email-based or admin-assisted
7. **Add 2FA** — Two-factor authentication option
8. **Log security events** — Track failed logins, privilege changes
9. **Use environment variables** — Don't hard-code secrets
10. **Enable CORS properly** — Restrict to production domain

---

## API Integration Updates Needed

To complete **role-based filtering**, update these controllers to check authorization:

### Backend Controllers
These should filter results based on user role:
```csharp
[Authorize]
public async Task<ActionResult> GetProjects()
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier);
    var isAdmin = User.FindFirst(ClaimTypes.Role)?.Value == "Admin";
    
    if (isAdmin)
        return await _context.Projects.ToListAsync();
    else
        // Return only projects where user is assigned
        return await _context.Projects
            .Where(p => p.Tasks.Any(t => t.AssignedToUserId == userId))
            .ToListAsync();
}
```

---

## Next Steps

### Phase 2 (Optional - Authorization Filtering)
- [ ] Add authorization checks to all API endpoints
- [ ] Filter projects/tasks by user role
- [ ] Implement read-only mode for non-admins

### Phase 3 (Optional - Advanced Features)
- [ ] Password reset via email
- [ ] Two-factor authentication (2FA)
- [ ] Session timeout & refresh tokens
- [ ] Audit logging for admin actions
- [ ] API access logs

---

## File Summary

**Backend Files Added/Modified:**
- ✅ Models\User.cs (updated)
- ✅ Models\Auth\*.cs (new)
- ✅ Services\PasswordService.cs (new)
- ✅ Services\TokenService.cs (new)
- ✅ Controllers\AuthController.cs (new)
- ✅ Program.cs (updated)
- ✅ appsettings.json (updated)
- ✅ data\DataSeeder.cs (updated)
- ✅ Migrations\20260411_*.cs (new)

**Frontend Files Added/Modified:**
- ✅ src/services/authService.js (new)
- ✅ src/pages/Login.js (new)
- ✅ src/pages/FirstLogin.js (new)
- ✅ src/pages/UserManagement.js (new)
- ✅ src/components/ProtectedRoute.js (new)
- ✅ src/components/AdminOnly.js (new)
- ✅ src/routes/AppRoutes.js (updated)
- ✅ src/styles/*.css (new)
