/*
  # Update active users count function with date range support

  This migration updates the get_active_users_count function to:
  1. Accept date range parameters
  2. Filter active subscriptions within the date range
  3. Consider both creation date and subscription status
*/

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
      AND ms.disabled_at IS NULL
      AND ms.expiration_date > NOW()
      AND (
        (start_date IS NULL AND end_date IS NULL) OR
        (ms.created_at >= start_date AND ms.created_at <= end_date)
      )
    UNION
    -- Users with active Google subscriptions
    SELECT DISTINCT user_id
    FROM google_subscriptions gs
    WHERE gs.active = true
      AND gs.disabled_at IS NULL
      AND gs.expiration_date > NOW()
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