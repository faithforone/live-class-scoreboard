'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * up 함수: 마이그레이션을 적용할 때 실행됩니다.
     * queryInterface 객체를 사용하여 DB 스키마를 변경합니다.
     */
    // class_sessions 테이블의 session_id 컬럼을 id 로 이름 변경
    await queryInterface.renameColumn(
      'class_sessions', // 대상 테이블 이름 (실제 DB 테이블 이름 확인)
      'session_id',     // 변경 전 컬럼 이름
      'id'              // 변경 후 컬럼 이름
    );
  },



  async down (queryInterface, Sequelize) {
    /**
     * down 함수: 마이그레이션을 되돌릴 때(rollback) 실행됩니다.
     * up 함수에서 적용한 변경 사항을 원래대로 복구하는 코드를 작성합니다.
     */
    // class_sessions 테이블의 id 컬럼을 다시 session_id 로 이름 변경
    await queryInterface.renameColumn(
      'class_sessions', // 대상 테이블 이름
      'id',             // 변경 전 컬럼 이름 (되돌릴 때 기준)
      'session_id'      // 변경 후 컬럼 이름 (원래 이름)
    );
  }
};
