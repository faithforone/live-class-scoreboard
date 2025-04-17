// server/models/group.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    static associate(models) {
      // 그룹은 여러 학생을 가질 수 있음 (N:M)
      Group.belongsToMany(models.Student, {
        through: 'StudentGroup', // 중간 테이블 이름 (Student 모델과 동일하게 지정)
        foreignKey: 'groupId',     // 중간 테이블의 그룹 ID 외래 키
        otherKey: 'studentId',   // 중간 테이블의 학생 ID 외래 키
        as: 'students'           // 관계 접근 시 사용할 별칭 (컨트롤러 로직과 일치)
      });

      // 그룹은 여러 템플릿에 속할 수 있음 (N:M)
      Group.belongsToMany(models.Template, {
        through: 'template_groups',
        foreignKey: 'groupId',
        otherKey: 'templateId',
        as: 'templates'
      });
    }
  }
  Group.init({
    id: { // 마이그레이션에서 PK로 변경했으므로 정의 필요
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true // 그룹 이름은 고유해야 할 수 있음
    }
    // createdAt, updatedAt 자동 관리 (timestamps: true 기본)
  }, {
    sequelize,
    modelName: 'Group',
    tableName: 'groups',
    timestamps: true // createdAt, updatedAt 자동 관리
  });
  return Group;
};