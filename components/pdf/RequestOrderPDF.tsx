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

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: { width: 100, height: 60, objectFit: "contain" },
  title: { fontSize: 16, fontWeight: "bold", textAlign: "right" },
  tableContainer: { flexDirection: "row", justifyContent: "space-between" },
  singTable: { alignSelf: "center" },
  table: { width: "48%" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottom: "1px solid #000",
    padding: 5,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    borderBottom: "0.5px solid #ddd",
    padding: 4,
  },
  colIndex: { width: "10%", textAlign: "center" },
  colDesc: { width: "50%" },
  colUnit: { width: "20%", textAlign: "center" },
  colQty: { width: "20%", textAlign: "center" },
  footer: { marginTop: 20, textAlign: "center", fontSize: 10 },
});

interface RequestOrderPFGProps {
  data: RequestOrderPdf | null;
}
const RequestOrderPDF = ({ data }: RequestOrderPFGProps) => {
  const isMoreThan20 = (data?.requestItems?.length ?? 0) > 20;
  const half = Math.ceil((data?.requestItems?.length ?? 0) / 2);
  const leftItems = data?.requestItems.slice(0, half);
  const rightItems = data?.requestItems.slice(half);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Request Order</Text>
            <Text>RO #: {data?.requestOrder.requestNo}</Text>
            <Text>Store: {data?.store.storeName}</Text>
            <Text>
              Date:{" "}
              {formatDateToWords(data?.requestOrder.requestCreatedAt ?? "")}
            </Text>
          </View>
          <Image style={styles.logo} src={`/avdclogo.png`} />
        </View>

        {/* 2-column Table */}
        {isMoreThan20 ? (
          <View style={styles.tableContainer}>
            {/* Left Table */}
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.colIndex}>#</Text>
                <Text style={styles.colDesc}>Item</Text>
                <Text style={styles.colUnit}>Unit</Text>
                <Text style={styles.colQty}>Qty</Text>
              </View>
              {leftItems?.map((item, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.colIndex}>{i + 1}</Text>
                  <Text style={styles.colDesc}>{item.itemName}</Text>
                  <Text style={styles.colUnit}>{item.itemUnit}</Text>
                  <Text style={styles.colQty}>
                    {formatQuantityByUnit(item.reqItemQuantity, item.itemUnit)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Right Table */}
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.colIndex}>#</Text>
                <Text style={styles.colDesc}>Item</Text>
                <Text style={styles.colUnit}>Unit</Text>
                <Text style={styles.colQty}>Qty</Text>
              </View>
              {rightItems?.map((item, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.colIndex}>{half + i + 1}</Text>
                  <Text style={styles.colDesc}>{item.itemName}</Text>
                  <Text style={styles.colUnit}>{item.itemUnit}</Text>
                  <Text style={styles.colQty}>
                    {" "}
                    {formatQuantityByUnit(item.reqItemQuantity, item.itemUnit)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.singTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.colIndex}>#</Text>
              <Text style={styles.colDesc}>Item</Text>
              <Text style={styles.colUnit}>Unit</Text>
              <Text style={styles.colQty}>Qty</Text>
            </View>
            {data?.requestItems?.map((item, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.colIndex}>{i + 1}</Text>
                <Text style={styles.colDesc}>{item.itemName}</Text>
                <Text style={styles.colUnit}>{item.itemUnit}</Text>
                <Text style={styles.colQty}>
                  {" "}
                  {formatQuantityByUnit(item.reqItemQuantity, item.itemUnit)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* <Text style={styles.footer}>Thank you for your business!</Text> */}
      </Page>
    </Document>
  );
};

export default RequestOrderPDF;
