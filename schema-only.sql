-- PostgreSQL Database Schema for Task Management System
-- Schema Only - No Sample Data
-- Compatible with PostgreSQL 12+

-- Drop tables if they exist (in correct order to handle foreign keys)
DROP TABLE IF EXISTS media_files CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;

-- Create restaurants table
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

-- Create locations table
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    town_city VARCHAR(100) NOT NULL,
    postcode VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    pin VARCHAR(10) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'staff',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create media_files table
CREATE TABLE media_files (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('image', 'video')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Create indexes for performance optimization
CREATE INDEX idx_restaurants_code ON restaurants(restaurant_code);
CREATE INDEX idx_locations_restaurant_id ON locations(restaurant_id);
CREATE INDEX idx_users_restaurant_id ON users(restaurant_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_tasks_restaurant_id ON tasks(restaurant_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_day ON tasks(day);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_completed_at ON tasks(completed_at);
CREATE INDEX idx_tasks_status_day ON tasks(status, day);
CREATE INDEX idx_media_files_task_id ON media_files(task_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at timestamps
CREATE TRIGGER update_restaurants_updated_at 
    BEFORE UPDATE ON restaurants
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create useful views for reporting and analytics
CREATE OR REPLACE VIEW restaurant_task_summary AS
SELECT 
    r.id as restaurant_id,
    r.name as restaurant_name,
    r.restaurant_code,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'Done' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status IN ('Unknown', 'Submitted') THEN 1 END) as pending_tasks,
    COUNT(CASE WHEN t.status = 'Declined' THEN 1 END) as declined_tasks,
    CASE 
        WHEN COUNT(t.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN t.status = 'Done' THEN 1 END)::DECIMAL / COUNT(t.id)::DECIMAL) * 100, 2)
        ELSE 0::DECIMAL
    END as completion_rate
FROM restaurants r
LEFT JOIN tasks t ON r.id = t.restaurant_id
GROUP BY r.id, r.name, r.restaurant_code;

-- Create view for daily task breakdown
CREATE OR REPLACE VIEW daily_task_breakdown AS
SELECT 
    r.id as restaurant_id,
    r.name as restaurant_name,
    t.day,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'Done' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status IN ('Unknown', 'Submitted') THEN 1 END) as pending_tasks,
    COUNT(CASE WHEN t.status = 'Declined' THEN 1 END) as declined_tasks
FROM restaurants r
LEFT JOIN tasks t ON r.id = t.restaurant_id
GROUP BY r.id, r.name, t.day
ORDER BY r.id, 
    CASE t.day 
        WHEN 'monday' THEN 1
        WHEN 'tuesday' THEN 2
        WHEN 'wednesday' THEN 3
        WHEN 'thursday' THEN 4
        WHEN 'friday' THEN 5
        WHEN 'saturday' THEN 6
        WHEN 'sunday' THEN 7
    END;

-- Create utility functions for statistics and reporting
CREATE OR REPLACE FUNCTION get_restaurant_stats(restaurant_id_param INTEGER)
RETURNS TABLE (
    total_tasks INTEGER,
    completed_tasks INTEGER,
    pending_tasks INTEGER,
    total_users INTEGER,
    completion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(t.id)::INTEGER as total_tasks,
        COUNT(CASE WHEN t.status = 'Done' THEN 1 END)::INTEGER as completed_tasks,
        COUNT(CASE WHEN t.status IN ('Unknown', 'Submitted') THEN 1 END)::INTEGER as pending_tasks,
        (SELECT COUNT(u.id)::INTEGER FROM users u WHERE u.restaurant_id = restaurant_id_param) as total_users,
        CASE 
            WHEN COUNT(t.id) > 0 THEN 
                ROUND((COUNT(CASE WHEN t.status = 'Done' THEN 1 END)::DECIMAL / COUNT(t.id)::DECIMAL) * 100, 2)
            ELSE 0::DECIMAL
        END as completion_rate
    FROM tasks t
    WHERE t.restaurant_id = restaurant_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to get daily task summary
CREATE OR REPLACE FUNCTION get_daily_task_summary(restaurant_id_param INTEGER, day_param VARCHAR)
RETURNS TABLE (
    day VARCHAR,
    total_tasks INTEGER,
    completed_tasks INTEGER,
    pending_tasks INTEGER,
    declined_tasks INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        day_param as day,
        COUNT(t.id)::INTEGER as total_tasks,
        COUNT(CASE WHEN t.status = 'Done' THEN 1 END)::INTEGER as completed_tasks,
        COUNT(CASE WHEN t.status IN ('Unknown', 'Submitted') THEN 1 END)::INTEGER as pending_tasks,
        COUNT(CASE WHEN t.status = 'Declined' THEN 1 END)::INTEGER as declined_tasks
    FROM tasks t
    WHERE t.restaurant_id = restaurant_id_param AND t.day = day_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup old completed tasks (utility for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_tasks(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM tasks 
    WHERE status = 'Done' 
    AND completed_at < CURRENT_DATE - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (uncomment and modify for specific database users)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;
