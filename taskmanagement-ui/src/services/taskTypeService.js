import api from './api';

const taskTypeService = {
  async getAllTaskTypes() {
    try {
      const response = await api.get('/TaskTypes');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch task types:', error);
      return [];
    }
  },

  getDefaultTaskTypes() {
    return [
      { taskTypeId: 1, name: 'Development', description: 'Development work' },
      { taskTypeId: 2, name: 'Technical', description: 'Technical task' },
      { taskTypeId: 3, name: 'Functional', description: 'Functional task' },
    ];
  },
};

export default taskTypeService;
