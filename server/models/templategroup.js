'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TemplateGroup extends Model {
    static associate(models) {
      // No direct associations needed here as this is a join table
    }
  }
  
  TemplateGroup.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    templateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'templates',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'TemplateGroup',
    tableName: 'template_groups',
    underscored: false
  });
  
  return TemplateGroup;
}; 