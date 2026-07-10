import { calcTotals, type TaxRounding } from "@/lib/invoice-calc";
import {
  formatNumber,
  formatDateJa,
  formatBillingMonth,
} from "@/lib/utils";

/** A4 @96dpi のピクセル寸法（プレビューのスケーリングにも使用） */
export const SHEET_WIDTH_PX = 794;
export const SHEET_HEIGHT_PX = 1123;

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
 * 請求書帳票（shadcnスタイル・角丸カード）。
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

  return (
    <div
      className="print-sheet mx-auto flex min-h-[296mm] w-[210mm] flex-col bg-white p-[12mm] text-[13px] leading-relaxed text-slate-900"
      style={{ fontFeatureSettings: '"palt"' }}
    >
      {/* ヘッダー: タイトル / 書類情報 */}
      <div className="flex items-start justify-between">
        <h1 className="text-[26px] font-bold tracking-[0.3em]">
          {invoice.title}
        </h1>
        <div className="w-56 rounded-lg border border-slate-200 px-4 py-2.5 text-[11px] leading-5">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">請求日</span>
            <span className="font-medium tabular-nums">
              {formatDateJa(invoice.issueDate)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">請求書番号</span>
            <span className="font-medium tabular-nums">{invoice.invoiceNo}</span>
          </div>
        </div>
      </div>

      {/* 宛先 / 発行元 */}
      <div className="mt-7 flex items-start justify-between gap-8">
        <div className="w-[54%] rounded-xl bg-slate-50 p-5">
          <div className="text-[17px] font-bold">
            {invoice.client.name}
            <span className="ml-2 text-[13px] font-medium text-slate-500">
              {invoice.client.honorific}
            </span>
          </div>
          <div className="mt-2 space-y-0.5 text-[11px] leading-5 text-slate-600">
            {invoice.client.zip && <div>〒{invoice.client.zip}</div>}
            {invoice.client.address && <div>{invoice.client.address}</div>}
            {invoice.client.building && <div>{invoice.client.building}</div>}
            {invoice.client.contact && (
              <div className="pt-1">ご担当: {invoice.client.contact} 様</div>
            )}
          </div>
        </div>

        <div className="relative w-[40%] pt-1 text-[11px] leading-5 text-slate-600">
          <div className="text-[15px] font-bold text-slate-900">
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

      {/* あいさつ + 件名 */}
      <p className="mt-7 text-[12px] text-slate-600">
        下記の通りご請求申し上げます。
      </p>
      <div className="mt-2 flex items-center gap-3">
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          件名
        </span>
        <span className="text-[15px] font-bold">{subject}</span>
      </div>

      {/* ご請求金額（ヒーローカード） */}
      <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-900 px-7 py-5 text-white">
        <div>
          <div className="text-[11px] tracking-wider text-slate-400">
            ご請求金額（税込）
          </div>
          <div className="mt-0.5 text-[30px] font-bold leading-tight tabular-nums">
            {yen(totals.total)}
          </div>
        </div>
        {invoice.dueDate && (
          <div className="text-right">
            <div className="text-[11px] tracking-wider text-slate-400">
              お支払い期限
            </div>
            <div className="mt-0.5 text-[16px] font-semibold tabular-nums">
              {formatDateJa(invoice.dueDate)}
            </div>
          </div>
        )}
      </div>

      {/* 明細（角丸テーブル） */}
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-slate-50 text-[10.5px] font-semibold tracking-wider text-slate-500">
              <th className="px-4 py-2.5 text-left">摘要</th>
              <th className="w-20 px-3 py-2.5 text-right">数量</th>
              <th className="w-28 px-3 py-2.5 text-right">単価</th>
              <th className="w-32 px-4 py-2.5 text-right">金額</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.items.map((it, i) => (
              <tr key={i}>
                <td className="px-4 py-2.5">
                  {it.name}
                  {hasReduced && it.taxRate === 8 ? (
                    <span className="text-slate-500"> ※</span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">
                  {formatNumber(it.quantity)}
                  {it.unit ? ` ${it.unit}` : ""}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {formatNumber(it.unitPrice)}
                </td>
                <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                  {formatNumber(it.quantity * it.unitPrice)}
                </td>
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

      {/* 合計 */}
      <div className="mt-5 flex justify-end">
        <div className="w-[300px] text-[12px]">
          <div className="flex justify-between px-4 py-1.5">
            <span className="text-slate-500">小計</span>
            <span className="tabular-nums">{yen(totals.subtotal)}</span>
          </div>
          {totals.taxLines.map((t) => (
            <div key={t.rate} className="flex justify-between px-4 py-1.5">
              <span className="text-slate-500">
                消費税
                {t.rate > 0
                  ? `（${t.rate}%対象 ${yen(t.net)}）`
                  : "（非課税）"}
              </span>
              <span className="tabular-nums">{yen(t.tax)}</span>
            </div>
          ))}
          <div className="mt-1.5 flex items-center justify-between rounded-lg bg-slate-900 px-4 py-2.5 text-white">
            <span className="font-medium">合計金額</span>
            <span className="text-[15px] font-bold tabular-nums">
              {yen(totals.total)}
            </span>
          </div>
        </div>
      </div>

      {/* 振込先・備考 */}
      {(company.bankInfo || invoice.notes) && (
        <div className="mt-auto grid grid-cols-2 gap-4 pt-8 text-[11px]">
          {company.bankInfo && (
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="mb-1.5 text-[10px] font-semibold tracking-wider text-slate-500">
                お振込先
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-slate-700">
                {company.bankInfo}
              </div>
            </div>
          )}
          {invoice.notes && (
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="mb-1.5 text-[10px] font-semibold tracking-wider text-slate-500">
                備考
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-slate-700">
                {invoice.notes}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
