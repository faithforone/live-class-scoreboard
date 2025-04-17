// server/models/classsession.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ClassSession extends Model {
    static associate(models) {
      // 세션은 여러 참여자 기록을 가짐 (1:N)
      ClassSession.hasMany(models.SessionParticipant, {
        foreignKey: 'sessionId',      // SessionParticipant의 세션 ID 외래 키 (camelCase로 변경)
        as: 'sessionParticipants'     // 관계 접근 시 사용할 별칭
      });
      // 세션은 여러 학생을 가질 수 있음 (N:M, SessionParticipant를 통해)
      ClassSession.belongsToMany(models.Student, {
        through: models.SessionParticipant, // 중간 모델 사용
        foreignKey: 'sessionId',          // SessionParticipant의 세션 ID 외래 키 (camelCase로 변경)
        otherKey: 'studentId',            // SessionParticipant의 학생 ID 외래 키 (camelCase로 변경)
        as: 'students'                    // 관계 접근 시 사용할 별칭
      });
      // 현재 이 세션을 진행 중인 학생들 (1:N 관계, Student.currentSessionId)
      ClassSession.hasMany(models.Student, {
        foreignKey: 'currentSessionId', // Student 테이블의 외래 키 (camelCase로 변경)
        as: 'currentStudents'         // 관계 접근 시 사용할 별칭
      });
      // 세션은 템플릿과 연결될 수 있음 (N:1 관계, optional)
      ClassSession.belongsTo(models.Template, {
        foreignKey: 'templateId',  // ClassSession 테이블의 외래 키 (camelCase로 변경)
        as: 'template',            // 관계 접근 시 사용할
        allowNull: true           // 템플릿은 선택적
      });
      // 세션은 그룹과 연결될 수 있음 (N:1 관계, optional)
      ClassSession.belongsTo(models.Group, {
        foreignKey: 'groupId',    // ClassSession 테이블의 외래 키 (camelCase로 변경)
        as: 'group',               // 관계 접근 시 사용할
        allowNull: true           // 그룹은 선택적
      });
    }
  }
  ClassSession.init({
    id: { // PK
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    name: { // 세션 이름 (선택적)
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', '종료됨'), // 컨트롤러 로직 기반 ENUM
      allowNull: false,
      defaultValue: 'active'
    },
    startTime: { // snake_case에서 camelCase로 변경
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW // 생성 시 현재 시간 기본값
    },
    endTime: { // snake_case에서 camelCase로 변경
      type: DataTypes.DATE,
      allowNull: true // 종료 시 설정
    },
    urlIdentifier: { // snake_case에서 camelCase로 변경
      type: DataTypes.STRING, // UUID 등을 사용하므로 STRING
      allowNull: false,
      unique: true
    },
    templateId: { // snake_case에서 camelCase로 변경
      type: DataTypes.INTEGER,
      allowNull: true, // 선택적 관계
      references: {
        model: 'templates', // 참조 테이블
        key: 'id'          // 참조 컬럼
      }
    },
    groupId: { // snake_case에서 camelCase로 변경
      type: DataTypes.INTEGER,
      allowNull: true, // 선택적 관계
      references: {
        model: 'groups', // 참조 테이블
        key: 'id'        // 참조 컬럼
      }
    }
    // teacherId: { // 교사 연결 시 FK 추가 가능
    //   type: DataTypes.INTEGER,
    //   allowNull: true, // 또는 false
    // }
    // createdAt, updatedAt 자동 관리
  }, {
    sequelize,
    modelName: 'ClassSession',
    tableName: 'class_sessions', // 실제 테이블 이름
    timestamps: true,
    underscored: true  // This tells Sequelize to use snake_case in the DB
  });
  return ClassSession;
};