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
| DB / ORM | Prisma + SQLite（本番は PostgreSQL 等に差し替え可能） |
| 認証 | 自前のセッション（`jose` による JWT + `bcryptjs`） |
| バリデーション | Zod |

## セットアップ（ローカル）

```bash
# 1. 依存関係をインストール
npm install

# 2. 環境変数を用意（.env.example をコピー）
cp .env.example .env
#   AUTH_SECRET には十分に長いランダム値を設定してください
#   例: openssl rand -base64 32

# 3. データベースを作成
npm run db:push

# 4. （任意）デモデータを投入
npm run db:seed
#   → demo@example.com / password123 でログインできます

# 5. 開発サーバーを起動
npm run dev
# http://localhost:3000
```

## 使い方

1. `/register` からアカウントを作成
2. **自社情報設定** で会社名・住所・振込先などを入力
3. **取引先** を登録
4. **請求書を作成** → 明細を入力 → 作成
5. 帳票プレビュー画面で **「印刷 / PDF」** ボタン → ブラウザの印刷ダイアログから PDF 保存

## デプロイ（Vercel + Neon）

このアプリは **Vercel + Neon（サーバーレス PostgreSQL）** の無料枠で運用できます。

1. `prisma/schema.prisma` の datasource を切り替え:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Vercel にプロジェクトをインポート
3. Vercel ダッシュボードの **Storage → Create Database → Neon** で DB を作成
   （`DATABASE_URL` が自動で環境変数に設定されます）
4. 環境変数 **`AUTH_SECRET`** を設定（`openssl rand -base64 32` の値など）
5. デプロイ後、初回のみスキーマを反映:
   ```bash
   npx prisma migrate deploy   # もしくは npx prisma db push
   ```

ビルドコマンドには `prisma generate` を含めているため（`npm run build`）、追加設定は不要です。

> Vercel の Hobby プランは規約上「非商用」向けです。事業として本格運用する場合は Pro プランをご検討ください。

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
