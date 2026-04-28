import React, { useEffect, useState } from "react";
import api from "../services/api";
import authService from "../services/authService";

const getApiErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.response?.data || fallback;

function Projects() {
  const isAdmin = authService.isAdmin();
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editProject, setEditProject] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("Not Started");
  const [errorMessage, setErrorMessage] = useState("");

  const loadProjects = async () => {
    try {
      const response = await api.get("/Projects");
      setProjects(response.data);
    } catch (error) {
      console.error("Error loading projects:", error);
      setErrorMessage(getApiErrorMessage(error, "Could not load projects."));
    }
  };

  const addProject = async () => {
    if (!name.trim()) {
      alert("Project name is required");
      return;
    }

    try {
      await api.post("/Projects", {
        name,
        description,
        startDate: "2026-04-08T00:00:00",
        endDate: "2026-06-30T00:00:00",
        status: "Not Started",
      });

      setName("");
      setDescription("");
      setErrorMessage("");
      loadProjects();
    } catch (error) {
      console.error("Error adding project:", error);
      setErrorMessage(getApiErrorMessage(error, "Could not add project."));
    }
  };

  const beginEdit = (project) => {
    setEditProject(project);
    setEditName(project.name ?? "");
    setEditDescription(project.description ?? "");
    setEditStatus(project.status ?? "Not Started");
    setErrorMessage("");
  };

  const cancelEdit = () => {
    setEditProject(null);
    setEditName("");
    setEditDescription("");
    setEditStatus("Not Started");
  };

  const saveEdit = async () => {
    if (!editProject || !editName.trim()) {
      alert("Project name is required");
      return;
    }

    try {
      await api.put(`/Projects/${editProject.projectId}`, {
        name: editName,
        description: editDescription,
        status: editStatus,
      });

      cancelEdit();
      setErrorMessage("");
      loadProjects();
    } catch (error) {
      console.error("Error updating project:", error);
      setErrorMessage(getApiErrorMessage(error, "Could not update project."));
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Projects</h1>

      {errorMessage && (
        <div style={{ marginBottom: "16px", padding: "12px", border: "1px solid #dc3545", borderRadius: "6px", color: "#842029", background: "#f8d7da" }}>
          {errorMessage}
        </div>
      )}

      {isAdmin && (
        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: "8px", marginRight: "10px" }}
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ padding: "8px", marginRight: "10px" }}
          />
          <button onClick={addProject} style={{ padding: "8px 16px" }}>
            Add Project
          </button>
        </div>
      )}

      <ul style={{ paddingLeft: 0, listStyle: "none" }}>
        {projects.map((project) => {
          const hasTasks = (project.taskCount ?? 0) > 0;
          const isEditing = editProject?.projectId === project.projectId;

          return (
            <li key={project.projectId} style={{ marginBottom: "12px", padding: "12px", border: "1px solid #ddd", borderRadius: "6px" }}>
              {isEditing ? (
                <div style={{ display: "grid", gap: "10px", maxWidth: "680px" }}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ padding: "8px" }}
                  />
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    style={{ padding: "8px" }}
                  />
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={{ padding: "8px", maxWidth: "220px" }}>
                    <option>Not Started</option>
                    <option>Planning</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={saveEdit} style={{ padding: "8px 16px" }}>Save</button>
                    <button onClick={cancelEdit} style={{ padding: "8px 16px" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <strong>{project.name}</strong> - {project.status}
                  <br />
                  <span>{project.description}</span>
                  <div style={{ marginTop: "8px", fontSize: "13px", color: "#666" }}>
                    Tasks: {project.taskCount ?? 0}
                  </div>
                  {isAdmin && (
                    <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <button
                        disabled={hasTasks}
                        onClick={() => beginEdit(project)}
                        title={hasTasks ? "Projects can only be edited before tasks are added." : "Edit project"}
                        style={{
                          padding: "8px 16px",
                          cursor: hasTasks ? "not-allowed" : "pointer",
                          opacity: hasTasks ? 0.55 : 1,
                        }}
                      >
                        Edit
                      </button>
                      {hasTasks && <span style={{ fontSize: "13px", color: "#666" }}>Locked because tasks exist.</span>}
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Projects;
