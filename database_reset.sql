-- ============================================
-- Restaurant Task Management Database Reset
-- ============================================
-- This script drops all existing tables and recreates the schema

-- Step 1: Drop all existing tables (if they exist)
-- Note: CASCADE will remove all dependent objects like foreign keys, indexes, etc.
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS decline_reasons CASCADE;
DROP TABLE IF EXISTS media_files CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS task_status CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any other tables that might exist
DROP TABLE IF EXISTS alembic_version CASCADE;

-- Step 2: Recreate the schema for Restaurant Task Management System

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    initials VARCHAR(10) NOT NULL,
    role VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create restaurants table
CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    contact_info VARCHAR(100)
);

-- Create task_status table
CREATE TABLE task_status (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT
);

-- Create tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status_id INTEGER REFERENCES task_status(id),
    assigned_to INTEGER REFERENCES users(id),
    restaurant_id INTEGER REFERENCES restaurants(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP
);

-- Create decline_reasons table
CREATE TABLE decline_reasons (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id),
    user_id INTEGER REFERENCES users(id),
    reason TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create media_files table
CREATE TABLE media_files (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id),
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_log table
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);

-- Step 3: Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_tasks_status ON tasks(status_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_restaurant ON tasks(restaurant_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_decline_reasons_task ON decline_reasons(task_id);
CREATE INDEX idx_media_files_task ON media_files(task_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);

-- Step 4: Insert default task statuses
INSERT INTO task_status (name, description) VALUES 
('pending', 'Task is pending and not yet started'),
('in_progress', 'Task is currently being worked on'),
('completed', 'Task has been completed successfully'),
('declined', 'Task has been declined'),
('overdue', 'Task is past its due date');

-- Step 5: Create a default admin user (optional)
-- Note: You should change the password hash in production
-- INSERT INTO users (name, initials, role, email, password_hash) VALUES 
-- ('System Admin', 'SA', 'admin', 'admin@restaurant.com', '$2b$12$example_hash_here');

-- Step 6: Create a sample restaurant (optional)
-- INSERT INTO restaurants (name, address, contact_info) VALUES 
-- ('Sample Restaurant', '123 Main St, City, State', 'contact@restaurant.com');

-- Display completion message
SELECT 'Database schema has been successfully reset and recreated!' as status;
