import path from "node:path";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
  StyleSheet,
} from "@react-pdf/renderer";
import { calcTotals, type TaxRounding } from "@/lib/invoice-calc";
import { formatNumber, formatDateJa, formatBillingMonth } from "@/lib/utils";

// 日本語フォント（Noto Sans JP）を登録
const fontDir = path.join(process.cwd(), "assets", "fonts");
Font.register({
  family: "NotoSansJP",
  fonts: [
    { src: path.join(fontDir, "NotoSansJP-Regular.otf"), fontWeight: 400 },
    { src: path.join(fontDir, "NotoSansJP-Bold.otf"), fontWeight: 700 },
  ],
});
// CJKはどこでも改行できるように1文字ずつに分割。
// 各文字の後ろに空文字を挟むことで、行分割時のハイフン自動挿入を抑止する
Font.registerHyphenationCallback((word) =>
  Array.from(word).flatMap((char) => [char, ""]),
);

const BORDER = "#333333";

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    fontSize: 9,
    color: "#111111",
    paddingTop: 40,
    paddingBottom: 46,
    paddingHorizontal: 44,
    lineHeight: 1.45,
  },
  title: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 10,
    marginBottom: 26,
  },
  // 上段: 宛先(左) / メタ+発行元(右)
  topRow: { flexDirection: "row", justifyContent: "space-between" },
  clientName: { fontSize: 12.5, marginBottom: 4 },
  clientSub: { fontSize: 9, color: "#222222" },
  metaRow: { flexDirection: "row", marginBottom: 3 },
  metaLabel: { width: 64, color: "#333333" },
  metaValue: { flexGrow: 1, textAlign: "right" },
  issuerName: { fontSize: 12, marginBottom: 6, marginTop: 26 },
  greeting: { marginTop: 22, marginBottom: 10 },
  subjectRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 12 },
  subjectLabel: { width: 64, fontSize: 10 },
  subjectValue: { fontSize: 11.5, fontWeight: 700 },
  // 集計表 (小計/消費税/請求金額)
  table: { borderWidth: 1, borderColor: BORDER },
  row: { flexDirection: "row" },
  th: {
    backgroundColor: "#ffffff",
    paddingVertical: 4,
    paddingHorizontal: 6,
    textAlign: "center",
    fontSize: 8.5,
  },
  td: { paddingVertical: 5, paddingHorizontal: 8 },
  borderR: { borderRightWidth: 1, borderRightColor: BORDER },
  borderB: { borderBottomWidth: 1, borderBottomColor: BORDER },
  amountBig: { fontSize: 16, fontWeight: 700, textAlign: "right" },
  // 明細表
  itemHead: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    textAlign: "center",
    fontSize: 8.5,
  },
  itemCell: { paddingVertical: 4.5, paddingHorizontal: 6, fontSize: 9 },
  right: { textAlign: "right" },
  center: { textAlign: "center" },
  // 内訳
  breakdownBox: {
    alignSelf: "flex-end",
    width: 250,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 14,
  },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between" },
  // 備考
  notesBox: {
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  pageNo: {
    position: "absolute",
    bottom: 22,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 9,
    color: "#333333",
  },
  seal: { position: "absolute", top: -6, right: 0, width: 52, height: 52 },
});

export interface PdfInvoiceData {
  invoiceNo: string;
  title: string;
  subject: string | null;
  billingMonth: string;
  issueDate: Date;
  dueDate: Date | null;
  notes: string | null;
  taxRounding: string;
  items: {
    name: string;
    quantity: number;
    unit: string | null;
    unitPrice: number;
    taxRate: number;
  }[];
  client: {
    name: string;
    honorific: string;
    zip: string | null;
    address: string | null;
    building: string | null;
    contact: string | null;
  };
  company: {
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
  };
}

const yen = (n: number) => `${formatNumber(Math.round(n))}円`;

const MIN_ROWS = 12;

export function InvoicePdf({ data }: { data: PdfInvoiceData }) {
  const totals = calcTotals(data.items, data.taxRounding as TaxRounding);
  const issuerName = data.company.companyName || data.company.name;
  const subject =
    data.subject || `${formatBillingMonth(data.billingMonth)}分`;
  const fillerCount = Math.max(0, MIN_ROWS - data.items.length);
  const hasReduced = data.items.some((it) => it.taxRate === 8);

  // 明細表の列幅
  const col = { desc: "52%", qty: "13%", price: "16%", amount: "19%" } as const;

  return (
    <Document
      title={`請求書 ${data.invoiceNo}`}
      author={issuerName}
      creator="SayQ"
      producer="SayQ"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>請求書</Text>

        {/* 上段 */}
        <View style={styles.topRow}>
          {/* 宛先（左） */}
          <View style={{ width: "52%" }}>
            <Text style={styles.clientName}>
              {data.client.name} {data.client.honorific}
            </Text>
            {data.client.zip && (
              <Text style={styles.clientSub}>{data.client.zip}</Text>
            )}
            {data.client.address && (
              <Text style={styles.clientSub}>{data.client.address}</Text>
            )}
            {data.client.building && (
              <Text style={styles.clientSub}>{data.client.building}</Text>
            )}
            {data.client.contact && (
              <Text style={[styles.clientSub, { marginTop: 4 }]}>
                ご担当: {data.client.contact} 様
              </Text>
            )}

            <Text style={styles.greeting}>下記の通りご請求申し上げます。</Text>
            <View style={styles.subjectRow}>
              <Text style={styles.subjectLabel}>件名</Text>
              <Text style={styles.subjectValue}>{subject}</Text>
            </View>
          </View>

          {/* メタ + 発行元（右） */}
          <View style={{ width: "40%", position: "relative" }}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>請求日</Text>
              <Text style={styles.metaValue}>
                {formatDateJa(data.issueDate)}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>請求書番号</Text>
              <Text style={styles.metaValue}>{data.invoiceNo}</Text>
            </View>

            <View style={{ position: "relative" }}>
              <Text style={styles.issuerName}>{issuerName}</Text>
              {data.company.companyZip && (
                <Text>{data.company.companyZip}</Text>
              )}
              {data.company.companyAddress && (
                <Text>
                  {data.company.companyAddress}
                  {data.company.companyBuilding
                    ? data.company.companyBuilding
                    : ""}
                </Text>
              )}
              {data.company.companyTel && (
                <Text>TEL: {data.company.companyTel}</Text>
              )}
              {data.company.companyEmail && (
                <Text>{data.company.companyEmail}</Text>
              )}
              {data.company.invoiceRegNo && (
                <Text style={{ marginTop: 3 }}>
                  登録番号: {data.company.invoiceRegNo}
                </Text>
              )}
              {/* 角印 */}
              {data.company.sealImage ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image src={data.company.sealImage} style={styles.seal} />
              ) : data.company.sealText ? (
                <View
                  style={[
                    styles.seal,
                    {
                      borderWidth: 2,
                      borderColor: "#dd3333",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: "rotate(6deg)",
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: "#dd3333",
                      fontSize: 8,
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  >
                    {data.company.sealText}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* 集計表: 小計 / 消費税 / 請求金額 */}
        <View style={[styles.table, { width: "62%" }]}>
          <View style={[styles.row, styles.borderB]}>
            <Text style={[styles.th, styles.borderR, { width: "29%" }]}>
              小計
            </Text>
            <Text style={[styles.th, styles.borderR, { width: "25%" }]}>
              消費税
            </Text>
            <Text style={[styles.th, { width: "46%" }]}>請求金額</Text>
          </View>
          <View style={styles.row}>
            <Text
              style={[styles.td, styles.right, styles.borderR, { width: "29%" }]}
            >
              {yen(totals.subtotal)}
            </Text>
            <Text
              style={[styles.td, styles.right, styles.borderR, { width: "25%" }]}
            >
              {yen(totals.totalTax)}
            </Text>
            <Text style={[styles.td, styles.amountBig, { width: "46%" }]}>
              {yen(totals.total)}
            </Text>
          </View>
        </View>

        {/* 入金期日 / 振込先 */}
        <View style={[styles.table, { width: "62%", marginTop: 10 }]}>
          <View style={[styles.row, styles.borderB]}>
            <Text style={[styles.th, styles.borderR, { width: "29%" }]}>
              入金期日
            </Text>
            <Text style={[styles.th, { width: "71%" }]}>振込先</Text>
          </View>
          <View style={styles.row}>
            <Text
              style={[
                styles.td,
                styles.center,
                styles.borderR,
                { width: "29%" },
              ]}
            >
              {data.dueDate ? formatDateJa(data.dueDate) : "—"}
            </Text>
            <Text style={[styles.td, { width: "71%", fontSize: 8.5 }]}>
              {data.company.bankInfo?.replace(/\n/g, "　") ?? "—"}
            </Text>
          </View>
        </View>

        {/* 明細表 */}
        <View style={[styles.table, { marginTop: 22 }]}>
          <View style={[styles.row, styles.borderB]}>
            <Text style={[styles.itemHead, styles.borderR, { width: col.desc }]}>
              摘要
            </Text>
            <Text style={[styles.itemHead, styles.borderR, { width: col.qty }]}>
              数量
            </Text>
            <Text
              style={[styles.itemHead, styles.borderR, { width: col.price }]}
            >
              単価
            </Text>
            <Text style={[styles.itemHead, { width: col.amount }]}>
              明細金額
            </Text>
          </View>
          {data.items.map((it, i) => (
            <View key={i} style={[styles.row, styles.borderB]}>
              <Text style={[styles.itemCell, styles.borderR, { width: col.desc }]}>
                {it.name}
                {hasReduced && it.taxRate === 8 ? " ※" : ""}
              </Text>
              <Text
                style={[
                  styles.itemCell,
                  styles.center,
                  styles.borderR,
                  { width: col.qty },
                ]}
              >
                {formatNumber(it.quantity)}
                {it.unit ? ` ${it.unit}` : ""}
              </Text>
              <Text
                style={[
                  styles.itemCell,
                  styles.right,
                  styles.borderR,
                  { width: col.price },
                ]}
              >
                {formatNumber(it.unitPrice)}
              </Text>
              <Text style={[styles.itemCell, styles.right, { width: col.amount }]}>
                {formatNumber(it.quantity * it.unitPrice)}
              </Text>
            </View>
          ))}
          {Array.from({ length: fillerCount }).map((_, i) => (
            <View
              key={`f-${i}`}
              style={[styles.row, i < fillerCount - 1 ? styles.borderB : {}]}
            >
              <Text style={[styles.itemCell, styles.borderR, { width: col.desc }]}>
                {" "}
              </Text>
              <Text style={[styles.itemCell, styles.borderR, { width: col.qty }]} />
              <Text
                style={[styles.itemCell, styles.borderR, { width: col.price }]}
              />
              <Text style={[styles.itemCell, { width: col.amount }]} />
            </View>
          ))}
        </View>
        {hasReduced && (
          <Text style={{ fontSize: 8, marginTop: 4, color: "#333333" }}>
            ※は軽減税率(8%)対象
          </Text>
        )}

        {/* 内訳（税率別） */}
        <View style={styles.breakdownBox}>
          {totals.taxLines.map((t, i) => (
            <View key={t.rate}>
              <View style={styles.breakdownRow}>
                <Text style={{ fontWeight: i === 0 ? 700 : 400 }}>
                  {i === 0 ? "内訳　" : "　　　"}
                  {t.rate > 0 ? `${t.rate}%対象(税抜)` : "非課税対象"}
                </Text>
                <Text>{yen(t.net)}</Text>
              </View>
              {t.rate > 0 && (
                <View style={[styles.breakdownRow, { marginTop: 1 }]}>
                  <Text style={{ fontSize: 8, color: "#333333" }}>
                    　　　{t.rate}%消費税
                  </Text>
                  <Text style={{ fontSize: 8, color: "#333333" }}>
                    {yen(t.tax)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* 備考 */}
        {data.notes && (
          <View style={styles.notesBox}>
            <Text style={{ fontSize: 8.5, marginBottom: 3 }}>備考</Text>
            <Text style={{ fontSize: 9 }}>{data.notes}</Text>
          </View>
        )}

        {/* ページ番号 */}
        <Text
          style={styles.pageNo}
          fixed
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  );
}
