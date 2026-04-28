// src/pages/Settings.js
import React, { useEffect, useState } from "react";
import api from "../services/api";
import authService from "../services/authService";

const fieldStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #ddd",
  borderRadius: "6px",
  fontSize: "14px",
  boxSizing: "border-box",
};

const sectionStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "20px",
};

function Settings() {
  const isAdmin = authService.isAdmin();
  const [activeTab, setActiveTab] = useState(isAdmin ? "email" : "profile");
  const [profile, setProfile] = useState({
    fullName: "",
    username: "",
    email: "",
  });
  const [preferences, setPreferences] = useState({
    taskAssignedEmail: true,
    taskCompletedEmail: true,
    taskDueSoonEmail: true,
    taskStatusChangeEmail: true,
    dailyDigestEmail: false,
    digestTime: "09:00",
  });
  const [emailConfig, setEmailConfig] = useState({
    smtpServer: "smtp.gmail.com",
    smtpPort: 587,
    senderEmail: "",
    senderName: "Task Management System",
    adminEmail: "",
    senderPassword: "",
    passwordConfigured: false,
  });
  const [companyInfo, setCompanyInfo] = useState({ name: "", description: "" });
  const [restorePath, setRestorePath] = useState("");
  const [backupResult, setBackupResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationPage, setNotificationPage] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
    loadPreferences();
    if (isAdmin) {
      loadEmailConfiguration();
      loadCompanyInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      loadNotificationHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, notificationPage]);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 5000);
  };

  const getErrorMessage = (error, fallback) => error.response?.data?.message || error.message || fallback;

  const loadProfile = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setProfile({
          fullName: user.fullName || "",
          username: user.username || "",
          email: user.email || "",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await api.get("/Notifications/Preferences");
      setPreferences(response.data);
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailConfiguration = async () => {
    try {
      const response = await api.get("/AdminSettings/email");
      setEmailConfig({ ...response.data, senderPassword: "" });
    } catch (error) {
      console.error("Error loading email configuration:", error);
    }
  };

  const loadCompanyInfo = async () => {
    try {
      const response = await api.get("/AdminSettings/company");
      setCompanyInfo(response.data);
    } catch (error) {
      console.error("Error loading company info:", error);
    }
  };

  const loadNotificationHistory = async () => {
    try {
      const response = await api.get(`/Notifications/History?skip=${notificationPage * 20}&take=20`);
      setNotifications(response.data);
    } catch (error) {
      console.error("Error loading notification history:", error);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      await api.put("/Notifications/Preferences", preferences);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert("Error saving preferences: " + getErrorMessage(error, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfileEmail = async () => {
    try {
      setSaving(true);
      const result = await authService.updateCurrentUserEmail(profile.email);
      if (!result.success) {
        alert("Error saving email: " + result.message);
        return;
      }

      setProfile({
        fullName: result.data.fullName || "",
        username: result.data.username || "",
        email: result.data.email || "",
      });
      showMessage("Your email address was saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmailConfiguration = async () => {
    try {
      setSaving(true);
      await api.put("/AdminSettings/email", emailConfig);
      await loadEmailConfiguration();
      showMessage("Email configuration saved.");
    } catch (error) {
      alert("Error saving email configuration: " + getErrorMessage(error, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      setSaving(true);
      const response = await api.post("/AdminSettings/email/test");
      showMessage(response.data?.message || "Test email sent.");
    } catch (error) {
      alert("Error sending test email: " + getErrorMessage(error, "Test email failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleBackupData = async () => {
    try {
      setSaving(true);
      const response = await api.post("/AdminSettings/backup");
      setBackupResult(response.data);
      showMessage("Database backup created.");
    } catch (error) {
      alert("Error creating backup: " + getErrorMessage(error, "Backup failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreData = async () => {
    if (!restorePath.trim()) {
      alert("Enter the backup file path first.");
      return;
    }

    if (!window.confirm("Restore will replace the current database. Continue?")) return;

    try {
      setSaving(true);
      const response = await api.post("/AdminSettings/restore", { backupPath: restorePath });
      showMessage(response.data?.message || "Database restored. Restart the application.");
    } catch (error) {
      alert("Error restoring backup: " + getErrorMessage(error, "Restore failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompanyInfo = async () => {
    try {
      setSaving(true);
      await api.put("/AdminSettings/company", companyInfo);
      showMessage("Company info saved.");
    } catch (error) {
      alert("Error saving company info: " + getErrorMessage(error, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNotification = async (logId) => {
    if (!window.confirm("Delete this notification?")) return;
    try {
      await api.delete(`/Notifications/${logId}`);
      loadNotificationHistory();
    } catch (error) {
      alert("Error deleting notification: " + getErrorMessage(error, "Delete failed"));
    }
  };

  const togglePreference = (key) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  const renderTabButton = (tab, label) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={{
        padding: "12px 16px",
        border: "none",
        background: activeTab === tab ? "#0056b3" : "#f2f4f7",
        color: activeTab === tab ? "white" : "#333",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "600",
      }}
    >
      {label}
    </button>
  );

  if (loading) return <div style={{ padding: "20px" }}>Loading settings...</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "20px" }}>Settings</h1>

      {message && (
        <div style={{ background: "#d4edda", color: "#155724", padding: "12px", borderRadius: "6px", marginBottom: "20px", fontSize: "14px" }}>
          {message}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "24px" }}>
        {isAdmin && renderTabButton("email", "Configuration Email")}
        {isAdmin && renderTabButton("backup", "Backup Data")}
        {isAdmin && renderTabButton("restore", "Restore")}
        {isAdmin && renderTabButton("company", "Company Info")}
        {renderTabButton("profile", "My Email")}
        {renderTabButton("notifications", "Notification Preferences")}
        {renderTabButton("history", "Notification History")}
      </div>

      {isAdmin && activeTab === "email" && (
        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>Configuration Email</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <label>
              SMTP Server
              <input
                value={emailConfig.smtpServer}
                onChange={(e) => setEmailConfig({ ...emailConfig, smtpServer: e.target.value })}
                style={fieldStyle}
              />
            </label>
            <label>
              SMTP Port
              <input
                type="number"
                value={emailConfig.smtpPort}
                onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: parseInt(e.target.value, 10) || 587 })}
                style={fieldStyle}
              />
            </label>
            <label>
              Sender Email
              <input
                value={emailConfig.senderEmail}
                onChange={(e) => setEmailConfig({ ...emailConfig, senderEmail: e.target.value })}
                style={fieldStyle}
              />
            </label>
            <label>
              Sender Name
              <input
                value={emailConfig.senderName}
                onChange={(e) => setEmailConfig({ ...emailConfig, senderName: e.target.value })}
                style={fieldStyle}
              />
            </label>
            <label>
              Sender Password
              <input
                type="password"
                value={emailConfig.senderPassword}
                placeholder={emailConfig.passwordConfigured ? "Password already configured" : "SMTP password or app password"}
                onChange={(e) => setEmailConfig({ ...emailConfig, senderPassword: e.target.value })}
                style={fieldStyle}
              />
            </label>
            <label>
              Admin Email
              <input
                value={emailConfig.adminEmail}
                onChange={(e) => setEmailConfig({ ...emailConfig, adminEmail: e.target.value })}
                style={fieldStyle}
              />
            </label>
          </div>
          <p style={{ color: "#666", fontSize: "13px" }}>
            For Gmail, use an app password. Leaving Sender Password blank keeps the existing saved password.
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleSaveEmailConfiguration} disabled={saving} style={{ padding: "10px 18px", borderRadius: "6px", border: "none", background: "#007bff", color: "white", cursor: "pointer" }}>
              Save Email Configuration
            </button>
            <button onClick={handleSendTestEmail} disabled={saving} style={{ padding: "10px 18px", borderRadius: "6px", border: "1px solid #007bff", background: "white", color: "#007bff", cursor: "pointer" }}>
              Send Test Email
            </button>
          </div>
        </div>
      )}

      {isAdmin && activeTab === "backup" && (
        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>Backup Data</h2>
          <p>Create a SQL Server backup file for the current database.</p>
          <button onClick={handleBackupData} disabled={saving} style={{ padding: "10px 18px", borderRadius: "6px", border: "none", background: "#007bff", color: "white", cursor: "pointer" }}>
            Create Backup
          </button>
          {backupResult && (
            <div style={{ marginTop: "16px", padding: "12px", background: "#f2f4f7", borderRadius: "6px" }}>
              <div><strong>File:</strong> {backupResult.fileName}</div>
              <div><strong>Path:</strong> {backupResult.path}</div>
            </div>
          )}
        </div>
      )}

      {isAdmin && activeTab === "restore" && (
        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>Restore</h2>
          <p>Restore replaces the current database with a SQL Server backup file. Restart the application after restore.</p>
          <label>
            Backup File Path
            <input
              value={restorePath}
              onChange={(e) => setRestorePath(e.target.value)}
              placeholder="C:\\Program Files\\Microsoft SQL Server\\...\\Backup\\TaskManagementDB_20260412_120000.bak"
              style={fieldStyle}
            />
          </label>
          <button onClick={handleRestoreData} disabled={saving} style={{ marginTop: "12px", padding: "10px 18px", borderRadius: "6px", border: "none", background: "#dc3545", color: "white", cursor: "pointer" }}>
            Restore Backup
          </button>
        </div>
      )}

      {isAdmin && activeTab === "company" && (
        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>Company Info</h2>
          <div style={{ display: "grid", gap: "16px" }}>
            <label>
              Company Name
              <input
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                style={fieldStyle}
              />
            </label>
            <label>
              Description
              <textarea
                value={companyInfo.description || ""}
                onChange={(e) => setCompanyInfo({ ...companyInfo, description: e.target.value })}
                style={{ ...fieldStyle, minHeight: "100px" }}
              />
            </label>
          </div>
          <button onClick={handleSaveCompanyInfo} disabled={saving} style={{ marginTop: "12px", padding: "10px 18px", borderRadius: "6px", border: "none", background: "#007bff", color: "white", cursor: "pointer" }}>
            Save Company Info
          </button>
        </div>
      )}

      {activeTab === "profile" && (
        <div style={{ ...sectionStyle, maxWidth: "650px" }}>
          <h2 style={{ marginTop: 0 }}>My Email</h2>
          <p style={{ color: "#555", fontSize: "14px" }}>
            This email is included when your task status changes or task notes are mailed to the admin.
          </p>
          <div style={{ display: "grid", gap: "16px" }}>
            <label>
              Name
              <input value={profile.fullName} disabled style={{ ...fieldStyle, background: "#f2f4f7" }} />
            </label>
            <label>
              Username
              <input value={profile.username} disabled style={{ ...fieldStyle, background: "#f2f4f7" }} />
            </label>
            <label>
              Email Address
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="name@company.com"
                style={fieldStyle}
              />
            </label>
          </div>
          <button onClick={handleSaveProfileEmail} disabled={saving} style={{ marginTop: "12px", padding: "10px 18px", borderRadius: "6px", border: "none", background: "#007bff", color: "white", cursor: "pointer" }}>
            Save My Email
          </button>

        </div>
      )}

      {activeTab === "notifications" && (
        <div style={{ ...sectionStyle, maxWidth: "650px" }}>
          <h2 style={{ marginTop: 0 }}>Notification Preferences</h2>
          {saved && (
            <div style={{ background: "#d4edda", color: "#155724", padding: "12px", borderRadius: "4px", marginBottom: "20px", fontSize: "14px" }}>
              Preferences saved successfully.
            </div>
          )}

          {[
            ["taskAssignedEmail", "Task Assigned", "Receive an email when a task is assigned to you"],
            ["taskCompletedEmail", "Task Completed", "Receive an email when an assigned task is completed"],
            ["taskDueSoonEmail", "Task Due Soon", "Receive a reminder when your tasks are due in 2 days or less"],
            ["taskStatusChangeEmail", "Task Status Changes", "Receive an email when task status changes"],
            ["dailyDigestEmail", "Daily Digest", "Receive a daily summary of all task activities"],
          ].map(([key, title, detail]) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", marginBottom: "18px" }}>
              <input
                type="checkbox"
                checked={preferences[key]}
                onChange={() => togglePreference(key)}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <div>
                <strong>{title}</strong>
                <p style={{ margin: "4px 0 0 0", color: "#666", fontSize: "12px" }}>{detail}</p>
              </div>
            </label>
          ))}

          {preferences.dailyDigestEmail && (
            <label style={{ display: "block", marginBottom: "20px" }}>
              Digest Time
              <input
                type="time"
                value={preferences.digestTime}
                onChange={(e) => setPreferences({ ...preferences, digestTime: e.target.value })}
                style={{ ...fieldStyle, maxWidth: "180px" }}
              />
            </label>
          )}

          <button onClick={handleSavePreferences} disabled={saving} style={{ padding: "10px 18px", borderRadius: "6px", border: "none", background: "#007bff", color: "white", cursor: "pointer" }}>
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      )}

      {activeTab === "history" && (
        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>Notification History</h2>
          {notifications.length === 0 ? (
            <p style={{ color: "#666" }}>No notifications to display.</p>
          ) : (
            <div>
              {notifications.map((notif) => (
                <div key={notif.logId} style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "15px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: notif.status === "Sent" ? "#f9f9f9" : "#fff3cd" }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: "14px" }}>{notif.subject}</strong>
                    <span style={{ marginLeft: "10px", fontSize: "11px", padding: "3px 8px", borderRadius: "3px", background: notif.status === "Sent" ? "#d4edda" : "#fff3cd", color: notif.status === "Sent" ? "#155724" : "#856404" }}>
                      {notif.status}
                    </span>
                    <p style={{ margin: "6px 0 0 0", color: "#666", fontSize: "12px" }}>
                      {notif.status === "Failed" ? "Failed to send" : `Sent on ${new Date(notif.sentAt).toLocaleString()}`}
                    </p>
                    {notif.recipientEmail && (
                      <p style={{ margin: "4px 0 0 0", color: "#666", fontSize: "12px" }}>
                        To: {notif.recipientEmail}
                      </p>
                    )}
                    {notif.relatedTaskName && <p style={{ margin: "4px 0 0 0", color: "#999", fontSize: "12px" }}>Task: <strong>{notif.relatedTaskName}</strong></p>}
                    {notif.status === "Failed" && notif.errorMessage && (
                      <p style={{ margin: "6px 0 0 0", color: "#b45309", fontSize: "12px" }}>
                        Error: {notif.errorMessage}
                      </p>
                    )}
                  </div>
                  <button onClick={() => handleDeleteNotification(notif.logId)} style={{ padding: "6px 12px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", marginLeft: "10px" }}>
                    Delete
                  </button>
                </div>
              ))}

              <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "center" }}>
                <button onClick={() => setNotificationPage(Math.max(0, notificationPage - 1))} disabled={notificationPage === 0} style={{ padding: "8px 16px", background: notificationPage === 0 ? "#ccc" : "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: notificationPage === 0 ? "not-allowed" : "pointer", fontSize: "12px" }}>
                  Previous
                </button>
                <button onClick={() => setNotificationPage(notificationPage + 1)} disabled={notifications.length < 20} style={{ padding: "8px 16px", background: notifications.length < 20 ? "#ccc" : "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: notifications.length < 20 ? "not-allowed" : "pointer", fontSize: "12px" }}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Settings;
