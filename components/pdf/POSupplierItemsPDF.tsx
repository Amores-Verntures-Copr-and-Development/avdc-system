import { DisplayPOItemsSupplier } from "@/dtos/purchase.dto";
import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";
import { PurchaseOrders } from "@/types/purchaseOrders";
import { formatDateToWords } from "@/utils/formatDateToWords";

interface POSupplierItemsProps {
  data: DisplayPOItemsSupplier;
  poData: PurchaseOrders | null;
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  logo: { width: 100, height: 70, objectFit: "contain" },
  titleContainer: {
    flexDirection: "column",
  },
  divider: {
    borderBottom: "1px solid #000",
    width: "100%",
    marginVertical: 3,
  },
  body: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  supplierSection: {
    width: "48%",
  },
  infoSection: {
    width: "48%",
    flexDirection: "column",
  },
  infoRow: {
    flexDirection: "column",
    marginBottom: 6,
  },
  label: {
    fontSize: 9,
    color: "#666",
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontWeight: "bold",
  },

  // Single Column Table Styles
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    borderTop: "1px solid #333",
    borderBottom: "1px solid #333",
    padding: 6,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    borderBottom: "0.5px solid #ddd",
    padding: 6,
    alignItems: "center",
    minHeight: 22,
  },
  colIndex: {
    width: "8%",
    textAlign: "center",
    fontWeight: "bold",
  },
  colDesc: {
    width: "52%",
    paddingHorizontal: 3,
  },
  colUnit: {
    width: "15%",
    textAlign: "center",
    fontWeight: "bold",
  },
  colQty: {
    width: "15%",
    textAlign: "center",
    fontWeight: "bold",
  },
  colTotal: {
    width: "10%",
    textAlign: "right",
    fontWeight: "bold",
  },

  // Two Column Table Styles - More compact
  tableContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  table: {
    width: "49%",
  },
  twoColTableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    borderTop: "1px solid #333",
    borderBottom: "1px solid #333",
    padding: 5,
    fontWeight: "bold",
  },
  twoColRow: {
    flexDirection: "row",
    borderBottom: "0.5px solid #ddd",
    padding: 5,
    alignItems: "center",
    minHeight: 20,
  },
  twoColIndex: {
    width: "12%",
    textAlign: "center",
    fontWeight: "bold",
  },
  twoColDesc: {
    width: "48%",
    paddingHorizontal: 2,
  },
  twoColUnit: {
    width: "18%",
    textAlign: "center",
    fontWeight: "bold",
  },
  twoColQty: {
    width: "22%",
    textAlign: "center",
    fontWeight: "bold",
  },

  // Summary section
  summarySection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#f8f8f8",
    border: "1px solid #ddd",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },

  pageNumber: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 9,
    color: "#666",
  },
  footerNote: {
    position: "absolute",
    bottom: 35,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: "#666",
    fontStyle: "italic",
  },
});

const ITEMS_PER_PAGE = 56; // Increased due to more compact design
const TWO_COLUMN_THRESHOLD = 20; // Lower threshold for better readability

const POSupplierItemsPDF = ({ data, poData }: POSupplierItemsProps) => {
  const chunkItems = (items: any[], chunkSize: number) => {
    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const itemChunks = chunkItems(data?.items || [], ITEMS_PER_PAGE);
  const totalItems = data?.items?.length || 0;
  const totalQuantity =
    data?.items?.reduce(
      (sum, item) => sum + (Number(item.poItemOrderedQty) || 0),
      0
    ) || 0;
  console.log({ totalQuantity });
  const renderSingleColumnTable = (items: any[], startIndex: number = 0) => (
    <View>
      <View style={styles.tableHeader}>
        <Text style={styles.colIndex}>No.</Text>
        <Text style={styles.colDesc}>Item Description</Text>
        <Text style={styles.colUnit}>Unit</Text>
        <Text style={styles.colQty}>Quantity</Text>
        <Text style={styles.colTotal}>Total</Text>
      </View>
      {items.map((item, i) => (
        <View key={i} style={styles.row}>
          <Text
            style={{
              fontWeight: styles.twoColIndex.width,
              width: styles.twoColIndex.width,
              textAlign: styles.twoColIndex.textAlign,
            }}
          >
            {startIndex + i + 1}
          </Text>
          <Text style={styles.colDesc}>{item.itemName}</Text>
          <Text style={styles.colUnit}>{item.itemUnit || "-"}</Text>
          <Text style={styles.colQty}>
            {formatQuantityByUnit(item.poItemOrderedQty, item.itemUnit ?? "")}
          </Text>
          <Text style={styles.colTotal}>
            {formatQuantityByUnit(item.poItemOrderedQty, item.itemUnit ?? "")}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderTwoColumnTable = (items: any[], startIndex: number = 0) => {
    const half = Math.ceil(items.length / 2);
    const leftItems = items.slice(0, half);
    const rightItems = items.slice(half);

    return (
      <View style={styles.tableContainer}>
        {/* Left Column */}
        <View style={styles.table}>
          <View style={styles.twoColTableHeader}>
            <Text style={styles.twoColIndex}>No.</Text>
            <Text style={styles.twoColDesc}>Item Description</Text>
            <Text style={styles.twoColUnit}>Unit</Text>
            <Text style={styles.twoColQty}>Quantity</Text>
          </View>
          {leftItems.map((item, i) => (
            <View key={i} style={styles.twoColRow}>
              <Text
                style={{
                  fontWeight: styles.twoColIndex.width,
                  width: styles.twoColIndex.width,
                  textAlign: styles.twoColIndex.textAlign,
                }}
              >
                {startIndex + i + 1}
              </Text>
              <Text style={styles.twoColDesc}>{item.itemName}</Text>
              <Text style={styles.twoColUnit}>{item.itemUnit || "-"}</Text>
              <Text style={styles.twoColQty}>
                {formatQuantityByUnit(
                  item.poItemOrderedQty,
                  item.itemUnit ?? ""
                )}
              </Text>
            </View>
          ))}
        </View>

        {/* Right Column */}
        <View style={styles.table}>
          <View style={styles.twoColTableHeader}>
            <Text style={styles.twoColIndex}>No.</Text>
            <Text style={styles.twoColDesc}>Item Description</Text>
            <Text style={styles.twoColUnit}>Unit</Text>
            <Text style={styles.twoColQty}>Quantity</Text>
          </View>
          {rightItems.map((item, i) => (
            <View key={i} style={styles.twoColRow}>
              <Text
                style={{
                  fontWeight: styles.twoColIndex.width,
                  width: styles.twoColIndex.width,
                  textAlign: styles.twoColIndex.textAlign,
                }}
              >
                {startIndex + half + i + 1}
              </Text>
              <Text style={styles.twoColDesc}>{item.itemName}</Text>
              <Text style={styles.twoColUnit}>{item.itemUnit || "-"}</Text>
              <Text style={styles.twoColQty}>
                {formatQuantityByUnit(
                  item.poItemOrderedQty,
                  item.itemUnit ?? ""
                )}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderSummary = () => (
    <View style={styles.summarySection}>
      <View style={styles.totalRow}>
        <Text>Total Items:</Text>
        <Text style={{ fontWeight: "bold" }}>{totalItems}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text>Total Quantity:</Text>
        <Text style={{ fontWeight: "bold" }}>
          {formatQuantityByUnit(totalQuantity, "pcs")}
        </Text>
      </View>
    </View>
  );

  return (
    <Document>
      {itemChunks.map((items, pageIndex) => {
        const startIndex = pageIndex * ITEMS_PER_PAGE;
        const useTwoColumns = items.length > TWO_COLUMN_THRESHOLD;
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === itemChunks.length - 1;

        return (
          <Page key={pageIndex} size="A4" style={styles.page}>
            {/* Header - Only on first page */}
            {isFirstPage && (
              <>
                <View style={styles.header}>
                  <View style={styles.titleContainer}>
                    <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                      PURCHASE ORDER
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: "bold" }}>
                      PO #: {poData?.poNumber}
                    </Text>
                    <Text style={{ fontSize: 10, color: "#666", marginTop: 2 }}>
                      Date:{" "}
                      {poData?.poCreatedAt
                        ? formatDateToWords(poData.poCreatedAt)
                        : "N/A"}
                    </Text>
                  </View>
                  <Image style={styles.logo} source={"/avdclogo.png"} />
                </View>

                <View style={styles.divider} />

                {/* Supplier Info */}
                <View style={styles.body}>
                  <View style={styles.supplierSection}>
                    <Text
                      style={{
                        ...styles.label,
                        fontWeight: "bold",
                      }}
                    >
                      SUPPLIER:
                    </Text>
                    <Text style={{ ...styles.value, marginBottom: 3 }}>
                      {data.suppName}
                    </Text>
                    {data.suppAddress && (
                      <Text style={styles.label}>{data.suppAddress}</Text>
                    )}
                    {data.suppPhone && (
                      <Text style={styles.label}>Tel: {data.suppPhone}</Text>
                    )}
                    {data.suppEmail && (
                      <Text style={styles.label}>Email: {data.suppEmail}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.divider} />
              </>
            )}

            {/* Items Table */}
            {useTwoColumns
              ? renderTwoColumnTable(items, startIndex)
              : renderSingleColumnTable(items, startIndex)}

            {/* Empty state */}
            {items.length === 0 && (
              <View style={styles.row}>
                <Text
                  style={{
                    width: "100%",
                    textAlign: "center",
                    fontStyle: "italic",
                  }}
                >
                  No items found in this purchase order
                </Text>
              </View>
            )}

            {/* Summary - Only on last page */}
            {isLastPage && items.length > 0 && renderSummary()}

            {/* Footer Notes */}
            <Text style={styles.footerNote}>
              Please verify all items and quantities before delivery
            </Text>

            {/* Page number */}
            <Text style={styles.pageNumber}>
              Page {pageIndex + 1} of {itemChunks.length}
            </Text>
          </Page>
        );
      })}
    </Document>
  );
};

export default POSupplierItemsPDF;

// <View style={styles.supplierSection}>
//                     <View style={styles.infoRow}>
//                       <Text style={styles.label}>Date Issued</Text>
//                       <Text style={styles.value}>{poData?.poCreatedAt}</Text>
//                     </View>
//                   </View>
