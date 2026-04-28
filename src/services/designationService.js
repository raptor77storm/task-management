// src/services/designationService.js
import api from './api';

const designationService = {
  // Fetch all available designations
  getAllDesignations: async () => {
    try {
      const response = await api.get('/Designations');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch designations:', error);
      return [];
    }
  },

  // Get common designations (default list if API fails)
  getDefaultDesignations: () => {
    return [
      { designationId: 1, name: 'Web Developer', description: 'Frontend/Backend development' },
      { designationId: 2, name: 'QA Engineer', description: 'Quality assurance and testing' },
      { designationId: 3, name: 'Project Manager', description: 'Project planning and coordination' },
      { designationId: 4, name: 'DevOps Engineer', description: 'Infrastructure and deployment' },
      { designationId: 5, name: 'UI/UX Designer', description: 'User interface and experience design' },
      { designationId: 6, name: 'Data Analyst', description: 'Data analysis and reporting' },
      { designationId: 7, name: 'Systems Admin', description: 'System administration' },
    ];
  },
};

export default designationService;
