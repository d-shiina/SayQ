// セッションJWTの署名シークレット（Node/Edge 両ランタイム共通）
const secretValue = process.env.AUTH_SECRET;

if (!secretValue && process.env.NODE_ENV === "production") {
  throw new Error(
    "AUTH_SECRET が未設定です。`openssl rand -base64 32` などで生成した値を環境変数に設定してください。",
  );
}

export const authSecret = new TextEncoder().encode(
  secretValue ?? "insecure-dev-secret",
);
