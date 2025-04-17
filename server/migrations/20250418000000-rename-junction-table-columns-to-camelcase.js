'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // StudentGroup junction table - rename snake_case columns to camelCase
    try {
      // Check if student_groups table exists
      const tables = await queryInterface.showAllTables();
      if (tables.includes('student_groups')) {
        // Rename student_id to studentId
        await queryInterface.renameColumn('student_groups', 'student_id', 'studentId');
        // Rename group_id to groupId
        await queryInterface.renameColumn('student_groups', 'group_id', 'groupId');
        // Rename created_at to createdAt (if not already renamed)
        if ((await queryInterface.describeTable('student_groups')).created_at) {
          await queryInterface.renameColumn('student_groups', 'created_at', 'createdAt');
        }
        // Rename updated_at to updatedAt (if not already renamed)
        if ((await queryInterface.describeTable('student_groups')).updated_at) {
          await queryInterface.renameColumn('student_groups', 'updated_at', 'updatedAt');
        }
        console.log('Successfully renamed student_groups columns to camelCase');
      } else {
        console.log('student_groups table does not exist, skipping');
      }
    } catch (error) {
      console.error('Error renaming columns in student_groups:', error.message);
    }

    // Check for other tables that might need column renames
    try {
      const tables = await queryInterface.showAllTables();
      
      // SystemSettings table (if it exists)
      if (tables.includes('system_settings')) {
        const columns = await queryInterface.describeTable('system_settings');
        if (columns.setting_key) {
          await queryInterface.renameColumn('system_settings', 'setting_key', 'settingKey');
        }
        if (columns.setting_value) {
          await queryInterface.renameColumn('system_settings', 'setting_value', 'settingValue');
        }
        if (columns.created_at) {
          await queryInterface.renameColumn('system_settings', 'created_at', 'createdAt');
        }
        if (columns.updated_at) {
          await queryInterface.renameColumn('system_settings', 'updated_at', 'updatedAt');
        }
        console.log('Successfully renamed system_settings columns to camelCase');
      }
      
      // SessionParticipants table (if it exists)
      if (tables.includes('session_participants')) {
        const columns = await queryInterface.describeTable('session_participants');
        if (columns.student_id) {
          await queryInterface.renameColumn('session_participants', 'student_id', 'studentId');
        }
        if (columns.session_id) {
          await queryInterface.renameColumn('session_participants', 'session_id', 'sessionId');
        }
        if (columns.created_at) {
          await queryInterface.renameColumn('session_participants', 'created_at', 'createdAt');
        }
        if (columns.updated_at) {
          await queryInterface.renameColumn('session_participants', 'updated_at', 'updatedAt');
        }
        console.log('Successfully renamed session_participants columns to camelCase');
      }
      
      // ScoreLogs table (if it exists)
      if (tables.includes('score_logs')) {
        const columns = await queryInterface.describeTable('score_logs');
        if (columns.session_id) {
          await queryInterface.renameColumn('score_logs', 'session_id', 'sessionId');
        }
        if (columns.student_id) {
          await queryInterface.renameColumn('score_logs', 'student_id', 'studentId');
        }
        if (columns.created_at) {
          await queryInterface.renameColumn('score_logs', 'created_at', 'createdAt');
        }
        if (columns.updated_at) {
          await queryInterface.renameColumn('score_logs', 'updated_at', 'updatedAt');
        }
        console.log('Successfully renamed score_logs columns to camelCase');
      }
      
      // Update any other tables with snake_case columns as needed
      
    } catch (error) {
      console.error('Error in additional column renaming:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert the changes if needed
    try {
      const tables = await queryInterface.showAllTables();
      
      // StudentGroup junction table
      if (tables.includes('student_groups')) {
        // Rename back to snake_case
        await queryInterface.renameColumn('student_groups', 'studentId', 'student_id');
        await queryInterface.renameColumn('student_groups', 'groupId', 'group_id');
        await queryInterface.renameColumn('student_groups', 'createdAt', 'created_at');
        await queryInterface.renameColumn('student_groups', 'updatedAt', 'updated_at');
      }
      
      // SystemSettings table
      if (tables.includes('system_settings')) {
        const columns = await queryInterface.describeTable('system_settings');
        if (columns.settingKey) {
          await queryInterface.renameColumn('system_settings', 'settingKey', 'setting_key');
        }
        if (columns.settingValue) {
          await queryInterface.renameColumn('system_settings', 'settingValue', 'setting_value');
        }
        if (columns.createdAt) {
          await queryInterface.renameColumn('system_settings', 'createdAt', 'created_at');
        }
        if (columns.updatedAt) {
          await queryInterface.renameColumn('system_settings', 'updatedAt', 'updated_at');
        }
      }
      
      // SessionParticipants table
      if (tables.includes('session_participants')) {
        const columns = await queryInterface.describeTable('session_participants');
        if (columns.studentId) {
          await queryInterface.renameColumn('session_participants', 'studentId', 'student_id');
        }
        if (columns.sessionId) {
          await queryInterface.renameColumn('session_participants', 'sessionId', 'session_id');
        }
        if (columns.createdAt) {
          await queryInterface.renameColumn('session_participants', 'createdAt', 'created_at');
        }
        if (columns.updatedAt) {
          await queryInterface.renameColumn('session_participants', 'updatedAt', 'updated_at');
        }
      }
      
      // ScoreLogs table
      if (tables.includes('score_logs')) {
        const columns = await queryInterface.describeTable('score_logs');
        if (columns.sessionId) {
          await queryInterface.renameColumn('score_logs', 'sessionId', 'session_id');
        }
        if (columns.studentId) {
          await queryInterface.renameColumn('score_logs', 'studentId', 'student_id');
        }
        if (columns.createdAt) {
          await queryInterface.renameColumn('score_logs', 'createdAt', 'created_at');
        }
        if (columns.updatedAt) {
          await queryInterface.renameColumn('score_logs', 'updatedAt', 'updated_at');
        }
      }
      
    } catch (error) {
      console.error('Error reverting column renames:', error.message);
    }
  }
}; 