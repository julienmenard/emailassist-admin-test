/*
  # Remove URL column from edge_function_logs table

  1. Changes
    - Remove the 'url' column from edge_function_logs table
    
  2. Impact
    - This simplifies the log structure
    - Any code referring to the url column will need to be updated
*/

-- Alter table to remove the URL column
ALTER TABLE IF EXISTS edge_function_logs DROP COLUMN IF EXISTS url;