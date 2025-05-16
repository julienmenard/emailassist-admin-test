/*
  # Update active users count function
  
  1. Changes
    - Drop existing get_active_users_count functions
    - Create new function that only considers active field and created_at date range
    - Remove expiration_date and disabled_at checks
  
  2. Security
    - Function is security definer
    - Execute permission granted to authenticated users
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS get_active_users_count();
DROP FUNCTION IF EXISTS get_active_users_count(timestamp with time zone, timestamp with time zone);

-- Create new function
CREATE OR REPLACE FUNCTION get_active_users_count(start_date timestamp with time zone DEFAULT NULL, end_date timestamp with time zone DEFAULT NULL)
RETURNS TABLE (count bigint) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH active_users AS (
    -- Users with active Microsoft subscriptions
    SELECT DISTINCT user_id
    FROM microsoft_subscriptions ms
    WHERE ms.active = true
      AND (
        (start_date IS NULL AND end_date IS NULL) OR
        (ms.created_at >= start_date AND ms.created_at <= end_date)
      )
    UNION
    -- Users with active Google subscriptions
    SELECT DISTINCT user_id
    FROM google_subscriptions gs
    WHERE gs.active = true
      AND (
        (start_date IS NULL AND end_date IS NULL) OR
        (gs.created_at >= start_date AND gs.created_at <= end_date)
      )
  )
  SELECT COUNT(DISTINCT user_id)::bigint
  FROM active_users;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_active_users_count(timestamp with time zone, timestamp with time zone) TO authenticated;