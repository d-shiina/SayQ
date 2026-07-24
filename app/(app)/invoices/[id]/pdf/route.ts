import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";
// Chromium起動を含むためコールドスタート時に時間がかかる
export const maxDuration = 60;

async function launchBrowser(origin: string) {
  const puppeteer = await import("puppeteer-core");

  // 明示的なパス指定（この開発環境やセルフホスト向け）
  const execPath = process.env.PDF_CHROME_PATH;
  if (execPath) {
    return puppeteer.launch({
      executablePath: execPath,
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
  }

  // Vercel等のサーバーレス環境: Lambda向けChromiumを使用。
  // バイナリは public/chromium-pack.tar として自己ホストしており、
  // 初回起動時に自分のCDNからダウンロードして /tmp に展開する
  // （関数バンドルへの同梱はファイルトレースが効かず失敗するため）
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import("@sparticuz/chromium-min")).default;
    // テキスト中心のページなのでWebGLを無効化（サーバーレスでの安定性向上）
    chromium.setGraphicsMode = false;
    const packUrl =
      process.env.CHROMIUM_PACK_URL ?? `${origin}/chromium-pack.tar`;
    return puppeteer.launch({
      executablePath: await chromium.executablePath(packUrl),
      headless: true,
      args: chromium.args,
    });
  }

  // ローカル開発: インストール済みのChromeを使用
  return puppeteer.launch({ channel: "chrome", headless: true });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: user.id },
    select: { id: true, invoiceNo: true },
  });
  if (!invoice) {
    return new Response("Not Found", { status: 404 });
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 自分自身の /print ページをヘッドレスChromiumで開いてPDF化する
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const proto =
    req.headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  const origin = `${proto}://${host}`;

  let pdf: Uint8Array;
  try {
    const browser = await launchBrowser(origin);
    try {
      const page = await browser.newPage();
      // セッションCookieを引き継いで認証済みページとして描画
      await page.setCookie({ name: COOKIE_NAME, value: token, url: origin });
      await page.goto(`${origin}/print/invoices/${invoice.id}`, {
        waitUntil: "networkidle0",
        timeout: 30_000,
      });
      pdf = await page.pdf({
        format: "a4",
        printBackground: true,
        preferCSSPageSize: true,
        // 上下余白は全ページで繰り返されるプリンタ余白として確保する
        // （@pageやシートのpaddingだと2ページ目以降の先頭に余白が付かない）
        margin: { top: "12mm", bottom: "14mm", left: "0", right: "0" },
        // 下余白に「1 / 2」形式のページ番号を描画する
        displayHeaderFooter: true,
        headerTemplate: "<span></span>",
        footerTemplate:
          '<div style="width:100%;text-align:center;font-size:9px;color:#94a3b8;font-family:sans-serif;">' +
          '<span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      });
    } finally {
      await browser.close();
    }
  } catch (e) {
    console.error("[pdf] 生成に失敗:", e);
    const message = e instanceof Error ? e.message : String(e);
    return new Response(`PDF生成エラー: ${message}`, { status: 500 });
  }

  // 例: 御請求書_INV-202607-001.pdf（番号が既に INV- で始まる場合は重複させない）
  const no = invoice.invoiceNo.startsWith("INV-")
    ? invoice.invoiceNo
    : `INV-${invoice.invoiceNo}`;
  const encoded = encodeURIComponent(`御請求書_${no}.pdf`);
  const download = req.nextUrl.searchParams.get("dl") === "1";

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      // ASCIIの filename はSafari等のフォールバック用。対応ブラウザは filename* を優先する
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="invoice_${no}.pdf"; filename*=UTF-8''${encoded}`,
      "Cache-Control": "no-store",
    },
  });
}
