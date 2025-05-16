/*
  # Fix email count in range function

  1. Changes
    - Update get_email_counts_in_range function to properly count emails in date range
    - Ensure correct type casting and handling of timestamps
*/

-- Drop and recreate the function with fixes for proper counting
CREATE OR REPLACE FUNCTION get_email_counts_in_range(start_date timestamp with time zone, end_date timestamp with time zone)
RETURNS TABLE (count bigint) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::bigint
  FROM email_prio_logs
  WHERE created_at >= start_date AND created_at <= end_date;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_email_counts_in_range(timestamp with time zone, timestamp with time zone) TO authenticated;