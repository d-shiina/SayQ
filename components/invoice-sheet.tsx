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
    <div className="print-sheet mx-auto w-full max-w-[210mm] bg-white p-[12mm] text-[13px] leading-relaxed text-slate-900 shadow-sm ring-1 ring-slate-200 print:shadow-none print:ring-0">
      {/* タイトル */}
      <h1 className="mb-8 text-center text-2xl font-bold tracking-[0.5em] text-slate-800">
        {invoice.title}
      </h1>

      {/* 上段: 宛先(左) / 発行元(右) */}
      <div className="mb-6 flex items-start justify-between gap-8">
        {/* 宛先 */}
        <div className="flex-1 pt-1">
          <div className="border-b-2 border-slate-800 pb-1 text-xl font-bold">
            {invoice.client.name}
            <span className="ml-2 text-base font-normal">
              {invoice.client.honorific}
            </span>
          </div>
          <div className="mt-2 space-y-0.5 text-xs text-slate-600">
            {invoice.client.zip && <div>〒{invoice.client.zip}</div>}
            {invoice.client.address && <div>{invoice.client.address}</div>}
            {invoice.client.building && <div>{invoice.client.building}</div>}
            {invoice.client.contact && (
              <div className="pt-1">ご担当: {invoice.client.contact} 様</div>
            )}
          </div>
        </div>

        {/* 発行元 */}
        <div className="relative w-[42%] text-xs text-slate-700">
          <div className="text-right text-[11px] text-slate-500">
            <div>請求書番号: {invoice.invoiceNo}</div>
            <div>発行日: {formatDateJa(invoice.issueDate)}</div>
          </div>
          <div className="mt-3 text-base font-bold text-slate-900">
            {issuerName}
          </div>
          <div className="mt-1 space-y-0.5">
            {company.companyZip && <div>〒{company.companyZip}</div>}
            {company.companyAddress && <div>{company.companyAddress}</div>}
            {company.companyBuilding && <div>{company.companyBuilding}</div>}
            {company.companyTel && <div>TEL: {company.companyTel}</div>}
            {company.companyEmail && <div>{company.companyEmail}</div>}
            {company.invoiceRegNo && (
              <div className="pt-1">登録番号: {company.invoiceRegNo}</div>
            )}
          </div>

          {/* 角印（画像優先、なければテキスト） */}
          {company.sealImage ? (
            // data URL の印影画像（サイズ最適化不要のため素の img を使用）
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.sealImage}
              alt=""
              className="absolute right-0 top-8 h-16 w-16 object-contain"
            />
          ) : company.sealText ? (
            <div className="absolute right-0 top-8 flex h-16 w-16 rotate-6 items-center justify-center rounded border-2 border-red-500/70 p-1 text-center text-[10px] font-bold leading-tight text-red-500/80">
              {company.sealText}
            </div>
          ) : null}
        </div>
      </div>

      {/* ご請求金額（強調） */}
      <div className="mb-6 flex items-stretch">
        <div className="flex items-center rounded-l-md bg-slate-800 px-5 text-sm font-medium text-white">
          ご請求金額
        </div>
        <div className="flex flex-1 items-baseline justify-end rounded-r-md border-2 border-l-0 border-slate-800 px-5 py-3">
          <span className="text-3xl font-bold tabular-nums">
            {formatYen(totals.total)}
          </span>
          <span className="ml-2 text-sm text-slate-500">(税込)</span>
        </div>
      </div>

      {invoice.dueDate && (
        <p className="mb-4 text-xs text-slate-600">
          お支払い期限: {formatDateJa(invoice.dueDate)}
        </p>
      )}

      {/* 明細テーブル */}
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100 text-slate-600">
            <th className="border border-slate-300 px-3 py-2 text-left font-medium">
              品目
            </th>
            <th className="w-16 border border-slate-300 px-2 py-2 text-right font-medium">
              数量
            </th>
            <th className="w-14 border border-slate-300 px-2 py-2 text-center font-medium">
              単位
            </th>
            <th className="w-24 border border-slate-300 px-2 py-2 text-right font-medium">
              単価
            </th>
            <th className="w-14 border border-slate-300 px-2 py-2 text-center font-medium">
              税率
            </th>
            <th className="w-28 border border-slate-300 px-3 py-2 text-right font-medium">
              金額
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it, i) => (
            <tr key={i}>
              <td className="border border-slate-300 px-3 py-2">{it.name}</td>
              <td className="border border-slate-300 px-2 py-2 text-right tabular-nums">
                {formatNumber(it.quantity)}
              </td>
              <td className="border border-slate-300 px-2 py-2 text-center">
                {it.unit ?? ""}
              </td>
              <td className="border border-slate-300 px-2 py-2 text-right tabular-nums">
                {formatYen(it.unitPrice)}
              </td>
              <td className="border border-slate-300 px-2 py-2 text-center">
                {it.taxRate > 0 ? `${it.taxRate}%` : "—"}
              </td>
              <td className="border border-slate-300 px-3 py-2 text-right tabular-nums">
                {formatYen(it.quantity * it.unitPrice)}
              </td>
            </tr>
          ))}
          {/* 余白行（見栄え用に最低行数を確保） */}
          {Array.from({ length: Math.max(0, 5 - invoice.items.length) }).map(
            (_, i) => (
              <tr key={`pad-${i}`}>
                <td className="border border-slate-300 px-3 py-2">&nbsp;</td>
                <td className="border border-slate-300 px-2 py-2" />
                <td className="border border-slate-300 px-2 py-2" />
                <td className="border border-slate-300 px-2 py-2" />
                <td className="border border-slate-300 px-2 py-2" />
                <td className="border border-slate-300 px-3 py-2" />
              </tr>
            ),
          )}
        </tbody>
      </table>

      {/* 合計 */}
      <div className="mt-4 flex justify-end">
        <table className="w-72 text-xs">
          <tbody>
            <tr>
              <td className="py-1.5 text-slate-600">小計</td>
              <td className="py-1.5 text-right tabular-nums">
                {formatYen(totals.subtotal)}
              </td>
            </tr>
            {totals.taxLines.map((t) => (
              <tr key={t.rate}>
                <td className="py-1.5 text-slate-600">
                  消費税
                  {t.rate > 0 ? `（${t.rate}%対象 ${formatYen(t.net)}）` : "（非課税）"}
                </td>
                <td className="py-1.5 text-right tabular-nums">
                  {formatYen(t.tax)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-slate-800">
              <td className="py-2 font-bold">合計金額</td>
              <td className="py-2 text-right text-base font-bold tabular-nums">
                {formatYen(totals.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 振込先・備考 */}
      <div className="mt-8 grid grid-cols-2 gap-6 text-xs">
        {company.bankInfo && (
          <div className="rounded-md border border-slate-300 p-3">
            <div className="mb-1 font-medium text-slate-600">お振込先</div>
            <div className="whitespace-pre-wrap leading-relaxed">
              {company.bankInfo}
            </div>
          </div>
        )}
        {invoice.notes && (
          <div className="rounded-md border border-slate-300 p-3">
            <div className="mb-1 font-medium text-slate-600">備考</div>
            <div className="whitespace-pre-wrap leading-relaxed">
              {invoice.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
