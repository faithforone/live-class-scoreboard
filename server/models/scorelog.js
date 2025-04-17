// server/models/scorelog.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ScoreLog extends Model {
    static associate(models) {
      // 점수 로그는 특정 세션 참여 기록에 속함 (N:1)
      ScoreLog.belongsTo(models.SessionParticipant, {
        foreignKey: 'participant_id', // 현재 모델의 외래 키
        as: 'participant'           // 관계 접근 시 사용할 별칭
      });
    }
  }
  ScoreLog.init({
    id: { // PK
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    participant_id: { // SessionParticipant FK
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'session_participants', // 참조 테이블
        key: 'id'                   // 참조 컬럼
      },
      onDelete: 'CASCADE' // 참여 기록 삭제 시 로그도 삭제
    },
    change: { // 점수 변화량 (+/-)
      type: DataTypes.INTEGER,
      allowNull: false
    },
    timestamp: { // 점수 변경 시간
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
    // createdAt, updatedAt 자동 관리
  }, {
    sequelize,
    modelName: 'ScoreLog',
    tableName: 'score_logs', // 실제 테이블 이름
    timestamps: true, // createdAt, updatedAt 자동 관리
    underscored: true // 모델 필드 이름을 스네이크 케이스로 자동 변환
  });
  return ScoreLog;
};