# デプロイ手順書

## 1. GitHubリポジトリ作成 & プッシュ

### 1-1. GitHubでリポジトリを作成
1. https://github.com/new にアクセス
2. Repository name: `subsidy-system`
3. Private を選択
4. 「Create repository」をクリック

### 1-2. ローカルからプッシュ
```bash
cd /Users/shinsuke/補助金/subsidy-system
git remote add origin https://github.com/shinbai/subsidy-system.git
git branch -M main
git push -u origin main
```

---

## 2. Supabase設定

### 2-1. プロジェクト作成（未作成の場合）
1. https://supabase.com/dashboard にアクセス
2. 「New project」でプロジェクト作成
3. Region: Northeast Asia (Tokyo) を推奨

### 2-2. マイグレーション実行
Supabase Dashboard の SQL Editor で以下を順番に実行:

1. `supabase/migrations/001_initial.sql` の内容をコピー&実行
2. `supabase/migrations/002_drafts.sql` の内容をコピー&実行
3. `supabase/seed.sql` の内容をコピー&実行

### 2-3. APIキー取得
Settings > API から以下を取得:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 2-4. 認証ユーザー作成
Authentication > Users から「Add user」で初期ユーザーを作成

---

## 3. Vercelデプロイ

### 3-1. Vercelプロジェクト作成
1. https://vercel.com/new にアクセス
2. GitHubリポジトリ `shinbai/subsidy-system` を選択
3. Framework Preset: Next.js
4. Root Directory: (デフォルトのまま)

### 3-2. 環境変数設定
Vercel Dashboard > Settings > Environment Variables に以下を設定:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
ANTHROPIC_API_KEY=sk-ant-xxxxx
LINE_CHANNEL_ACCESS_TOKEN=（LINE Developers から取得）
LINE_CHANNEL_SECRET=（LINE Developers から取得）
RESEND_API_KEY=re_xxxxx
NOTIFICATION_LINE_USER_ID=U00000000000000
NOTIFICATION_EMAIL=your@email.com
CRON_SECRET=（任意の文字列。Cron保護用）
```

### 3-3. カスタムドメイン設定
1. Vercel Dashboard > Settings > Domains
2. `subsidy.dance-grand.com` を追加
3. Cloudflareで CNAME レコードを追加:
   - Name: `subsidy`
   - Target: `cname.vercel-dns.com`
   - Proxy status: DNS only (グレー雲)

### 3-4. デプロイ確認
`git push` で自動デプロイされます。

---

## 4. Cloudflare Workers デプロイ

### 4-1. wrangler インストール
```bash
npm install -g wrangler
wrangler login
```

### 4-2. 各Workerの環境変数設定
```bash
# J-Net21
cd workers/jnet21-scraper
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
wrangler secret put NOTIFICATION_LINE_USER_ID
wrangler deploy

# 東京都公社
cd ../tokyo-metro-scraper
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler deploy

# 厚労省
cd ../mhlw-scraper
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler deploy
```

---

## 5. LINE Messaging API 設定

1. https://developers.line.biz/ にアクセス
2. Messaging API チャンネルを作成
3. Channel access token を発行 → `LINE_CHANNEL_ACCESS_TOKEN`
4. Channel secret を取得 → `LINE_CHANNEL_SECRET`
5. 自分のUser IDを取得 → `NOTIFICATION_LINE_USER_ID`

---

## 6. Resend メール設定

1. https://resend.com/ でアカウント作成
2. API Key を取得 → `RESEND_API_KEY`
3. ドメイン認証: `dance-grand.com` を追加
   - CloudflareでDNSレコード（TXT, CNAME）を追加

---

## 動作確認チェックリスト

- [ ] ログインページが表示される
- [ ] ログインできる
- [ ] ダッシュボードにサマリーが表示される
- [ ] 補助金一覧に初期データが表示される
- [ ] 補助金を新規登録できる
- [ ] Kanbanボードが表示される
- [ ] 申請書作成ウィザードが動作する
- [ ] AI生成が動作する（ANTHROPIC_API_KEY設定後）
- [ ] Word出力がダウンロードできる
- [ ] 通知テスト送信が成功する
- [ ] 設定ページで法人プロフィールが編集できる
