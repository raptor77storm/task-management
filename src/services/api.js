import axios from "axios";
import serverConfig from "../config/serverConfig";
import localStorageApi from "./localStorageApi";

const createBackendApi = () => {
  const instance = axios.create({
    baseURL: serverConfig.apiBase,
  });

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Create axios instance with dynamic API base
let backendApi = createBackendApi();

// Recreate axios instance when API config changes
window.addEventListener('api-config-changed', () => {
  backendApi = createBackendApi();
});

const normalizeEndpoint = (endpoint) => endpoint.replace(/\/+$/, "");

const extractId = (endpoint) => normalizeEndpoint(endpoint).split("/").pop();

const isProjectsEndpoint = (endpoint) => normalizeEndpoint(endpoint).startsWith("/Projects");
const isTasksEndpoint = (endpoint) => normalizeEndpoint(endpoint).startsWith("/Tasks");
const isUsersEndpoint = (endpoint) => {
  const normalized = normalizeEndpoint(endpoint);
  return normalized.startsWith("/Users") || normalized.startsWith("/TeamMembers");
};

const translateEndpoint = (endpoint) => endpoint.replace("/TeamMembers", "/Users");

const shouldUseOfflineFallback = (error) => !error.response;

const mapTaskFromBackend = (task) => ({
  ...task,
  taskId: task.taskId ?? task.taskItemId,
  assignedTo: task.assignedTo ?? task.assignedToUserId ?? null,
});

const mapProjectFromBackend = (project) => ({
  ...project,
  priority: project.priority ?? "Medium",
});

const mapTaskToBackend = (task, taskIdOverride) => ({
  taskItemId: taskIdOverride ?? task.taskItemId ?? task.taskId ?? 0,
  projectId: Number(task.projectId),
  parentTaskId: task.parentTaskId ?? null,
  assignedToUserId: task.assignedToUserId ?? task.assignedTo ?? null,
  name: task.name ?? "",
  description: task.description ?? "",
  startDate: task.startDate ?? null,
  endDate: task.endDate ?? null,
  status: task.status ?? "Not Started",
  priority: task.priority ?? "Medium",
  taskTypeId: task.taskTypeId ?? null,
  overheadCosts: task.overheadCosts ?? 0,
  predecessorTaskId: task.predecessorTaskId ?? null,
  budgetAtCompletion: task.budgetAtCompletion ?? 0,
  plannedWorkPercentage: task.plannedWorkPercentage ?? 0,
});

const mapProjectToBackend = (project, projectIdOverride) => ({
  projectId: projectIdOverride ?? project.projectId ?? 0,
  name: project.name ?? "",
  description: project.description ?? "",
  startDate: project.startDate ?? null,
  endDate: project.endDate ?? null,
  status: project.status ?? "Not Started",
  priority: project.priority ?? "Medium",
  programmeId: Number(project.programmeId ?? 1),
  calculatedEndDate: project.calculatedEndDate ?? null,
});

const mapLegacyMemberToBackendUser = (member) => {
  const trimmedName = (member.name ?? "").trim();
  const nameParts = trimmedName.split(/\s+/).filter(Boolean);

  return {
    userNumber: member.userNumber ?? member.memberId ?? 0,
    firstName: member.firstName ?? nameParts[0] ?? "",
    middleInitial: member.middleInitial ?? "",
    lastName: member.lastName ?? nameParts.slice(1).join(" ") ?? "",
    roles: member.roles ?? member.role ?? "",
    ssn: member.ssn ?? "",
  };
};

const getOfflineResponse = async (method, endpoint, data) => {
  const id = extractId(endpoint);

  if (method === "get") {
    if (normalizeEndpoint(endpoint) === "/Projects") return localStorageApi.getProjects();
    if (normalizeEndpoint(endpoint) === "/Tasks") return localStorageApi.getTasks();
    if (isUsersEndpoint(endpoint)) return localStorageApi.getUsers();
  }

  if (method === "post") {
    if (normalizeEndpoint(endpoint) === "/Projects") return localStorageApi.addProject(data);
    if (normalizeEndpoint(endpoint) === "/Tasks") return localStorageApi.addTask(data);
    if (isUsersEndpoint(endpoint)) return localStorageApi.addUser(data);
  }

  if (method === "put") {
    if (isProjectsEndpoint(endpoint)) return localStorageApi.updateProject(id, data);
    if (isTasksEndpoint(endpoint)) return localStorageApi.updateTask(id, data);
  }

  if (method === "delete") {
    if (isProjectsEndpoint(endpoint)) return localStorageApi.deleteProject(id);
    if (isTasksEndpoint(endpoint)) return localStorageApi.deleteTask(id);
    if (isUsersEndpoint(endpoint)) return localStorageApi.deleteUser(id);
  }

  return null;
};

const apiWrapper = {
  async get(endpoint) {
    const backendEndpoint = translateEndpoint(endpoint);

    try {
      const response = await backendApi.get(backendEndpoint);

      if (normalizeEndpoint(endpoint) === "/Tasks") {
        return { ...response, data: response.data.map(mapTaskFromBackend) };
      }

      if (normalizeEndpoint(endpoint) === "/Projects") {
        return { ...response, data: response.data.map(mapProjectFromBackend) };
      }

      return response;
    } catch (error) {
      if (!shouldUseOfflineFallback(error)) throw error;
      console.warn(`Backend unavailable, using offline storage for: ${endpoint}`);
      const fallback = await getOfflineResponse("get", endpoint);
      if (fallback) return fallback;
      throw error;
    }
  },

  async post(endpoint, data) {
    const backendEndpoint = translateEndpoint(endpoint);

    try {
      if (normalizeEndpoint(endpoint) === "/Projects") {
        const response = await backendApi.post(backendEndpoint, mapProjectToBackend(data));
        return { ...response, data: mapProjectFromBackend(response.data) };
      }

      if (normalizeEndpoint(endpoint) === "/Tasks") {
        const response = await backendApi.post(backendEndpoint, mapTaskToBackend(data));
        return { ...response, data: mapTaskFromBackend(response.data) };
      }

      if (isUsersEndpoint(endpoint)) {
        const payload = normalizeEndpoint(endpoint) === "/TeamMembers"
          ? mapLegacyMemberToBackendUser(data)
          : data;
        return await backendApi.post(backendEndpoint, payload);
      }

      return await backendApi.post(backendEndpoint, data);
    } catch (error) {
      if (!shouldUseOfflineFallback(error)) throw error;
      console.warn(`Backend unavailable, using offline storage for: ${endpoint}`);
      const fallback = await getOfflineResponse("post", endpoint, data);
      if (fallback) return fallback;
      throw error;
    }
  },

  async put(endpoint, data) {
    const id = extractId(endpoint);

    try {
      if (normalizeEndpoint(endpoint).match(/^\/Tasks\/\d+\/status$/)) {
        return await backendApi.put(endpoint, data);
      }

      if (isTasksEndpoint(endpoint)) {
        const existingResponse = await backendApi.get(`/Tasks/${id}`);
        const mergedTask = mapTaskToBackend(
          {
            ...existingResponse.data,
            ...mapTaskFromBackend(existingResponse.data),
            ...data,
          },
          Number(id)
        );

        await backendApi.put(`/Tasks/${id}`, mergedTask);
        return { data: mapTaskFromBackend(mergedTask) };
      }

      if (isProjectsEndpoint(endpoint)) {
        const existingResponse = await backendApi.get(`/Projects/${id}`);
        const mergedProject = mapProjectToBackend(
          {
            ...existingResponse.data,
            ...data,
          },
          Number(id)
        );

        await backendApi.put(`/Projects/${id}`, mergedProject);
        return { data: mapProjectFromBackend(mergedProject) };
      }

      return await backendApi.put(translateEndpoint(endpoint), data);
    } catch (error) {
      if (!shouldUseOfflineFallback(error)) throw error;
      console.warn(`Backend unavailable, using offline storage for: ${endpoint}`);
      const fallback = await getOfflineResponse("put", endpoint, data);
      if (fallback) return fallback;
      throw error;
    }
  },

  async delete(endpoint) {
    const backendEndpoint = translateEndpoint(endpoint);

    try {
      return await backendApi.delete(backendEndpoint);
    } catch (error) {
      if (!shouldUseOfflineFallback(error)) throw error;
      console.warn(`Backend unavailable, using offline storage for: ${endpoint}`);
      const fallback = await getOfflineResponse("delete", endpoint);
      if (fallback) return fallback;
      throw error;
    }
  },
};

export default apiWrapper;
