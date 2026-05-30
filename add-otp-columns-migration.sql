-- WorkTrack Pro - Add OTP columns for password reset
-- Adds otp_hash and otp_expires_at columns to app_users table for direct DB password reset

-- Add OTP columns to app_users table
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS otp_hash TEXT,
ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster OTP lookups
CREATE INDEX IF NOT EXISTS idx_app_users_otp_expires_at ON public.app_users(otp_expires_at);

-- Add comment for documentation
COMMENT ON COLUMN public.app_users.otp_hash IS 'SHA-256 hash of the 6-digit OTP for password reset';
COMMENT ON COLUMN public.app_users.otp_expires_at IS 'Expiration timestamp for the OTP (typically 15 minutes from creation)';
