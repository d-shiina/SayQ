# SayQ — 毎月の請求書作成ツール

freee のような「帳票 + フォーム」で、毎月の請求書をかんたんに作成・管理できる Web アプリです。

## 主な機能

- 🔐 **ユーザー認証** — メール / パスワードでの新規登録・ログイン（セッションは JWT + httpOnly Cookie）
- 🏢 **自社情報設定** — 会社名・住所・インボイス登録番号・振込先・角印テキストを請求書に反映
- 👥 **取引先管理** — 請求先の登録・編集・削除
- 🧾 **請求書作成フォーム** — 明細の動的追加、数量 × 単価の自動計算、税率（10% / 8% / 非課税）対応、消費税の端数処理（切り捨て / 四捨五入 / 切り上げ）
- 📄 **帳票プレビュー** — freee ライクな A4 レイアウト。ブラウザの印刷機能でそのまま **PDF 出力**
- 📊 **ダッシュボード** — 今月の請求額 / 未入金合計 / 最近の請求書
- 🗂 **ステータス管理** — 下書き / 送付済み / 入金済み、対象月フィルタ、複製（翌月請求に便利）

## 技術スタック

| 領域 | 採用技術 |
| --- | --- |
| フレームワーク | Next.js 16 (App Router) / React 19 / TypeScript |
| UI | Tailwind CSS + shadcn/ui スタイルのコンポーネント |
| DB / ORM | Prisma + PostgreSQL（Neon 推奨） |
| 認証 | 自前のセッション（`jose` による JWT + `bcryptjs`） |
| バリデーション | Zod |

## セットアップ（ローカル）

```bash
# 1. 依存関係をインストール
npm install

# 2. 環境変数を用意（.env.example をコピー）
cp .env.example .env
#   DATABASE_URL / DIRECT_URL に Neon の接続文字列を設定（下記「デプロイ」参照）
#   AUTH_SECRET には十分に長いランダム値を設定（例: openssl rand -base64 32）

# 3. データベースにスキーマを反映
npm run db:migrate      # 本番と同じ migrate deploy（Neon に対して実行）
#   ↑ ローカルでスキーマを試行錯誤する場合は npm run db:push でも可

# 4. （任意）デモデータを投入
npm run db:seed
#   → demo@example.com / password123 でログインできます

# 5. 開発サーバーを起動
npm run dev
# http://localhost:3000
```

> ローカル開発でも DB は Neon を使います（開発用に別の Neon プロジェクト／ブランチを
> 作っておくと本番と分離できます）。ローカルだけ別の PostgreSQL を立てても構いません。

## 使い方

1. `/register` からアカウントを作成
2. **自社情報設定** で会社名・住所・振込先などを入力
3. **取引先** を登録
4. **請求書を作成** → 明細を入力 → 作成
5. 帳票プレビュー画面で **「印刷 / PDF」** ボタン → ブラウザの印刷ダイアログから PDF 保存

## デプロイ（Vercel + Neon）

このアプリは **Vercel + Neon（サーバーレス PostgreSQL）** の無料枠で運用できます。
DB は Prisma + PostgreSQL 構成、初期マイグレーションは `prisma/migrations/` に含まれており、
`npm run build`（= `prisma generate && prisma migrate deploy && next build`）で
デプロイ時に自動でスキーマが反映されます。

### 1. Neon で DB を作成

1. <https://neon.tech> にサインアップ → 新規プロジェクトを作成
2. 作成後の **Connection string** を控える。2種類ある点に注意:
   - **Pooled**（ホスト名に `-pooler` が付く）→ アプリ実行用 = `DATABASE_URL`
   - **Direct / Unpooled**（`-pooler` なし）→ マイグレーション用 = `DIRECT_URL`
   - どちらも末尾に `?sslmode=require` を付ける

> Vercel の **Storage → Create Database → Neon** から作ると Vercel と自動連携され、
> `DATABASE_URL` と `DATABASE_URL_UNPOOLED` が自動で入ります。その場合は下記 3 で
> `DIRECT_URL` に `DATABASE_URL_UNPOOLED` の値を手動で設定してください。

### 2. Vercel にインポート

1. <https://vercel.com> でこのリポジトリを **Import**
2. Framework は自動で Next.js と認識されます（Build/Install コマンドは変更不要）

### 3. 環境変数を設定（Vercel → Settings → Environment Variables）

| 変数名 | 値 |
| --- | --- |
| `DATABASE_URL` | Neon の **Pooled** 接続文字列（`-pooler` 付き） |
| `DIRECT_URL` | Neon の **Direct** 接続文字列（`-pooler` なし） |
| `AUTH_SECRET` | `openssl rand -base64 32` で生成したランダム値 |

すべて Production / Preview / Development にチェックを入れて保存します。

### 4. デプロイ

**Deploy** を実行するだけです。ビルド中に `prisma migrate deploy` が走り、
Neon にテーブルが作成されます。完了後、公開 URL の `/register` からアカウントを
作成して利用開始できます。

### （任意）デモデータの投入

手元から本番 DB に対して実行:

```bash
# .env の DATABASE_URL / DIRECT_URL を Neon の値にした状態で
npm run db:seed   # demo@example.com / password123
```

> **Vercel Hobby プランは規約上「非商用」向け**です。事業として本格運用する場合は
> Pro プラン（$20/月）をご検討ください。月数回・数社程度の利用なら Vercel・Neon とも
> 無料枠に十分収まります。

## ディレクトリ構成

```
app/
  (auth)/            ログイン・新規登録（認証アクション）
  (app)/             ログイン後の画面
    dashboard/       ダッシュボード
    invoices/        請求書 一覧・作成・編集・帳票プレビュー
    clients/         取引先管理
    settings/        自社情報設定
components/
  ui/                shadcn/ui スタイルの共通コンポーネント
  invoice-sheet.tsx  A4 帳票（印刷対応）
lib/
  prisma.ts          Prisma クライアント
  session.ts         セッション（JWT）
  invoice-calc.ts    金額・消費税の計算ロジック
  utils.ts           整形ユーティリティ
prisma/
  schema.prisma      データモデル
  seed.ts            デモデータ
proxy.ts             認証によるルート保護（Next.js Proxy、旧middleware）
```

## ライセンス

Private.
