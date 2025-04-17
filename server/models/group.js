// server/models/group.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    static associate(models) {
      // 그룹은 여러 학생을 가질 수 있음 (N:M)
      Group.belongsToMany(models.Student, {
        through: models.StudentGroup, // 문자열 대신 모델 객체 사용
        foreignKey: 'group_id',     // 중간 테이블의 그룹 ID 외래 키
        otherKey: 'student_id',   // 중간 테이블의 학생 ID 외래 키
        as: 'students'           // 관계 접근 시 사용할 별칭 (컨트롤러 로직과 일치)
      });

      // 그룹은 여러 템플릿에 속할 수 있음 (N:M)
      Group.belongsToMany(models.Template, {
        through: models.TemplateGroup, // 문자열 대신 모델 객체 사용
        foreignKey: 'group_id',
        otherKey: 'template_id',
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
    timestamps: true, // createdAt, updatedAt 자동 관리
    underscored: true // 모델 필드 이름을 스네이크 케이스로 자동 변환
  });
  return Group;
};