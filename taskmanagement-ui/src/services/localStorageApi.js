// Mock API using localStorage for fully offline operation
// This replaces the need for a backend server

const STORAGE_KEY_PROJECTS = 'taskmanagement_projects';
const STORAGE_KEY_TASKS = 'taskmanagement_tasks';
const STORAGE_KEY_TEAM_MEMBERS = 'taskmanagement_team_members';

// Initialize empty local storage buckets if the backend is unavailable.
const initializeData = () => {
  if (!localStorage.getItem(STORAGE_KEY_TEAM_MEMBERS)) {
    localStorage.setItem(STORAGE_KEY_TEAM_MEMBERS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEY_PROJECTS)) {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEY_TASKS)) {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify([]));
  }
};

// Initialize on load
initializeData();

// Simulate API delays for realistic behavior
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Get next available ID
const getNextId = (items, idField = 'projectId') => {
  const ids = items.map(item => item[idField]);
  return Math.max(...ids, 0) + 1;
};

const buildFullName = (firstName, middleInitial, lastName) =>
  [firstName, middleInitial, lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

const memberToUser = (member) => {
  const nameParts = (member.name ?? '').split(/\s+/).filter(Boolean);
  const firstName = member.firstName ?? nameParts[0] ?? '';
  const lastName = member.lastName ?? nameParts.slice(1).join(' ') ?? '';
  const middleInitial = member.middleInitial ?? '';

  return {
    userNumber: member.userNumber ?? member.memberId,
    ssn: member.ssn ?? '',
    firstName,
    middleInitial,
    lastName,
    roles: member.roles ?? member.role ?? '',
    fullName: buildFullName(firstName, middleInitial, lastName) || member.name || '',
  };
};

const userToMember = (user, existingMembers) => {
  const memberId = user.userNumber && user.userNumber > 0
    ? user.userNumber
    : getNextId(existingMembers, 'memberId');

  return {
    memberId,
    userNumber: memberId,
    name: buildFullName(user.firstName, user.middleInitial, user.lastName),
    firstName: user.firstName ?? '',
    middleInitial: user.middleInitial ?? '',
    lastName: user.lastName ?? '',
    ssn: user.ssn ?? '',
    email: user.email ?? '',
    role: user.roles ?? '',
    roles: user.roles ?? '',
    color: existingMembers.find((member) => member.memberId === memberId)?.color ?? '#4ECDC4',
  };
};

export const localStorageApi = {
  // TEAM MEMBERS
  async getTeamMembers() {
    await delay();
    const members = JSON.parse(localStorage.getItem(STORAGE_KEY_TEAM_MEMBERS)) || [];
    return { data: members };
  },

  async addTeamMember(member) {
    await delay();
    const members = JSON.parse(localStorage.getItem(STORAGE_KEY_TEAM_MEMBERS)) || [];
    const newMember = {
      memberId: getNextId(members, 'memberId'),
      ...member,
    };
    members.push(newMember);
    localStorage.setItem(STORAGE_KEY_TEAM_MEMBERS, JSON.stringify(members));
    return { data: newMember };
  },

  async updateTeamMember(memberId, member) {
    await delay();
    const members = JSON.parse(localStorage.getItem(STORAGE_KEY_TEAM_MEMBERS)) || [];
    const index = members.findIndex(m => m.memberId === parseInt(memberId, 10));
    if (index === -1) throw new Error('Team member not found');
    members[index] = { ...members[index], ...member, memberId: parseInt(memberId, 10) };
    localStorage.setItem(STORAGE_KEY_TEAM_MEMBERS, JSON.stringify(members));
    return { data: members[index] };
  },

  async deleteTeamMember(memberId) {
    await delay();
    let members = JSON.parse(localStorage.getItem(STORAGE_KEY_TEAM_MEMBERS)) || [];
    members = members.filter(m => m.memberId !== parseInt(memberId, 10));
    localStorage.setItem(STORAGE_KEY_TEAM_MEMBERS, JSON.stringify(members));
    return { data: { success: true } };
  },

  async getUsers() {
    await delay();
    const members = JSON.parse(localStorage.getItem(STORAGE_KEY_TEAM_MEMBERS)) || [];
    return { data: members.map(memberToUser) };
  },

  async addUser(user) {
    await delay();
    const members = JSON.parse(localStorage.getItem(STORAGE_KEY_TEAM_MEMBERS)) || [];
    const member = userToMember(user, members);
    members.push(member);
    localStorage.setItem(STORAGE_KEY_TEAM_MEMBERS, JSON.stringify(members));
    return { data: memberToUser(member) };
  },

  async deleteUser(userNumber) {
    return this.deleteTeamMember(userNumber);
  },

  // PROJECTS
  async getProjects() {
    await delay();
    const projects = JSON.parse(localStorage.getItem(STORAGE_KEY_PROJECTS)) || [];
    return { data: projects };
  },

  async addProject(project) {
    await delay();
    const projects = JSON.parse(localStorage.getItem(STORAGE_KEY_PROJECTS)) || [];
    const newProject = {
      projectId: getNextId(projects, 'projectId'),
      ...project,
    };
    projects.push(newProject);
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    return { data: newProject };
  },

  async updateProject(projectId, project) {
    await delay();
    const projects = JSON.parse(localStorage.getItem(STORAGE_KEY_PROJECTS)) || [];
    const index = projects.findIndex(p => p.projectId === parseInt(projectId, 10));
    if (index === -1) throw new Error('Project not found');
    projects[index] = { ...projects[index], ...project, projectId: parseInt(projectId, 10) };
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    return { data: projects[index] };
  },

  async deleteProject(projectId) {
    await delay();
    let projects = JSON.parse(localStorage.getItem(STORAGE_KEY_PROJECTS)) || [];
    projects = projects.filter(p => p.projectId !== parseInt(projectId, 10));
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));

    let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY_TASKS)) || [];
    tasks = tasks.filter(t => t.projectId !== parseInt(projectId, 10));
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    return { data: { success: true } };
  },

  // TASKS
  async getTasks() {
    await delay();
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEY_TASKS)) || [];
    return { data: tasks };
  },

  async addTask(task) {
    await delay();
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEY_TASKS)) || [];
    const newTask = {
      taskId: getNextId(tasks, 'taskId'),
      ...task,
    };
    tasks.push(newTask);
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    return { data: newTask };
  },

  async updateTask(taskId, task) {
    await delay();
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEY_TASKS)) || [];
    const index = tasks.findIndex(t => t.taskId === parseInt(taskId, 10));
    if (index === -1) throw new Error('Task not found');
    tasks[index] = { ...tasks[index], ...task, taskId: parseInt(taskId, 10) };
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    return { data: tasks[index] };
  },

  async deleteTask(taskId) {
    await delay();
    let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY_TASKS)) || [];
    tasks = tasks.filter(t => t.taskId !== parseInt(taskId, 10) && t.parentTaskId !== parseInt(taskId, 10));
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    return { data: { success: true } };
  },
};

export default localStorageApi;
