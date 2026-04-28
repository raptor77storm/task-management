import React from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import Login from "../pages/Login";
import FirstLogin from "../pages/FirstLogin";
import Dashboard from "../pages/Dashboard";
import Projects from "../pages/Projects";
import Tasks from "../pages/Tasks";
import TeamMembers from "../pages/TeamMembers";
import Reports from "../pages/Reports";
import ProjectTemplates from "../pages/ProjectTemplates";
import AdminDashboard from "../pages/AdminDashboard";
import Settings from "../pages/Settings";
import ProtectedRoute from "../components/ProtectedRoute";
import authService from "../services/authService";
import "../styles/AppRoutes.css";

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUserData();
  const mustChangePassword = authService.getMustChangePassword();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <>
      {authService.isAuthenticated() ? (
        <div style={{ fontFamily: "Arial, sans-serif" }}>
          <nav className="navbar">
            <div className="nav-brand">Task Management System</div>
            <div className="nav-links">
              <Link to="/" className="nav-link">Dashboard</Link>
              <Link to="/projects" className="nav-link">Projects</Link>
              <Link to="/tasks" className="nav-link">Tasks</Link>
              <Link to="/reports" className="nav-link">Reports</Link>
              {authService.isAdmin() && (
                <>
                  <Link to="/templates" className="nav-link">Templates</Link>
                  <Link to="/team" className="nav-link">Team Management</Link>
                  <Link to="/admin" className="nav-link admin-link">Admin Dashboard</Link>
                </>
              )}
              <Link to="/settings" className="nav-link">⚙️ Settings</Link>
            </div>
            <div className="nav-user">
              <span className="user-name">{user?.fullName}</span>
              {authService.isAdmin() && <span className="admin-badge">Admin</span>}
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </nav>

          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute>
                  <TeamMembers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <ProtectedRoute>
                  <ProjectTemplates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="/first-login" element={<FirstLogin />} />
          </Routes>

          {mustChangePassword && location.pathname !== "/first-login" && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2000,
              }}
            >
              <div style={{ background: "white", borderRadius: "8px", padding: "20px", width: "90%", maxWidth: "420px" }}>
                <h3 style={{ marginTop: 0 }}>Change Your Password</h3>
                <p style={{ color: "#555", fontSize: "14px" }}>
                  This is your first login. You must set a new password before using the system.
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    className="logout-btn"
                    onClick={handleLogout}
                    style={{ padding: "8px 12px" }}
                  >
                    Logout
                  </button>
                  <button
                    className="logout-btn"
                    onClick={() => navigate("/first-login")}
                    style={{ padding: "8px 12px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/first-login" element={<FirstLogin />} />
          <Route path="*" element={<Login />} />
        </Routes>
      )}
    </>
  );
}

export default AppRoutes;
