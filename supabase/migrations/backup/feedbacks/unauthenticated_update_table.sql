alter policy "Enable update for users based on userid"
on "public"."feedbacks"
to anon, authenticated
using (
  -- For authenticated users: check if they created the feedback
  (auth.role() = 'authenticated' AND auth.uid() = "createdBy")
  OR
  -- For anonymous users: check if they have a valid token
  (auth.role() = 'anon' AND token IS NOT NULL AND token = current_setting('app.feedback_token', true)::uuid)
)
with check (
  -- For authenticated users: check if they created the feedback
  (auth.role() = 'authenticated' AND auth.uid() = "createdBy")
  OR
  -- For anonymous users: check if they have a valid token
  (auth.role() = 'anon' AND token IS NOT NULL AND token = current_setting('app.feedback_token', true)::uuid)
);





















-- alter policy "Enable update for users based on userid"
-- on "public"."feedbacks"
-- to anon, authenticated
-- using (
--   -- For authenticated users: check if they created the feedback
--   (auth.role() = 'authenticated' AND (SELECT auth.uid()) = "createdBy")
--   OR
--   -- For anonymous users: check if they have a valid token
--   (auth.role() = 'anon' AND token IS NOT NULL AND token = current_setting('app.feedback_token', true))
-- )
-- with check (
--   -- For authenticated users: check if they created the feedback
--   (auth.role() = 'authenticated' AND (SELECT auth.uid()) = "createdBy")
--   OR
--   -- For anonymous users: check if they have a valid token
--   (auth.role() = 'anon' AND token IS NOT NULL AND token = current_setting('app.feedback_token', true))
-- );
















-- alter policy "Enable update for users based on userid"
-- on "public"."feedbacks"
-- to anon, authenticated
-- using (
--   -- For authenticated users: check if they created the feedback
--   (auth.role() = 'authenticated' AND (SELECT auth.uid() AS uid) = "createdBy")
--   OR
--   -- For anonymous users: check if they have a valid token
--   (auth.role() = 'anon' AND token IS NOT NULL AND token = current_setting('app.feedback_token', true)::text)
-- )
-- with check (
--   -- For authenticated users: check if they created the feedback
--   (auth.role() = 'authenticated' AND (SELECT auth.uid() AS uid) = "createdBy")
--   OR
--   -- For anonymous users: check if they have a valid token
--   (auth.role() = 'anon' AND token IS NOT NULL AND token = current_setting('app.feedback_token', true)::text)
-- );