'use strict';

module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define('Student', {
    student_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('대기중', '수업중'),
      defaultValue: '대기중'
    },
    current_session_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'students',
    timestamps: true
  });

  Student.associate = function(models) {
    // 그룹과의, 세션과의 관계 정의 (나중에 Group 모델이 생성되면)
    Student.belongsTo(models.Group, {
      foreignKey: 'group_id',
      as: 'group'
    });

    // 현재 수업 세션과의 관계
    Student.belongsTo(models.ClassSession, {
      foreignKey: 'current_session_id',
      as: 'currentSession'
    });

    // 학생이 참여한 모든 세션과의 관계 (다대다)
    Student.belongsToMany(models.ClassSession, {
      through: 'SessionParticipants',
      foreignKey: 'student_id',
      as: 'sessions'
    });

    // 점수 기록과의 관계
    Student.hasMany(models.ScoreLog, {
      foreignKey: 'student_id',
      as: 'scoreLogs'
    });
  };

  return Student;
};
