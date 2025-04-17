// server/models/sessionparticipant.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SessionParticipant extends Model {
    static associate(models) {
      // 참여 기록은 특정 세션에 속함 (N:1)
      SessionParticipant.belongsTo(models.ClassSession, {
        foreignKey: 'sessionId', // snake_case에서 camelCase로 변경
        as: 'session'           // 관계 접근 시 사용할 별칭
      });
      // 참여 기록은 특정 학생에 속함 (N:1)
      SessionParticipant.belongsTo(models.Student, {
        foreignKey: 'studentId', // snake_case에서 camelCase로 변경
        as: 'student'           // 관계 접근 시 사용할 별칭
      });
      // 참여 기록은 여러 점수 로그를 가짐 (1:N)
      SessionParticipant.hasMany(models.ScoreLog, {
        foreignKey: 'participant_id', // ScoreLog의 외래 키 (snake_case)
        as: 'scoreLogs'            // 관계 접근 시 사용할 별칭
      });
    }
  }
  SessionParticipant.init({
    // 컨트롤러에서 participant.id 를 사용했으므로 자동 증가 ID PK 사용
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    sessionId: { // session_id에서 sessionId로 변경
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'class_sessions', // 참조 테이블
        key: 'id'              // 참조 컬럼
      },
      onDelete: 'CASCADE' // 세션 삭제 시 참여 기록도 삭제
    },
    studentId: { // student_id에서 studentId로 변경
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students', // 참조 테이블
        key: 'id'         // 참조 컬럼
      },
      onDelete: 'CASCADE' // 학생 삭제 시 참여 기록도 삭제
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
    // createdAt, updatedAt 자동 관리
  }, {
    sequelize,
    modelName: 'SessionParticipant',
    tableName: 'session_participants', // 실제 테이블 이름
    timestamps: true,
    underscored: true, // Use snake_case column names in the database
    // 세션 내 학생 참여는 고유해야 하므로 복합 고유 인덱스 추가 가능
    indexes: [
      {
        unique: true,
        fields: ['sessionId', 'studentId'] // camelCase로 변경
      }
    ]
  });
  return SessionParticipant;
};