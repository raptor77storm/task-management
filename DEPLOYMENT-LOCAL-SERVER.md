# Local Server/VM Deployment Guide

This guide explains how to deploy the Task Management application on a local server or VM with a fixed IP address, allowing end users to connect via the same network.

## Architecture Overview

- **Frontend**: React application served from the backend's `wwwroot/` folder
- **Backend**: ASP.NET Core API on a fixed network IP
- **Network**: Both frontend and backend run on the same machine, accessed via local IP
- **Database**: SQL Server (local or network accessible)

## Prerequisites

- Windows Server or VM with a static/fixed IP address
- SQL Server instance running (local or networked)
- .NET Runtime 10.0 (included in the distributed executable)
- Port 5267 available (or change in configuration)

## Step 1: Determine Your Server's Fixed IP

### On Windows Server/VM:
```powershell
ipconfig
```

Look for IPv4 Address (e.g., `192.168.1.100` or `10.0.0.50`)

Make this IP static in Windows:
- Control Panel → Network & Internet → Network Connections
- Right-click your adapter → Properties
- IPv4 Properties → Use static IP

## Step 2: Configure the Backend (First Time Only)

### Update Connection String
Edit `app/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=TaskManagementDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

**For remote SQL Server:**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=192.168.1.50\\SQLEXPRESS;Database=TaskManagementDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

### Allow Network IP Binding
Edit `app/web.config`:

```xml
<aspNetCore processPath=".\TaskManagement.API.exe" 
           arguments="" 
           stdoutLogEnabled="false" 
           stdoutLogFile=".\logs\stdout" />
```

Ensure binding to all network interfaces (this should be handled by the application).

## Step 3: Start the Application

### Method 1: Using Batch Script (Recommended)
```batch
cd c:\Users\cyborg\TaskManagement-Handoff
start-taskmanagement.bat
```

This will:
- Start the API on `http://YOUR-SERVER-IP:5267`
- Open the browser to the application

### Method 2: Manual Start
```powershell
cd c:\Users\cyborg\TaskManagement-Handoff\app
.\TaskManagement.API.exe
```

The application will be available at:
- **http://YOUR-SERVER-IP:5267** (main application)
- **http://YOUR-SERVER-IP:5267/api** (API endpoints)

## Step 4: Connect from Client Machines

### On Client Machine (Windows, Mac, Linux):

1. **Open Browser** and navigate to:
   ```
   http://192.168.1.100:5267
   ```
   (Replace `192.168.1.100` with your actual server IP)

2. **Login** with default credentials:
   - Username: `admin`
   - Password: `admin`
   - Change password on first login

3. **For Non-Admin Users:**
   - Go to ⚙️ Settings (visible only to admins)
   - If API connection fails, verify:
     - Server IP is correct
     - Port 5267 is open (check firewall)
     - Backend is running

### Automatic API Configuration

The frontend automatically detects the backend:

1. **In Production Mode:**
   - Uses the hostname from the URL
   - Assumes backend runs on port 5267 (configurable)
   - Example: If you visit `http://192.168.1.100:5267`, the API is auto-detected as `http://192.168.1.100:5267/api`

2. **Manual Configuration (if needed):**
   - Visit ⚙️ Settings (admin only)
   - Enter custom API URL: `http://192.168.1.100:5267/api`
   - Click "Test Connection" to verify
   - Settings are saved in browser localStorage

## Step 5: Configure Firewall Rules

### Windows Firewall

Allow inbound traffic on port 5267:

```powershell
# PowerShell (as Administrator)
New-NetFirewallRule -DisplayName "Task Management API" `
  -Direction Inbound -Protocol TCP -LocalPort 5267 -Action Allow
```

Or manually:
1. Windows Defender Firewall → Allow an app
2. Click "Allow another app"
3. Browse to `TaskManagement.API.exe`
4. Ensure it's checked for Private and/or Public networks

## Step 6: Database Migrations (Automatic)

On first run, migrations auto-apply:
1. Application starts
2. Checks database schema
3. Applies any pending migrations
4. Seeds sample data if empty

**No manual action needed** - just start the app!

## Network Accessibility Checklist

- [ ] Backend running on fixed server IP
- [ ] Port 5267 open on firewall
- [ ] SQL Server accessible from server (local or network)
- [ ] Client machines can ping server IP
- [ ] Client browser can access `http://SERVER-IP:5267`
- [ ] Admin users can access Settings page
- [ ] Connection test passes in Settings

## Troubleshooting

### Can't Connect to Application

1. **Check if backend is running:**
   ```powershell
   netstat -ano | findstr :5267
   ```

2. **Test server connectivity from client:**
   ```cmd
   ping 192.168.1.100
   telnet 192.168.1.100 5267
   ```

3. **Check Windows Firewall:**
   - Advanced Settings → Inbound Rules
   - Verify port 5267 is allowed

4. **Review application logs:**
   - `app/logs/` directory (if logging enabled)

### Database Connection Failed

1. **Check SQL Server is running:**
   ```powershell
   Get-Service | Where-Object {$_.Name -like "*SQL*"}
   ```

2. **Update connection string in `appsettings.json`**

3. **Verify instance name:** `sqlcmd -L`

4. **Restart backend after changing connection string**

### API Connection Error in UI

1. Open ⚙️ Settings (admin only)
2. Verify API URL matches your server: `http://192.168.1.100:5267/api`
3. Click "Test Connection"
4. If fails, check:
   - Server IP is accessible from client
   - Port 5267 is reachable
   - Backend CORS is configured

## Advanced Configuration

### Custom Port (if 5267 is unavailable)

1. Edit `start-taskmanagement.bat`:
   ```batch
   set ASPNETCORE_URLS=http://localhost:6000
   ```

2. Edit `app/web.config` (update binding port)

3. Update firewall rules to new port

4. Clients will auto-detect using browser URL

### Enable HTTPS

1. Generate or obtain SSL certificate
2. Configure in `web.config`
3. Update frontend to use `https://` URLs
4. Ensure port 443 is open on firewall

### Running as Windows Service

For permanent deployment, configure as Windows Service:

```powershell
# Install as service
sc.exe create "TaskManagementAPI" `
  binPath= "C:\Users\cyborg\TaskManagement-Handoff\app\TaskManagement.API.exe"

# Start service
net start TaskManagementAPI
```

## Security Recommendations

- [ ] Change default admin password immediately
- [ ] Use strong passwords for all accounts
- [ ] Restrict network access to required users
- [ ] Enable CORS only for known client IPs
- [ ] Run on HTTPS for sensitive deployments
- [ ] Regular database backups
- [ ] Monitor application logs
- [ ] Keep Windows/SQL Server updated

## Client Deployment Methods

### Method 1: Direct URL
Users simply open browser and visit: `http://SERVER-IP:5267`

### Method 2: Create Desktop Shortcut
Create `.url` file on desktop:
```ini
[InternetShortcut]
URL=http://192.168.1.100:5267
```

### Method 3: Local Network Broadcast
In `appsettings.json` enable service discovery (future enhancement)

## Support & Documentation

- **Backend API Docs**: `http://SERVER-IP:5267/swagger` (development mode only)
- **Settings Page**: Accessible to admins at ⚙️ Settings route
- **Test Connection**: Use the built-in connection test in Settings

## Performance Tips

- Use fixed IP (not hostname) for faster resolution
- Ensure network latency < 100ms for best UX
- Monitor database query performance in Reports
- Clear browser cache if UI seems stale
- Use modern browsers (Chrome, Edge, Firefox)

---

**For detailed app features, see**: [INSTALL.md](../INSTALL.md)
