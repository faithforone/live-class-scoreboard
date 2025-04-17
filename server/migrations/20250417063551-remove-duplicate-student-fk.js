'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableName = 'students';
    const constraintNameToRemove = 'students_current_session_id_fkey'; // \d students 에서 확인된 중복 FK 이름

    await queryInterface.sequelize.transaction(async (transaction) => {
      try {
        console.log(`Removing duplicate foreign key constraint '${constraintNameToRemove}' from ${tableName}...`);
        await queryInterface.removeConstraint(tableName, constraintNameToRemove, { transaction });
        console.log(`Constraint '${constraintNameToRemove}' removed successfully.`);
      } catch (error) {
        // 제약 조건이 이미 없거나 이름이 다른 경우 경고만 표시
        console.warn(`Could not remove constraint ${constraintNameToRemove} (maybe it was already removed or named differently?): ${error.message}`);
      }
    });
  },

  async down (queryInterface, Sequelize) {
    // up 함수에서 제거한 제약 조건을 다시 추가 (롤백 시 필요)
    const tableName = 'students';
    const constraintNameToRestore = 'students_current_session_id_fkey';

    await queryInterface.sequelize.transaction(async (transaction) => {
      console.log(`Adding foreign key constraint '${constraintNameToRestore}' back to ${tableName}...`);
      await queryInterface.addConstraint(tableName, {
        fields: ['currentSessionId'], // 현재 컬럼 이름은 currentSessionId
        type: 'foreign key',
        name: constraintNameToRestore, // 복구할 제약 조건 이름
        references: {
          table: 'class_sessions', // 참조 테이블
          field: 'id' // 참조 컬럼
        },
        onDelete: 'SET NULL', // \d students 에서 확인된 옵션
        onUpdate: 'CASCADE', // \d students 에서 확인된 옵션
        transaction
      });
      console.log(`Constraint '${constraintNameToRestore}' added back.`);
    });
  }
};