-- MINIMAL TEST VERSION - Just to verify basic functionality works
CREATE OR REPLACE FUNCTION admin_delete_race(
  p_race_id uuid,
  p_admin_user_id uuid,
  p_deletion_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_race_name text;
BEGIN
  -- Get race name
  SELECT name INTO v_race_name FROM races WHERE id = p_race_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Race not found');
  END IF;

  -- Simply delete the race (minimal version)
  DELETE FROM races WHERE id = p_race_id;

  RETURN jsonb_build_object(
    'success', true,
    'race_name', COALESCE(v_race_name, 'Carrera eliminada')
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', CONCAT('Database error: ', SQLERRM)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_delete_race TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_race TO anon;
