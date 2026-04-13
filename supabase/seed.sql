-- ============================================
-- 初期データ挿入
-- ============================================

-- 法人プロフィール: Gold Phoenix
INSERT INTO organizations (
  name, legal_form, industry, employee_count, capital_amount,
  representative, postal_code, address, phone, email
) VALUES (
  '株式会社Gold Phoenix',
  '株式会社',
  '社交ダンス教室',
  5,
  3000000,
  '金光進陪',
  '150-0001',
  '東京都渋谷区神宮前1丁目',
  NULL,
  NULL
);

-- 拠点: 原宿店
INSERT INTO locations (
  organization_id,
  name, branch_name, address, city, ward, prefecture,
  postal_code, opened_date, employee_count, is_active, notes
) VALUES (
  (SELECT id FROM organizations LIMIT 1),
  'DANCE GRAND Harajuku',
  '原宿店',
  '東京都渋谷区神宮前1丁目',
  '渋谷区',
  '神宮前',
  '東京都',
  '150-0001',
  NULL,
  3,
  true,
  '本店。日本最大の会員数を持つ社交ダンス教室'
);

-- 拠点: 吉祥寺店（準備中）
INSERT INTO locations (
  organization_id,
  name, branch_name, address, city, ward, prefecture,
  postal_code, opened_date, employee_count, is_active, notes
) VALUES (
  (SELECT id FROM organizations LIMIT 1),
  'DANCE GRAND Kichijoji',
  '吉祥寺店',
  '東京都武蔵野市吉祥寺',
  '武蔵野市',
  '吉祥寺',
  '東京都',
  '180-0004',
  NULL,
  0,
  false,
  '準備中。2号店として出店予定'
);

-- 補助金初期データ
INSERT INTO subsidies (name, official_name, category, authority, authority_url, target_area, target_industry, target_size, purpose, max_amount, subsidy_rate, status, source_url, is_manually_added) VALUES
(
  '小規模事業者持続化補助金',
  '小規模事業者持続化補助金（一般型）第20回',
  'subsidy',
  '商工会議所',
  'https://r3.jizokukahojokin.info/',
  '全国',
  ARRAY['全業種'],
  ARRAY['小規模事業者'],
  ARRAY['販路開拓', '広告宣伝', '設備投資'],
  2000000,
  0.67,
  'open',
  'https://r3.jizokukahojokin.info/',
  true
),
(
  'IT導入補助金2025',
  'IT導入補助金2025',
  'subsidy',
  '中小企業庁',
  'https://www.it-hojo.jp/',
  '全国',
  ARRAY['全業種'],
  ARRAY['中小企業', '小規模事業者'],
  ARRAY['IT導入'],
  1500000,
  0.50,
  'open',
  'https://www.it-hojo.jp/',
  true
),
(
  '東京都中小企業強靱化支援補助金',
  '東京都中小企業強靱化支援補助金',
  'subsidy',
  '東京都産業労働局',
  NULL,
  '東京都',
  ARRAY['全業種'],
  ARRAY['中小企業'],
  ARRAY['事業継続', 'BCP対策'],
  2000000,
  NULL,
  'open',
  NULL,
  true
),
(
  'キャリアアップ助成金（正社員化コース）',
  'キャリアアップ助成金（正社員化コース）',
  'grant',
  '厚生労働省',
  'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/part_haken/jigyounushi/career.html',
  '全国',
  ARRAY['全業種'],
  ARRAY['全規模'],
  ARRAY['雇用'],
  800000,
  NULL,
  'open',
  'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/part_haken/jigyounushi/career.html',
  true
),
(
  '人材確保等支援助成金',
  '人材確保等支援助成金',
  'grant',
  '厚生労働省',
  'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000199292.html',
  '全国',
  ARRAY['全業種'],
  ARRAY['全規模'],
  ARRAY['雇用'],
  NULL,
  NULL,
  'open',
  'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000199292.html',
  true
);
