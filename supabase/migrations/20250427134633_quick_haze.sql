/*
  # Fix email counts query return type

  1. Changes
    - Update get_email_counts_by_date function to fix type mismatch error
    - Cast DATE(created_at) to timestamp with time zone to match expected return type
    - Keep all existing functionality but ensure correct data type is returned

  2. Security
    - Maintain security definer setting
    - Maintain existing permissions
*/

-- Drop and recreate the function with fixed return type
CREATE OR REPLACE FUNCTION get_email_counts_by_date(days_ago integer DEFAULT 30)
RETURNS TABLE (date timestamp with time zone, count bigint) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DATE(created_at)::timestamp with time zone AS date, COUNT(*) AS count
  FROM email_prio_logs
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY DATE(created_at)
  ORDER BY date ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_email_counts_by_date(integer) TO authenticated;