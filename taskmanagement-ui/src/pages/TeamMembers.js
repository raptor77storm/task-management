import React, { useEffect, useState } from "react";
import api from "../services/api";
import teamTypeService from "../services/teamTypeService";

const USER_COLORS = ["#FF6B6B", "#4ECDC4", "#95E1D3", "#F38181", "#AA96DA", "#FCBAD3", "#A8D8EA", "#FFD3B6"];

function TeamMembers() {
  const [users, setUsers] = useState([]);
  const [teamTypes, setTeamTypes] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [teamTypeId, setTeamTypeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createPasswordModal, setCreatePasswordModal] = useState({ show: false, user: null, tempPassword: null });

  const getUserColor = (userNumber) => USER_COLORS[(userNumber - 1) % USER_COLORS.length];

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/Users");
      setUsers(response.data);
      setError("");
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadTeamTypes = async () => {
    try {
      const types = await teamTypeService.getAllTeamTypes();
      setTeamTypes(types.length > 0 ? types : teamTypeService.getDefaultTeamTypes());
    } catch (err) {
      console.error("Error loading team types:", err);
      setTeamTypes(teamTypeService.getDefaultTeamTypes());
    }
  };

  const addUser = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert("First name and last name are required");
      return;
    }

    if (!username.trim() && !email.trim()) {
      alert("Username or email is required");
      return;
    }

    if (!teamTypeId) {
      alert("Team type is required");
      return;
    }

    try {
      const response = await api.post("/Users", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim() || null,
        email: email.trim() || null,
        teamTypeId: teamTypeId ? parseInt(teamTypeId, 10) : null,
      });

      setCreatePasswordModal({
        show: true,
        user: response.data.user,
        tempPassword: response.data.temporaryPassword,
      });

      setFirstName("");
      setLastName("");
      setUsername("");
      setEmail("");
      setTeamTypeId("");
      setError("");
      loadUsers();
    } catch (err) {
      console.error("Error adding user:", err);
      setError(err.response?.data?.message || "Failed to add user");
    }
  };

  const deleteUser = async (userNumber) => {
    if (!window.confirm("Remove this user?")) return;

    try {
      await api.delete(`/Users/${userNumber}`);
      setError("");
      loadUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user");
    }
  };

  useEffect(() => {
    loadUsers();
    loadTeamTypes();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Team Members</h1>

      {error && <div style={{ color: "red", marginBottom: "10px", padding: "10px", background: "#fff3f3", borderRadius: "4px" }}>{error}</div>}

      <div style={{ marginBottom: "20px", padding: "15px", background: "#f5f5f5", borderRadius: "4px" }}>
        <h3>Add New User</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={{ display: "block", width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={{ display: "block", width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
          />
        </div>
        <input
          type="text"
          placeholder="Username (login)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ display: "block", width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ddd" }}
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ddd" }}
        />
        <select
          value={teamTypeId}
          onChange={(e) => setTeamTypeId(e.target.value)}
          style={{ display: "block", width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ddd" }}
        >
          <option value="">Select Team Role</option>
          {teamTypes.map((type) => (
            <option key={type.teamTypeId} value={type.teamTypeId}>
              {type.name}
            </option>
          ))}
        </select>
        <button
          onClick={addUser}
          style={{
            padding: "8px 16px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Add User
        </button>
      </div>

      {loading ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <p>No users yet. Add one above.</p>
      ) : (
        <div>
          <h3>Current Team ({users.length})</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "15px" }}>
            {users.map((user) => (
              <div
                key={user.userNumber}
                style={{
                  padding: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  borderLeft: `4px solid ${getUserColor(user.userNumber)}`,
                  background: "#fff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <h4 style={{ margin: "0 0 8px 0", color: getUserColor(user.userNumber) }}>{user.fullName}</h4>
                    <p style={{ margin: "4px 0", color: "#666", fontSize: "12px" }}>Username: {user.username}</p>
                    <p style={{ margin: "4px 0", color: "#666", fontSize: "12px" }}>Team Role: {teamTypes.find((t) => t.teamTypeId === user.teamTypeId)?.name || "-"}</p>
                  </div>
                  <button
                    onClick={() => deleteUser(user.userNumber)}
                    style={{
                      padding: "4px 8px",
                      background: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {createPasswordModal.show && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{ background: "white", borderRadius: "8px", padding: "20px", width: "90%", maxWidth: "420px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h3 style={{ margin: 0 }}>New Member Login</h3>
              <button
                onClick={() => setCreatePasswordModal({ show: false, user: null, tempPassword: null })}
                style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#999" }}
              >
                x
              </button>
            </div>
            <p style={{ marginTop: 0 }}>Share these credentials with the new member:</p>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ fontSize: "12px", color: "#666" }}>Username</label>
              <div style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "6px" }}>
                <code>{createPasswordModal.user?.username}</code>
              </div>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ fontSize: "12px", color: "#666" }}>Temporary Password</label>
              <div style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <code>{createPasswordModal.tempPassword}</code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(createPasswordModal.tempPassword || "")}
                  style={{ padding: "6px 10px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                >
                  Copy
                </button>
              </div>
            </div>
            <p style={{ fontSize: "12px", color: "#666" }}>They will be asked to change the password on first login.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamMembers;
