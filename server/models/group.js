// server/models/group.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    static associate(models) {
      // 그룹은 여러 학생을 가질 수 있음 (N:M)
      Group.belongsToMany(models.Student, {
        through: models.StudentGroup,
        foreignKey: 'group_id',
        otherKey: 'student_id',
        as: 'students'
      });

      // 그룹은 여러 템플릿에 속할 수 있음 (N:M)
      Group.belongsToMany(models.Template, {
        through: models.TemplateGroup,
        foreignKey: 'group_id',
        otherKey: 'template_id',
        as: 'templates'
      });
    }
  }
  Group.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
    // createdAt, updatedAt 자동 관리 (timestamps: true 기본)
  }, {
    sequelize,
    modelName: 'Group',
    tableName: 'groups',
    timestamps: true, // createdAt, updatedAt 자동 관리
    underscored: true // 모델 필드 이름을 스네이크 케이스로 자동 변환
  });
  return Group;
};