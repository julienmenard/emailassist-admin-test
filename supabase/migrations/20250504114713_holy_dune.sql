/*
  # Add user_id field to edge_function_logs table

  1. Changes
    - Add user_id column to edge_function_logs table
    - Make it nullable since some edge function calls may not be associated with a user
    - Add foreign key constraint referencing the users table
    - Add index on user_id for better query performance

  2. Impact
    - Enables tracking which user triggered a function call
    - Allows filtering logs by user
*/

-- Add user_id column
ALTER TABLE edge_function_logs 
ADD COLUMN user_id uuid NULL;

-- Add foreign key constraint
ALTER TABLE edge_function_logs
ADD CONSTRAINT edge_function_logs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_edge_function_logs_user_id ON edge_function_logs(user_id);

-- Add comment to explain the column
COMMENT ON COLUMN edge_function_logs.user_id IS 'The ID of the user who triggered the edge function, if applicable';