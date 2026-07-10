import { calcTotals, type TaxRounding } from "@/lib/invoice-calc";
import { formatYen, formatNumber, formatDateJa } from "@/lib/utils";

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

export function InvoiceSheet({
  invoice,
  company,
}: {
  invoice: SheetInvoice;
  company: Company;
}) {
  const totals = calcTotals(invoice.items, invoice.taxRounding as TaxRounding);
  const issuerName = company.companyName || company.name;

  return (
    <div className="print-sheet mx-auto w-full max-w-[210mm] bg-white p-[13mm] text-[13px] leading-relaxed text-slate-800 shadow-sm ring-1 ring-slate-200 print:shadow-none print:ring-0">
      {/* 上部アクセントライン */}
      <div className="mb-8 h-1.5 w-full rounded-full bg-gradient-to-r from-primary to-primary/60" />

      {/* タイトル行: タイトル(左) / 書類情報(右) */}
      <div className="mb-8 flex items-start justify-between">
        <h1 className="text-[27px] font-bold tracking-[0.35em] text-slate-900">
          {invoice.title}
        </h1>
        <table className="text-[11px] leading-5">
          <tbody>
            <tr>
              <td className="pr-4 text-slate-500">請求書番号</td>
              <td className="text-right font-medium text-slate-800">
                {invoice.invoiceNo}
              </td>
            </tr>
            <tr>
              <td className="pr-4 text-slate-500">発行日</td>
              <td className="text-right font-medium text-slate-800">
                {formatDateJa(invoice.issueDate)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 宛先(左) / 発行元(右) */}
      <div className="mb-8 flex items-start justify-between gap-10">
        <div className="min-w-0 flex-1 pt-1">
          <div className="border-b-2 border-primary pb-1.5 text-[19px] font-bold text-slate-900">
            {invoice.client.name}
            <span className="ml-2 text-[14px] font-medium text-slate-600">
              {invoice.client.honorific}
            </span>
          </div>
          <div className="mt-2.5 space-y-0.5 text-[11px] text-slate-600">
            {invoice.client.zip && <div>〒{invoice.client.zip}</div>}
            {(invoice.client.address || invoice.client.building) && (
              <div>
                {invoice.client.address}
                {invoice.client.building && ` ${invoice.client.building}`}
              </div>
            )}
            {invoice.client.contact && (
              <div className="pt-1">ご担当: {invoice.client.contact} 様</div>
            )}
          </div>
        </div>

        <div className="relative w-[38%] shrink-0 text-[11px] leading-5 text-slate-600">
          <div className="text-[14px] font-bold text-slate-900">
            {issuerName}
          </div>
          <div className="mt-1.5 space-y-0.5">
            {company.companyZip && <div>〒{company.companyZip}</div>}
            {(company.companyAddress || company.companyBuilding) && (
              <div>
                {company.companyAddress}
                {company.companyBuilding && (
                  <>
                    <br />
                    {company.companyBuilding}
                  </>
                )}
              </div>
            )}
            {company.companyTel && <div>TEL: {company.companyTel}</div>}
            {company.companyEmail && <div>{company.companyEmail}</div>}
            {company.invoiceRegNo && (
              <div className="pt-1 font-medium text-slate-700">
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
              className="absolute -top-1 right-0 h-16 w-16 object-contain opacity-90"
            />
          ) : company.sealText ? (
            <div className="absolute -top-1 right-0 flex h-14 w-14 rotate-6 items-center justify-center rounded border-2 border-red-500/70 p-1 text-center text-[10px] font-bold leading-tight text-red-500/80">
              {company.sealText}
            </div>
          ) : null}
        </div>
      </div>

      {/* ご請求金額 */}
      <div className="mb-8 flex items-center justify-between rounded-lg border-l-4 border-primary bg-primary/5 px-6 py-4">
        <div>
          <div className="text-[11px] font-medium tracking-wider text-slate-500">
            ご請求金額（税込）
          </div>
          <div className="mt-0.5 text-[30px] font-bold leading-tight tracking-tight text-slate-900">
            {formatYen(totals.total)}
          </div>
        </div>
        {invoice.dueDate && (
          <div className="text-right text-[11px] text-slate-500">
            お支払い期限
            <div className="text-[13px] font-semibold text-slate-800">
              {formatDateJa(invoice.dueDate)}
            </div>
          </div>
        )}
      </div>

      {/* 明細テーブル（横罫線のみのモダンスタイル） */}
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b-2 border-slate-700 text-[10px] font-semibold tracking-wider text-slate-500">
            <th className="px-2 pb-2 text-left">品目</th>
            <th className="w-14 px-2 pb-2 text-right">数量</th>
            <th className="w-12 px-2 pb-2 text-center">単位</th>
            <th className="w-24 px-2 pb-2 text-right">単価</th>
            <th className="w-14 px-2 pb-2 text-center">税率</th>
            <th className="w-28 px-2 pb-2 text-right">金額</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it, i) => (
            <tr key={i} className="border-b border-slate-200">
              <td className="px-2 py-2.5">{it.name}</td>
              <td className="px-2 py-2.5 text-right tabular-nums">
                {formatNumber(it.quantity)}
              </td>
              <td className="px-2 py-2.5 text-center text-slate-600">
                {it.unit ?? ""}
              </td>
              <td className="px-2 py-2.5 text-right tabular-nums">
                {formatYen(it.unitPrice)}
              </td>
              <td className="px-2 py-2.5 text-center text-slate-600">
                {it.taxRate > 0 ? `${it.taxRate}%` : "—"}
              </td>
              <td className="px-2 py-2.5 text-right font-medium tabular-nums">
                {formatYen(it.quantity * it.unitPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 合計ブロック */}
      <div className="mt-5 flex justify-end">
        <div className="w-72 text-[12px]">
          <div className="flex justify-between px-3 py-1.5">
            <span className="text-slate-500">小計</span>
            <span className="tabular-nums">{formatYen(totals.subtotal)}</span>
          </div>
          {totals.taxLines.map((t) => (
            <div key={t.rate} className="flex justify-between px-3 py-1.5">
              <span className="text-slate-500">
                消費税
                {t.rate > 0
                  ? `（${t.rate}% 対象 ${formatYen(t.net)}）`
                  : "（非課税）"}
              </span>
              <span className="tabular-nums">{formatYen(t.tax)}</span>
            </div>
          ))}
          <div className="mt-1.5 flex items-center justify-between rounded-md bg-slate-900 px-3 py-2.5 text-white">
            <span className="text-[12px] font-medium">合計金額</span>
            <span className="text-[16px] font-bold tabular-nums">
              {formatYen(totals.total)}
            </span>
          </div>
        </div>
      </div>

      {/* 振込先・備考 */}
      {(company.bankInfo || invoice.notes) && (
        <div className="mt-9 grid grid-cols-2 gap-4 text-[11px]">
          {company.bankInfo && (
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="mb-1.5 text-[10px] font-semibold tracking-wider text-slate-500">
                お振込先
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-slate-700">
                {company.bankInfo}
              </div>
            </div>
          )}
          {invoice.notes && (
            <div className="rounded-lg bg-slate-50 p-4">
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
