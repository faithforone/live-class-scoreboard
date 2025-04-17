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
      primaryKey: true,
      references: {
        model: 'students',
        key: 'id'
      },
      field: 'student_id'
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'groups',
        key: 'id'
      },
      field: 'group_id'
    }
  }, {
    sequelize,
    modelName: 'StudentGroup',
    tableName: 'student_groups',
    underscored: true,
    timestamps: true
  });
  
  return StudentGroup;
}; 