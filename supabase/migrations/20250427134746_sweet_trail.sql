/*
  # Add test data for email_prio_logs

  1. Changes
    - Add sample email log entries for the past 30 days
    - Ensure data is available for testing the dashboard graph
*/

-- Insert test data for the last 30 days
DO $$
DECLARE
  i INTEGER;
  random_count INTEGER;
  log_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Insert sample data for the last 30 days
  FOR i IN 1..30 LOOP
    -- Generate a random count between 5 and 50
    random_count := floor(random() * 46 + 5);
    log_date := (CURRENT_DATE - (i || ' days')::interval)::timestamp with time zone;
    
    -- Insert random number of records for each day
    FOR j IN 1..random_count LOOP
      INSERT INTO email_prio_logs (
        email_sender,
        email_recipient,
        email_subject,
        email_priority,
        date,
        created_at
      ) VALUES (
        'sender' || j || '@example.com',
        'recipient' || j || '@example.com',
        'Test Subject ' || j,
        (ARRAY['1', '2', '3', '4', '5'])[floor(random() * 5 + 1)],
        log_date::date,
        log_date + (random() * 86400 * INTERVAL '1 second')
      );
    END LOOP;
  END LOOP;
END $$;