-- Add unique constraint to email column in admin_users table if it doesn't exist
DO $$
BEGIN
    -- Check if the unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'admin_users_email_key' 
        AND table_name = 'admin_users'
        AND table_schema = 'public'
    ) THEN
        -- Add unique constraint to email column
        ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_email_key UNIQUE (email);
    END IF;
END $$;