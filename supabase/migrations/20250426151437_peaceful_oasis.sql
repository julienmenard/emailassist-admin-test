/*
  # Add function to count active users

  This migration adds a PostgreSQL function to count users with active subscriptions
  in either microsoft_subscriptions or google_subscriptions tables.
*/

CREATE OR REPLACE FUNCTION get_active_users_count()
RETURNS TABLE (count bigint) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH active_users AS (
    -- Users with active Microsoft subscriptions
    SELECT DISTINCT user_id
    FROM microsoft_subscriptions
    WHERE active = true
    UNION
    -- Users with active Google subscriptions
    SELECT DISTINCT user_id
    FROM google_subscriptions
    WHERE active = true
  )
  SELECT COUNT(DISTINCT user_id)::bigint
  FROM active_users;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_active_users_count() TO authenticated;