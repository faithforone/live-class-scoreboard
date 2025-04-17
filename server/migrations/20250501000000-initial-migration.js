'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, try to drop all existing tables to ensure a clean slate
    try {
      // Drop in reverse order to avoid foreign key constraints
      await queryInterface.dropTable('system_settings', { cascade: true, force: true });
      await queryInterface.dropTable('score_logs', { cascade: true, force: true });
      await queryInterface.dropTable('session_participants', { cascade: true, force: true });
      await queryInterface.dropTable('class_sessions', { cascade: true, force: true });
      await queryInterface.dropTable('template_groups', { cascade: true, force: true });
      await queryInterface.dropTable('student_groups', { cascade: true, force: true });
      await queryInterface.dropTable('templates', { cascade: true, force: true });
      await queryInterface.dropTable('groups', { cascade: true, force: true });
      await queryInterface.dropTable('students', { cascade: true, force: true });
      
      // Try to drop existing enum types
      try {
        if (queryInterface.sequelize.getDialect() === 'postgres') {
          await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_students_status";');
          await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_class_sessions_status";');
        }
      } catch (enumError) {
        console.log('No enum types to drop or error dropping them:', enumError.message);
      }
    } catch (error) {
      console.log('Some tables did not exist, continuing with migration');
    }

    // Create custom enum types for PostgreSQL
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      try {
        await queryInterface.sequelize.query('CREATE TYPE "enum_students_status" AS ENUM (\'대기중\', \'수업중\');');
        await queryInterface.sequelize.query('CREATE TYPE "enum_class_sessions_status" AS ENUM (\'active\', \'종료됨\');');
      } catch (error) {
        console.log('Error creating enum types (they may already exist):', error.message);
      }
    }

    // Create all tables in the correct order based on dependencies

    // 1. Create students table
    await queryInterface.createTable('students', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: queryInterface.sequelize.getDialect() === 'postgres' 
          ? Sequelize.ENUM('대기중', '수업중') 
          : Sequelize.STRING(10),
        allowNull: false,
        defaultValue: '대기중'
      },
      current_session_id: {
        type: Sequelize.INTEGER,
        allowNull: true
        // Reference will be added after class_sessions table is created
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 2. Create groups table
    await queryInterface.createTable('groups', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 3. Create templates table
    await queryInterface.createTable('templates', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metrics: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 4. Create student_groups junction table
    await queryInterface.createTable('student_groups', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'groups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint to prevent duplicate relationships
    await queryInterface.addIndex('student_groups', ['student_id', 'group_id'], {
      unique: true,
      name: 'student_groups_unique'
    });

    // 5. Create template_groups junction table
    await queryInterface.createTable('template_groups', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      template_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'templates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'groups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint to prevent duplicate relationships
    await queryInterface.addIndex('template_groups', ['template_id', 'group_id'], {
      unique: true,
      name: 'template_groups_unique'
    });

    // 6. Create class_sessions table
    await queryInterface.createTable('class_sessions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: queryInterface.sequelize.getDialect() === 'postgres' 
          ? Sequelize.ENUM('active', '종료됨') 
          : Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'active'
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      url_identifier: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      template_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'templates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'groups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 7. Now add the foreign key to students table for current_session_id
    await queryInterface.addConstraint('students', {
      fields: ['current_session_id'],
      type: 'foreign key',
      name: 'students_current_session_fk',
      references: {
        table: 'class_sessions',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // 8. Create session_participants table
    await queryInterface.createTable('session_participants', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'class_sessions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint to prevent duplicate participants in a session
    await queryInterface.addIndex('session_participants', ['session_id', 'student_id'], {
      unique: true,
      name: 'session_participants_unique'
    });

    // 9. Create score_logs table
    await queryInterface.createTable('score_logs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      participant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'session_participants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      change: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 10. Create system_settings table
    await queryInterface.createTable('system_settings', {
      setting_key: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      setting_value: {
        type: Sequelize.STRING(1024), // Longer length for JSON or longer values
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order to avoid foreign key constraints
    try {
      await queryInterface.dropTable('system_settings', { cascade: true });
      await queryInterface.dropTable('score_logs', { cascade: true });
      await queryInterface.dropTable('session_participants', { cascade: true });
      
      // Drop foreign key constraint first
      try {
        await queryInterface.removeConstraint('students', 'students_current_session_fk');
      } catch (error) {
        console.log('Foreign key constraint not found, continuing...');
      }
      
      await queryInterface.dropTable('class_sessions', { cascade: true });
      await queryInterface.dropTable('template_groups', { cascade: true });
      await queryInterface.dropTable('student_groups', { cascade: true });
      await queryInterface.dropTable('templates', { cascade: true });
      await queryInterface.dropTable('groups', { cascade: true });
      await queryInterface.dropTable('students', { cascade: true });
      
      // Drop enum types in PostgreSQL
      if (queryInterface.sequelize.getDialect() === 'postgres') {
        try {
          await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_students_status";');
          await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_class_sessions_status";');
        } catch (error) {
          console.log('Error dropping enum types:', error.message);
        }
      }
    } catch (error) {
      console.error('Error in migration down method:', error);
      throw error;
    }
  }
}; 