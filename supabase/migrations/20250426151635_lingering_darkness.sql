/*
  # Fix active users count calculation

  This migration updates the get_active_users_count function to:
  1. Properly check active status in Microsoft subscriptions
  2. Consider subscription expiration dates
  3. Handle both Microsoft and Google subscriptions correctly
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
    FROM microsoft_subscriptions ms
    WHERE ms.active = true
      AND ms.disabled_at IS NULL
      AND ms.expiration_date > NOW()
    UNION
    -- Users with active Google subscriptions
    SELECT DISTINCT user_id
    FROM google_subscriptions gs
    WHERE gs.active = true
      AND gs.disabled_at IS NULL
      AND gs.expiration_date > NOW()
  )
  SELECT COUNT(DISTINCT user_id)::bigint
  FROM active_users;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_active_users_count() TO authenticated;