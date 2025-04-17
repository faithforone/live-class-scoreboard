// server/models/student.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Student extends Model {
    static associate(models) {
      // 학생은 여러 그룹에 속할 수 있음 (N:M)
      Student.belongsToMany(models.Group, {
        through: models.StudentGroup, // 문자열 대신 모델 객체 사용
        foreignKey: 'student_id', // 중간 테이블의 학생 ID 외래 키
        otherKey: 'group_id',     // 중간 테이블의 그룹 ID 외래 키
        as: 'groups'             // 관계 접근 시 사용할 별칭
      });
      // 학생은 여러 세션에 참여할 수 있음 (N:M, SessionParticipant를 통해)
      Student.belongsToMany(models.ClassSession, {
        through: models.SessionParticipant, // 중간 모델 사용
        foreignKey: 'student_id',          // SessionParticipant의 학생 ID 외래 키
        otherKey: 'session_id',            // SessionParticipant의 세션 ID 외래 키
        as: 'sessions'                    // 관계 접근 시 사용할 별칭
      });
      // 학생은 여러 세션 참여 기록(점수 등)을 가짐 (1:N)
      Student.hasMany(models.SessionParticipant, {
        foreignKey: 'student_id',          // SessionParticipant의 학생 ID 외래 키
        as: 'sessionParticipants'         // 관계 접근 시 사용할 별칭
      });
      // 학생은 현재 특정 세션에 속할 수 있음 (1:1 또는 1:N, Null 가능)
      Student.belongsTo(models.ClassSession, {
        foreignKey: 'current_session_id', // 학생 테이블의 세션 ID 외래 키
        as: 'currentSession',         // 관계 접근 시 사용할 별칭
        allowNull: true              // 현재 세션이 없을 수도 있음
      });
    }
  }
  Student.init({
    id: { // 마이그레이션에서 PK로 변경했으므로 정의 필요
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('대기중', '수업중'), // 컨트롤러 로직 기반 ENUM 사용
      allowNull: false, // 기본값을 가지므로 false 권장
      defaultValue: '대기중'
    },
    current_session_id: { // Changed from camelCase to snake_case
      type: DataTypes.INTEGER,
      allowNull: true, // 현재 세션이 없을 수 있음
      references: {
        model: 'class_sessions', // 참조할 테이블 이름 (ClassSession 모델의 tableName)
        key: 'id'              // 참조할 컬럼 이름
      },
      onUpdate: 'CASCADE', // 참조 무결성 옵션 (선택적)
      onDelete: 'SET NULL' // 세션 삭제 시 학생의 currentSessionId를 NULL로 설정
    }
    // createdAt, updatedAt 자동 관리 (timestamps: true 기본)
  }, {
    sequelize,
    modelName: 'Student',
    tableName: 'students',
    timestamps: true, // createdAt, updatedAt 자동 관리
    underscored: true // Use snake_case column names in the database
  });
  return Student;
};