'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // 1. 중복된 제약조건 제거
      console.log('Removing duplicate constraints...');
      
      // 1.1 groups 테이블의 중복 유니크 제약조건 제거
      await queryInterface.sequelize.query(`
        ALTER TABLE IF EXISTS "groups" DROP CONSTRAINT IF EXISTS "groups_name_key1";
        ALTER TABLE IF EXISTS "groups" DROP CONSTRAINT IF EXISTS "groups_name_key10";
        ALTER TABLE IF EXISTS "groups" DROP CONSTRAINT IF EXISTS "groups_name_key11";
      `);
      
      // 1.2 session_participants 테이블의 중복 외래 키 제거
      await queryInterface.sequelize.query(`
        ALTER TABLE IF EXISTS "session_participants" DROP CONSTRAINT IF EXISTS "session_participants_sessionId_fkey1";
        ALTER TABLE IF EXISTS "session_participants" DROP CONSTRAINT IF EXISTS "session_participants_sessionId_fkey2";
        ALTER TABLE IF EXISTS "session_participants" DROP CONSTRAINT IF EXISTS "session_participants_session_id_fkey";
        ALTER TABLE IF EXISTS "session_participants" DROP CONSTRAINT IF EXISTS "session_participants_studentId_fkey1";
      `);
      
      // 1.3 students 테이블의 중복 외래 키 제거
      await queryInterface.sequelize.query(`
        ALTER TABLE IF EXISTS "students" DROP CONSTRAINT IF EXISTS "students_currentSessionId_fkey1";
      `);
      
      // 1.4 score_logs 테이블의 중복 외래 키 제거
      await queryInterface.sequelize.query(`
        ALTER TABLE IF EXISTS "score_logs" DROP CONSTRAINT IF EXISTS "score_logs_participantId_fkey1";
      `);

      // 2. 명명 규칙 통일 (snake_case를 camelCase로 변환)
      console.log('Standardizing column naming convention to camelCase...');
      
      // 2.1 template_groups 테이블 컬럼 변환
      const templateGroupsColumns = await queryInterface.describeTable('template_groups');
      if (templateGroupsColumns.template_id) {
        await queryInterface.renameColumn('template_groups', 'template_id', 'templateId');
      }
      if (templateGroupsColumns.group_id) {
        await queryInterface.renameColumn('template_groups', 'group_id', 'groupId');
      }
      if (templateGroupsColumns.created_at) {
        await queryInterface.renameColumn('template_groups', 'created_at', 'createdAt');
      }
      if (templateGroupsColumns.updated_at) {
        await queryInterface.renameColumn('template_groups', 'updated_at', 'updatedAt');
      }
      
      // 2.2 templates 테이블 컬럼 변환
      const templatesColumns = await queryInterface.describeTable('templates');
      if (templatesColumns.is_active) {
        await queryInterface.renameColumn('templates', 'is_active', 'isActive');
      }
      if (templatesColumns.created_at) {
        await queryInterface.renameColumn('templates', 'created_at', 'createdAt');
      }
      if (templatesColumns.updated_at) {
        await queryInterface.renameColumn('templates', 'updated_at', 'updatedAt');
      }
      
      // 2.3 class_sessions 테이블 컬럼 변환
      const classSessionsColumns = await queryInterface.describeTable('class_sessions');
      if (classSessionsColumns.start_time) {
        await queryInterface.renameColumn('class_sessions', 'start_time', 'startTime');
      }
      if (classSessionsColumns.end_time) {
        await queryInterface.renameColumn('class_sessions', 'end_time', 'endTime');
      }
      if (classSessionsColumns.template_id) {
        await queryInterface.renameColumn('class_sessions', 'template_id', 'templateId');
      }
      if (classSessionsColumns.group_id) {
        await queryInterface.renameColumn('class_sessions', 'group_id', 'groupId');
      }
      
      // 2.4 groups 테이블 컬럼 변환
      const groupsColumns = await queryInterface.describeTable('groups');
      if (groupsColumns.created_at) {
        await queryInterface.renameColumn('groups', 'created_at', 'createdAt');
      }
      if (groupsColumns.updated_at) {
        await queryInterface.renameColumn('groups', 'updated_at', 'updatedAt');
      }
      
      // 2.5 students 테이블 확인 및 변환
      try {
        const studentsColumns = await queryInterface.describeTable('students');
        if (studentsColumns.current_session_id) {
          await queryInterface.renameColumn('students', 'current_session_id', 'currentSessionId');
        }
        if (studentsColumns.created_at) {
          await queryInterface.renameColumn('students', 'created_at', 'createdAt');
        }
        if (studentsColumns.updated_at) {
          await queryInterface.renameColumn('students', 'updated_at', 'updatedAt');
        }
      } catch (error) {
        console.log('Error checking students table:', error.message);
      }

      // 3. 중복 테이블 처리 (SessionParticipants와 session_participants)
      console.log('Fixing duplicate tables...');
      
      try {
        // SessionParticipants 테이블 존재 여부 확인
        const tables = await queryInterface.sequelize.query(
          `SELECT table_name FROM information_schema.tables 
           WHERE table_schema = 'public' AND table_name = '"SessionParticipants"'`,
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        
        if (tables.length > 0) {
          // SessionParticipants 테이블이 존재하면 제거
          await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "SessionParticipants"`);
          console.log('Dropped duplicate SessionParticipants table');
        }
      } catch (error) {
        console.log('Error handling duplicate tables:', error.message);
      }

      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Error in migration:', error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // 이전 상태로 되돌리기 (필요한 경우)
      // 주의: 이 마이그레이션은 많은 구조적 변경을 포함하므로 정확한 롤백이 어려울 수 있습니다
      
      // 1. camelCase에서 snake_case로 변환 예시 
      // template_groups 테이블 컬럼 변환
      await queryInterface.renameColumn('template_groups', 'templateId', 'template_id');
      await queryInterface.renameColumn('template_groups', 'groupId', 'group_id');
      await queryInterface.renameColumn('template_groups', 'createdAt', 'created_at');
      await queryInterface.renameColumn('template_groups', 'updatedAt', 'updated_at');
      
      // templates 테이블 컬럼 변환
      await queryInterface.renameColumn('templates', 'isActive', 'is_active');
      await queryInterface.renameColumn('templates', 'createdAt', 'created_at');
      await queryInterface.renameColumn('templates', 'updatedAt', 'updated_at');
      
      // class_sessions 테이블 컬럼 변환
      await queryInterface.renameColumn('class_sessions', 'startTime', 'start_time');
      await queryInterface.renameColumn('class_sessions', 'endTime', 'end_time');
      await queryInterface.renameColumn('class_sessions', 'templateId', 'template_id');
      await queryInterface.renameColumn('class_sessions', 'groupId', 'group_id');
      
      // groups 테이블 컬럼 변환
      await queryInterface.renameColumn('groups', 'createdAt', 'created_at');
      await queryInterface.renameColumn('groups', 'updatedAt', 'updated_at');
      
      // students 테이블 변환
      await queryInterface.renameColumn('students', 'currentSessionId', 'current_session_id');
      await queryInterface.renameColumn('students', 'createdAt', 'created_at');
      await queryInterface.renameColumn('students', 'updatedAt', 'updated_at');
      
      console.log('Rollback completed');
    } catch (error) {
      console.error('Error in migration rollback:', error);
    }
  }
}; 