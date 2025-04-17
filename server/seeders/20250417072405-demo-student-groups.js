'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Get existing students
    const students = await queryInterface.sequelize.query(
      'SELECT id FROM students;',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    // Get existing groups
    const groups = await queryInterface.sequelize.query(
      'SELECT id FROM groups;',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (students.length === 0 || groups.length === 0) {
      console.log('No students or groups found. Make sure to create them first.');
      return;
    }
    
    // Create associations - assign students to groups
    const studentGroups = [];
    
    // Example: Assign first half of students to group 1, second half to group 2
    students.forEach((student, index) => {
      // Assign to group 1 or 2 based on index (even/odd)
      const groupId = groups[index % groups.length].id;
      
      studentGroups.push({
        studentId: student.id,
        groupId: groupId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    await queryInterface.bulkInsert('StudentGroups', studentGroups, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('StudentGroups', null, {});
  }
};
