import React, { useEffect, useState } from "react";
import api from "../services/api";
import authService from "../services/authService";

function ProjectTemplates() {
  const isAdmin = authService.isAdmin();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [programmes, setProgrammes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    isPublic: false,
    templateTasks: [
      { name: "", description: "", orderIndex: 1, startDateOffsetDays: 0, durationDays: 5, priority: "Medium", status: "Not Started" }
    ]
  });
  const [applyData, setApplyData] = useState({
    programmmeId: "",
    projectName: "",
    projectStartDate: new Date().toISOString().split("T")[0]
  });

  useEffect(() => {
    loadTemplates();
    loadProgrammes();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.get("/ProjectTemplates");
      setTemplates(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading templates:", error);
      setLoading(false);
    }
  };

  const loadProgrammes = async () => {
    try {
      const response = await api.get("/Programmes");
      setProgrammes(response.data);
    } catch (error) {
      console.error("Error loading programmes:", error);
    }
  };

  const addTemplateTask = () => {
    setNewTemplate({
      ...newTemplate,
      templateTasks: [
        ...newTemplate.templateTasks,
        {
          name: "",
          description: "",
          orderIndex: newTemplate.templateTasks.length + 1,
          startDateOffsetDays: 0,
          durationDays: 5,
          priority: "Medium",
          status: "Not Started"
        }
      ]
    });
  };

  const updateTemplateTask = (index, field, value) => {
    const updated = [...newTemplate.templateTasks];
    updated[index] = { ...updated[index], [field]: value };
    setNewTemplate({ ...newTemplate, templateTasks: updated });
  };

  const removeTemplateTask = (index) => {
    const updated = newTemplate.templateTasks.filter((_, i) => i !== index);
    setNewTemplate({ ...newTemplate, templateTasks: updated });
  };

  const handleCreateTemplate = async () => {
    try {
      await api.post("/ProjectTemplates", newTemplate);
      setShowCreateModal(false);
      setNewTemplate({
        name: "",
        description: "",
        isPublic: false,
        templateTasks: [{ name: "", description: "", orderIndex: 1, startDateOffsetDays: 0, durationDays: 5, priority: "Medium", status: "Not Started" }]
      });
      loadTemplates();
    } catch (error) {
      alert("Error creating template: " + (error.response?.data?.message || error.message));
    }
  };

  const handleApplyTemplate = async () => {
    try {
      const response = await api.post(
        `/ProjectTemplates/${selectedTemplate.templateId}/CreateProject`,
        {
          programmmeId: parseInt(applyData.programmmeId),
          projectName: applyData.projectName,
          projectStartDate: applyData.projectStartDate + "T00:00:00"
        }
      );
      alert("Project created successfully from template!");
      setShowApplyModal(false);
      setSelectedTemplate(null);
      setApplyData({
        programmmeId: "",
        projectName: "",
        projectStartDate: new Date().toISOString().split("T")[0]
      });
    } catch (error) {
      alert("Error creating project: " + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading templates...</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ margin: 0 }}>Project Templates</h1>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: "10px 20px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            + Create Template
          </button>
        )}
      </div>

      {/* Templates Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "20px",
        marginBottom: "40px"
      }}>
        {templates.map((template) => (
          <div key={template.templateId} style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "20px",
            background: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            hover: "box-shadow: 0 4px 16px rgba(0,0,0,0.15)"
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)"}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"}
          >
            <h3 style={{ margin: "0 0 10px 0", fontSize: "18px", fontWeight: "600" }}>{template.name}</h3>
            <p style={{ margin: "0 0 10px 0", color: "#666", fontSize: "14px" }}>{template.description}</p>
            <div style={{ display: "flex", gap: "10px", marginBottom: "15px", fontSize: "12px", color: "#999" }}>
              <span>📋 {template.taskCount} tasks</span>
              <span>👤 {template.usageCount}x used</span>
            </div>
            <button
              onClick={() => {
                setSelectedTemplate(template);
                setShowApplyModal(true);
              }}
              style={{
                width: "100%",
                padding: "10px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600"
              }}
            >
              Use Template
            </button>
          </div>
        ))}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            borderRadius: "8px",
            maxWidth: "700px",
            width: "90%",
            maxHeight: "85vh",
            overflow: "auto",
            padding: "20px"
          }}>
            <h2 style={{ marginTop: 0 }}>Create New Template</h2>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px" }}>Template Name</label>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px" }}>Description</label>
              <textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", minHeight: "60px", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={newTemplate.isPublic}
                  onChange={(e) => setNewTemplate({ ...newTemplate, isPublic: e.target.checked })}
                />
                <span>Make this template public (available to all users)</span>
              </label>
            </div>

            <h3>Template Tasks</h3>
            {newTemplate.templateTasks.map((task, idx) => (
              <div key={idx} style={{ border: "1px solid #eee", padding: "15px", marginBottom: "10px", borderRadius: "4px", background: "#f9f9f9" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <input
                    type="text"
                    placeholder="Task name"
                    value={task.name}
                    onChange={(e) => updateTemplateTask(idx, "name", e.target.value)}
                    style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
                  />
                  <select
                    value={task.priority}
                    onChange={(e) => updateTemplateTask(idx, "priority", e.target.value)}
                    style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <input
                    type="number"
                    placeholder="Start offset (days)"
                    value={task.startDateOffsetDays}
                    onChange={(e) => updateTemplateTask(idx, "startDateOffsetDays", parseInt(e.target.value))}
                    style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
                  />
                  <input
                    type="number"
                    placeholder="Duration (days)"
                    value={task.durationDays}
                    onChange={(e) => updateTemplateTask(idx, "durationDays", parseInt(e.target.value))}
                    style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
                  />
                </div>
                {newTemplate.templateTasks.length > 1 && (
                  <button
                    onClick={() => removeTemplateTask(idx)}
                    style={{ marginTop: "10px", padding: "6px 12px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                  >
                    Remove Task
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={addTemplateTask}
              style={{
                marginBottom: "20px",
                padding: "8px 16px",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              + Add Task
            </button>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ padding: "8px 16px", border: "1px solid #ddd", background: "white", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                style={{ padding: "8px 16px", background: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Template Modal */}
      {showApplyModal && selectedTemplate && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            borderRadius: "8px",
            maxWidth: "500px",
            width: "90%",
            padding: "20px"
          }}>
            <h2 style={{ marginTop: 0 }}>Create Project from "{selectedTemplate.name}"</h2>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px" }}>Select Programme</label>
              <select
                value={applyData.programmmeId}
                onChange={(e) => setApplyData({ ...applyData, programmmeId: e.target.value })}
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }}
              >
                <option value="">-- Choose a programme --</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px" }}>Project Name</label>
              <input
                type="text"
                value={applyData.projectName}
                onChange={(e) => setApplyData({ ...applyData, projectName: e.target.value })}
                placeholder="e.g., Q1 2026 Development"
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px" }}>Project Start Date</label>
              <input
                type="date"
                value={applyData.projectStartDate}
                onChange={(e) => setApplyData({ ...applyData, projectStartDate: e.target.value })}
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ background: "#f0f7ff", padding: "12px", borderRadius: "4px", marginBottom: "15px", fontSize: "13px", color: "#004085" }}>
              ℹ️ This will create a new project with {selectedTemplate.taskCount} predefined tasks. You can edit them after creation.
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowApplyModal(false)}
                style={{ padding: "8px 16px", border: "1px solid #ddd", background: "white", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyTemplate}
                disabled={!applyData.programmmeId || !applyData.projectName}
                style={{
                  padding: "8px 16px",
                  background: !applyData.programmmeId || !applyData.projectName ? "#ccc" : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: !applyData.programmmeId || !applyData.projectName ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600"
                }}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectTemplates;
