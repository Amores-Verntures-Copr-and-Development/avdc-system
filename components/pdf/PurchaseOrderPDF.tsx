import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

interface Item {
  description: string;
  quantity: number;
  price: number;
}

interface PurchaseOrderProps {
  logo: string;
  companyName: string;
  companyAddress: string;
  companyContact: string;
  orderType: "Purchase Order" | "Request Order";
  poNumber: string;
  date: string;
  supplierName: string;
  supplierAddress: string;
  items: Item[];
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 12, fontFamily: "Helvetica" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  logo: { width: 100, height: 80 },
  title: { fontSize: 18, fontWeight: "bold", textAlign: "right" },
  section: { marginBottom: 10 },
  bold: { fontWeight: "bold" },
  table: { marginTop: 20 },
  row: { flexDirection: "row", borderBottom: "1px solid #ccc", padding: 5 },
  colDesc: { width: "50%" },
  colQty: { width: "15%", textAlign: "center" },
  colPrice: { width: "15%", textAlign: "center" },
  colTotal: { width: "20%", textAlign: "right" },
  footer: { marginTop: 30, textAlign: "center", fontSize: 10 },
});

export const PurchaseOrderPDF = (props: PurchaseOrderProps) => {
  const total = props.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image style={styles.logo} source={props.logo} />
          <View>
            <Text style={styles.title}>{props.orderType}</Text>
            <Text>PO #: {props.poNumber}</Text>
            <Text>Date: {props.date}</Text>
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.section}>
          <Text style={styles.bold}>{props.companyName}</Text>
          <Text>{props.companyAddress}</Text>
          <Text>{props.companyContact}</Text>
        </View>

        {/* Supplier Info */}
        <View style={styles.section}>
          <Text style={styles.bold}>Supplier:</Text>
          <Text>{props.supplierName}</Text>
          <Text>{props.supplierAddress}</Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={[styles.row, styles.bold]}>
            <Text style={styles.colDesc}>Supplier</Text>
            <Text style={styles.colDesc}>Item</Text>
            <Text style={styles.colDesc}>Unit</Text>
            <Text style={styles.colPrice}>Price</Text>
            <Text style={styles.colQty}>Qty</Text>
          </View>

          {props.items.map((item, i) => (
            <View style={styles.row} key={i}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{item.price.toFixed(2)}</Text>
              <Text style={styles.colTotal}>
                {(item.quantity * item.price).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={[styles.row, styles.bold]}>
            <Text style={styles.colDesc}></Text>
            <Text style={styles.colQty}></Text>
            <Text style={styles.colPrice}>Total</Text>
            <Text style={styles.colTotal}>{total.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>Thank you for your business!</Text>
      </Page>
    </Document>
  );
};
