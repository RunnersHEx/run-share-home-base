-- Minimal test functions - run this first to test basic functionality

-- Simple version of admin_delete_race function
CREATE OR REPLACE FUNCTION admin_delete_race(
  race_id uuid,
  admin_user_id uuid,
  deletion_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  race_record RECORD;
BEGIN
  -- Get race record
  SELECT r.*, pr.first_name, pr.last_name, pr.email 
  INTO race_record 
  FROM races r
  JOIN profiles pr ON pr.id = r.host_id
  WHERE r.id = race_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Race not found');
  END IF;

  -- Simply delete the race for now
  DELETE FROM races WHERE id = race_id;

  RETURN jsonb_build_object(
    'success', true,
    'race_name', race_record.name
  );
END;
$$;

-- Simple version of admin_update_race_status function
CREATE OR REPLACE FUNCTION admin_update_race_status(
  race_id uuid,
  admin_user_id uuid,
  new_is_active boolean,
  admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  race_record RECORD;
BEGIN
  -- Get race record
  SELECT r.*, pr.first_name, pr.last_name, pr.email 
  INTO race_record 
  FROM races r
  JOIN profiles pr ON pr.id = r.host_id
  WHERE r.id = race_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Race not found');
  END IF;

  -- Update race status
  UPDATE races 
  SET is_active = new_is_active, updated_at = now()
  WHERE id = race_id;

  RETURN jsonb_build_object(
    'success', true,
    'race_name', race_record.name
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION admin_update_race_status TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_race TO authenticated;
