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
import { getRequestStatusOption } from "@/utils/requestOrderUtils";

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
  },
  logo: { width: 100, height: 70, objectFit: "contain" },
  titleContainer: {
    flexDirection: "column",
  },
  divider: {
    borderBottom: "1px solid #000",
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
    border: "0.5px solid #ddd",
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

interface RequestOrderPFGProps {
  data: RequestOrderPdf | null;
}

const TWO_COLUMN_THRESHOLD = 40;
const ITEMS_PER_PAGE_SINGLE_COLUMN = 56;
const ITEMS_PER_PAGE_TWO_COLUMN = 50;

const RequestOrderPDF = ({ data }: RequestOrderPFGProps) => {
  const chunkItems = (items: any[], chunkSize: number) => {
    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const items = data?.requestItems || [];
  const useTwoColumns = items.length > TWO_COLUMN_THRESHOLD;

  // Determine chunk size based on layout
  const chunkSize = useTwoColumns
    ? ITEMS_PER_PAGE_TWO_COLUMN
    : ITEMS_PER_PAGE_SINGLE_COLUMN;
  const itemChunks = chunkItems(items, chunkSize);

  const renderSingleColumnTable = (items: any[], startIndex: number = 0) => (
    <View>
      <View style={styles.tableHeader}>
        <Text style={styles.colIndex}>#</Text>
        <Text style={styles.colDesc}>Item</Text>
        <Text style={styles.colUnit}>Unit</Text>
        <Text style={styles.colQty}>Order Qty</Text>
        <Text style={styles.colQty}>Receive Qty</Text>
      </View>
      {items.map((item, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.colIndex}> {"#" + `${startIndex + i + 1}`}</Text>
          <Text style={styles.colDesc}>{item.itemName}</Text>
          <Text style={styles.colUnit}>{item.itemUnit}</Text>
          <Text style={styles.colQty}>
            {formatQuantityByUnit(item.reqItemQuantity, item.itemUnit ?? "")}
          </Text>
          <Text style={styles.colQty}>
            {item.reqItemReceived === 0 || item.reqItemReceived === "0.00"
              ? ""
              : formatQuantityByUnit(item.reqItemReceived, item.itemUnit ?? "")}
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
            <Text style={styles.twoColQty}>Ordr Qty</Text>
            <Text style={styles.twoColQty}>Rcvd Qty</Text>
          </View>
          {leftItems.map((item, i) => (
            <View key={i} style={styles.twoColRow}>
              <Text style={styles.twoColIndex}>{startIndex + i + 1}</Text>
              <Text style={styles.twoColDesc}>{item.itemName}</Text>
              <Text style={styles.twoColUnit}>{item.itemUnit}</Text>
              <Text style={styles.twoColQty}>
                {formatQuantityByUnit(
                  item.reqItemQuantity,
                  item.itemUnit ?? ""
                )}
              </Text>
              <Text style={styles.twoColQty}>
                {item.reqItemReceived === 0 || item.reqItemReceived === "0.00"
                  ? ""
                  : formatQuantityByUnit(
                      item.reqItemReceived,
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
            <Text style={styles.twoColQty}>Ordr Qty</Text>
            <Text style={styles.twoColQty}>Rcvd Qty</Text>
          </View>
          {rightItems.map((item, i) => (
            <View key={i} style={styles.twoColRow}>
              <Text style={styles.twoColIndex}>
                {"#" + `${startIndex + i + 1}`}
              </Text>
              <Text style={styles.twoColDesc}>{item.itemName}</Text>
              <Text style={styles.twoColUnit}>{item.itemUnit}</Text>
              <Text style={styles.twoColQty}>
                {formatQuantityByUnit(
                  item.reqItemQuantity,
                  item.itemUnit ?? ""
                )}
              </Text>
              <Text style={styles.twoColQty}>
                {item.reqItemReceived === 0 || item.reqItemReceived === "0.00"
                  ? ""
                  : formatQuantityByUnit(
                      item.reqItemReceived,
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
        const startIndex = pageIndex * chunkSize;
        const isFirstPage = pageIndex === 0;

        return (
          <Page key={pageIndex} size="A4" style={styles.page}>
            {/* Header - Only on first page */}
            {isFirstPage && (
              <>
                <View style={styles.header}>
                  <View style={styles.titleContainer}>
                    <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                      Request Order
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: "bold" }}>
                      #{data?.requestOrder.requestNo}
                    </Text>
                    <Text style={{ fontSize: 10, color: "#666", marginTop: 2 }}>
                      Date:{" "}
                      {data?.requestOrder.requestCreatedAt
                        ? formatDateToWords(data?.requestOrder.requestCreatedAt)
                        : ""}
                    </Text>
                  </View>

                  <Image style={styles.logo} source={"/avdclogo.png"} />
                </View>

                <View style={styles.divider} />

                <View style={styles.body}>
                  <View style={styles.supplierSection}>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Store</Text>
                      <Text style={styles.value}>{data?.store.storeName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Requestor</Text>
                      <Text style={styles.value}>{data?.requestedBy}</Text>
                    </View>
                  </View>
                  <View style={styles.supplierSection}>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Date</Text>
                      <Text style={styles.value}>
                        {formatDateToWords(
                          data?.requestOrder.requestCreatedAt ?? ""
                        )}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Status</Text>
                      <Text style={styles.value}>{status}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />
              </>
            )}

            {/* Items Table - Layout determined by total item count */}
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

export default RequestOrderPDF;
