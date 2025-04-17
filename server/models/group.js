'use strict';

module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('Group', {
    group_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }, {
    tableName: 'groups',
    timestamps: true
  });

  Group.associate = function(models) {
    // 그룹에 속한 학생들과의 관계
    Group.hasMany(models.Student, {
      foreignKey: 'group_id',
      as: 'students'
    });
  };

  return Group;
};
