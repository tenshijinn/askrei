
-- Enums
CREATE TYPE public.contributor_role AS ENUM ('dev', 'product', 'research', 'community', 'design', 'ops');
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.verification_type AS ENUM ('followed_by_web3_project', 'kol', 'thought_leader', 'web3_founder', 'manual');

-- Helper functions (no table dependencies)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_rei_registry_updated_at()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- user_roles (must come before has_role function)
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function (depends on user_roles)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- user_roles RLS (depends on has_role)
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- talent_views (must come before rei_registry policies)
CREATE TABLE public.talent_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_wallet TEXT NOT NULL,
  talent_x_user_id TEXT NOT NULL,
  payment_tx_signature TEXT NOT NULL UNIQUE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employer_wallet, talent_x_user_id)
);
ALTER TABLE public.talent_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employers can view their own talent views" ON public.talent_views FOR SELECT
  USING (employer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');
CREATE POLICY "Employers can insert talent views" ON public.talent_views FOR INSERT WITH CHECK (true);
CREATE INDEX idx_talent_views_employer ON public.talent_views(employer_wallet);
CREATE INDEX idx_talent_views_talent ON public.talent_views(talent_x_user_id);

-- rei_registry
CREATE TABLE public.rei_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  x_user_id TEXT, handle TEXT, display_name TEXT, profile_image_url TEXT,
  verified BOOLEAN DEFAULT false, wallet_address TEXT NOT NULL, file_path TEXT NOT NULL,
  portfolio_url TEXT, role_tags contributor_role[], consent BOOLEAN NOT NULL DEFAULT true,
  nft_minted BOOLEAN DEFAULT false, nft_mint_address TEXT,
  profile_analysis jsonb, analysis_summary text, profile_score numeric,
  skill_category_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT rei_registry_wallet_address_key UNIQUE (wallet_address)
);
ALTER TABLE public.rei_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage registry" ON public.rei_registry FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Users can view own profile" ON public.rei_registry FOR SELECT TO authenticated
  USING (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address')
    OR x_user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'x_user_id'));
CREATE POLICY "Paid employers can view purchased profiles" ON public.rei_registry FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.talent_views tv WHERE tv.talent_x_user_id = rei_registry.x_user_id
    AND tv.employer_wallet = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address')));
CREATE POLICY "Admins can view all profiles" ON public.rei_registry FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_rei_registry_updated_at BEFORE UPDATE ON public.rei_registry FOR EACH ROW EXECUTE FUNCTION public.update_rei_registry_updated_at();
CREATE INDEX idx_rei_registry_skill_categories ON public.rei_registry USING GIN(skill_category_ids);

-- chat_conversations
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  user_type TEXT CHECK (user_type IN ('talent', 'employer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own conversations" ON public.chat_conversations FOR SELECT
  USING (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'));
CREATE POLICY "Users can insert their own conversations" ON public.chat_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own conversations" ON public.chat_conversations FOR UPDATE
  USING (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'));
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_chat_conversations_wallet ON public.chat_conversations(wallet_address);

-- chat_messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL, metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own messages" ON public.chat_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chat_conversations WHERE id = conversation_id
    AND wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address')));
CREATE POLICY "Users can insert their own messages" ON public.chat_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.chat_conversations WHERE id = conversation_id
    AND wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address')));
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id);

-- jobs
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, description TEXT NOT NULL, requirements TEXT,
  role_tags TEXT[] DEFAULT '{}', compensation TEXT, employer_wallet TEXT NOT NULL,
  payment_tx_signature TEXT NOT NULL UNIQUE, og_image text, link text,
  source text DEFAULT 'manual', external_id text, company_name TEXT,
  deadline TIMESTAMP WITH TIME ZONE, solana_pay_reference TEXT UNIQUE,
  expires_at timestamp with time zone, apply_url text,
  opportunity_type TEXT DEFAULT 'job', skill_category_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'filled'))
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active jobs" ON public.jobs FOR SELECT USING (status = 'active');
CREATE POLICY "Employers can insert their own jobs" ON public.jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Employers can update their own jobs" ON public.jobs FOR UPDATE
  USING (employer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_jobs_employer ON public.jobs(employer_wallet);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_external_id ON public.jobs(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_jobs_solana_pay_reference ON public.jobs(solana_pay_reference);
CREATE INDEX idx_jobs_skill_categories ON public.jobs USING GIN(skill_category_ids);

-- tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, description TEXT NOT NULL, link TEXT NOT NULL,
  role_tags TEXT[] DEFAULT '{}', compensation TEXT, employer_wallet TEXT NOT NULL,
  payment_tx_signature TEXT NOT NULL UNIQUE, og_image text,
  source text DEFAULT 'manual', external_id text, company_name TEXT,
  end_date TIMESTAMP WITH TIME ZONE, solana_pay_reference TEXT UNIQUE,
  opportunity_type TEXT DEFAULT 'task', skill_category_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'completed'))
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active tasks" ON public.tasks FOR SELECT USING (status = 'active');
CREATE POLICY "Employers can insert their own tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Employers can update their own tasks" ON public.tasks FOR UPDATE
  USING (employer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_tasks_employer ON public.tasks(employer_wallet);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_external_id ON public.tasks(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_tasks_solana_pay_reference ON public.tasks(solana_pay_reference);
CREATE INDEX idx_tasks_skill_categories ON public.tasks USING GIN(skill_category_ids);

-- user_points
CREATE TABLE public.user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL, x_user_id text,
  total_points integer DEFAULT 0, points_pending integer DEFAULT 0,
  lifetime_earnings_sol numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own points" ON public.user_points FOR SELECT TO authenticated
  USING (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));
CREATE POLICY "Users can view points by x_user_id" ON public.user_points FOR SELECT
  USING (x_user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'x_user_id'::text));
CREATE POLICY "Users can insert their own points" ON public.user_points FOR INSERT TO authenticated
  WITH CHECK (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));
CREATE POLICY "Admins can manage all points" ON public.user_points FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_user_points_updated_at BEFORE UPDATE ON public.user_points FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- payment_references
CREATE TABLE public.payment_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE, amount numeric NOT NULL, memo text,
  payer text NOT NULL, status text NOT NULL DEFAULT 'pending',
  payment_type text NOT NULL DEFAULT 'x402', tx_signature text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert payment references" ON public.payment_references FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own payment references" ON public.payment_references FOR SELECT
  USING (payer = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));
CREATE POLICY "Service role can manage all payment references" ON public.payment_references FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);
CREATE POLICY "Only service role can update payments" ON public.payment_references FOR UPDATE
  USING ((auth.jwt() ->> 'role'::text) = 'service_role') WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role');
CREATE TRIGGER update_payment_references_updated_at BEFORE UPDATE ON public.payment_references FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_payment_references_reference ON public.payment_references(reference);
CREATE INDEX idx_payment_references_status ON public.payment_references(status);
CREATE INDEX idx_payment_references_payer ON public.payment_references(payer);

-- rei_treasury_wallet
CREATE TABLE public.rei_treasury_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL, balance_sol numeric DEFAULT 0,
  total_distributed numeric DEFAULT 0, last_updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.rei_treasury_wallet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view treasury" ON public.rei_treasury_wallet FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage treasury" ON public.rei_treasury_wallet FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- skill_categories
CREATE TABLE public.skill_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, description TEXT, keywords TEXT[] DEFAULT '{}',
  parent_category_id UUID REFERENCES public.skill_categories(id),
  job_count INTEGER DEFAULT 0, task_count INTEGER DEFAULT 0, talent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT skill_categories_name_unique UNIQUE (name)
);
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view skill categories" ON public.skill_categories FOR SELECT USING (true);
CREATE TRIGGER update_skill_categories_updated_at BEFORE UPDATE ON public.skill_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_skill_categories_keywords ON public.skill_categories USING GIN(keywords);

-- twitter_whitelist
CREATE TABLE public.twitter_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twitter_handle TEXT NOT NULL UNIQUE, twitter_user_id text,
  verification_type verification_type NOT NULL, notes TEXT,
  verified_by UUID REFERENCES auth.users(id),
  welcome_dm_sent boolean DEFAULT false, welcome_dm_sent_at timestamp with time zone,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.twitter_whitelist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read twitter whitelist" ON public.twitter_whitelist FOR SELECT USING (true);
CREATE POLICY "Service role can manage whitelist" ON public.twitter_whitelist FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Admins can manage whitelist" ON public.twitter_whitelist FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_twitter_whitelist_updated_at BEFORE UPDATE ON public.twitter_whitelist FOR EACH ROW EXECUTE FUNCTION update_rei_registry_updated_at();
CREATE INDEX idx_twitter_whitelist_handle ON public.twitter_whitelist(twitter_handle);

-- twitter_whitelist_submissions
CREATE TABLE public.twitter_whitelist_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  twitter_handle TEXT NOT NULL, x_user_id TEXT, display_name TEXT, profile_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE, reviewed_by UUID, notes TEXT,
  dm_sent boolean DEFAULT false, dm_sent_at timestamp with time zone, contact_email text
);
ALTER TABLE public.twitter_whitelist_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit whitelist requests" ON public.twitter_whitelist_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all wl submissions" ON public.twitter_whitelist_submissions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own wl submission" ON public.twitter_whitelist_submissions FOR SELECT
  USING (x_user_id = ((current_setting('request.jwt.claims', true))::json ->> 'x_user_id'));
CREATE POLICY "Admins can update wl submissions" ON public.twitter_whitelist_submissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_twitter_whitelist_submissions_handle ON public.twitter_whitelist_submissions(twitter_handle);
CREATE INDEX idx_twitter_whitelist_submissions_status ON public.twitter_whitelist_submissions(status);

-- community_submissions
CREATE TABLE public.community_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_type text NOT NULL CHECK (submission_type IN ('job', 'task')),
  submitter_wallet text NOT NULL, submitter_x_user_id text,
  title text NOT NULL, description text NOT NULL, link text NOT NULL,
  og_image text, compensation text, role_tags text[] DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),
  duplicate_of uuid, points_awarded integer DEFAULT 0,
  reviewed_by uuid REFERENCES auth.users(id), reviewed_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.community_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own comm submissions" ON public.community_submissions FOR SELECT TO authenticated
  USING (submitter_wallet = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));
CREATE POLICY "Anyone can insert comm submissions" ON public.community_submissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage all comm submissions" ON public.community_submissions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_community_submissions_updated_at BEFORE UPDATE ON public.community_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_community_submissions_status ON public.community_submissions(status);
CREATE INDEX idx_community_submissions_wallet ON public.community_submissions(submitter_wallet);

-- points_transactions
CREATE TABLE public.points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('earned', 'converted', 'bonus')),
  points integer NOT NULL, submission_id uuid REFERENCES public.community_submissions(id),
  sol_amount numeric, tx_signature text, solana_pay_reference TEXT,
  payment_token_mint TEXT, payment_token_amount NUMERIC,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_points_solana_pay_reference UNIQUE (solana_pay_reference)
);
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own pt transactions" ON public.points_transactions FOR SELECT TO authenticated
  USING (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));
CREATE POLICY "Admins can view all pt transactions" ON public.points_transactions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_points_transactions_wallet ON public.points_transactions(wallet_address);

-- referral_codes
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL, x_user_id text,
  referral_code text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), is_active boolean NOT NULL DEFAULT true
);
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own referral code" ON public.referral_codes FOR SELECT
  USING (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text)
    OR x_user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'x_user_id'::text));
CREATE POLICY "Service role can manage referral codes" ON public.referral_codes FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Admins can view all referral codes" ON public.referral_codes FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_referral_codes_wallet ON public.referral_codes(wallet_address);
CREATE INDEX idx_referral_codes_code ON public.referral_codes(referral_code);

-- referral_clicks
CREATE TABLE public.referral_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code text NOT NULL, clicked_at timestamptz NOT NULL DEFAULT now(),
  click_date date NOT NULL DEFAULT CURRENT_DATE, ip_hash text NOT NULL,
  user_agent_hash text, source_url text, target_path text,
  session_id text NOT NULL, points_awarded boolean NOT NULL DEFAULT false
);
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage referral clicks" ON public.referral_clicks FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Users can view clicks for their referral code" ON public.referral_clicks FOR SELECT
  USING (referral_code IN (SELECT rc.referral_code FROM public.referral_codes rc
    WHERE rc.wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text)
    OR rc.x_user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'x_user_id'::text)));
CREATE POLICY "Admins can view all referral clicks" ON public.referral_clicks FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_referral_clicks_code ON public.referral_clicks(referral_code);
CREATE INDEX idx_referral_clicks_session ON public.referral_clicks(session_id);
CREATE INDEX idx_referral_clicks_dedup ON public.referral_clicks(referral_code, ip_hash, click_date);

-- referral_conversions
CREATE TABLE public.referral_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code text NOT NULL,
  conversion_type text NOT NULL CHECK (conversion_type IN ('registration', 'payment')),
  converted_wallet text NOT NULL, payment_amount numeric,
  points_awarded integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  click_id uuid REFERENCES public.referral_clicks(id)
);
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage referral conversions" ON public.referral_conversions FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Users can view conversions for their referral code" ON public.referral_conversions FOR SELECT
  USING (referral_code IN (SELECT rc.referral_code FROM public.referral_codes rc
    WHERE rc.wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text)
    OR rc.x_user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'x_user_id'::text)));
CREATE POLICY "Admins can view all referral conversions" ON public.referral_conversions FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_referral_conversions_code ON public.referral_conversions(referral_code);
CREATE INDEX idx_referral_conversions_wallet ON public.referral_conversions(converted_wallet);

-- admin_audit_log
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL, admin_handle TEXT, action TEXT NOT NULL,
  table_name TEXT NOT NULL, record_id TEXT, previous_value JSONB, new_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_log FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert audit logs" ON public.admin_audit_log FOR INSERT WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_log FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- increment_user_points function
CREATE OR REPLACE FUNCTION public.increment_user_points(p_wallet_address text, p_points integer, p_x_user_id text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO user_points (wallet_address, total_points, x_user_id) VALUES (p_wallet_address, p_points, p_x_user_id)
  ON CONFLICT (wallet_address) DO UPDATE SET total_points = user_points.total_points + p_points,
    x_user_id = COALESCE(EXCLUDED.x_user_id, user_points.x_user_id), updated_at = now();
END; $$;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('rei-contributor-files', 'rei-contributor-files', false);
CREATE POLICY "Anyone can upload contributor files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'rei-contributor-files');
CREATE POLICY "Users can view their uploaded files" ON storage.objects FOR SELECT USING (bucket_id = 'rei-contributor-files');
