import React, { useEffect, useState } from "react";
import api from "../services/api";
import authService from "../services/authService";
import AttachmentUpload from "../components/AttachmentUpload";
import AttachmentList from "../components/AttachmentList";
import taskTypeService from "../services/taskTypeService";

const USER_COLORS = ["#FF6B6B", "#4ECDC4", "#95E1D3", "#F38181", "#AA96DA", "#FCBAD3", "#A8D8EA", "#FFD3B6"];

const toDateInputValue = (value) => {
  if (!value) return "";
  if (typeof value === "string" && value.length >= 10) {
    return value.slice(0, 10);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const toApiDateValue = (value) => (value ? `${value}T00:00:00` : null);

const getRelativeDateInput = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const formatDisplayDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

function Tasks() {
  const isAdmin = authService.isAdmin();
  const currentUserId = authService.getCurrentUserId();

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [taskTypeId, setTaskTypeId] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [priority, setPriority] = useState("Medium");
  const [startDate, setStartDate] = useState(getRelativeDateInput(0));
  const [endDate, setEndDate] = useState(getRelativeDateInput(7));
  const [editTaskModal, setEditTaskModal] = useState({ show: false, task: null });
  const [activeEditTab, setActiveEditTab] = useState("details");
  const [addTaskModal, setAddTaskModal] = useState(false);
  const [attachmentRefresh, setAttachmentRefresh] = useState(0);
  const [noteModal, setNoteModal] = useState({ show: false, task: null, note: "", sending: false });
  const [timesheetModal, setTimesheetModal] = useState({
    show: false,
    task: null,
    workDate: getRelativeDateInput(0),
    hours: "",
    notes: "",
    entries: [],
    saving: false,
    error: "",
  });
  const [formError, setFormError] = useState("");

  const loadTasks = async () => {
    try {
      const response = await api.get("/Tasks");
      setTasks(response.data);
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await api.get("/Projects");
      setProjects(response.data);
      if (response.data.length > 0 && !projectId) {
        setProjectId(String(response.data[0].projectId));
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const loadTaskTypes = async () => {
    const types = await taskTypeService.getAllTaskTypes();
    setTaskTypes(types.length > 0 ? types : taskTypeService.getDefaultTaskTypes());
  };

  const loadUsers = async () => {
    try {
      const response = await api.get("/Users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const resetTaskForm = () => {
    setName("");
    setDescription("");
    setAssignedTo("");
    setTaskTypeId("");
    setStatus("Not Started");
    setPriority("Medium");
    setStartDate(getRelativeDateInput(0));
    setEndDate(getRelativeDateInput(7));
  };

  const openAddTaskModal = () => {
    resetTaskForm();
    setFormError("");
    setAddTaskModal(true);
  };

  const closeAddTaskModal = () => {
    setAddTaskModal(false);
    setFormError("");
    resetTaskForm();
  };

  const addTask = async () => {
    if (!name.trim()) {
      alert("Task name is required");
      return;
    }

    if (!taskTypeId) {
      alert("Task type is required");
      return;
    }

    if (!projectId) {
      alert("Please select a project first");
      return;
    }

    if (!startDate || !endDate) {
      alert("Start date and end date are required");
      return;
    }

    if (startDate > endDate) {
      alert("End date must be on or after the start date");
      return;
    }

    try {
      setFormError("");
      await api.post("/Tasks", {
        projectId: parseInt(projectId, 10),
        parentTaskId: null,
        name,
        description,
        startDate: toApiDateValue(startDate),
        endDate: toApiDateValue(endDate),
        status,
        priority,
        assignedTo: assignedTo ? parseInt(assignedTo, 10) : null,
        taskTypeId: taskTypeId ? parseInt(taskTypeId, 10) : null,
      });

      resetTaskForm();
      closeAddTaskModal();
      loadTasks();
    } catch (error) {
      console.error("Error adding task:", error);
      setFormError(error.response?.data?.message || "Could not create task. Check the fields and try again.");
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;

    try {
      await api.delete(`/Tasks/${taskId}`);
      loadTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleEditTask = (task) => {
    setEditTaskModal({ show: true, task });
  };

  const handleSaveEditTask = async (taskId, updates) => {
    try {
      if (!updates.taskTypeId) {
        alert("Task type is required");
        return;
      }

      await api.put(`/Tasks/${taskId}`, updates);
      setEditTaskModal({ show: false, task: null });
      loadTasks();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/Tasks/${taskId}/status`, { status: newStatus });
      loadTasks();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const openNoteModal = (task) => {
    setNoteModal({ show: true, task, note: "", sending: false });
  };

  const closeNoteModal = () => {
    setNoteModal({ show: false, task: null, note: "", sending: false });
  };

  const sendTaskNoteToAdmin = async () => {
    if (!noteModal.task || !noteModal.note.trim()) {
      alert("Please enter a note first");
      return;
    }

    try {
      setNoteModal((current) => ({ ...current, sending: true }));
      await api.post(`/Tasks/${getTaskId(noteModal.task)}/note-to-admin`, { note: noteModal.note });
      closeNoteModal();
      alert("Note sent to admin.");
    } catch (error) {
      console.error("Error sending task note:", error);
      alert("Could not send note: " + (error.response?.data?.message || error.message));
      setNoteModal((current) => ({ ...current, sending: false }));
    }
  };

  const updateTaskAssignment = async (taskId, userNumber) => {
    try {
      await api.put(`/Tasks/${taskId}`, { assignedTo: userNumber ? parseInt(userNumber, 10) : null });
      loadTasks();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const updateTaskDates = async (task, changes) => {
    const nextStartDate = changes.startDate ?? toDateInputValue(task.startDate);
    const nextEndDate = changes.endDate ?? toDateInputValue(task.endDate);

    if (nextStartDate && nextEndDate && nextStartDate > nextEndDate) {
      alert("End date must be on or after the start date");
      return;
    }

    try {
      await api.put(`/Tasks/${getTaskId(task)}`, {
        startDate: toApiDateValue(nextStartDate),
        endDate: toApiDateValue(nextEndDate),
      });
      loadTasks();
    } catch (error) {
      console.error("Error updating task dates:", error);
    }
  };

  const getAssigneeColor = (userNumber) => {
    if (!userNumber) return "#999";
    return USER_COLORS[(userNumber - 1) % USER_COLORS.length];
  };

  const getTaskId = (task) => task.taskItemId ?? task.taskId;

  const getAssignedUserId = (task) => task.assignedToUserId ?? task.assignedTo;

  const getAssigneeName = (userNumber) => {
    if (!userNumber) return "Unassigned";
    const user = users.find((item) => item.userNumber === userNumber);
    return user ? user.fullName : "Unknown user";
  };

  const openTimesheetModal = async (task) => {
    setTimesheetModal({
      show: true,
      task,
      workDate: getRelativeDateInput(0),
      hours: "",
      notes: "",
      entries: [],
      saving: false,
      error: "",
    });

    try {
      const response = await api.get(`/Timesheets/task/${getTaskId(task)}`);
      setTimesheetModal((current) => ({ ...current, entries: response.data || [] }));
    } catch (error) {
      console.error("Error loading timesheet entries:", error);
      setTimesheetModal((current) => ({ ...current, error: "Could not load previous time entries." }));
    }
  };

  const closeTimesheetModal = () => {
    setTimesheetModal({
      show: false,
      task: null,
      workDate: getRelativeDateInput(0),
      hours: "",
      notes: "",
      entries: [],
      saving: false,
      error: "",
    });
  };

  const saveTimesheetEntry = async () => {
    if (!timesheetModal.task) return;

    const parsedHours = Number(timesheetModal.hours);
    if (!timesheetModal.workDate) {
      setTimesheetModal((current) => ({ ...current, error: "Work date is required." }));
      return;
    }

    if (!Number.isFinite(parsedHours) || parsedHours <= 0 || parsedHours > 24) {
      setTimesheetModal((current) => ({ ...current, error: "Hours must be greater than 0 and no more than 24." }));
      return;
    }

    try {
      setTimesheetModal((current) => ({ ...current, saving: true, error: "" }));
      await api.post("/Timesheets", {
        taskId: getTaskId(timesheetModal.task),
        workDate: toApiDateValue(timesheetModal.workDate),
        hours: parsedHours,
        notes: timesheetModal.notes,
      });

      const response = await api.get(`/Timesheets/task/${getTaskId(timesheetModal.task)}`);
      setTimesheetModal((current) => ({
        ...current,
        hours: "",
        notes: "",
        entries: response.data || [],
        saving: false,
        error: "",
      }));
    } catch (error) {
      console.error("Error saving timesheet entry:", error);
      setTimesheetModal((current) => ({
        ...current,
        saving: false,
        error: error.response?.data?.message || "Could not save time entry.",
      }));
    }
  };

  const deleteTimesheetEntry = async (entryId) => {
    if (!window.confirm("Delete this time entry?")) return;

    try {
      await api.delete(`/Timesheets/${entryId}`);
      setTimesheetModal((current) => ({
        ...current,
        entries: current.entries.filter((entry) => entry.timesheetEntryId !== entryId),
      }));
    } catch (error) {
      console.error("Error deleting timesheet entry:", error);
      setTimesheetModal((current) => ({ ...current, error: "Could not delete time entry." }));
    }
  };

  const getTaskTypeName = (typeId) => {
    if (!typeId) return "Unspecified";
    const type = taskTypes.find((item) => item.taskTypeId === typeId);
    return type ? type.name : "Unspecified";
  };

  const renderTaskList = () => {
    const tasksToRender = tasks.filter((task) => task.projectId === parseInt(projectId, 10));

    return (
      <div>
        {tasksToRender.map((task) => {
          const taskId = getTaskId(task);
          const assignedUserId = getAssignedUserId(task);

          return (
            <div key={taskId} style={{ marginBottom: "12px" }}>
              <div
                style={{
                  padding: "16px",
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  borderLeft: `5px solid ${getAssigneeColor(assignedUserId)}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: "8px" }}>
                    <strong style={{ fontSize: "16px", color: "#333" }}>{task.name}</strong>
                    <span
                      style={{
                        marginLeft: "12px",
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "white",
                        background:
                          task.status === "Completed"
                            ? "#28a745"
                            : task.status === "In Progress"
                            ? "#fd7e14"
                            : "#6c757d",
                      }}
                    >
                      {task.status}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 8px 0", color: "#666", fontSize: "13px" }}>
                    {task.description || "(No description)"}
                  </p>
                  <div style={{ fontSize: "12px", color: "#999", display: "flex", gap: "20px" }}>
                    <span>📅 {formatDisplayDate(task.startDate)} → {formatDisplayDate(task.endDate)}</span>
                    <span>👤 {getAssigneeName(assignedUserId)}</span>
                    <span>Type: {getTaskTypeName(task.taskTypeId)}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", minWidth: "fit-content", alignItems: "center" }}>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleEditTask(task)}
                        style={{
                          padding: "8px 14px",
                          background: "#0056b3",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteTask(taskId)}
                        style={{
                          padding: "8px 14px",
                          background: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </>
                  )}
                  {!isAdmin && (
                    <>
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(taskId, e.target.value)}
                        style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "13px" }}
                      >
                        <option>Not Started</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                      <button
                        onClick={() => openNoteModal(task)}
                        style={{
                          padding: "8px 14px",
                          background: "#0056b3",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        Mail admin
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => openTimesheetModal(task)}
                    style={{
                      padding: "8px 14px",
                      background: "#198754",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    {isAdmin ? "Timesheet" : "Log time"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    loadProjects();
    loadUsers();
    loadTaskTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const filteredTasks = tasks.filter((task) => task.projectId === parseInt(projectId, 10));

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>Tasks</h1>
        {isAdmin && (
          <button
            onClick={openAddTaskModal}
            style={{
              padding: "10px 20px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            + Add Task
          </button>
        )}
      </div>

      {!isAdmin && (
        <div style={{ marginBottom: "20px", padding: "15px", background: "#e8f5e9", borderRadius: "4px", borderLeft: "4px solid #4caf50" }}>
          <p style={{ margin: 0, color: "#2e7d32", fontSize: "14px" }}>
            Viewing tasks assigned to you. You can update status or mail a note to the admin.
          </p>
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: "#555" }}>Select Project:</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          style={{ display: "block", width: "100%", maxWidth: "400px", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
        >
          <option value="">Select Project</option>
          {projects.map((project) => (
            <option key={project.projectId} value={project.projectId}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <h3>
        Tasks ({filteredTasks.length}) - {projects.find((project) => project.projectId === parseInt(projectId, 10))?.name}
      </h3>

      {projectId === "" ? <p>Please select a project first</p> : filteredTasks.length === 0 ? <p>No tasks yet</p> : renderTaskList()}

      {noteModal.show && noteModal.task && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)", maxWidth: "520px", width: "90%" }}>
            <div style={{ padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Mail admin</h3>
              <button onClick={closeNoteModal} style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#999" }}>
                x
              </button>
            </div>
            <div style={{ padding: "20px" }}>
              <p style={{ marginTop: 0, color: "#555", fontSize: "14px" }}>
                Task: <strong>{noteModal.task.name}</strong>
              </p>
              <textarea
                value={noteModal.note}
                onChange={(e) => setNoteModal((current) => ({ ...current, note: e.target.value }))}
                placeholder="Write your note for the admin"
                style={{ width: "100%", minHeight: "120px", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ padding: "20px", borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: "10px", background: "#f9f9f9" }}>
              <button onClick={closeNoteModal} style={{ padding: "8px 16px", border: "1px solid #ddd", background: "white", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
                Cancel
              </button>
              <button
                onClick={sendTaskNoteToAdmin}
                disabled={noteModal.sending}
                style={{ padding: "8px 16px", background: "#007bff", color: "white", border: "none", borderRadius: "6px", cursor: noteModal.sending ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600", opacity: noteModal.sending ? 0.7 : 1 }}
              >
                {noteModal.sending ? "Sending..." : "Send note"}
              </button>
            </div>
          </div>
        </div>
      )}

      {timesheetModal.show && timesheetModal.task && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)", maxWidth: "620px", width: "90%", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>{isAdmin ? "Task timesheet" : "Log time"}</h3>
              <button onClick={closeTimesheetModal} style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#999" }}>
                x
              </button>
            </div>

            <div style={{ padding: "20px", overflowY: "auto" }}>
              <p style={{ marginTop: 0, color: "#555", fontSize: "14px" }}>
                Task: <strong>{timesheetModal.task.name}</strong>
              </p>
              {isAdmin ? (
                <div style={{ marginBottom: "15px", padding: "12px", background: "#eef4ff", color: "#0b3d75", border: "1px solid #b8d4ff", borderRadius: "6px", fontSize: "13px" }}>
                  Admin view only. Team members add their worked hours and notes manually from their own account.
                </div>
              ) : (
                <div style={{ marginBottom: "15px", padding: "12px", background: "#eef8f0", color: "#245b32", border: "1px solid #b8dfc0", borderRadius: "6px", fontSize: "13px" }}>
                  Add the hours you worked on this task manually, then write a note about what you completed.
                </div>
              )}

              {timesheetModal.error && (
                <div style={{ marginBottom: "15px", padding: "10px", background: "#fff3f3", color: "#b00020", border: "1px solid #f5c2c7", borderRadius: "6px", fontSize: "13px" }}>
                  {timesheetModal.error}
                </div>
              )}

              {!isAdmin && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>
                      Work Date
                      <input
                        type="date"
                        value={timesheetModal.workDate}
                        onChange={(e) => setTimesheetModal((current) => ({ ...current, workDate: e.target.value }))}
                        style={{ display: "block", width: "100%", marginTop: "6px", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                      />
                    </label>
                    <label style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>
                      Hours Worked
                      <input
                        type="number"
                        min="0.25"
                        max="24"
                        step="0.25"
                        placeholder="4"
                        value={timesheetModal.hours}
                        onChange={(e) => setTimesheetModal((current) => ({ ...current, hours: e.target.value }))}
                        style={{ display: "block", width: "100%", marginTop: "6px", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                      />
                    </label>
                  </div>

                  <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "12px" }}>
                    Work Note
                    <textarea
                      value={timesheetModal.notes}
                      onChange={(e) => setTimesheetModal((current) => ({ ...current, notes: e.target.value }))}
                      placeholder="Describe what you worked on"
                      style={{ display: "block", width: "100%", minHeight: "80px", marginTop: "6px", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                    />
                  </label>

                  <button
                    onClick={saveTimesheetEntry}
                    disabled={timesheetModal.saving}
                    style={{ padding: "9px 16px", background: "#198754", color: "white", border: "none", borderRadius: "6px", cursor: timesheetModal.saving ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600", opacity: timesheetModal.saving ? 0.7 : 1 }}
                  >
                    {timesheetModal.saving ? "Saving..." : "Save Manual Time"}
                  </button>
                </>
              )}

              <div style={{ marginTop: "24px" }}>
                <h4 style={{ margin: "0 0 10px 0" }}>{isAdmin ? "Task time entries" : "My time entries"}</h4>
                {timesheetModal.entries.length === 0 ? (
                  <p style={{ color: "#666", fontSize: "13px" }}>No time entered for this task yet.</p>
                ) : (
                  <div style={{ display: "grid", gap: "8px" }}>
                    {timesheetModal.entries.map((entry) => (
                      <div key={entry.timesheetEntryId} style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "10px", display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "600" }}>
                            {formatDisplayDate(entry.workDate)} - {entry.hours} hour{Number(entry.hours) === 1 ? "" : "s"}
                          </div>
                          {isAdmin && entry.userName && <div style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}>Member: {entry.userName}</div>}
                          {entry.notes && <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>{entry.notes}</div>}
                        </div>
                        {!isAdmin && (
                          <button
                            onClick={() => deleteTimesheetEntry(entry.timesheetEntryId)}
                            style={{ padding: "5px 10px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: "16px 20px", borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end", background: "#f9f9f9" }}>
              <button onClick={closeTimesheetModal} style={{ padding: "8px 16px", border: "1px solid #ddd", background: "white", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {addTaskModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
              maxWidth: "500px",
              width: "90%",
            }}
          >
            <div style={{ padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Create New Task</h3>
              <button
                onClick={closeAddTaskModal}
                style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#999" }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "20px" }}>
              {formError && (
                <div style={{ marginBottom: "15px", padding: "10px", background: "#fff3f3", color: "#b00020", border: "1px solid #f5c2c7", borderRadius: "6px", fontSize: "13px" }}>
                  {formError}
                </div>
              )}
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#333" }}>Project</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project.projectId} value={project.projectId}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#333" }}>Task Name</label>
                <input
                  type="text"
                  placeholder="Enter task name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#333" }}>Description</label>
                <textarea
                  placeholder="Enter task description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", minHeight: "80px" }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#333" }}>Task Type</label>
                <select
                  value={taskTypeId}
                  onChange={(e) => setTaskTypeId(e.target.value)}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
                  required
                >
                  <option value="">Select Task Type</option>
                  {taskTypes.map((type) => (
                    <option key={type.taskTypeId} value={type.taskTypeId}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#333" }}>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#333" }}>End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#333" }}>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
                  >
                    <option>Not Started</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#333" }}>Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#333" }}>Assign To</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
                  >
                    <option value="">-- Unassigned --</option>
                    {users.map((user) => (
                      <option key={user.userNumber} value={user.userNumber}>
                        {user.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ padding: "20px", borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={closeAddTaskModal}
                style={{ padding: "8px 16px", border: "1px solid #ddd", background: "white", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                style={{ padding: "8px 16px", background: "#007bff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editTaskModal.show && editTaskModal.task && (
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
          zIndex: 1000,
        }}>
          <div style={{
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Header */}
            <div style={{ padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Edit Task</h3>
              <button 
                onClick={() => {
                  setEditTaskModal({ show: false, task: null });
                  setActiveEditTab("details");
                }}
                style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#999" }}
              >
                ×
              </button>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: "flex", borderBottom: "2px solid #eee", background: "#f9f9f9" }}>
              <button
                onClick={() => setActiveEditTab("details")}
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  border: "none",
                  background: activeEditTab === "details" ? "white" : "transparent",
                  borderBottom: activeEditTab === "details" ? "3px solid #007bff" : "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: activeEditTab === "details" ? "600" : "500",
                  color: activeEditTab === "details" ? "#007bff" : "#666",
                  transition: "all 0.2s ease",
                }}
              >
                📋 Details
              </button>
              <button
                onClick={() => setActiveEditTab("attachments")}
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  border: "none",
                  background: activeEditTab === "attachments" ? "white" : "transparent",
                  borderBottom: activeEditTab === "attachments" ? "3px solid #007bff" : "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: activeEditTab === "attachments" ? "600" : "500",
                  color: activeEditTab === "attachments" ? "#007bff" : "#666",
                  transition: "all 0.2s ease",
                }}
              >
                📎 Files ({editTaskModal.task.attachments?.length || 0})
              </button>
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {/* Details Tab */}
              {activeEditTab === "details" && (
                <div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#333" }}>Task Name</label>
                    <input
                      type="text"
                      defaultValue={editTaskModal.task.name}
                      onChange={(e) => setEditTaskModal({ ...editTaskModal, task: { ...editTaskModal.task, name: e.target.value } })}
                      style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#333" }}>Description</label>
                    <textarea
                      defaultValue={editTaskModal.task.description}
                      onChange={(e) => setEditTaskModal({ ...editTaskModal, task: { ...editTaskModal.task, description: e.target.value } })}
                      style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", minHeight: "80px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#333" }}>Task Type</label>
                  <select
                    value={editTaskModal.task.taskTypeId || ""}
                    onChange={(e) => setEditTaskModal({ ...editTaskModal, task: { ...editTaskModal.task, taskTypeId: e.target.value ? parseInt(e.target.value, 10) : null } })}
                    style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                    required
                  >
                    <option value="">Select Task Type</option>
                      {taskTypes.map((type) => (
                        <option key={type.taskTypeId} value={type.taskTypeId}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#333" }}>Start Date</label>
                      <input
                        type="date"
                        defaultValue={toDateInputValue(editTaskModal.task.startDate)}
                        onChange={(e) => setEditTaskModal({ ...editTaskModal, task: { ...editTaskModal.task, startDate: e.target.value } })}
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#333" }}>End Date</label>
                      <input
                        type="date"
                        defaultValue={toDateInputValue(editTaskModal.task.endDate)}
                        onChange={(e) => setEditTaskModal({ ...editTaskModal, task: { ...editTaskModal.task, endDate: e.target.value } })}
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#333" }}>Priority</label>
                      <select
                        defaultValue={editTaskModal.task.priority}
                        onChange={(e) => setEditTaskModal({ ...editTaskModal, task: { ...editTaskModal.task, priority: e.target.value } })}
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#333" }}>Status</label>
                      <select
                        defaultValue={editTaskModal.task.status}
                        onChange={(e) => setEditTaskModal({ ...editTaskModal, task: { ...editTaskModal.task, status: e.target.value } })}
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                      >
                        <option>Not Started</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Attachments Tab */}
              {activeEditTab === "attachments" && (
                <div>
                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", color: "#333" }}>Upload File</h4>
                    <AttachmentUpload
                      taskId={getTaskId(editTaskModal.task)}
                      onUploadSuccess={() => setAttachmentRefresh(attachmentRefresh + 1)}
                    />
                  </div>

                  <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid #eee" }} />

                  <div>
                    <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", color: "#333" }}>Attached Files</h4>
                    <AttachmentList
                      key={attachmentRefresh}
                      taskId={getTaskId(editTaskModal.task)}
                      isAdmin={isAdmin}
                      onDeleteSuccess={() => setAttachmentRefresh(attachmentRefresh + 1)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "20px", borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: "10px", background: "#f9f9f9" }}>
              <button
                onClick={() => {
                  setEditTaskModal({ show: false, task: null });
                  setActiveEditTab("details");
                }}
                style={{ padding: "8px 16px", border: "1px solid #ddd", background: "white", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveEditTask(getTaskId(editTaskModal.task), editTaskModal.task)}
                style={{ padding: "8px 16px", background: "#007bff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
