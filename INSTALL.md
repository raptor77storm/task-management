# Task Management Handoff Package

## What is included

- `app\TaskManagement.API.exe`: Windows executable that hosts the API and the React frontend together
- `start-taskmanagement.bat`: starts the app and opens the browser
- `stop-taskmanagement.bat`: stops the local app process
- `app\appsettings.json`: SQL Server connection string used by the app

## Requirements on the other PC

- Windows x64
- SQL Server installed and running
- The SQL Server instance in `app\appsettings.json` must be valid on that PC

Current connection string:

```json
"DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=TaskManagementDB;Trusted_Connection=True;TrustServerCertificate=True;"
```

If the other PC uses a different instance name, edit `app\appsettings.json` before first run.
Examples:

- `Server=localhost\\SQLEXPRESS;...`
- `Server=.\\SQLEXPRESS;...`
- `Server=localhost;...`
- `Server=DESKTOP-NAME\\SQLEXPRESS;...`

## First run

1. Make sure SQL Server is running.
2. If needed, edit `app\appsettings.json`.
3. Double-click `start-taskmanagement.bat`.
4. The app will open at `http://localhost:5267`.

On first run the app will:

- create/update the database schema with EF migrations
- seed sample data if the database is empty

## Notes

- You do not need Node.js to run this package.
- You do not need to start the React frontend separately.
- Swagger is only available in Development mode, so this package is meant for normal app use at the root URL.
- If port `5267` is already in use, close the conflicting app first or change the port in `start-taskmanagement.bat`.
