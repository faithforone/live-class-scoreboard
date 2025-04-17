const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Template extends Model {
    static associate(models) {
      // Define association with Group model
      Template.belongsToMany(models.Group, {
        through: 'TemplateGroups',
        foreignKey: 'templateId',
        otherKey: 'groupId'
      });
    }
  }

  Template.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      metrics: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Template',
      tableName: 'templates'
    }
  );

  return Template;
}; 