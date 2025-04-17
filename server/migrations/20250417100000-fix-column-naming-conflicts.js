'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Fix camelCase columns back to snake_case for consistency
    try {
      // Check if the camelCase columns exist to handle potential idempotency
      const tableInfo = await queryInterface.describeTable('groups');
      
      // Only rename if camelCase columns exist
      const columnsToFix = [];
      
      if (tableInfo.createdAt) {
        columnsToFix.push(queryInterface.renameColumn('groups', 'createdAt', 'created_at'));
      }
      
      if (tableInfo.updatedAt) {
        columnsToFix.push(queryInterface.renameColumn('groups', 'updatedAt', 'updated_at'));
      }
      
      // Fix students table
      const studentsInfo = await queryInterface.describeTable('students');
      
      if (studentsInfo.createdAt) {
        columnsToFix.push(queryInterface.renameColumn('students', 'createdAt', 'created_at'));
      }
      
      if (studentsInfo.updatedAt) {
        columnsToFix.push(queryInterface.renameColumn('students', 'updatedAt', 'updated_at'));
      }
      
      if (studentsInfo.currentSessionId) {
        columnsToFix.push(queryInterface.renameColumn('students', 'currentSessionId', 'current_session_id'));
      }
      
      // Fix templates table
      const templatesInfo = await queryInterface.describeTable('templates');
      
      if (templatesInfo.createdAt) {
        columnsToFix.push(queryInterface.renameColumn('templates', 'createdAt', 'created_at'));
      }
      
      if (templatesInfo.updatedAt) {
        columnsToFix.push(queryInterface.renameColumn('templates', 'updatedAt', 'updated_at'));
      }
      
      if (templatesInfo.isActive) {
        columnsToFix.push(queryInterface.renameColumn('templates', 'isActive', 'is_active'));
      }
      
      // Fix student_groups table
      const studentGroupsInfo = await queryInterface.describeTable('student_groups');
      
      if (studentGroupsInfo.studentId) {
        columnsToFix.push(queryInterface.renameColumn('student_groups', 'studentId', 'student_id'));
      }
      
      if (studentGroupsInfo.groupId) {
        columnsToFix.push(queryInterface.renameColumn('student_groups', 'groupId', 'group_id'));
      }
      
      if (studentGroupsInfo.createdAt) {
        columnsToFix.push(queryInterface.renameColumn('student_groups', 'createdAt', 'created_at'));
      }
      
      if (studentGroupsInfo.updatedAt) {
        columnsToFix.push(queryInterface.renameColumn('student_groups', 'updatedAt', 'updated_at'));
      }
      
      // Fix template_groups table
      const templateGroupsInfo = await queryInterface.describeTable('template_groups');
      
      if (templateGroupsInfo.templateId) {
        columnsToFix.push(queryInterface.renameColumn('template_groups', 'templateId', 'template_id'));
      }
      
      if (templateGroupsInfo.groupId) {
        columnsToFix.push(queryInterface.renameColumn('template_groups', 'groupId', 'group_id'));
      }
      
      if (templateGroupsInfo.createdAt) {
        columnsToFix.push(queryInterface.renameColumn('template_groups', 'createdAt', 'created_at'));
      }
      
      if (templateGroupsInfo.updatedAt) {
        columnsToFix.push(queryInterface.renameColumn('template_groups', 'updatedAt', 'updated_at'));
      }
      
      // Execute all the changes
      if (columnsToFix.length > 0) {
        await Promise.all(columnsToFix);
      }
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert back to camelCase if needed
    try {
      await Promise.all([
        // Groups table
        queryInterface.renameColumn('groups', 'created_at', 'createdAt'),
        queryInterface.renameColumn('groups', 'updated_at', 'updatedAt'),
        
        // Students table
        queryInterface.renameColumn('students', 'created_at', 'createdAt'),
        queryInterface.renameColumn('students', 'updated_at', 'updatedAt'),
        queryInterface.renameColumn('students', 'current_session_id', 'currentSessionId'),
        
        // Templates table
        queryInterface.renameColumn('templates', 'created_at', 'createdAt'),
        queryInterface.renameColumn('templates', 'updated_at', 'updatedAt'),
        queryInterface.renameColumn('templates', 'is_active', 'isActive'),
        
        // Student_groups table
        queryInterface.renameColumn('student_groups', 'student_id', 'studentId'),
        queryInterface.renameColumn('student_groups', 'group_id', 'groupId'),
        queryInterface.renameColumn('student_groups', 'created_at', 'createdAt'),
        queryInterface.renameColumn('student_groups', 'updated_at', 'updatedAt'),
        
        // Template_groups table
        queryInterface.renameColumn('template_groups', 'template_id', 'templateId'),
        queryInterface.renameColumn('template_groups', 'group_id', 'groupId'),
        queryInterface.renameColumn('template_groups', 'created_at', 'createdAt'),
        queryInterface.renameColumn('template_groups', 'updated_at', 'updatedAt')
      ]);
    } catch (error) {
      console.error('Migration rollback error:', error);
      throw error;
    }
  }
}; 