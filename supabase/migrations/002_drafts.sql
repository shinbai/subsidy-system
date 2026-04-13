-- ============================================
-- Phase 2: 申請書ドラフト・テンプレート
-- ============================================

-- 申請書テンプレート（補助金の申請書フォーマット定義）
CREATE TABLE draft_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subsidy_id UUID REFERENCES subsidies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  sections JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 申請書ドラフト
CREATE TABLE drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  subsidy_id UUID REFERENCES subsidies(id),
  template_id UUID REFERENCES draft_templates(id),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'finalized')),
  input_data JSONB,
  generated_content JSONB,
  final_content JSONB,
  generation_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE draft_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_access" ON draft_templates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_access" ON drafts
  FOR ALL USING (auth.role() = 'authenticated');

-- updated_atトリガー
CREATE TRIGGER update_drafts_updated_at
  BEFORE UPDATE ON drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- インデックス
CREATE INDEX idx_drafts_application ON drafts(application_id);
CREATE INDEX idx_drafts_subsidy ON drafts(subsidy_id);
CREATE INDEX idx_draft_templates_subsidy ON draft_templates(subsidy_id);

-- ============================================
-- 小規模事業者持続化補助金 テンプレート（初期データ）
-- ============================================
INSERT INTO draft_templates (name, description, is_default, sections) VALUES
(
  '小規模事業者持続化補助金（経営計画書・補助事業計画書）',
  '小規模事業者持続化補助金の一般型に対応した申請書テンプレート。経営計画書と補助事業計画書の各セクションを含みます。',
  true,
  '[
    {
      "id": "company_overview",
      "title": "1. 企業概要",
      "type": "textarea",
      "prompt_hint": "会社の基本情報、事業内容、沿革、組織体制を記述してください",
      "max_chars": 800
    },
    {
      "id": "customer_needs",
      "title": "2. 顧客ニーズと市場の動向",
      "type": "textarea",
      "prompt_hint": "ターゲット顧客のニーズ、市場規模、業界トレンドを具体的な数字を含めて記述してください",
      "max_chars": 600
    },
    {
      "id": "own_strengths",
      "title": "3. 自社や自社の提供する商品・サービスの強み",
      "type": "textarea",
      "prompt_hint": "競合との差別化ポイント、独自の強み、実績を具体的に記述してください",
      "max_chars": 600
    },
    {
      "id": "business_plan",
      "title": "4. 経営方針・目標と今後のプラン",
      "type": "textarea",
      "prompt_hint": "中長期的な経営方針、売上目標、具体的な行動計画を記述してください",
      "max_chars": 800
    },
    {
      "id": "subsidy_purpose",
      "title": "5. 補助事業で行う事業名",
      "type": "textarea",
      "prompt_hint": "補助事業の名称を30文字程度で簡潔に記述してください",
      "max_chars": 100
    },
    {
      "id": "subsidy_overview",
      "title": "6. 販路開拓等の取組内容",
      "type": "textarea",
      "prompt_hint": "補助事業の具体的な内容、実施方法、スケジュールを記述してください",
      "max_chars": 1000
    },
    {
      "id": "subsidy_effect",
      "title": "7. 業務効率化（生産性向上）の取組内容",
      "type": "textarea",
      "prompt_hint": "IT活用や業務プロセス改善など、生産性向上に関する取組を記述してください",
      "max_chars": 600
    },
    {
      "id": "expected_effect",
      "title": "8. 補助事業の効果",
      "type": "textarea",
      "prompt_hint": "補助事業完了後の定量的・定性的な効果（売上増加率、顧客数増加など）を記述してください",
      "max_chars": 600
    }
  ]'::jsonb
);
