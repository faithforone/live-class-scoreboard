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
        model: 'Student',
        key: 'id'
      }
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Group',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'StudentGroup',
    tableName: 'StudentGroups'
  });
  
  return StudentGroup;
}; 