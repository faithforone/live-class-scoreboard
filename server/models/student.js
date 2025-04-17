// server/models/student.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Student extends Model {
    static associate(models) {
      // 학생은 여러 그룹에 속할 수 있음 (N:M)
      Student.belongsToMany(models.Group, {
        through: models.StudentGroup,
        foreignKey: 'student_id', // Use snake_case for foreign key
        otherKey: 'group_id',     // Use snake_case for other key
        as: 'groups'
      });
      // 학생은 여러 세션에 참여할 수 있음 (N:M, SessionParticipant를 통해)
      Student.belongsToMany(models.ClassSession, {
        through: models.SessionParticipant,
        foreignKey: 'student_id',
        otherKey: 'session_id',
        as: 'sessions'
      });
      // 학생은 여러 세션 참여 기록(점수 등)을 가짐 (1:N)
      Student.hasMany(models.SessionParticipant, {
        foreignKey: 'student_id',
        as: 'sessionParticipants'
      });
      // 학생은 현재 특정 세션에 속할 수 있음 (1:1 또는 1:N, Null 가능)
      Student.belongsTo(models.ClassSession, {
        foreignKey: 'currentSessionId',
        as: 'currentSession',
        allowNull: true
      });
    }
  }
  Student.init({
    id: {
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
      type: DataTypes.ENUM('대기중', '수업중'),
      allowNull: false,
      defaultValue: '대기중'
    },
    currentSessionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'class_sessions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
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