/*
  # Add PostgreSQL functions to fetch email counts for dashboard

  1. New Functions
    - `get_email_counts_by_date`: Returns email counts by date for the last N days
    - `get_email_counts_in_range`: Returns total email count within a date range

  2. Security
    - Functions are security definer
    - Execute permission granted to authenticated users
*/

-- Function to get email counts by date for the last N days
CREATE OR REPLACE FUNCTION get_email_counts_by_date(days_ago integer DEFAULT 30)
RETURNS TABLE (date timestamp with time zone, count bigint) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  EXECUTE 'SELECT DATE(created_at) AS date, COUNT(*) AS count
           FROM email_prio_logs
           WHERE created_at >= CURRENT_DATE - INTERVAL ''' || days_ago::text || ' days''
           GROUP BY DATE(created_at)
           ORDER BY date ASC';
END;
$$;

-- Function to get total email count within a date range
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
GRANT EXECUTE ON FUNCTION get_email_counts_by_date(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_email_counts_in_range(timestamp with time zone, timestamp with time zone) TO authenticated;