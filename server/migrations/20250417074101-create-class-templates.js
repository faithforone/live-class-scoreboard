'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Skip this migration since we're using templates table instead
    console.log('Skipping create-class-templates migration - using templates table instead');
  },

  async down (queryInterface, Sequelize) {
    // No need to drop tables since we're not creating them
  }
};
