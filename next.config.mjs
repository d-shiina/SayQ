/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PDF生成（ヘッドレスChromium）関連はバンドルせず node_modules から実行時に読み込む
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  // Chromiumのバイナリ(bin/*.br)は実行時にfsで動的に読まれるため
  // ファイルトレースが検出できない。PDFルートの関数へ明示的に同梱する
  outputFileTracingIncludes: {
    "/invoices/[id]/pdf": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
};

export default nextConfig;
