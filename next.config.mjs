/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PDF生成ルートにフォントファイルを同梱する（Vercelのファイルトレース対策）
  outputFileTracingIncludes: {
    "/invoices/[id]/pdf": ["./assets/fonts/*"],
  },
};

export default nextConfig;
