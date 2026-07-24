import { calcTotals, type TaxRounding } from "@/lib/invoice-calc";
import {
  formatNumber,
  formatDateJa,
  formatBillingMonth,
} from "@/lib/utils";

/** A4 @96dpi のピクセル寸法（プレビューのスケーリングにも使用） */
export const SHEET_WIDTH_PX = 794;
export const SHEET_HEIGHT_PX = 1123;

/** 明細表の最低行数（freee同様、足りない分は空行で埋めて罫線を見せる） */
const MIN_ITEM_ROWS = 6;

interface Item {
  name: string;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  taxRate: number;
}

interface SheetInvoice {
  invoiceNo: string;
  title: string;
  subject: string | null;
  billingMonth: string;
  issueDate: Date | string;
  dueDate: Date | string | null;
  notes: string | null;
  taxRounding: string;
  items: Item[];
  client: {
    name: string;
    honorific: string;
    zip: string | null;
    address: string | null;
    building: string | null;
    contact: string | null;
  };
}

interface Company {
  name: string;
  companyName: string | null;
  companyZip: string | null;
  companyAddress: string | null;
  companyBuilding: string | null;
  companyTel: string | null;
  companyEmail: string | null;
  invoiceRegNo: string | null;
  bankInfo: string | null;
  sealText: string | null;
  sealImage: string | null;
}

const yen = (n: number) => `${formatNumber(Math.round(n))}円`;

/**
 * 請求書帳票（freeeレイアウト + 角丸・カラーのモダンスタイル）。
 * 画面プレビューにそのまま埋め込み、PDF化はこのHTMLをヘッドレスChromiumで印刷する。
 */
export function InvoiceSheet({
  invoice,
  company,
}: {
  invoice: SheetInvoice;
  company: Company;
}) {
  const totals = calcTotals(invoice.items, invoice.taxRounding as TaxRounding);
  const issuerName = company.companyName || company.name;
  const subject =
    invoice.subject || `${formatBillingMonth(invoice.billingMonth)}分`;
  const hasReduced = invoice.items.some((it) => it.taxRate === 8);
  const emptyRows = Math.max(0, MIN_ITEM_ROWS - invoice.items.length);

  return (
    <div
      className="print-sheet mx-auto flex min-h-[296mm] w-[210mm] flex-col bg-white p-[12mm] text-[13px] leading-relaxed text-slate-900"
      style={{ fontFeatureSettings: '"palt"' }}
    >
      {/* タイトル（中央） */}
      <h1 className="text-center text-[24px] font-bold tracking-[0.4em] text-slate-900">
        {invoice.title}
      </h1>

      {/* 宛先（左） / 書類情報・発行元（右） */}
      <div className="mt-6 flex items-start justify-between gap-10">
        <div className="min-w-0 flex-1 pt-1">
          <div className="border-b-2 border-sky-500 pb-1.5 text-[17px] font-bold">
            {invoice.client.name}
            <span className="ml-2 text-[13px] font-medium text-slate-600">
              {invoice.client.honorific}
            </span>
          </div>
          <div className="mt-2.5 space-y-0.5 text-[11px] leading-5 text-slate-600">
            {invoice.client.zip && <div>〒{invoice.client.zip}</div>}
            {invoice.client.address && <div>{invoice.client.address}</div>}
            {invoice.client.building && <div>{invoice.client.building}</div>}
            {invoice.client.contact && (
              <div className="pt-1">ご担当: {invoice.client.contact} 様</div>
            )}
          </div>
        </div>

        <div className="w-[38%] shrink-0">
          {/* 請求日・請求書番号 */}
          <div className="text-[11px] leading-5">
            <div className="flex justify-between gap-4 border-b border-slate-200 py-1">
              <span className="text-slate-500">請求日</span>
              <span className="font-medium tabular-nums">
                {formatDateJa(invoice.issueDate)}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-200 py-1">
              <span className="text-slate-500">請求書番号</span>
              <span className="font-medium tabular-nums">
                {invoice.invoiceNo}
              </span>
            </div>
          </div>

          {/* 発行元 */}
          <div className="relative mt-7 text-[11px] leading-5 text-slate-600">
            <div className="pr-16 text-[15px] font-bold text-slate-900">
              {issuerName}
            </div>
            <div className="mt-1.5 space-y-0.5">
              {company.companyZip && <div>〒{company.companyZip}</div>}
              {company.companyAddress && <div>{company.companyAddress}</div>}
              {company.companyBuilding && <div>{company.companyBuilding}</div>}
              {company.companyTel && <div>TEL: {company.companyTel}</div>}
              {company.companyEmail && <div>{company.companyEmail}</div>}
              {company.invoiceRegNo && (
                <div className="pt-1 font-medium text-slate-800">
                  登録番号: {company.invoiceRegNo}
                </div>
              )}
            </div>

            {/* 角印（画像優先、なければテキスト） */}
            {company.sealImage ? (
              // data URL の印影画像（サイズ最適化不要のため素の img を使用）
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.sealImage}
                alt=""
                className="absolute right-0 top-0 h-14 w-14 object-contain opacity-90"
              />
            ) : company.sealText ? (
              <div className="absolute right-0 top-0 flex h-14 w-14 rotate-6 items-center justify-center rounded-md border-2 border-red-500/70 p-1 text-center text-[10px] font-bold leading-tight text-red-500/80">
                {company.sealText}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* あいさつ + 件名 */}
      <p className="mt-5 text-[12px] text-slate-600">
        下記の通りご請求申し上げます。
      </p>
      <div className="mt-2 flex items-center gap-3">
        <span className="rounded-md bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
          件名
        </span>
        <span className="text-[15px] font-bold">{subject}</span>
      </div>

      {/* 小計 / 消費税 / 請求金額（freeeのサマリー表） */}
      <div className="mt-3 w-[58%] overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full">
          <thead>
            <tr className="divide-x divide-slate-200 bg-sky-50 text-[10.5px] font-semibold text-sky-800">
              <th className="w-[26%] px-3 py-1.5 text-center">小計</th>
              <th className="w-[26%] px-3 py-1.5 text-center">消費税</th>
              <th className="px-3 py-1.5 text-center">請求金額</th>
            </tr>
          </thead>
          <tbody>
            <tr className="divide-x divide-slate-200 border-t border-slate-200">
              <td className="px-3 py-2.5 text-right text-[12px] tabular-nums">
                {yen(totals.subtotal)}
              </td>
              <td className="px-3 py-2.5 text-right text-[12px] tabular-nums">
                {yen(totals.totalTax)}
              </td>
              <td className="px-4 py-2.5 text-right text-[21px] font-bold leading-tight text-sky-700 tabular-nums">
                {yen(totals.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 入金期日 / 振込先 */}
      {(invoice.dueDate || company.bankInfo) && (
        <div className="mt-3 w-[58%] overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full">
            <thead>
              <tr className="divide-x divide-slate-200 bg-sky-50 text-[10.5px] font-semibold text-sky-800">
                <th className="w-[26%] px-3 py-1.5 text-center">入金期日</th>
                <th className="px-3 py-1.5 text-center">振込先</th>
              </tr>
            </thead>
            <tbody>
              <tr className="divide-x divide-slate-200 border-t border-slate-200">
                <td className="px-3 py-2 text-center text-[12px] tabular-nums">
                  {invoice.dueDate ? formatDateJa(invoice.dueDate) : ""}
                </td>
                <td className="whitespace-pre-wrap px-3 py-2 text-[11px] leading-snug text-slate-700">
                  {company.bankInfo ?? ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 明細（角丸テーブル・空行で罫線を埋める） */}
      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="divide-x divide-slate-200 bg-sky-50 text-[10.5px] font-semibold text-sky-800">
              <th className="px-4 py-1.5 text-center">摘要</th>
              <th className="w-24 px-3 py-1.5 text-center">数量</th>
              <th className="w-28 px-3 py-1.5 text-center">単価</th>
              <th className="w-32 px-4 py-1.5 text-center">明細金額</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 border-t border-slate-200">
            {invoice.items.map((it, i) => (
              <tr key={i} className="divide-x divide-slate-100">
                <td className="px-4 py-1.5">
                  {it.name}
                  {hasReduced && it.taxRate === 8 ? (
                    <span className="text-slate-500"> ※</span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums">
                  {formatNumber(it.quantity)}
                  {it.unit ? ` ${it.unit}` : ""}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {formatNumber(it.unitPrice)}
                </td>
                <td className="px-4 py-1.5 text-right font-medium tabular-nums">
                  {formatNumber(it.quantity * it.unitPrice)}
                </td>
              </tr>
            ))}
            {Array.from({ length: emptyRows }).map((_, i) => (
              <tr key={`empty-${i}`} className="divide-x divide-slate-100">
                <td className="px-4 py-1.5">&nbsp;</td>
                <td className="px-3 py-1.5" />
                <td className="px-3 py-1.5" />
                <td className="px-4 py-1.5" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasReduced && (
        <p className="mt-1.5 text-[10px] text-slate-500">
          ※は軽減税率(8%)対象
        </p>
      )}

      {/* 内訳（税率別・右寄せ） */}
      <div className="mt-3 flex justify-end">
        <div className="flex w-[46%] overflow-hidden rounded-lg border border-slate-200 text-[11px]">
          <div className="flex items-center bg-sky-50 px-3 text-[10.5px] font-semibold text-sky-800">
            内訳
          </div>
          <div className="flex-1 divide-y divide-slate-100 border-l border-slate-200">
            {totals.taxLines.map((t) => (
              <div key={t.rate} className="px-3 py-1.5">
                {t.rate > 0 ? (
                  <>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-600">
                        {t.rate}%対象(税抜)
                        {t.rate === 8 ? " ※" : ""}
                      </span>
                      <span className="font-medium tabular-nums">
                        {yen(t.net)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 text-[10px] text-slate-500">
                      <span>{t.rate}%消費税</span>
                      <span className="tabular-nums">{yen(t.tax)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-600">非課税対象</span>
                    <span className="font-medium tabular-nums">
                      {yen(t.net)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 備考 + ページ番号（用紙下部に固定） */}
      <div className="mt-auto">
        {invoice.notes && (
          <div className="mt-4 rounded-lg border border-slate-200 px-4 py-3 text-[11px]">
            <div className="mb-1 text-[10px] font-semibold tracking-wider text-sky-700">
              備考
            </div>
            <div className="whitespace-pre-wrap leading-relaxed text-slate-700">
              {invoice.notes}
            </div>
          </div>
        )}
        <div className="pt-3 text-center text-[10px] tabular-nums text-slate-400">
          1 / 1
        </div>
      </div>
    </div>
  );
}
