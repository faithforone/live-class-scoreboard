'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // groups 테이블의 group_id 컬럼을 id 로 이름 변경
    await queryInterface.renameColumn(
      'groups',       // 대상 테이블 이름 (group.js의 tableName 확인)
      'group_id',     // 변경 전 컬럼 이름
      'id'            // 변경 후 컬럼 이름
    );
  },

  async down (queryInterface, Sequelize) {
    // groups 테이블의 id 컬럼을 다시 group_id 로 이름 변경
    await queryInterface.renameColumn(
      'groups',       // 대상 테이블 이름
      'id',           // 변경 전 컬럼 이름 (되돌릴 때 기준)
      'group_id'      // 변경 후 컬럼 이름 (원래 이름)
    );
  }
};
