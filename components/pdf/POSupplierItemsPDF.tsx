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

interface POSupplierItemsProps {
  data: DisplayPOItemsSupplier;
  poData: PurchaseOrders | null;
}

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: "Helvetica" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: { width: 120, height: 80, objectFit: "contain" },
  titleContainer: {
    flexDirection: "column",
  },
  divider: {
    borderBottom: "1px solid #000",
    marginVertical: 20,
    width: "100%",
  },
  body: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    color: "#666",
  },
  value: {
    fontSize: 11,
    fontWeight: "bold",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottom: "1px solid #000",
    padding: 8,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    borderBottom: "0.5px solid #ddd",
    padding: 8,
    alignItems: "center",
  },
  colIndex: { width: "10%", textAlign: "center" },
  colDesc: { width: "50%" },
  colUnit: { width: "20%", textAlign: "center" },
  colQty: { width: "20%", textAlign: "center" },
  // Two column styles
  tableContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  table: {
    width: "48%",
  },
  twoColTableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottom: "1px solid #000",
    padding: 6,
    fontWeight: "bold",
  },
  twoColRow: {
    flexDirection: "row",
    borderBottom: "0.5px solid #ddd",
    padding: 6,
    alignItems: "center",
  },
  twoColIndex: { width: "15%", textAlign: "center" },
  twoColDesc: { width: "50%" },
  twoColUnit: { width: "20%", textAlign: "center" },
  twoColQty: { width: "15%", textAlign: "center" },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 10,
    color: "#666",
  },
});

const ITEMS_PER_PAGE = 30;
const TWO_COLUMN_THRESHOLD = 15;

const POSupplierItemsPDF = ({ data, poData }: POSupplierItemsProps) => {
  const chunkItems = (items: any[], chunkSize: number) => {
    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const itemChunks = chunkItems(data?.items || [], ITEMS_PER_PAGE);

  const renderSingleColumnTable = (items: any[], startIndex: number = 0) => (
    <View>
      <View style={styles.tableHeader}>
        <Text style={styles.colIndex}>#</Text>
        <Text style={styles.colDesc}>Item</Text>
        <Text style={styles.colUnit}>Unit</Text>
        <Text style={styles.colQty}>Qty</Text>
      </View>
      {items.map((item, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.colIndex}>{startIndex + i + 1}</Text>
          <Text style={styles.colDesc}>{item.itemName}</Text>
          <Text style={styles.colUnit}>{item.itemUnit}</Text>
          <Text style={styles.colQty}>
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
            <Text style={styles.twoColIndex}>#</Text>
            <Text style={styles.twoColDesc}>Item</Text>
            <Text style={styles.twoColUnit}>Unit</Text>
            <Text style={styles.twoColQty}>Qty</Text>
          </View>
          {leftItems.map((item, i) => (
            <View key={i} style={styles.twoColRow}>
              <Text style={styles.twoColIndex}>{startIndex + i + 1}</Text>
              <Text style={styles.twoColDesc}>{item.itemName}</Text>
              <Text style={styles.twoColUnit}>{item.itemUnit}</Text>
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
            <Text style={styles.twoColIndex}>#</Text>
            <Text style={styles.twoColDesc}>Item</Text>
            <Text style={styles.twoColUnit}>Unit</Text>
            <Text style={styles.twoColQty}>Qty</Text>
          </View>
          {rightItems.map((item, i) => (
            <View key={i} style={styles.twoColRow}>
              <Text style={styles.twoColIndex}>
                {startIndex + half + i + 1}
              </Text>
              <Text style={styles.twoColDesc}>{item.itemName}</Text>
              <Text style={styles.twoColUnit}>{item.itemUnit}</Text>
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

  return (
    <Document>
      {itemChunks.map((items, pageIndex) => {
        const startIndex = pageIndex * ITEMS_PER_PAGE;
        const useTwoColumns = items.length > TWO_COLUMN_THRESHOLD;

        return (
          <Page key={pageIndex} size="A4" style={styles.page}>
            {/* Header - Only on first page */}
            {pageIndex === 0 && (
              <>
                <View style={styles.header}>
                  <View style={styles.titleContainer}>
                    <Text style={{ fontSize: 17, fontWeight: "bold" }}>
                      Purchase Order
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: "bold" }}>
                      #{poData?.poNumber}
                    </Text>
                  </View>
                  <Image style={styles.logo} source={"/avdclogo.png"} />
                </View>

                <View style={styles.divider} />

                {/* Body - Company & Supplier Info - Only on first page */}
                <View style={styles.body}>
                  <View style={styles.supplierSection}>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Supplier</Text>
                      <Text style={styles.value}>{data.suppName}</Text>
                      <Text style={styles.label}>{data.suppPhone}</Text>
                      <Text style={styles.label}>{data.suppAddress}</Text>
                      <Text style={styles.label}>{data.suppEmail}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />
              </>
            )}

            {/* Items Table - Conditional rendering based on item count */}
            {useTwoColumns
              ? renderTwoColumnTable(items, startIndex)
              : renderSingleColumnTable(items, startIndex)}

            {/* Empty state */}
            {items.length === 0 && (
              <View style={styles.row}>
                <Text style={{ width: "100%", textAlign: "center" }}>
                  No items found
                </Text>
              </View>
            )}

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
