'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 시도할 제약 조건 이름과 테이블 이름 조합
    const constraintNameCamel = 'SessionParticipants_student_id_fkey';
    const tableNameCamel = '"SessionParticipants"'; // 따옴표 포함 시도
    const constraintNameSnake = 'session_participants_student_id_fkey';
    const tableNameSnake = 'session_participants';
    const studentsTableName = 'students';

    await queryInterface.sequelize.transaction(async (transaction) => {
      // 1. student_id를 참조하는 외래 키 제약 조건 삭제 (직접 SQL 실행, 두 이름 모두 시도)
      console.log(`Attempting to remove constraint using raw SQL (IF EXISTS)...`);
      try {
        // 카멜 케이스 이름 시도 (테이블 이름에 따옴표 사용)
        const sqlDropCamel = `ALTER TABLE ${tableNameCamel} DROP CONSTRAINT IF EXISTS "${constraintNameCamel}";`;
        console.log(`Executing: ${sqlDropCamel}`);
        await queryInterface.sequelize.query(sqlDropCamel, { transaction });
        console.log(`Constraint (CamelCase, if existed) removed or did not exist.`);
      } catch (error) {
         // 테이블 이름이나 스키마 문제 등 예외 처리
         console.warn(`Warning trying to drop constraint ${constraintNameCamel} on ${tableNameCamel}: ${error.message}`);
      }
      try {
        // 스네이크 케이스 이름 시도 (테이블 이름에 따옴표 없이)
        const sqlDropSnake = `ALTER TABLE ${tableNameSnake} DROP CONSTRAINT IF EXISTS ${constraintNameSnake};`;
        console.log(`Executing: ${sqlDropSnake}`);
        await queryInterface.sequelize.query(sqlDropSnake, { transaction });
        console.log(`Constraint (snake_case, if existed) removed or did not exist.`);
      } catch (error) {
         // 테이블 이름이나 스키마 문제 등 예외 처리
         console.warn(`Warning trying to drop constraint ${constraintNameSnake} on ${tableNameSnake}: ${error.message}`);
      }
      console.log(`Finished attempting to remove FK constraints.`);


      // 2. students 테이블의 기존 기본 키 제약 조건(student_id) 삭제
      console.log(`Removing primary key constraint 'students_pkey' from ${studentsTableName} based on student_id...`);
      await queryInterface.removeConstraint(studentsTableName, 'students_pkey', { transaction });
      console.log(`Primary key constraint removed from ${studentsTableName} (column student_id).`);

      // 3. student_id 컬럼 삭제
      console.log(`Removing student_id column from ${studentsTableName}...`);
      await queryInterface.removeColumn(studentsTableName, 'student_id', { transaction });
      console.log('student_id column removed.');

      // 4. 기존 id 컬럼에 기본 키 제약 조건 추가
      console.log(`Adding primary key constraint 'students_pkey' to ${studentsTableName}.id...`);
      await queryInterface.addConstraint(studentsTableName, {
        fields: ['id'],
        type: 'primary key',
        name: 'students_pkey',
        transaction
      });
      console.log(`Primary key constraint added to ${studentsTableName}.id.`);
    });
  },

  // down 함수는 이전 상태로 유지 (또는 필요시 raw SQL로 FK 재생성 로직 추가)
  async down (queryInterface, Sequelize) {
    // 이전 버전의 down 함수 사용 또는 아래 예시 참고
    const constraintNameCamel = 'SessionParticipants_student_id_fkey';
    const tableNameCamel = '"SessionParticipants"';
    const constraintNameSnake = 'session_participants_student_id_fkey';
    const tableNameSnake = 'session_participants';
    const studentsTableName = 'students';

    // down 함수에서도 일관성을 위해 소문자 이름 사용 추천
    const fkNameToRestore = constraintNameSnake; // 복구 시 사용할 이름 (보통 소문자)
    const fkTableNameToRestore = tableNameSnake; // 복구 시 사용할 테이블 이름

    await queryInterface.sequelize.transaction(async (transaction) => {
        // 1. id 컬럼의 기본 키 제약 조건 삭제
        console.log(`Removing primary key constraint 'students_pkey' from ${studentsTableName}.id...`);
        await queryInterface.removeConstraint(studentsTableName, 'students_pkey', { transaction });
        console.log(`Primary key constraint removed from ${studentsTableName}.id.`);

        // 2. student_id 컬럼 다시 추가
        console.log(`Adding student_id column back to ${studentsTableName}...`);
        await queryInterface.addColumn(studentsTableName, 'student_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            transaction
        });
        console.log('student_id column added back.');
        // 여기서 id -> student_id 값 복사 로직 필요 시 추가

        // 3. student_id 컬럼에 기본 키 제약 조건 다시 추가
        console.log(`Adding primary key constraint 'students_pkey' back to ${studentsTableName}.student_id...`);
        await queryInterface.addConstraint(studentsTableName, {
            fields: ['student_id'],
            type: 'primary key',
            name: 'students_pkey',
            transaction
        });
        console.log(`Primary key constraint added back to ${studentsTableName}.student_id.`);

        // 4. student_id 참조 외래 키 제약 조건 복구 (직접 SQL 또는 queryInterface 사용)
        console.log(`Adding foreign key constraint ${fkNameToRestore} back to ${fkTableNameToRestore}...`);
        await queryInterface.addConstraint(fkTableNameToRestore, {
            fields: ['student_id'], // SessionParticipants 테이블의 컬럼 이름 확인 필요
            type: 'foreign key',
            name: fkNameToRestore,
            references: {
            table: studentsTableName,
            field: 'student_id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            transaction
        });
        console.log(`Foreign key constraint ${fkNameToRestore} added back.`);
    });
  }
};