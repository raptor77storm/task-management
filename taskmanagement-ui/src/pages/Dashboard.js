import React, { useEffect, useState } from "react";
import api from "../services/api";
import teamTypeService from "../services/teamTypeService";
import taskTypeService from "../services/taskTypeService";

const USER_COLORS = ["#FF6B6B", "#4ECDC4", "#95E1D3", "#F38181", "#AA96DA", "#FCBAD3", "#A8D8EA", "#FFD3B6"];

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

const getDateRangeLabel = (items) => {
  const dates = items
    .flatMap((task) => [toDate(task.startDate), toDate(task.endDate)])
    .filter(Boolean)
    .sort((a, b) => a - b);

  if (dates.length === 0) return "No dates set";
  return `${dates[0].toLocaleDateString()} to ${dates[dates.length - 1].toLocaleDateString()}`;
};

const getStartOfWeek = (baseDate = new Date()) => {
  const date = new Date(baseDate);
  const dayIndex = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - dayIndex);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getEndOfWeek = (baseDate = new Date()) => {
  const date = getStartOfWeek(baseDate);
  date.setDate(date.getDate() + 6);
  date.setHours(23, 59, 59, 999);
  return date;
};

const overlapsCurrentWeek = (task) => {
  const startOfWeek = getStartOfWeek();
  const endOfWeek = getEndOfWeek();
  const startDate = toDate(task.startDate);
  const endDate = toDate(task.endDate);

  if (startDate && endDate) {
    return startDate <= endOfWeek && endDate >= startOfWeek;
  }

  if (startDate) {
    return startDate >= startOfWeek && startDate <= endOfWeek;
  }

  if (endDate) {
    return endDate >= startOfWeek && endDate <= endOfWeek;
  }

  return false;
};

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [teamTypes, setTeamTypes] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [teamTypeFilter, setTeamTypeFilter] = useState("all");
  const [taskTypeFilter, setTaskTypeFilter] = useState("all");
  const [scheduleFilter, setScheduleFilter] = useState("all");

  const loadData = async () => {
    try {
      const [projectsRes, tasksRes, usersRes] = await Promise.all([
        api.get("/Projects"),
        api.get("/Tasks"),
        api.get("/Users"),
      ]);
      setProjects(projectsRes.data);
      setTasks(tasksRes.data);
      setUsers(usersRes.data);
      const [teamTypesRes, taskTypesRes] = await Promise.all([
        teamTypeService.getAllTeamTypes(),
        taskTypeService.getAllTaskTypes(),
      ]);
      setTeamTypes(teamTypesRes.length > 0 ? teamTypesRes : teamTypeService.getDefaultTeamTypes());
      setTaskTypes(taskTypesRes.length > 0 ? taskTypesRes : taskTypeService.getDefaultTaskTypes());
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getAssigneeName = (userNumber) => {
    const user = users.find((item) => item.userNumber === userNumber);
    return user ? user.fullName : "Unassigned";
  };

  const getTeamTypeName = (teamTypeId) => {
    if (!teamTypeId) return "Unspecified";
    const type = teamTypes.find((item) => item.teamTypeId === teamTypeId);
    return type ? type.name : "Unspecified";
  };

  const getTaskTypeName = (taskTypeId) => {
    if (!taskTypeId) return "Unspecified";
    const type = taskTypes.find((item) => item.taskTypeId === taskTypeId);
    return type ? type.name : "Unspecified";
  };

  const userById = users.reduce((acc, user) => {
    acc[user.userNumber] = user;
    return acc;
  }, {});

  const getAssigneeColor = (userNumber) => {
    if (!userNumber) return "#999";
    return USER_COLORS[(userNumber - 1) % USER_COLORS.length];
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesAssignee = assigneeFilter === "all"
      ? true
      : assigneeFilter === "unassigned"
        ? !task.assignedTo
        : task.assignedTo === parseInt(assigneeFilter, 10);

    const matchesTeamType = teamTypeFilter === "all"
      ? true
      : (() => {
          const user = userById[task.assignedTo];
          return user && user.teamTypeId === parseInt(teamTypeFilter, 10);
        })();

    const matchesTaskType = taskTypeFilter === "all"
      ? true
      : task.taskTypeId === parseInt(taskTypeFilter, 10);

    const matchesSchedule = (() => {
      if (scheduleFilter === "all") return true;
      if (scheduleFilter === "overdue") {
        const daysUntil = getDaysUntil(task.endDate);
        return daysUntil !== null && daysUntil < 0 && task.status !== "Completed";
      }
      if (scheduleFilter === "week") {
        return overlapsCurrentWeek(task);
      }
      return true;
    })();

    return matchesAssignee && matchesTeamType && matchesTaskType && matchesSchedule;
  });

  const hasActiveFilters = assigneeFilter !== "all" || teamTypeFilter !== "all" || taskTypeFilter !== "all" || scheduleFilter !== "all";
  const visibleProjectIds = new Set(filteredTasks.map((task) => task.projectId));

  const totalProjects = hasActiveFilters ? visibleProjectIds.size : projects.length;
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((task) => task.status === "Completed").length;
  const inProgressTasks = filteredTasks.filter((task) => task.status === "In Progress").length;
  const highPriorityTasks = filteredTasks.filter((task) => task.priority === "High" && task.status !== "Completed").length;
  const overdueTasks = filteredTasks.filter((task) => {
    const daysUntil = getDaysUntil(task.endDate);
    return daysUntil !== null && daysUntil < 0 && task.status !== "Completed";
  }).length;
  const upcomingTasks = filteredTasks.filter((task) => {
    const daysUntil = getDaysUntil(task.endDate);
    return daysUntil !== null && daysUntil >= 0 && daysUntil <= 7 && task.status !== "Completed";
  }).length;

  const tasksByAssignee = users
    .filter((user) => teamTypeFilter === "all" || user.teamTypeId === parseInt(teamTypeFilter, 10))
    .map((user) => {
    const userTasks = filteredTasks.filter((task) => task.assignedTo === user.userNumber);
    return {
      user,
      tasks: userTasks,
      completed: userTasks.filter((task) => task.status === "Completed").length,
      inProgress: userTasks.filter((task) => task.status === "In Progress").length,
      total: userTasks.length,
      scheduleRange: getDateRangeLabel(userTasks),
    };
  });

  const unassignedTasks = filteredTasks.filter((task) => !task.assignedTo);

  const tasksByStatus = {
    "Not Started": filteredTasks.filter((task) => task.status === "Not Started").length,
    "In Progress": inProgressTasks,
    Completed: completedTasks,
  };

  const upcomingDeadlines = [...filteredTasks]
    .filter((task) => task.status !== "Completed" && toDate(task.endDate))
    .sort((a, b) => toDate(a.endDate) - toDate(b.endDate))
    .slice(0, 5);

  const recentTasks = [...filteredTasks]
    .sort((a, b) => {
      const aStart = toDate(a.startDate)?.getTime() ?? 0;
      const bStart = toDate(b.startDate)?.getTime() ?? 0;
      return bStart - aStart;
    })
    .slice(0, 10);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Task Management Dashboard</h1>

      <div style={{ marginBottom: "20px", padding: "15px", background: "#f5f5f5", borderRadius: "4px" }}>
        <h2 style={{ marginTop: 0 }}>Filters</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "10px", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "#555" }}>Team Member</label>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            >
              <option value="all">All team members</option>
              <option value="unassigned">Unassigned only</option>
              {users.map((user) => (
                <option key={user.userNumber} value={user.userNumber}>
                  {user.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "#555" }}>Team Type</label>
            <select
              value={teamTypeFilter}
              onChange={(e) => setTeamTypeFilter(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            >
              <option value="all">All team types</option>
              {teamTypes.map((type) => (
                <option key={type.teamTypeId} value={type.teamTypeId}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "#555" }}>Task Type</label>
            <select
              value={taskTypeFilter}
              onChange={(e) => setTaskTypeFilter(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            >
              <option value="all">All task types</option>
              {taskTypes.map((type) => (
                <option key={type.taskTypeId} value={type.taskTypeId}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "#555" }}>Schedule</label>
            <select
              value={scheduleFilter}
              onChange={(e) => setScheduleFilter(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            >
              <option value="all">All tasks</option>
              <option value="overdue">Overdue only</option>
              <option value="week">This week</option>
            </select>
          </div>

          <button
            onClick={() => {
              setAssigneeFilter("all");
              setTeamTypeFilter("all");
              setTaskTypeFilter("all");
              setScheduleFilter("all");
            }}
            style={{
              padding: "8px 16px",
              background: hasActiveFilters ? "#007bff" : "#b0b0b0",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: hasActiveFilters ? "pointer" : "default",
            }}
            disabled={!hasActiveFilters}
          >
            Reset Filters
          </button>
        </div>

        <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
          Showing {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
          {hasActiveFilters ? " in the current dashboard view." : "."}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "30px" }}>
        <div style={{ padding: "15px", background: "#e3f2fd", borderRadius: "4px", borderLeft: "4px solid #2196f3" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#2196f3" }}>{totalProjects}</div>
          <div style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>{hasActiveFilters ? "Projects In View" : "Projects"}</div>
        </div>

        <div style={{ padding: "15px", background: "#f3e5f5", borderRadius: "4px", borderLeft: "4px solid #9c27b0" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#9c27b0" }}>{totalTasks}</div>
          <div style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>{hasActiveFilters ? "Visible Tasks" : "Total Tasks"}</div>
        </div>

        <div style={{ padding: "15px", background: "#e8f5e9", borderRadius: "4px", borderLeft: "4px solid #4caf50" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#4caf50" }}>{completedTasks}</div>
          <div style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>Completed</div>
        </div>

        <div style={{ padding: "15px", background: "#fff3e0", borderRadius: "4px", borderLeft: "4px solid #ff9800" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#ff9800" }}>{highPriorityTasks}</div>
          <div style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>High Priority Open</div>
        </div>

        <div style={{ padding: "15px", background: "#fdecea", borderRadius: "4px", borderLeft: "4px solid #e53935" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#e53935" }}>{overdueTasks}</div>
          <div style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>Overdue Tasks</div>
        </div>

        <div style={{ padding: "15px", background: "#e8f1ff", borderRadius: "4px", borderLeft: "4px solid #3949ab" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#3949ab" }}>{upcomingTasks}</div>
          <div style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>Due In 7 Days</div>
        </div>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h2>Status Overview</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px" }}>
          {Object.entries(tasksByStatus).map(([status, count]) => (
            <div key={status} style={{ padding: "15px", background: "#f5f5f5", borderRadius: "4px" }}>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{count}</div>
              <div style={{ color: "#666", fontSize: "12px", marginTop: "5px" }}>{status}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h2>Upcoming Deadlines</h2>
        {upcomingDeadlines.length === 0 ? (
          <p>No task deadlines match the current filters.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "15px" }}>
            {upcomingDeadlines.map((task) => {
              const daysUntil = getDaysUntil(task.endDate);
              const urgencyColor = daysUntil !== null && daysUntil < 0 ? "#e53935" : daysUntil !== null && daysUntil <= 2 ? "#fb8c00" : "#1e88e5";

              return (
                <div key={task.taskId} style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "4px", borderLeft: `4px solid ${urgencyColor}` }}>
                  <div style={{ fontWeight: "bold", marginBottom: "6px" }}>{task.name}</div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>
                    {getAssigneeName(task.assignedTo)}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>
                    Type: {getTaskTypeName(task.taskTypeId)}
                  </div>
                  <div style={{ fontSize: "12px", color: "#555" }}>Start: {formatDisplayDate(task.startDate)}</div>
                  <div style={{ fontSize: "12px", color: "#555" }}>End: {formatDisplayDate(task.endDate)}</div>
                  <div style={{ fontSize: "12px", color: urgencyColor, marginTop: "8px", fontWeight: "bold" }}>
                    {daysUntil === null ? "No deadline" : daysUntil < 0 ? `${Math.abs(daysUntil)} day(s) overdue` : `${daysUntil} day(s) remaining`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h2>Team Workload</h2>
        {tasksByAssignee.filter((item) => item.total > 0).length === 0 && unassignedTasks.length === 0 ? (
          <p>No tasks match the current filters.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "15px" }}>
            {tasksByAssignee
              .filter((item) => item.total > 0)
              .map((item) => (
                <div
                  key={item.user.userNumber}
                  style={{
                    padding: "15px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    borderLeft: `4px solid ${getAssigneeColor(item.user.userNumber)}`,
                  }}
                >
                  <h4 style={{ margin: "0 0 10px 0", color: getAssigneeColor(item.user.userNumber) }}>
                    {item.user.fullName}
                  </h4>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
                    {item.user.roles} · {getTeamTypeName(item.user.teamTypeId)}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                    {item.total} task{item.total !== 1 ? "s" : ""}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                    <div>Completed: {item.completed}</div>
                    <div>In progress: {item.inProgress}</div>
                    <div>Schedule: {item.scheduleRange}</div>
                  </div>
                </div>
              ))}

            {unassignedTasks.length > 0 && (
              <div
                style={{
                  padding: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  borderLeft: "4px solid #999",
                  background: "#fafafa",
                }}
              >
                <h4 style={{ margin: "0 0 10px 0", color: "#999" }}>Unassigned</h4>
                <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                  {unassignedTasks.length} task{unassignedTasks.length !== 1 ? "s" : ""}
                </div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                  <div>Waiting for assignment</div>
                  <div>Schedule: {getDateRangeLabel(unassignedTasks)}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <h2>Recent Activity</h2>
        {recentTasks.length === 0 ? (
          <p>No tasks match the current filters.</p>
        ) : (
          <div style={{ borderTop: "1px solid #ddd" }}>
            {recentTasks.map((task) => (
              <div
                key={task.taskId}
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #eee",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: "bold" }}>{task.name}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    Assigned to:{" "}
                    <span style={{ color: getAssigneeColor(task.assignedTo) }}>
                      {getAssigneeName(task.assignedTo)}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                    Type: {getTaskTypeName(task.taskTypeId)}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                    Start: {formatDisplayDate(task.startDate)} | End: {formatDisplayDate(task.endDate)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "3px",
                      fontSize: "12px",
                      background:
                        task.status === "Completed"
                          ? "#d4edda"
                          : task.status === "In Progress"
                            ? "#fff3cd"
                            : "#e2e3e5",
                      color:
                        task.status === "Completed"
                          ? "#155724"
                          : task.status === "In Progress"
                            ? "#856404"
                            : "#383d41",
                    }}
                  >
                    {task.status}
                  </span>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "3px",
                      fontSize: "12px",
                      background:
                        task.priority === "High"
                          ? "#f8d7da"
                          : task.priority === "Medium"
                            ? "#fff3cd"
                            : "#d1ecf1",
                      color:
                        task.priority === "High"
                          ? "#721c24"
                          : task.priority === "Medium"
                            ? "#856404"
                            : "#0c5460",
                    }}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
