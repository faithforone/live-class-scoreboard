'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableName = 'SessionParticipants'; // \d 결과에 나온 테이블 이름 확인
    const pkConstraintName = 'SessionParticipants_pkey'; // \d 결과에 나온 PK 이름 확인

    await queryInterface.sequelize.transaction(async (transaction) => {
      // 1. 기존 기본 키 제약 조건 삭제
      console.log(`Removing primary key constraint '${pkConstraintName}' from ${tableName}...`);
      await queryInterface.removeConstraint(tableName, pkConstraintName, { transaction });
      console.log(`Primary key constraint '${pkConstraintName}' removed.`);

      // 2. session_id 컬럼 이름을 sessionId로 변경
      console.log(`Renaming column 'session_id' to 'sessionId' in ${tableName}...`);
      await queryInterface.renameColumn(tableName, 'session_id', 'sessionId', { transaction });
      console.log(`Column 'session_id' renamed to 'sessionId'.`);

      // 3. student_id 컬럼 이름을 studentId로 변경
      console.log(`Renaming column 'student_id' to 'studentId' in ${tableName}...`);
      await queryInterface.renameColumn(tableName, 'student_id', 'studentId', { transaction });
      console.log(`Column 'student_id' renamed to 'studentId'.`);

      // 4. 새로운 컬럼 이름으로 기본 키 제약 조건 다시 추가
      console.log(`Adding primary key constraint '${pkConstraintName}' back with new columns ('sessionId', 'studentId') to ${tableName}...`);
      await queryInterface.addConstraint(tableName, {
        fields: ['sessionId', 'studentId'], // 새로운 컬럼 이름 사용
        type: 'primary key',
        name: pkConstraintName, // 동일한 제약 조건 이름 사용 가능
        transaction
      });
      console.log(`Primary key constraint '${pkConstraintName}' added back with new columns.`);
    });
  },

  async down (queryInterface, Sequelize) {
    const tableName = 'SessionParticipants'; // 테이블 이름 확인
    const pkConstraintName = 'SessionParticipants_pkey'; // PK 이름 확인

    await queryInterface.sequelize.transaction(async (transaction) => {
      // 1. 새로운 기본 키 제약 조건 삭제 (sessionId, studentId 기반)
      console.log(`Removing primary key constraint '${pkConstraintName}' (based on new columns) from ${tableName}...`);
      await queryInterface.removeConstraint(tableName, pkConstraintName, { transaction });
      console.log(`Primary key constraint '${pkConstraintName}' removed.`);

      // 2. sessionId 컬럼 이름을 session_id로 복구
      console.log(`Renaming column 'sessionId' back to 'session_id' in ${tableName}...`);
      await queryInterface.renameColumn(tableName, 'sessionId', 'session_id', { transaction });
      console.log(`Column 'sessionId' renamed back to 'session_id'.`);

      // 3. studentId 컬럼 이름을 student_id로 복구
      console.log(`Renaming column 'studentId' back to 'student_id' in ${tableName}...`);
      await queryInterface.renameColumn(tableName, 'studentId', 'student_id', { transaction });
      console.log(`Column 'studentId' renamed back to 'student_id'.`);

      // 4. 이전 컬럼 이름으로 기본 키 제약 조건 복구
      console.log(`Adding primary key constraint '${pkConstraintName}' back with old columns ('session_id', 'student_id') to ${tableName}...`);
      await queryInterface.addConstraint(tableName, {
        fields: ['session_id', 'student_id'], // 이전 컬럼 이름 사용
        type: 'primary key',
        name: pkConstraintName,
        transaction
      });
      console.log(`Primary key constraint '${pkConstraintName}' added back with old columns.`);
    });
  }
};