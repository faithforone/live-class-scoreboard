// server/models/systemsetting.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SystemSetting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here if needed
      // 예: 다른 모델과의 관계 설정
    }
  }
  SystemSetting.init({
    // 컬럼 정의
    setting_key: { // 설정 키 (예: 'teacher_password', 'admin_password')
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true // 기본 키로 사용
    },
    setting_value: { // 설정 값
      type: DataTypes.STRING, // 필요에 따라 TEXT 등으로 변경 가능
      allowNull: true // 또는 false, 설정 값은 필수인지 여부에 따라
    }
    // createdAt, updatedAt 컬럼은 Sequelize가 자동으로 처리 (timestamps: true 기본값)
  }, {
    sequelize,
    modelName: 'SystemSetting', // 모델 이름 (컨트롤러에서 db.SystemSetting 으로 사용)
    tableName: 'system_settings', // 실제 데이터베이스 테이블 이름 (보통 복수형, 스네이크 케이스)
    timestamps: true, // createdAt, updatedAt 자동 관리를 위해 true 권장
    // paranoid: true, // deletedAt 컬럼 (소프트 삭제) 사용 시 추가
    // underscored: true // 모델 필드 이름을 스네이크 케이스로 자동 변환 시 사용 (여기서는 불필요)
  });
  return SystemSetting;
};