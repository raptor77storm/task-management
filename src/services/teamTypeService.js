import api from './api';

const teamTypeService = {
  async getAllTeamTypes() {
    try {
      const response = await api.get('/TeamTypes');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch team types:', error);
      return [];
    }
  },

  getDefaultTeamTypes() {
    return [
      { teamTypeId: 1, name: 'Developer', description: 'Software development team' },
      { teamTypeId: 2, name: 'Technical', description: 'Technical and infrastructure team' },
      { teamTypeId: 3, name: 'Functional', description: 'Business and functional team' },
    ];
  },
};

export default teamTypeService;
