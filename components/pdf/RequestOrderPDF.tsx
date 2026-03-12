import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { RequestOrderPdf } from "@/dtos/request.dto";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";

// ─── Constants ────────────────────────────────────────────────────────────────
const TWO_COLUMN_THRESHOLD = 30;
const FIRST_PAGE_SINGLE = 30;
const NEXT_PAGE_SINGLE = 50;
const FIRST_PAGE_TWO = 30;
const NEXT_PAGE_TWO = 80;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getQuantityByStatus = (item: any, status: string): number => {
  switch (status) {
    case "pending":
    case "approved":
    case "in_progress":
      return item.reqItemReceived ?? 0;
    case "delivered":
      return item.reqItemReceived ?? 0;
    case "received":
    case "completed":
      return item.reqItemReceived ?? 0;
    default:
      return 0;
  }
};

const statusColor = (status: string): string => {
  switch (status) {
    case "completed":
      return "#16a34a";
    case "delivered":
      return "#2563eb";
    case "approved":
      return "#7c3aed";
    case "in_progress":
      return "#d97706";
    case "pending":
      return "#6b7280";
    default:
      return "#111827";
  }
};

const chunkItemsWithFirstPage = (
  items: any[],
  firstSize: number,
  nextSize: number,
): any[][] => {
  if (items.length === 0) return [[]];
  const chunks: any[][] = [];
  chunks.push(items.slice(0, firstSize));
  let index = firstSize;
  while (index < items.length) {
    chunks.push(items.slice(index, index + nextSize));
    index += nextSize;
  }
  return chunks;
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    padding: 10,
    fontSize: 9,
    fontFamily: "Helvetica",
    backgroundColor: "#fff",
  },

  // Header
  headerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    padding: 10,
    marginBottom: 6,
    borderBottom: "2px solid #1e3a5f",
  },
  logo: { width: 90, height: 60, objectFit: "contain" },
  titleBlock: { flexDirection: "column", gap: 2 },
  docTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#1e3a5f" },
  docNo: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#374151" },
  docDate: { fontSize: 9, color: "#6b7280", marginTop: 2 },

  // Info body
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoCol: { width: "48%" },
  infoGroup: { marginBottom: 5 },
  label: {
    fontSize: 8,
    color: "#9ca3af",
    marginBottom: 1,
    fontFamily: "Helvetica-Bold",
  },
  value: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111827" },
  statusBadge: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: "flex-start",
  },

  divider: { borderBottom: "1px solid #e5e7eb", marginVertical: 6 },

  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e3a5f",
    padding: "5 4",
  },
  thText: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#ffffff" },
  row: {
    flexDirection: "row",
    padding: "4 4",
    alignItems: "center",
    minHeight: 20,
  },
  rowEven: { backgroundColor: "#f9fafb" },
  rowOdd: { backgroundColor: "#ffffff" },

  // Columns
  colIndex: { width: "5%", fontSize: 8 },
  colDesc: { width: "38%", paddingHorizontal: 3, fontSize: 8 },
  colUnit: { width: "10%", fontSize: 8 },
  colPrice: { width: "13%", fontSize: 8, textAlign: "right" },
  colQty: { width: "8%", fontSize: 8, textAlign: "center" },
  colTotal: {
    width: "18%",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },

  // Footer
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 6,
    borderTop: "1.5px solid #1e3a5f",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grandTotalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
  },
  pageNumber: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
});

// ─── Component ────────────────────────────────────────────────────────────────
interface RequestOrderPDFProps {
  data: RequestOrderPdf | null;
}

const RequestOrderPDF = ({ data }: RequestOrderPDFProps) => {
  const items = data?.requestItems ?? [];
  const status = data?.requestOrder.requestStatus ?? "";
  const isTwoCol = items.length > TWO_COLUMN_THRESHOLD;

  const firstSize = isTwoCol ? FIRST_PAGE_TWO : FIRST_PAGE_SINGLE;
  const nextSize = isTwoCol ? NEXT_PAGE_TWO : NEXT_PAGE_SINGLE;

  const itemChunks = chunkItemsWithFirstPage(items, firstSize, nextSize);

  // ✅ Correctly compute startIndex per page using actual chunk sizes
  const startIndexPerPage = itemChunks.reduce<number[]>((acc, _, i) => {
    if (i === 0) return [0];
    return [...acc, acc[i - 1] + itemChunks[i - 1].length];
  }, []);

  const grandTotal = items
    .filter(
      (i) =>
        i.reqItemStatus === "delivered" ||
        i.reqItemStatus === "received" ||
        i.reqItemStatus === "partial",
    )
    .reduce((sum, item) => {
      return sum + item.reqItemReceived * Number(item.unitPrice);
    }, 0);

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.thText, styles.colIndex]}>#</Text>
      <Text style={[styles.thText, styles.colDesc]}>Item Description</Text>
      <Text style={[styles.thText, styles.colUnit]}>Unit</Text>
      <Text style={[styles.thText, styles.colPrice]}>Price</Text>
      <Text style={[styles.thText, styles.colQty]}>Ord</Text>
      <Text style={[styles.thText, styles.colQty]}>Del</Text>
      <Text style={[styles.thText, styles.colQty]}>Rec</Text>
      <Text style={[styles.thText, styles.colTotal]}>Total</Text>
    </View>
  );

  const renderRows = (chunk: any[], startIndex: number) => {
    const sortedChunk = [...chunk].sort((a, b) => {
      const aHasReceived = Number(a.reqItemReceived) !== 0;
      const bHasReceived = Number(b.reqItemReceived) !== 0;

      // First sort by received status
      if (aHasReceived !== bHasReceived) {
        return aHasReceived ? -1 : 1;
      }

      // Then alphabetical
      return a.itemName.localeCompare(b.itemName, undefined, {
        sensitivity: "base",
        numeric: true,
      });
    });
    return sortedChunk.map((item, i) => {
      const qty = getQuantityByStatus(item, status);
      const total = qty * Number(item.unitPrice);
      const isEven = i % 2 === 0;

      return (
        <View
          key={i}
          style={[styles.row, isEven ? styles.rowEven : styles.rowOdd]}
        >
          <Text style={styles.colIndex}>{startIndex + i + 1}</Text>
          <Text style={styles.colDesc}>{item.itemName}</Text>
          <Text style={styles.colUnit}>{item.itemUnit}</Text>
          <Text style={styles.colPrice}>
            {Number(item.unitPrice).toFixed(2)}
          </Text>
          <Text style={styles.colQty}>
            {item.reqItemQuantity
              ? formatQuantityByUnit(item.reqItemQuantity, item.itemUnit ?? "")
              : ""}
          </Text>
          <Text style={styles.colQty}>
            {Number(item.reqItemTransfer) !== 0
              ? formatQuantityByUnit(item.reqItemTransfer, item.itemUnit ?? "")
              : ""}
          </Text>
          <Text style={styles.colQty}>
            {Number(item.reqItemReceived) !== 0
              ? formatQuantityByUnit(item.reqItemReceived, item.itemUnit ?? "")
              : ""}
          </Text>
          <Text style={styles.colTotal}>
            {total !== 0 ? total.toFixed(2) : ""}
          </Text>
        </View>
      );
    });
  };
  return (
    <Document>
      {itemChunks.map((chunk, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === itemChunks.length - 1;
        const startIndex = startIndexPerPage[pageIndex];

        return (
          <Page key={pageIndex} size="A4" style={styles.page}>
            {/* ── Header (first page only) ── */}
            {isFirstPage && (
              <>
                <View style={styles.headerCard}>
                  <View style={styles.titleBlock}>
                    <Text style={styles.docTitle}>Request Order</Text>
                    <Text style={styles.docNo}>
                      #{data?.requestOrder.requestNo}
                    </Text>
                    <Text style={styles.docDate}>
                      {data?.requestOrder.requestCreatedAt
                        ? formatDateToWords(data.requestOrder.requestCreatedAt)
                        : ""}
                    </Text>
                  </View>
                  <Image style={styles.logo} source="/avdclogo.png" />
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoCol}>
                    <View style={styles.infoGroup}>
                      <Text style={styles.label}>STORE</Text>
                      <Text style={styles.value}>{data?.store.storeName}</Text>
                    </View>
                    <View style={styles.infoGroup}>
                      <Text style={styles.label}>REQUESTED BY</Text>
                      <Text style={styles.value}>{data?.requestedBy}</Text>
                    </View>
                  </View>
                  <View style={styles.infoCol}>
                    <View style={styles.infoGroup}>
                      <Text style={styles.label}>DATE</Text>
                      <Text style={styles.value}>
                        {formatDateToWords(
                          data?.requestOrder.requestCreatedAt ?? "",
                        )}
                      </Text>
                    </View>
                    <View style={styles.infoGroup}>
                      <Text style={styles.label}>STATUS</Text>
                      <Text
                        style={[
                          styles.statusBadge,
                          { color: statusColor(status) },
                        ]}
                      >
                        {status.replace("_", " ").toUpperCase() || "N/A"}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.divider} />
              </>
            )}

            {/* ── Table ── */}
            {renderTableHeader()}
            {renderRows(chunk, startIndex)}

            {/* ── Grand Total (last page only) ── */}
            {isLastPage && (
              <View style={styles.grandTotalRow}>
                <Text style={{ fontSize: 9, color: "#6b7280" }}>
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </Text>
                <Text style={styles.grandTotalValue}>
                  Grand Total: {grandTotal.toFixed(2)}
                </Text>
              </View>
            )}

            <Text style={styles.pageNumber}>
              Page {pageIndex + 1} of {itemChunks.length}
            </Text>
          </Page>
        );
      })}
    </Document>
  );
};

export default RequestOrderPDF;
