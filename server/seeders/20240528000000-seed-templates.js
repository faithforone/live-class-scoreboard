'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    
    await queryInterface.bulkInsert('templates', [
      {
        name: 'Basic Scoreboard',
        description: 'A simple template with basic metrics for classroom evaluation',
        metrics: JSON.stringify([
          {
            name: 'Participation',
            description: 'Active participation in class activities',
            maxScore: 10
          },
          {
            name: 'Teamwork',
            description: 'Ability to work effectively with others',
            maxScore: 10
          },
          {
            name: 'Problem Solving',
            description: 'Ability to solve problems creatively',
            maxScore: 10
          }
        ]),
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Science Lab',
        description: 'Template for evaluating science lab activities',
        metrics: JSON.stringify([
          {
            name: 'Hypothesis',
            description: 'Creation of a testable hypothesis',
            maxScore: 5
          },
          {
            name: 'Procedure',
            description: 'Following experimental procedures accurately',
            maxScore: 5
          },
          {
            name: 'Data Collection',
            description: 'Accurate collection and recording of data',
            maxScore: 5
          },
          {
            name: 'Analysis',
            description: 'Thoughtful analysis of experimental results',
            maxScore: 5
          },
          {
            name: 'Conclusion',
            description: 'Well-reasoned conclusion based on evidence',
            maxScore: 5
          }
        ]),
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('templates', null, {});
  }
}; 