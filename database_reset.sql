-- Database Schema for Task Management System
-- Compatible with SQLite and PostgreSQL

-- Drop tables if they exist (in correct order to handle foreign keys)
DROP TABLE IF EXISTS media_files;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS restaurants;

-- Create restaurants table
CREATE TABLE restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    cuisine_type VARCHAR(100) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on restaurant_code for fast lookups
CREATE INDEX idx_restaurants_code ON restaurants(restaurant_code);

-- Create locations table
CREATE TABLE locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    town_city VARCHAR(100) NOT NULL,
    postcode VARCHAR(20) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create index on restaurant_id for locations
CREATE INDEX idx_locations_restaurant_id ON locations(restaurant_id);

-- Create users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    pin VARCHAR(10) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'staff',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create index on restaurant_id for users
CREATE INDEX idx_users_restaurant_id ON users(restaurant_id);

-- Create tasks table
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    task VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('Cleaning', 'Cutting', 'Refilling', 'Other')),
    day VARCHAR(20) NOT NULL CHECK (day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    status VARCHAR(20) NOT NULL DEFAULT 'Unknown' CHECK (status IN ('Unknown', 'Submitted', 'Done', 'Declined')),
    task_type VARCHAR(20) NOT NULL DEFAULT 'Daily' CHECK (task_type IN ('Daily', 'Priority')),
    image_required BOOLEAN DEFAULT FALSE,
    video_required BOOLEAN DEFAULT FALSE,
    image_url VARCHAR(500),
    video_url VARCHAR(500),
    decline_reason TEXT,
    initials VARCHAR(10),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create indexes on tasks table for better performance
CREATE INDEX idx_tasks_restaurant_id ON tasks(restaurant_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_day ON tasks(day);
CREATE INDEX idx_tasks_category ON tasks(category);

-- Create media_files table
CREATE TABLE media_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('image', 'video')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Create index on task_id for media_files
CREATE INDEX idx_media_files_task_id ON media_files(task_id);

-- Insert sample data for development/testing

-- Sample restaurant
INSERT INTO restaurants (restaurant_code, name, cuisine_type, contact_email, contact_phone, password_hash) 
VALUES ('REST001', 'Sample Restaurant', 'Italian', 'admin@sample.com', '123-456-7890', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewAuBK3QnClYQy8a');

-- Sample location
INSERT INTO locations (restaurant_id, address_line1, town_city, postcode) 
VALUES (1, '123 Main Street', 'Sample City', 'SC1 2AB');

-- Sample admin user (PIN: 1234)
INSERT INTO users (restaurant_id, name, pin, role) 
VALUES (1, 'Admin User', '1234', 'admin');

-- Sample staff user (PIN: 5678)
INSERT INTO users (restaurant_id, name, pin, role) 
VALUES (1, 'Staff User', '5678', 'staff');

-- Sample tasks
INSERT INTO tasks (restaurant_id, task, description, category, day, task_type, image_required, video_required) 
VALUES 
(1, 'Clean kitchen surfaces', 'Wipe down all counters and prep areas', 'Cleaning', 'monday', 'Daily', TRUE, FALSE),
(1, 'Check inventory levels', 'Count stock and update inventory system', 'Other', 'monday', 'Daily', FALSE, FALSE),
(1, 'Prep vegetables for the day', 'Cut onions, carrots, and celery', 'Cutting', 'tuesday', 'Daily', TRUE, FALSE),
(1, 'Refill condiment stations', 'Check and refill all condiment dispensers', 'Refilling', 'wednesday', 'Daily', FALSE, FALSE),
(1, 'Deep clean fryer', 'Emergency deep clean of main fryer', 'Cleaning', 'thursday', 'Priority', TRUE, TRUE);

-- PostgreSQL compatibility notes:
-- For PostgreSQL, replace the following:
-- 1. INTEGER PRIMARY KEY AUTOINCREMENT -> SERIAL PRIMARY KEY
-- 2. DATETIME -> TIMESTAMP WITH TIME ZONE
-- 3. BOOLEAN values should use TRUE/FALSE (already compatible)
-- 4. VARCHAR sizes are compatible
-- 5. CHECK constraints are compatible

-- Example PostgreSQL version of restaurants table:
/*
CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    restaurant_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    cuisine_type VARCHAR(100) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
*/