'use strict';

module.exports = (sequelize, DataTypes) => {
  const SessionParticipant = sequelize.define('SessionParticipant', {
    id: {
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
    }
  }, {
    tableName: 'session_participants',
    timestamps: true
  });

  return SessionParticipant;
};
