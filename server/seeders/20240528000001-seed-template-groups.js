'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, get the IDs of the groups and templates we're associating
    const [groups, templates] = await Promise.all([
      queryInterface.sequelize.query(
        'SELECT id FROM groups;',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      ),
      queryInterface.sequelize.query(
        'SELECT id FROM templates;',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      )
    ]);
    
    if (groups.length < 2 || templates.length < 2) {
      console.log('Not enough templates or groups for seeding associations');
      return;
    }
    
    const now = new Date();
    
    // Associate all groups with the first template (Basic Scoreboard)
    const templateGroupAssociations = [];
    for (const group of groups) {
      templateGroupAssociations.push({
        templateId: templates[0].id, // Basic Scoreboard template
        groupId: group.id,
        createdAt: now,
        updatedAt: now
      });
    }
    
    // Associate the first group with the second template (Science Lab)
    templateGroupAssociations.push({
      templateId: templates[1].id, // Science Lab template
      groupId: groups[0].id,
      createdAt: now,
      updatedAt: now
    });
    
    await queryInterface.bulkInsert('template_groups', templateGroupAssociations);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('template_groups', null, {});
  }
}; 