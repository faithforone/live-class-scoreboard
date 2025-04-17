'use strict';

module.exports = (sequelize, DataTypes) => {
  const ClassSession = sequelize.define('ClassSession', {
    session_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('활성', '종료됨'),
      defaultValue: '활성'
    },
    feed_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    widget_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'class_sessions',
    timestamps: true
  });

  ClassSession.associate = function(models) {
    // 현재 참여 중인 학생들과의 관계
    ClassSession.hasMany(models.Student, {
      foreignKey: 'current_session_id',
      as: 'currentStudents'
    });

    // 이 세션에 참여했던 모든 학생들과의 관계 (다대다)
    ClassSession.belongsToMany(models.Student, {
      through: 'SessionParticipants',
      foreignKey: 'session_id',
      as: 'participants'
    });

    // 점수 기록과의 관계
    ClassSession.hasMany(models.ScoreLog, {
      foreignKey: 'session_id',
      as: 'scoreLogs'
    });
  };

  return ClassSession;
};
