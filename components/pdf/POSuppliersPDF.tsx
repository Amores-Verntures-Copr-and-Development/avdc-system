import { DisplayPOItemsSupplier } from "@/dtos/purchase.dto";
import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";
import { PurchaseOrders } from "@/types/purchaseOrders";
import { formatDateToWords } from "@/utils/formatDateToWords";

interface PoSuppliersPDFProps {
  data: DisplayPOItemsSupplier[];
  poData: PurchaseOrders | null;
}

const COL_WIDTH = "48%";

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 9,
    fontFamily: "Helvetica",
    backgroundColor: "#fff",
  },
  columnsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  column: { width: COL_WIDTH, flexDirection: "column", gap: 10 },
  supplierCard: {
    border: "1px solid #cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
  },
  supplierHeader: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageFooter: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: "center",
    fontSize: 8,
    color: "#888",
  },
  supplierName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#f8fafc",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  pageHeader: {
    marginBottom: 10,
  },
  poNumber: {
    fontWeight: "bold",
    fontSize: 12,
  },
  supplierBadge: { fontSize: 7, color: "#94a3b8" },
  tableContainer: { paddingHorizontal: 0 },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottom: "1px solid #cbd5e1",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  row: {
    flexDirection: "row",
    borderBottom: "1px solid #f1f5f9",
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  rowAlt: {
    flexDirection: "row",
    borderBottom: "1px solid #f1f5f9",
    backgroundColor: "#fafafa",
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  colName: { width: "38%", color: "#374151" },
  colUnit: { width: "14%", textAlign: "center", color: "#6b7280" },
  colPrice: { width: "20%", textAlign: "right", color: "#374151" },
  colQty: { width: "12%", textAlign: "center", color: "#374151" },
  colTotal: { width: "16%", textAlign: "right", color: "#374151" },
  headerText: {
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  itemText: { fontSize: 8.5 },
  totalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0f172a",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  totalLabel: {
    fontSize: 8,
    color: "#94a3b8",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  totalAmount: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#f8fafc" },
});

// ─── Supplier Part Type ──────────────────────────────
type SupplierPart = DisplayPOItemsSupplier & {
  items: DisplayPOItemsSupplier["items"];
  isFirstPart: boolean;
  isLastPart: boolean;
};

// ─── Supplier Card ──────────────────────────────
const SupplierCard = ({ supplier }: { supplier: SupplierPart }) => {
  const supplierTotal = supplier.items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Number(item.poItemOrderedQty),
    0,
  );

  return (
    <View style={styles.supplierCard}>
      {supplier.isFirstPart && (
        <View style={styles.supplierHeader}>
          <Text style={styles.supplierName}>{supplier.suppName}</Text>
          <Text style={styles.supplierBadge}>
            {supplier.items.length} item{supplier.items.length !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      <View style={styles.tableContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.colName, styles.headerText]}>Item</Text>
          <Text style={[styles.colUnit, styles.headerText]}>Unit</Text>
          <Text style={[styles.colPrice, styles.headerText]}>Price</Text>
          <Text style={[styles.colQty, styles.headerText]}>Qty</Text>
          <Text style={[styles.colTotal, styles.headerText]}>Total</Text>
        </View>

        {supplier.items.map((item, idx) => {
          const total = Number(item.unitPrice) * Number(item.poItemOrderedQty);
          const isAlt = idx % 2 !== 0;
          return (
            <View key={item.itemId} style={isAlt ? styles.rowAlt : styles.row}>
              <Text style={[styles.colName, styles.itemText]}>
                {item.itemName}
              </Text>
              <Text style={[styles.colUnit, styles.itemText]}>
                {item.itemUnit}
              </Text>
              <Text style={[styles.colPrice, styles.itemText]}>
                {Number(item.unitPrice).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <Text
                style={[styles.colQty, styles.itemText, { fontWeight: "bold" }]}
              >
                {parseFloat(item.poItemOrderedQty.toString()).toString()}
              </Text>
              <Text
                style={[
                  styles.colTotal,
                  styles.itemText,
                  { fontWeight: "bold" },
                ]}
              >
                {total.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          );
        })}
      </View>

      {supplier.isLastPart && (
        <View style={styles.totalFooter}>
          <Text style={styles.totalLabel}>Supplier Total</Text>
          <Text style={styles.totalAmount}>
            P{" "}
            {supplierTotal.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
      )}
    </View>
  );
};

// ─── Main PDF ──────────────────────────────
const POSuppliersPDF = ({ data, poData }: PoSuppliersPDFProps) => {
  const pages: SupplierPart[][][] = []; // [page][column][supplierParts]
  const maxItemsPerColumn = 38;
  let page: SupplierPart[][] = [[], []]; // [left, right]
  let colIndex = 0;

  const headerCost = 3; // 1 unit for supplier header
  const footerCost = 1; // 1 unit for supplier footer

  data.forEach((supplier) => {
    let remainingItems = [...supplier.items];
    let isFirstPart = true;

    while (remainingItems.length > 0) {
      // Check if this is the first page
      const isFirstPage = pages.length === 0;

      // Reduce max items for first page (both columns) to leave space for header
      const effectiveMax = isFirstPage
        ? maxItemsPerColumn - 2 // reduce for header
        : colIndex === 1
          ? maxItemsPerColumn + 3
          : maxItemsPerColumn;

      // Count "space used" in the current column
      const currentColumnUsed = page[colIndex].reduce((sum, part) => {
        const partHeader = part.isFirstPart ? headerCost : 0;
        const partFooter = part.isLastPart ? footerCost : 0;
        return sum + part.items.length + partHeader + partFooter;
      }, 0);

      const remainingSpace = effectiveMax - currentColumnUsed;

      // Minimum threshold: if too little space, move to next column/page
      const minThreshold = 5;
      if (
        remainingSpace < minThreshold &&
        remainingItems.length > remainingSpace
      ) {
        if (colIndex === 0) {
          colIndex = 1;
        } else {
          pages.push(page);
          page = [[], []];
          colIndex = 0;
        }
        continue;
      }

      // Take as much as fits in the column
      const partItems = remainingItems.slice(0, remainingSpace);
      const isLastPart = remainingItems.length <= remainingSpace;

      page[colIndex].push({
        ...supplier,
        items: partItems,
        isFirstPart,
        isLastPart,
      });

      remainingItems = remainingItems.slice(remainingSpace);
      isFirstPart = false;
    }
  });

  // Push last page if it has content
  if (page[0].length > 0 || page[1].length > 0) pages.push(page);

  return (
    <Document>
      {pages.map((pageColumns, pageIndex) => (
        <Page key={pageIndex} size="A4" wrap style={styles.page}>
          {/* First page header */}
          {pageIndex === 0 && (
            <View style={styles.pageHeader}>
              <Text style={styles.poNumber}>PO Number: {poData?.poNumber}</Text>
              <Text>Date: {formatDateToWords(poData?.poCreatedAt ?? "")}</Text>
            </View>
          )}

          {/* Columns */}
          <View style={styles.columnsWrapper}>
            {/* First Column */}
            <View style={styles.column}>
              {pageColumns[0].map((supplier) => (
                <SupplierCard
                  key={`${supplier.suppId}-${supplier.items[0].itemId}`}
                  supplier={supplier}
                />
              ))}
            </View>

            {/* Second Column */}
            <View style={styles.column}>
              {pageColumns[1].map((supplier) => (
                <SupplierCard
                  key={`${supplier.suppId}-${supplier.items[0].itemId}`}
                  supplier={supplier}
                />
              ))}
            </View>
          </View>

          {/* Footer for every page */}
          <View style={styles.pageFooter}>
            <Text>
              Page {pageIndex + 1} of {pages.length}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default POSuppliersPDF;
