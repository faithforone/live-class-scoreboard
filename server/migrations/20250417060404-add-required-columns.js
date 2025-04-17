'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Promise.all 블록은 이제 비어있거나 다른 작업만 남을 수 있습니다.
    // Promise.all 내부 또는 외부에 아래 로그 추가 가능
    // await Promise.all([
      // 1. session_participants 테이블에 score 컬럼 추가 (이전 단계에서 이미 주석 처리됨)
      /*
      queryInterface.addColumn(
        'session_participants',
        'score',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        }
      ),
      */
      // 2. class_sessions 테이블에 name 컬럼 추가 (이전 단계에서 이미 주석 처리됨)
      /*
      queryInterface.addColumn(
        'class_sessions',
        'name',
        {
          type: Sequelize.STRING,
          allowNull: true
        }
      ),
      */
      // 3. class_sessions 테이블에 urlIdentifier 컬럼 추가 (이전 단계에서 이미 주석 처리됨)
      /*
      queryInterface.addColumn(
        'class_sessions',
        'urlIdentifier',
        {
          type: Sequelize.STRING, // 또는 UUID
          allowNull: true,
          // unique: true
        }
      ),
      */
      // 4. score_logs 테이블에 participantId 컬럼 추가
      //    (DB에 이미 있다면 아래 라인 주석 처리 - 오류 메시지에 따르면 이미 존재)
      /*
      queryInterface.addColumn(
        'score_logs',
        'participantId',
        {
          type: Sequelize.INTEGER,
          allowNull: true // FK 설정 전 임시로 null 허용
        }
      )
      */
    // ]);
    // 로그 업데이트: 모든 컬럼 추가 시도를 건너뛴다는 내용으로 변경 가능
    console.log('Skipped adding score, name, urlIdentifier, participantId (assuming they already exist).');
  },

  async down (queryInterface, Sequelize) {
    // up 에서 추가하지 않았다면 down 에서도 제거할 필요 없음
    // await Promise.all([
      // queryInterface.removeColumn('session_participants', 'score'),
      // queryInterface.removeColumn('class_sessions', 'name'),
      // queryInterface.removeColumn('class_sessions', 'urlIdentifier'),
      // queryInterface.removeColumn('score_logs', 'participantId')
    // ]);
  }
};