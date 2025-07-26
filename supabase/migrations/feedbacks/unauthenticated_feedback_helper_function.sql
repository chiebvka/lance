-- Create a function to set the feedback token for RLS
CREATE OR REPLACE FUNCTION set_feedback_token(token_param text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.feedback_token', token_param, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;