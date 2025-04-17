'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('class_sessions', 'template_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'templates',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('class_sessions', 'group_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'groups',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('class_sessions', 'template_id');
    await queryInterface.removeColumn('class_sessions', 'group_id');
  }
}; 