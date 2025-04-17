'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // students 테이블에 이미 id 컬럼이 존재하므로 아무 작업도 하지 않습니다.
    /**
     * await queryInterface.renameColumn(
     * 'students',
     * 'student_id',
     * 'id'
     * );
     */
     console.log('Skipping rename student_id to id in students (assuming id already exists).');
     // 위 로그는 선택 사항입니다.
  },

  async down (queryInterface, Sequelize) {
    // 롤백 시에도 특별히 할 작업이 없습니다. (id를 student_id로 되돌리지 않음)
    /**
     * await queryInterface.renameColumn(
     * 'students',
     * 'id',
     * 'student_id'
     * );
     */
     console.log('Skipping revert id to student_id in students.');
     // 위 로그는 선택 사항입니다.
  }
};