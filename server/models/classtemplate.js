'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ClassTemplate extends Model {
    static associate(models) {
      // A template can be associated with multiple groups
      ClassTemplate.belongsToMany(models.Group, {
        through: 'TemplateGroups',
        foreignKey: 'templateId',
        otherKey: 'groupId',
        as: 'groups'
      });
    }
  }
  
  ClassTemplate.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    }
  }, {
    sequelize,
    modelName: 'ClassTemplate',
    tableName: 'class_templates'
  });
  
  return ClassTemplate;
}; 