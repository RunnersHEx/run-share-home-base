-- Also update admin_update_race_status function to match parameter naming
DROP FUNCTION IF EXISTS admin_update_race_status(uuid,uuid,boolean,text);

CREATE OR REPLACE FUNCTION admin_update_race_status(
  p_race_id uuid,
  p_admin_user_id uuid,
  p_new_is_active boolean,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_race_record RECORD;
  v_admin_profile RECORD;
  v_action_type text;
BEGIN
  -- Check if admin exists
  SELECT * INTO v_admin_profile FROM profiles WHERE id = p_admin_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin not found');
  END IF;

  -- Get race record with host info
  SELECT r.*, pr.first_name, pr.last_name, pr.email 
  INTO v_race_record 
  FROM races r
  JOIN profiles pr ON pr.id = r.host_id
  WHERE r.id = p_race_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Race not found');
  END IF;

  -- Determine action type
  v_action_type := CASE WHEN p_new_is_active THEN 'activation' ELSE 'deactivation' END;

  -- Update race status
  UPDATE races 
  SET is_active = p_new_is_active, updated_at = now()
  WHERE id = p_race_id;

  -- Create admin message
  INSERT INTO admin_messages (
    admin_id,
    user_id, 
    message_type,
    title,
    message,
    reason
  ) VALUES (
    p_admin_user_id,
    v_race_record.host_id,
    v_action_type,
    CASE 
      WHEN p_new_is_active THEN 'Carrera aprobada' 
      ELSE 'Carrera desactivada' 
    END,
    CASE 
      WHEN p_new_is_active THEN 
        CONCAT('Tu carrera "', v_race_record.name, '" ha sido aprobada y ya está disponible para reservas.')
      ELSE 
        CONCAT(
          'Tu carrera "', v_race_record.name, '" ha sido desactivada. ',
          CASE WHEN p_admin_notes IS NOT NULL THEN CONCAT('Motivo: ', p_admin_notes, ' ') ELSE '' END,
          'Contacta con soporte si necesitas más información.'
        )
    END,
    p_admin_notes
  );

  -- Create notification
  INSERT INTO user_notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    v_race_record.host_id,
    CASE WHEN p_new_is_active THEN 'race_approved' ELSE 'race_rejected' END,
    CASE 
      WHEN p_new_is_active THEN 'Carrera aprobada' 
      ELSE 'Carrera desactivada' 
    END,
    CASE 
      WHEN p_new_is_active THEN 
        CONCAT('Tu carrera "', v_race_record.name, '" ha sido aprobada exitosamente.')
      ELSE 
        CONCAT('Tu carrera "', v_race_record.name, '" ha sido desactivada. Revisa los mensajes del administrador para más detalles.')
    END,
    jsonb_build_object(
      'admin_id', p_admin_user_id,
      'race_id', p_race_id,
      'race_name', v_race_record.name,
      'action', CASE WHEN p_new_is_active THEN 'approve' ELSE 'reject' END,
      'notes', p_admin_notes,
      'action_date', now()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'action', v_action_type,
    'race_name', v_race_record.name,
    'host_name', COALESCE(v_race_record.first_name || ' ' || v_race_record.last_name, v_race_record.email)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_race_status TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_race_status TO anon;

SELECT 'admin_update_race_status function updated with clean parameter names' as status;
