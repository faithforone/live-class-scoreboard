'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await Promise.all([
      // 1. session_participants 테이블 컬럼 이름 변경
      queryInterface.renameColumn('session_participants', 'session_id', 'sessionId'),
      queryInterface.renameColumn('session_participants', 'student_id', 'studentId'),

      // 2. students 테이블 컬럼 이름 변경
      queryInterface.renameColumn('students', 'current_session_id', 'currentSessionId'),

      // 3. score_logs 테이블 컬럼 이름 변경
      queryInterface.renameColumn('score_logs', 'points', 'change')
    ]);
  },

  async down (queryInterface, Sequelize) {
    // up 함수에서 변경한 컬럼 이름들을 다시 원래대로 되돌림
    await Promise.all([
      // 1. session_participants 테이블 컬럼 이름 복구
      queryInterface.renameColumn('session_participants', 'sessionId', 'session_id'),
      queryInterface.renameColumn('session_participants', 'studentId', 'student_id'),

      // 2. students 테이블 컬럼 이름 복구
      queryInterface.renameColumn('students', 'currentSessionId', 'current_session_id'),

      // 3. score_logs 테이블 컬럼 이름 복구
      queryInterface.renameColumn('score_logs', 'change', 'points')
    ]);
  }
};