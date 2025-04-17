'use strict';

module.exports = (sequelize, DataTypes) => {
  const SystemSetting = sequelize.define('SystemSetting', {
    setting_key: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    setting_value: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'system_settings',
    timestamps: true
  });

  return SystemSetting;
};
