# CamelCase Migration Instructions

This document provides instructions for standardizing the database schema to use `camelCase` field naming conventions, which aligns with the updated model definitions.

## Background

After updating the model files to use `camelCase` field names and setting `underscored: false`, we need to ensure the actual database schema matches these changes. This prevents "column does not exist" errors that occur when Sequelize looks for `camelCase` columns (like `studentId`) but the database still has `snake_case` columns (like `student_id`).

## Migration Steps

1. **Before you start:** Backup your database to ensure you can recover if needed.

2. **Run the migration:**
   ```bash
   # Navigate to the server directory
   cd server
   
   # Run the migration
   npx sequelize-cli db:migrate
   ```

   This will execute the `20250418000000-rename-junction-table-columns-to-camelcase.js` migration which renames the following columns:

   - In `student_groups` table:
     - `student_id` → `studentId`
     - `group_id` → `groupId`
     - `created_at` → `createdAt`
     - `updated_at` → `updatedAt`

   - In `system_settings` table (if it exists):
     - `setting_key` → `settingKey`
     - `setting_value` → `settingValue`
     - `created_at` → `createdAt`
     - `updated_at` → `updatedAt`

   - In `session_participants` table:
     - `student_id` → `studentId`
     - `session_id` → `sessionId`
     - `created_at` → `createdAt`
     - `updated_at` → `updatedAt`

   - In `score_logs` table:
     - `session_id` → `sessionId`
     - `student_id` → `studentId`
     - `created_at` → `createdAt`
     - `updated_at` → `updatedAt`

3. **Test the application thoroughly:**
   - Start the server
   - Test teacher login
   - Test admin dashboard features
   - Check all tabs (students, groups, templates, active sessions)
   - Verify scoreboard functionality

## Troubleshooting

If you encounter errors after migration:

1. **Database column errors:** If you see "column does not exist" errors, it may indicate that a table or column was missed in the migration. You can manually rename columns using SQL:

   ```sql
   ALTER TABLE table_name RENAME COLUMN snake_case_column TO camelCaseColumn;
   ```

2. **Missing tables or columns:** If errors indicate missing tables or columns, examine the database schema and compare it with model definitions:

   ```sql
   -- List all tables
   SELECT name FROM sqlite_master WHERE type='table';
   
   -- Show columns in a specific table
   PRAGMA table_info(table_name);
   ```

3. **Rollback if necessary:** If you need to revert the migration:

   ```bash
   npx sequelize-cli db:migrate:undo
   ```

## Verification

After migration, you can verify the schema changes in the database:

1. For SQLite:
   ```bash
   sqlite3 database.sqlite
   .schema table_name
   ```

2. For MySQL:
   ```sql
   DESCRIBE table_name;
   ```

3. For PostgreSQL:
   ```sql
   \d table_name
   ```

Confirm that all column names follow the `camelCase` convention. 