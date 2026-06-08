
-- 1. chat_conversations: only service_role inserts (edge function writes)
DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.chat_conversations;
CREATE POLICY "Service role inserts conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- 2. chat_messages: only service_role inserts
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.chat_messages;
CREATE POLICY "Service role inserts messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- 3. talent_views: only service_role inserts (rei-chat verifies payment server-side)
DROP POLICY IF EXISTS "Employers can insert talent views" ON public.talent_views;
CREATE POLICY "Service role inserts talent views"
  ON public.talent_views FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- 4. twitter_whitelist: drop public read; admins and service_role keep access via existing policies
DROP POLICY IF EXISTS "Anyone can read twitter whitelist" ON public.twitter_whitelist;

-- 5. Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated.
--    has_role is invoked inside RLS expressions (definer context) — no need for public EXECUTE.
--    update_* are trigger functions — never called directly.
--    increment_user_points is only called by edge functions using service_role.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_user_points(text, integer, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_rei_registry_updated_at() FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_user_points(text, integer, text) TO service_role;
