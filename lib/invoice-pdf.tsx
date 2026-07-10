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
// - 行頭に来てはいけない文字（閉じ括弧・句読点など）は前の文字と結合（簡易禁則処理）
// - 各フラグメントの後ろに空文字を挟み、行分割時のハイフン自動挿入を抑止する
const NO_BREAK_BEFORE = "、。，．）」』】〕｝〉》・ー！？!?:：;；%％円";
Font.registerHyphenationCallback((word) => {
  const fragments: string[] = [];
  for (const char of Array.from(word)) {
    if (fragments.length > 0 && NO_BREAK_BEFORE.includes(char)) {
      fragments[fragments.length - 1] += char;
    } else {
      fragments.push(char);
    }
  }
  return fragments.flatMap((f) => [f, ""]);
});

// モノトーンパレット
const INK = "#1a1a1a"; // 基本の文字・外枠
const SUB = "#555555"; // 補助テキスト
const LINE = "#c8c8c8"; // 明細の内側罫線
const HEAD_BG = "#222222"; // 表ヘッダー（ダーク反転）
const SOFT_BG = "#f4f4f4"; // 備考などの淡い面

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    fontSize: 9,
    color: INK,
    paddingTop: 42,
    paddingBottom: 48,
    paddingHorizontal: 46,
    lineHeight: 1.45,
  },
  title: {
    textAlign: "center",
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: 12,
  },
  // タイトル下の飾り罫（細線 + 太線の二重線）
  ruleThin: {
    marginTop: 10,
    borderBottomWidth: 0.7,
    borderBottomColor: INK,
  },
  ruleThick: {
    marginTop: 1.6,
    borderBottomWidth: 2.4,
    borderBottomColor: INK,
    marginBottom: 24,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between" },
  clientName: {
    fontSize: 13,
    paddingBottom: 4,
    marginBottom: 6,
    borderBottomWidth: 0.7,
    borderBottomColor: INK,
  },
  clientSub: { fontSize: 9, color: SUB },
  greeting: { marginTop: 20, marginBottom: 10 },
  subjectRow: { flexDirection: "row", alignItems: "baseline" },
  subjectLabel: { width: 56, fontSize: 10 },
  subjectValue: { fontSize: 11.5, fontWeight: 700 },
  metaRow: { flexDirection: "row", marginBottom: 2.5 },
  metaLabel: { width: 62, color: SUB },
  metaValue: { flexGrow: 1, textAlign: "right" },
  issuerBlock: { position: "relative", marginTop: 22 },
  issuerName: { fontSize: 12, fontWeight: 700, marginBottom: 4 },
  issuerText: { fontSize: 8.5, color: SUB, lineHeight: 1.5 },
  // 表の共通
  table: { borderWidth: 1, borderColor: INK },
  row: { flexDirection: "row" },
  darkTh: {
    backgroundColor: HEAD_BG,
    color: "#ffffff",
    paddingVertical: 4.5,
    paddingHorizontal: 6,
    textAlign: "center",
    fontSize: 8.5,
    letterSpacing: 1,
  },
  cellDivider: { borderRightWidth: 0.7, borderRightColor: LINE },
  darkDivider: { borderRightWidth: 0.7, borderRightColor: "#555555" },
  valueCell: {
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    minHeight: 30,
  },
  amountBig: {
    fontSize: 15,
    fontWeight: 700,
    textAlign: "right",
    lineHeight: 1.2,
  },
  // 明細表
  itemCell: { paddingVertical: 4.5, paddingHorizontal: 6, fontSize: 9 },
  right: { textAlign: "right" },
  center: { textAlign: "center" },
  // 内訳
  breakdownBox: {
    alignSelf: "flex-end",
    width: 240,
    borderWidth: 0.7,
    borderColor: INK,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginTop: 14,
  },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between" },
  // 備考
  notesBox: {
    backgroundColor: SOFT_BG,
    borderRadius: 3,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginTop: 18,
  },
  pageNo: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: SUB,
  },
  seal: { position: "absolute", top: -4, right: 0, width: 48, height: 48 },
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

const MIN_ROWS = 10;

// 集計表・入金期日表の幅
const SUMMARY_WIDTH = "57%";

export function InvoicePdf({ data }: { data: PdfInvoiceData }) {
  const totals = calcTotals(data.items, data.taxRounding as TaxRounding);
  const issuerName = data.company.companyName || data.company.name;
  const subject = data.subject || `${formatBillingMonth(data.billingMonth)}分`;
  const fillerCount = Math.max(0, MIN_ROWS - data.items.length);
  const hasReduced = data.items.some((it) => it.taxRate === 8);

  const col = { desc: "52%", qty: "13%", price: "16%", amount: "19%" } as const;

  return (
    <Document
      title={`${data.title} ${data.invoiceNo}`}
      author={issuerName}
      creator="SayQ"
      producer="SayQ"
    >
      <Page size="A4" style={styles.page}>
        {/* タイトル（例: 御請求書） */}
        <Text style={styles.title}>{data.title}</Text>
        <View style={styles.ruleThin} />
        <View style={styles.ruleThick} />

        {/* 上段: 宛先(左) / メタ+発行元(右) */}
        <View style={styles.topRow}>
          <View style={{ width: "55%" }}>
            <Text style={styles.clientName}>
              {data.client.name}　{data.client.honorific}
            </Text>
            {data.client.zip && (
              <Text style={styles.clientSub}>〒{data.client.zip}</Text>
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

          {/* 右カラムは狭め＆右寄せ配置で、左の金額表と間隔を確保する */}
          <View style={{ width: "32%", position: "relative" }}>
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

            <View style={styles.issuerBlock}>
              <Text style={styles.issuerName}>{issuerName}</Text>
              {data.company.companyZip && (
                <Text style={styles.issuerText}>
                  〒{data.company.companyZip}
                </Text>
              )}
              {data.company.companyAddress && (
                <Text style={styles.issuerText}>
                  {data.company.companyAddress}
                </Text>
              )}
              {data.company.companyBuilding && (
                <Text style={styles.issuerText}>
                  {data.company.companyBuilding}
                </Text>
              )}
              {data.company.companyTel && (
                <Text style={styles.issuerText}>
                  TEL: {data.company.companyTel}
                </Text>
              )}
              {data.company.companyEmail && (
                <Text style={styles.issuerText}>
                  {data.company.companyEmail}
                </Text>
              )}
              {data.company.invoiceRegNo && (
                <Text style={[styles.issuerText, { marginTop: 3, color: INK }]}>
                  登録番号: {data.company.invoiceRegNo}
                </Text>
              )}

              {/* 角印（発行元名の右横に重ねる） */}
              {data.company.sealImage ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image src={data.company.sealImage} style={styles.seal} />
              ) : data.company.sealText ? (
                <View
                  style={[
                    styles.seal,
                    {
                      borderWidth: 2,
                      borderColor: "#cc3333",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: "rotate(6deg)",
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: "#cc3333",
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
        <View style={[styles.table, { width: SUMMARY_WIDTH, marginTop: 14 }]}>
          <View style={styles.row}>
            <Text style={[styles.darkTh, styles.darkDivider, { width: "28%" }]}>
              小計
            </Text>
            <Text style={[styles.darkTh, styles.darkDivider, { width: "26%" }]}>
              消費税
            </Text>
            <Text style={[styles.darkTh, { width: "46%" }]}>請求金額</Text>
          </View>
          <View style={styles.row}>
            <View style={[styles.valueCell, styles.cellDivider, { width: "28%" }]}>
              <Text style={styles.right}>{yen(totals.subtotal)}</Text>
            </View>
            <View style={[styles.valueCell, styles.cellDivider, { width: "26%" }]}>
              <Text style={styles.right}>{yen(totals.totalTax)}</Text>
            </View>
            <View style={[styles.valueCell, { width: "46%" }]}>
              <Text style={styles.amountBig}>{yen(totals.total)}</Text>
            </View>
          </View>
        </View>

        {/* 入金期日 / 振込先 */}
        <View style={[styles.table, { width: SUMMARY_WIDTH, marginTop: 10 }]}>
          <View style={styles.row}>
            <Text style={[styles.darkTh, styles.darkDivider, { width: "28%" }]}>
              入金期日
            </Text>
            <Text style={[styles.darkTh, { width: "72%" }]}>振込先</Text>
          </View>
          <View style={styles.row}>
            <View style={[styles.valueCell, styles.cellDivider, { width: "28%" }]}>
              <Text style={styles.center}>
                {data.dueDate ? formatDateJa(data.dueDate) : "—"}
              </Text>
            </View>
            <View style={[styles.valueCell, { width: "72%" }]}>
              <Text style={{ fontSize: 8.5 }}>
                {data.company.bankInfo?.replace(/\n/g, "　") ?? "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* 明細表 */}
        <View style={[styles.table, { marginTop: 24 }]}>
          <View style={styles.row}>
            <Text style={[styles.darkTh, styles.darkDivider, { width: col.desc }]}>
              摘要
            </Text>
            <Text style={[styles.darkTh, styles.darkDivider, { width: col.qty }]}>
              数量
            </Text>
            <Text
              style={[styles.darkTh, styles.darkDivider, { width: col.price }]}
            >
              単価
            </Text>
            <Text style={[styles.darkTh, { width: col.amount }]}>明細金額</Text>
          </View>
          {data.items.map((it, i) => (
            <View
              key={i}
              style={[
                styles.row,
                { borderBottomWidth: 0.7, borderBottomColor: LINE },
              ]}
            >
              <Text style={[styles.itemCell, styles.cellDivider, { width: col.desc }]}>
                {it.name}
                {hasReduced && it.taxRate === 8 ? " ※" : ""}
              </Text>
              <Text
                style={[
                  styles.itemCell,
                  styles.center,
                  styles.cellDivider,
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
                  styles.cellDivider,
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
              style={[
                styles.row,
                i < fillerCount - 1
                  ? { borderBottomWidth: 0.7, borderBottomColor: LINE }
                  : {},
              ]}
            >
              <Text style={[styles.itemCell, styles.cellDivider, { width: col.desc }]}>
                {" "}
              </Text>
              <Text style={[styles.itemCell, styles.cellDivider, { width: col.qty }]} />
              <Text
                style={[styles.itemCell, styles.cellDivider, { width: col.price }]}
              />
              <Text style={[styles.itemCell, { width: col.amount }]} />
            </View>
          ))}
        </View>
        {hasReduced && (
          <Text style={{ fontSize: 8, marginTop: 4, color: SUB }}>
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
                  <Text style={{ fontSize: 8, color: SUB }}>
                    　　　{t.rate}%消費税
                  </Text>
                  <Text style={{ fontSize: 8, color: SUB }}>{yen(t.tax)}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* 備考 */}
        {data.notes && (
          <View style={styles.notesBox}>
            <Text style={{ fontSize: 8.5, fontWeight: 700, marginBottom: 3 }}>
              備考
            </Text>
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
