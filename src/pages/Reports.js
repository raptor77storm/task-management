import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import authService from "../services/authService";

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDisplayDate = (value) => {
  const date = toDate(value);
  return date ? date.toLocaleDateString() : "Not set";
};

const getDaysUntil = (value) => {
  const date = toDate(value);
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return Math.round((target - today) / 86400000);
};

const csvEscape = (value) => {
  const stringValue = value == null ? "" : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

function Reports() {
  const isAdmin = authService.isAdmin();
  const currentUserId = authService.getCurrentUserId();

  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [usersRes, tasksRes, projectsRes] = await Promise.all([
          api.get("/Users"),
          api.get("/Tasks"),
          api.get("/Projects"),
        ]);
        setUsers(usersRes.data);
        setTasks(tasksRes.data);
        setProjects(projectsRes.data);
        setError("");

        // If team member, set filter to their own tasks
        if (!isAdmin && currentUserId) {
          setSelectedUserId(String(currentUserId));
        }
      } catch (err) {
        console.error("Error loading reports data:", err);
        setError("Failed to load reports data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdmin, currentUserId]);

  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.projectId, project.name])),
    [projects]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesUser = selectedUserId === "all"
        ? true
        : task.assignedTo === parseInt(selectedUserId, 10);

      const matchesStatus = statusFilter === "all" ? true : task.status === statusFilter;
      const matchesProject = projectFilter === "all" ? true : task.projectId === parseInt(projectFilter, 10);

      return matchesUser && matchesStatus && matchesProject;
    });
  }, [projectFilter, selectedUserId, statusFilter, tasks]);

  const teamReports = useMemo(() => {
    return users.map((user) => {
      const userTasks = tasks.filter((task) => task.assignedTo === user.userNumber);
      const completed = userTasks.filter((task) => task.status === "Completed").length;
      const inProgress = userTasks.filter((task) => task.status === "In Progress").length;
      const overdue = userTasks.filter((task) => {
        const daysUntil = getDaysUntil(task.endDate);
        return daysUntil !== null && daysUntil < 0 && task.status !== "Completed";
      }).length;

      return {
        user,
        total: userTasks.length,
        completed,
        inProgress,
        overdue,
        lastEndDate: userTasks
          .map((task) => toDate(task.endDate))
          .filter(Boolean)
          .sort((a, b) => b - a)[0] ?? null,
      };
    });
  }, [tasks, users]);

  const activeReportUser = selectedUserId === "all"
    ? null
    : users.find((user) => user.userNumber === parseInt(selectedUserId, 10)) ?? null;

  const exportCsv = () => {
    const headers = [
      "Team Member",
      "Project",
      "Task Name",
      "Description",
      "Status",
      "Priority",
      "Start Date",
      "End Date",
      "Days Remaining",
      "Parent Task ID",
      "Task ID",
    ];

    const rows = filteredTasks.map((task) => {
      const daysUntil = getDaysUntil(task.endDate);
      return [
        users.find((user) => user.userNumber === task.assignedTo)?.fullName ?? "Unassigned",
        projectMap.get(task.projectId) ?? `Project ${task.projectId}`,
        task.name,
        task.description ?? "",
        task.status,
        task.priority,
        formatDisplayDate(task.startDate),
        formatDisplayDate(task.endDate),
        daysUntil == null ? "" : daysUntil,
        task.parentTaskId ?? "",
        task.taskId,
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = activeReportUser
      ? `${activeReportUser.fullName.replace(/\s+/g, "-").toLowerCase()}-task-report.csv`
      : "team-task-report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  const summaryTotal = filteredTasks.length;
  const summaryCompleted = filteredTasks.filter((task) => task.status === "Completed").length;
  const summaryOpen = filteredTasks.filter((task) => task.status !== "Completed").length;
  const summaryOverdue = filteredTasks.filter((task) => {
    const daysUntil = getDaysUntil(task.endDate);
    return daysUntil !== null && daysUntil < 0 && task.status !== "Completed";
  }).length;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Reports</h1>
      <p style={{ color: "#555", marginTop: "0" }}>
        {isAdmin ? (
          "Review each team member's tasks, deadlines, statuses, and project details."
        ) : (
          "Viewing your assigned tasks, deadlines, statuses, and project details."
        )}
      </p>

      {error && <div style={{ color: "red", marginBottom: "10px", padding: "10px", background: "#fff3f3", borderRadius: "4px" }}>{error}</div>}

      <div style={{ marginBottom: "20px", padding: "15px", background: "#f5f5f5", borderRadius: "4px" }}>
        <h3 style={{ marginTop: 0 }}>Report Filters</h3>
        <div style={{ display: "grid", gridTemplateColumns: isAdmin ? "1fr 1fr 1fr auto auto" : "1fr 1fr auto auto", gap: "10px", alignItems: "end" }}>
          {isAdmin && (
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "#555" }}>Team Member</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              >
                <option value="all">All team members</option>
                {users.map((user) => (
                  <option key={user.userNumber} value={user.userNumber}>
                    {user.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "#555" }}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            >
              <option value="all">All statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "#555" }}>Project</label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            >
              <option value="all">All projects</option>
              {projects.map((project) => (
                <option key={project.projectId} value={project.projectId}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={exportCsv}
            style={{
              padding: "8px 16px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Export CSV
          </button>

          <button
            onClick={printReport}
            style={{
              padding: "8px 16px",
              background: "#444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Print
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading reports...</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "15px", marginBottom: "25px" }}>
            <div style={{ padding: "15px", background: "#e3f2fd", borderRadius: "4px", borderLeft: "4px solid #2196f3" }}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#2196f3" }}>{summaryTotal}</div>
              <div style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>Tasks In Report</div>
            </div>
            <div style={{ padding: "15px", background: "#e8f5e9", borderRadius: "4px", borderLeft: "4px solid #43a047" }}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#43a047" }}>{summaryCompleted}</div>
              <div style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>Completed</div>
            </div>
            <div style={{ padding: "15px", background: "#fff8e1", borderRadius: "4px", borderLeft: "4px solid #fb8c00" }}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#fb8c00" }}>{summaryOpen}</div>
              <div style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>Open Tasks</div>
            </div>
            <div style={{ padding: "15px", background: "#ffebee", borderRadius: "4px", borderLeft: "4px solid #e53935" }}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#e53935" }}>{summaryOverdue}</div>
              <div style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>Overdue</div>
            </div>
          </div>

          <div style={{ marginBottom: "25px" }}>
            <h2>Team Member Summary</h2>
            {teamReports.length === 0 ? (
              <p>No team members found.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "15px" }}>
                {teamReports.map((report) => (
                  <div
                    key={report.user.userNumber}
                    style={{
                      padding: "15px",
                      border: selectedUserId === String(report.user.userNumber) ? "2px solid #007bff" : "1px solid #ddd",
                      borderRadius: "4px",
                      background: "#fff",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                      <div>
                        <h4 style={{ margin: "0 0 6px 0" }}>{report.user.fullName}</h4>
                        <div style={{ fontSize: "12px", color: "#666" }}>{report.user.roles}</div>
                      </div>
                      <button
                        onClick={() => setSelectedUserId(String(report.user.userNumber))}
                        style={{
                          padding: "6px 10px",
                          background: "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        View Report
                      </button>
                    </div>
                    <div style={{ marginTop: "12px", fontSize: "13px", color: "#444", display: "grid", gap: "4px" }}>
                      <div>Total tasks: {report.total}</div>
                      <div>Completed: {report.completed}</div>
                      <div>In progress: {report.inProgress}</div>
                      <div>Overdue: {report.overdue}</div>
                      <div>Latest due date: {report.lastEndDate ? report.lastEndDate.toLocaleDateString() : "Not set"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2>{activeReportUser ? `${activeReportUser.fullName} Task Report` : "All Team Tasks"}</h2>
            {filteredTasks.length === 0 ? (
              <p>No tasks match the current report filters.</p>
            ) : (
              <div style={{ overflowX: "auto", border: "1px solid #ddd", borderRadius: "4px", background: "#fff" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1100px" }}>
                  <thead>
                    <tr style={{ background: "#f5f5f5", textAlign: "left" }}>
                      <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Team Member</th>
                      <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Project</th>
                      <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Task</th>
                      <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Description</th>
                      <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Status</th>
                      <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Priority</th>
                      <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Start Date</th>
                      <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>End Date</th>
                      <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Days Remaining</th>
                      <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Parent Task</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks
                      .slice()
                      .sort((a, b) => {
                        const aEnd = toDate(a.endDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
                        const bEnd = toDate(b.endDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
                        return aEnd - bEnd;
                      })
                      .map((task) => {
                        const daysUntil = getDaysUntil(task.endDate);
                        return (
                          <tr key={task.taskId}>
                            <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{users.find((user) => user.userNumber === task.assignedTo)?.fullName ?? "Unassigned"}</td>
                            <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{projectMap.get(task.projectId) ?? `Project ${task.projectId}`}</td>
                            <td style={{ padding: "10px", borderBottom: "1px solid #eee", fontWeight: "bold" }}>{task.name}</td>
                            <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{task.description || "-"}</td>
                            <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{task.status}</td>
                            <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{task.priority}</td>
                            <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{formatDisplayDate(task.startDate)}</td>
                            <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{formatDisplayDate(task.endDate)}</td>
                            <td style={{ padding: "10px", borderBottom: "1px solid #eee", color: daysUntil != null && daysUntil < 0 ? "#d32f2f" : "inherit" }}>
                              {daysUntil == null ? "Not set" : daysUntil < 0 ? `${Math.abs(daysUntil)} overdue` : `${daysUntil} day(s)`}
                            </td>
                            <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{task.parentTaskId ?? "-"}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Reports;
