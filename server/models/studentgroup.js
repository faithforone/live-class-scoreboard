'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StudentGroup extends Model {
    static associate(models) {
      // associations can be defined here
    }
  }
  
  StudentGroup.init({
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students',
        key: 'id'
      }
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'StudentGroup',
    tableName: 'student_groups',
    underscored: false
  });
  
  return StudentGroup;
}; 