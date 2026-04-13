-- ============================================
-- 補助金・助成金管理システム 初期マイグレーション
-- ============================================

-- 法人プロフィール
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '株式会社Gold Phoenix',
  legal_form TEXT DEFAULT '株式会社',
  industry TEXT DEFAULT '社交ダンス教室',
  employee_count INTEGER DEFAULT 5,
  capital_amount BIGINT DEFAULT 3000000,
  annual_revenue BIGINT,
  established_date DATE,
  representative TEXT DEFAULT '金光進陪',
  postal_code TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  invoice_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 拠点プロフィール
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  branch_name TEXT,
  address TEXT,
  city TEXT,
  ward TEXT,
  prefecture TEXT DEFAULT '東京都',
  postal_code TEXT,
  opened_date DATE,
  employee_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 補助金・助成金マスタ
CREATE TABLE subsidies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  official_name TEXT,
  category TEXT NOT NULL CHECK (category IN ('subsidy', 'grant', 'loan')),
  authority TEXT NOT NULL,
  authority_url TEXT,
  target_area TEXT,
  target_industry TEXT[],
  target_size TEXT[],
  purpose TEXT[],
  max_amount BIGINT,
  subsidy_rate NUMERIC(5,2),
  application_start DATE,
  application_deadline DATE,
  announcement_date DATE,
  round_number INTEGER,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'upcoming', 'unknown')),
  requirements TEXT,
  notes TEXT,
  source_url TEXT,
  is_manually_added BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 申請管理
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subsidy_id UUID REFERENCES subsidies(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id),
  organization_id UUID REFERENCES organizations(id),
  status TEXT NOT NULL DEFAULT 'discovered' CHECK (
    status IN ('discovered', 'reviewing', 'applying', 'reviewing_by_authority', 'adopted', 'rejected', 'received')
  ),
  assigned_to TEXT,
  application_amount BIGINT,
  adopted_amount BIGINT,
  received_amount BIGINT,
  applied_date DATE,
  result_date DATE,
  received_date DATE,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ナレッジベース
CREATE TABLE knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  subsidy_id UUID REFERENCES subsidies(id),
  result TEXT NOT NULL CHECK (result IN ('adopted', 'rejected')),
  key_points TEXT,
  feedback_from_authority TEXT,
  lessons_learned TEXT,
  effective_phrases TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 通知ログ
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subsidy_id UUID REFERENCES subsidies(id),
  application_id UUID REFERENCES applications(id),
  type TEXT NOT NULL CHECK (
    type IN ('deadline_30d', 'deadline_7d', 'deadline_1d', 'status_change')
  ),
  channel TEXT NOT NULL CHECK (channel IN ('line', 'email')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subsidies_updated_at
  BEFORE UPDATE ON subsidies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_updated_at
  BEFORE UPDATE ON knowledge
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS有効化
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidies ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLSポリシー（認証ユーザーは全データにアクセス可能）
CREATE POLICY "authenticated_access" ON organizations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_access" ON locations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_access" ON subsidies
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_access" ON applications
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_access" ON knowledge
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_access" ON notifications
  FOR ALL USING (auth.role() = 'authenticated');

-- インデックス
CREATE INDEX idx_subsidies_deadline ON subsidies(application_deadline);
CREATE INDEX idx_subsidies_status ON subsidies(status);
CREATE INDEX idx_subsidies_category ON subsidies(category);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_subsidy ON applications(subsidy_id);
CREATE INDEX idx_notifications_subsidy ON notifications(subsidy_id);
CREATE INDEX idx_notifications_type ON notifications(type);
