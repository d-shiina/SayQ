/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PDF生成（ヘッドレスChromium）関連はバンドルせず node_modules から実行時に読み込む
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
};

export default nextConfig;
