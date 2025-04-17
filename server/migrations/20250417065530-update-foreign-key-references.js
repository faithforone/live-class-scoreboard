'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // !!! 중요: 실제 Constraint 이름은 DB에서 확인해야 할 수 있습니다 !!!
    // 보통 '테이블명_컬럼명_fkey' 형식이지만 다를 수 있습니다.
    // 예시 Constraint 이름: 'session_participants_student_id_fkey' (변경 전 기준)

    // --- session_participants.studentId FK 업데이트 ---
    try {
      // 1. 기존 FK 제약 조건 삭제 (이름 확인 필요!)
      // await queryInterface.removeConstraint('session_participants', 'session_participants_student_id_fkey'); // 예시 이름
      console.log('Attempting to update FK for session_participants.studentId without explicit removeConstraint.');
    } catch (error) {
      console.warn('Could not remove old constraint for session_participants.studentId (maybe doesnt exist?):', error.message);
    }
    // 2. 컬럼 변경 (Reference 추가) - changeColumn으로 시도
    await queryInterface.changeColumn('session_participants', 'studentId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'students', // 참조 테이블
        key: 'id'         // 참조 PK (id로 변경됨)
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // --- session_participants.sessionId FK 업데이트 ---
    try {
      // await queryInterface.removeConstraint('session_participants', 'session_participants_session_id_fkey'); // 예시 이름
      console.log('Attempting to update FK for session_participants.sessionId without explicit removeConstraint.');
    } catch (error) {
      console.warn('Could not remove old constraint for session_participants.sessionId (maybe doesnt exist?):', error.message);
    }
    await queryInterface.changeColumn('session_participants', 'sessionId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'class_sessions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // --- students.currentSessionId FK 업데이트 ---
    try {
       // await queryInterface.removeConstraint('students', 'students_current_session_id_fkey'); // 예시 이름
       console.log('Attempting to update FK for students.currentSessionId without explicit removeConstraint.');
    } catch (error) {
        console.warn('Could not remove old constraint for students.currentSessionId (maybe doesnt exist?):', error.message);
    }
    await queryInterface.changeColumn('students', 'currentSessionId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'class_sessions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // --- score_logs.participantId FK 추가 ---
    // 이 컬럼은 새로 추가되었으므로 기존 제약 조건 삭제 불필요
    await queryInterface.changeColumn('score_logs', 'participantId', {
      type: Sequelize.INTEGER,
      allowNull: false, // null 비허용으로 변경
      references: {
        model: 'session_participants',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE' // 또는 SET NULL 등 정책에 맞게
    });
  },

  async down (queryInterface, Sequelize) {
    // 롤백 로직: 위에서 수정한 내용을 되돌림
    // changeColumn 만으로는 참조를 완전히 제거하기 어려울 수 있음
    // 더 안전한 방법은 up에서 추가한 constraint를 여기서 removeConstraint 하는 것

    // 임시: 이전 down 함수 로직 유지 (참조 제거 시도)
    await queryInterface.changeColumn('score_logs', 'participantId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: null
    });
    await queryInterface.changeColumn('students', 'currentSessionId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: null
    });
    await queryInterface.changeColumn('session_participants', 'studentId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: null
    });
    await queryInterface.changeColumn('session_participants', 'sessionId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: null
    });
  }
};