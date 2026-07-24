import { DisplayOrderDto, DisplayOrderItemDto } from "@/dtos/orders.dto";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

interface OrderReceiptPDFProps {
  order: DisplayOrderDto;
  items: DisplayOrderItemDto[];
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
  },
  logo: { width: 100, height: 70, objectFit: "contain" },
  titleContainer: {
    flexDirection: "column",
  },
  divider: {
    borderBottom: "1px solid #000",
    width: "100%",
    marginVertical: 8,
  },
  body: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoSection: {
    width: "48%",
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
  colIndex: { width: "8%", textAlign: "center", fontWeight: "bold" },
  colDesc: { width: "44%", paddingHorizontal: 3 },
  colQty: { width: "12%", textAlign: "center" },
  colPrice: { width: "18%", textAlign: "right" },
  colTotal: { width: "18%", textAlign: "right", fontWeight: "bold" },
  summarySection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#f8f8f8",
    border: "1px solid #ddd",
    width: "50%",
    alignSelf: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTop: "1px solid #333",
  },
  footerNote: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 9,
    color: "#666",
    fontStyle: "italic",
  },
});

export const OrderReceiptPDF = ({ order, items }: OrderReceiptPDFProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={{ fontSize: 14, fontWeight: "bold" }}>
              {order.storeName ?? "Order Receipt"}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: "bold", marginTop: 2 }}>
              Order #{order.orderNumber}
            </Text>
            <Text style={{ fontSize: 10, color: "#666", marginTop: 2 }}>
              Date: {formatDateToWords(order.orderCreatedAt)}
            </Text>
          </View>

          <Image style={styles.logo} source={"/avdclogo.png"} />
        </View>

        <View style={styles.divider} />

        <View style={styles.body}>
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Customer</Text>
              <Text style={styles.value}>
                {order.customerName || "Walk-in Customer"}
              </Text>
            </View>
            {order.customerPhone && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>{order.customerPhone}</Text>
              </View>
            )}
            {order.customerEmail && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{order.customerEmail}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Fulfillment</Text>
              <Text style={styles.value}>
                {order.fulfillmentType}
                {order.deliveryAddress ? ` - ${order.deliveryAddress}` : ""}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Payment Method</Text>
              <Text style={styles.value}>
                {order.payMetName ?? "-"}
                {order.paymentReference ? ` (${order.paymentReference})` : ""}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.value}>
                {order.orderStatus} / {order.paymentStatus}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.tableHeader}>
          <Text style={styles.colIndex}>#</Text>
          <Text style={styles.colDesc}>Item</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colPrice}>Unit Price</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>

        {items.map((item, i) => (
          <View key={item.orderItemId} style={styles.row}>
            <Text style={styles.colIndex}>{i + 1}</Text>
            <Text style={styles.colDesc}>{item.prodVarName}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>{formatPeso(item.unitPrice)}</Text>
            <Text style={styles.colTotal}>{formatPeso(item.lineTotal)}</Text>
          </View>
        ))}

        {items.length === 0 && (
          <View style={styles.row}>
            <Text style={{ width: "100%", textAlign: "center" }}>
              No items found
            </Text>
          </View>
        )}

        <View style={styles.summarySection}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{formatPeso(order.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Discount</Text>
            <Text>{formatPeso(order.discountAmount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Delivery Fee</Text>
            <Text>{formatPeso(order.deliveryFee)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={{ fontWeight: "bold" }}>Total</Text>
            <Text style={{ fontWeight: "bold" }}>
              {formatPeso(order.totalAmount)}
            </Text>
          </View>
        </View>

        {order.customerNotes && (
          <View style={{ marginTop: 15 }}>
            <Text style={styles.label}>Customer Notes</Text>
            <Text>{order.customerNotes}</Text>
          </View>
        )}

        <Text style={styles.footerNote}>
          Thank you! Please come again.
        </Text>
      </Page>
    </Document>
  );
};
