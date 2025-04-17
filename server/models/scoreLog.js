'use strict';

module.exports = (sequelize, DataTypes) => {
  const ScoreLog = sequelize.define('ScoreLog', {
    log_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    session_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'class_sessions',
        key: 'session_id'
      }
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id'
      }
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    teacher_identifier: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'score_logs',
    timestamps: true
  });

  ScoreLog.associate = function(models) {
    // 학생과의 관계
    ScoreLog.belongsTo(models.Student, {
      foreignKey: 'student_id',
      as: 'student'
    });

    // 세션과의 관계
    ScoreLog.belongsTo(models.ClassSession, {
      foreignKey: 'session_id',
      as: 'session'
    });
  };

  return ScoreLog;
};
