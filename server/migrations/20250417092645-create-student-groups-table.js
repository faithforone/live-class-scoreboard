'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if the table already exists
    const tables = await queryInterface.showAllTables();
    if (tables.includes('student_groups')) {
      console.log('student_groups table already exists, skipping creation');
      return;
    }

    // Create the table if it doesn't exist
    await queryInterface.createTable('student_groups', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'groups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' 
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint to prevent duplicate student-group pairs
    try {
      await queryInterface.addConstraint('student_groups', {
        fields: ['student_id', 'group_id'],
        type: 'unique',
        name: 'unique_student_group'
      });
    } catch (error) {
      console.log('Constraint unique_student_group already exists or could not be created');
    }
  },

  async down (queryInterface, Sequelize) {
    try {
      await queryInterface.dropTable('student_groups');
    } catch (error) {
      console.log('Failed to drop student_groups table:', error.message);
    }
  }
};
