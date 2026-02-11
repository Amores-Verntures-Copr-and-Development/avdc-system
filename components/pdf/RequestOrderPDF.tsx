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
import { formatPeso } from "@/utils/formatPeso";

const styles = StyleSheet.create({
  page: {
    padding: 10,
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
    marginVertical: 3,
  },
  body: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  supplierSection: {
    width: "48%",
  },
  infoRow: {
    flexDirection: "column",
    marginBottom: 3,
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

  // Table Styles
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    borderTop: "1px solid #333",
    borderBottom: "1px solid #333",
    padding: 4,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    borderBottom: "0.5px solid #ddd",
    padding: 4,
    alignItems: "center",
    minHeight: 22,
  },
  colIndex: { width: "8%", fontSize: 8 },
  colDesc: { width: "40%", paddingHorizontal: 3, fontSize: 8 },
  colUnit: { width: "12%", fontSize: 8 },
  colPrice: { width: "12%", fontSize: 8 },
  colQty: { width: "10%", fontSize: 8 },
  colTotal: { width: "18%", fontSize: 8, fontWeight: "bold" },

  tableContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  table: { width: "49%" },
  twoColTableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    borderTop: "1px solid #333",
    borderBottom: "1px solid #333",
    padding: 4,
    fontWeight: "bold",
  },
  twoColRow: {
    flexDirection: "row",
    borderBottom: "0.5px solid #ddd",
    padding: 4,
    alignItems: "center",
    minHeight: 20,
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
});

interface RequestOrderPFGProps {
  data: RequestOrderPdf | null;
}

const TWO_COLUMN_THRESHOLD = 30;
const FIRST_PAGE_SINGLE_COLUMN = 60;
const NEXT_PAGE_SINGLE_COLUMN = 70;
const FIRST_PAGE_TWO_COLUMN = 60;
const NEXT_PAGE_TWO_COLUMN = 80;

const RequestOrderPDF = ({ data }: RequestOrderPFGProps) => {
  const items = data?.requestItems || [];

  const chunkItemsWithFirstPage = (
    items: any[],
    firstSize: number,
    nextSize: number,
  ) => {
    if (items.length === 0) return [[]];
    const chunks: any[] = [];
    let index = 0;
    chunks.push(items.slice(index, index + firstSize));
    index += firstSize;
    while (index < items.length) {
      chunks.push(items.slice(index, index + nextSize));
      index += nextSize;
    }
    return chunks;
  };

  const itemChunks = chunkItemsWithFirstPage(
    items,
    items.length > TWO_COLUMN_THRESHOLD
      ? FIRST_PAGE_TWO_COLUMN
      : FIRST_PAGE_SINGLE_COLUMN,
    items.length > TWO_COLUMN_THRESHOLD
      ? NEXT_PAGE_TWO_COLUMN
      : NEXT_PAGE_SINGLE_COLUMN,
  );

  const getQuantityByStatus = (item: any, status: string) => {
    switch (status) {
      case "pending":
      case "approved":
      case "in_progress":
        return item.reqItemQuantity;
      case "delivered":
        return item.reqItemTransfer;
      case "received":
      case "completed":
        return item.reqItemReceived;
      default:
        return 0;
    }
  };

  const renderTable = (items: any[], startIndex = 0) => (
    <View>
      <View style={styles.tableHeader}>
        <Text style={styles.colIndex}>#</Text>
        <Text style={styles.colDesc}>Item</Text>
        <Text style={styles.colUnit}>Unit</Text>
        <Text style={styles.colPrice}>Price</Text>
        <Text style={styles.colQty}>O</Text>
        <Text style={styles.colQty}>D</Text>
        <Text style={styles.colQty}>R</Text>
        <Text style={styles.colTotal}>Total</Text>
      </View>

      {items.map((item, i) => {
        const total =
          getQuantityByStatus(item, data?.requestOrder.requestStatus ?? "") *
          Number(item.itemPrice);
        return (
          <View key={i} style={styles.row}>
            <Text style={styles.colIndex}>{startIndex + i + 1}</Text>
            <Text style={styles.colDesc}>{item.itemName}</Text>
            <Text style={styles.colUnit}>{item.itemUnit}</Text>
            <Text style={styles.colPrice}>{Number(item.itemPrice)}</Text>
            <Text style={styles.colQty}>
              {item.reqItemQuantity
                ? formatQuantityByUnit(
                    item.reqItemQuantity,
                    item.itemUnit ?? "",
                  )
                : ""}
            </Text>
            <Text style={styles.colQty}>
              {Number(item.reqItemTransfer) !== 0
                ? formatQuantityByUnit(
                    item.reqItemTransfer,
                    item.itemUnit ?? "",
                  )
                : ""}
            </Text>
            <Text style={styles.colQty}>
              {Number(item.reqItemReceived) !== 0
                ? formatQuantityByUnit(
                    item.reqItemReceived,
                    item.itemUnit ?? "",
                  )
                : ""}
            </Text>
            <Text style={styles.colTotal}>
              {Number(total) !== 0 ? total : ""}
            </Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <Document>
      {itemChunks.map((chunk, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const startIndex =
          pageIndex === 0
            ? 0
            : FIRST_PAGE_SINGLE_COLUMN +
              (pageIndex - 1) * NEXT_PAGE_SINGLE_COLUMN;

        return (
          <Page key={pageIndex} size="A4" style={styles.page}>
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
                          data?.requestOrder.requestCreatedAt ?? "",
                        )}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Status</Text>
                      <Text style={styles.value}>
                        {data?.requestOrder.requestStatus ?? "N/A"}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.divider} />
              </>
            )}
            {renderTable(chunk, startIndex)}
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
