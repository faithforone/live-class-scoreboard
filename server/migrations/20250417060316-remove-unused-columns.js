'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Promise.all 을 사용하여 여러 컬럼 삭제 작업을 동시에 실행 (효율성)
    await Promise.all([
      // 1. students 테이블에서 group_id 컬럼 삭제
      queryInterface.removeColumn('students', 'group_id'),

      // 2. class_sessions 테이블에서 불필요한 컬럼들 삭제
      queryInterface.removeColumn('class_sessions', 'feed_url'),
      queryInterface.removeColumn('class_sessions', 'widget_url'),
      queryInterface.removeColumn('class_sessions', 'created_by'),

      // 3. score_logs 테이블에서 불필요한 컬럼들 삭제
      // 주의: 이 컬럼들에 외래 키 제약 조건이 걸려있다면,
      // 제약 조건을 먼저 삭제해야 할 수도 있습니다. (removeConstraint)
      // 일단 컬럼 삭제를 시도합니다.
      queryInterface.removeColumn('score_logs', 'session_id'),
      queryInterface.removeColumn('score_logs', 'student_id'),
      queryInterface.removeColumn('score_logs', 'teacher_identifier')
    ]);
  },

  async down (queryInterface, Sequelize) {
    // up 함수에서 삭제한 컬럼들을 다시 추가 (롤백 시 필요)
    await Promise.all([
      // 1. students 테이블에 group_id 컬럼 복구
      queryInterface.addColumn('students', 'group_id', {
        type: Sequelize.INTEGER,
        allowNull: true // 원래 속성대로
        // references: { model: 'groups', key: 'id' } // 필요 시 FK 제약 조건도 복구
      }),

      // 2. class_sessions 테이블 컬럼들 복구
      queryInterface.addColumn('class_sessions', 'feed_url', {
        type: Sequelize.STRING,
        allowNull: true
      }),
      queryInterface.addColumn('class_sessions', 'widget_url', {
        type: Sequelize.STRING,
        allowNull: true
      }),
      queryInterface.addColumn('class_sessions', 'created_by', {
        type: Sequelize.STRING,
        allowNull: true
      }),

      // 3. score_logs 테이블 컬럼들 복구
      // 주의: down 함수에서는 컬럼 추가 후 필요 시 제약 조건도 다시 추가해야 합니다.
      queryInterface.addColumn('score_logs', 'session_id', {
        type: Sequelize.INTEGER,
        allowNull: false // 원래 속성대로
        // references: { model: 'class_sessions', key: 'id' } // 참조하는 PK 이름 확인 필요
      }),
      queryInterface.addColumn('score_logs', 'student_id', {
        type: Sequelize.INTEGER,
        allowNull: false // 원래 속성대로
        // references: { model: 'students', key: 'id' } // 참조하는 PK 이름 확인 필요
      }),
      queryInterface.addColumn('score_logs', 'teacher_identifier', {
        type: Sequelize.STRING,
        allowNull: true
      })
    ]);
    // 만약 외래 키 제약 조건도 복구해야 한다면 addConstraint 사용
  }
};
