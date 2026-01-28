import { selectCountSales } from "@/models/saleModel";
import { Connection } from "mysql2/promise";

export async function generateSalesInvoice({
  connection,
  id,
}: {
  connection: Connection;
  id: number;
}) {
  try {
    // 1️⃣ Count all sales

    // 2️⃣ Get current year dynamically
    const year = new Date().getFullYear(); // e.g., 2026

    // 3️⃣ Generate invoice number with padded count
    const invoiceNo = `INV-${year}-${(id + 1).toString().padStart(6, "0")}`;

    return invoiceNo;
  } catch (e) {
    throw e;
  }
}

export async function generateSalesNo({
  connection,
  storeId,
}: {
  connection: Connection;
  storeId: number;
}) {
  try {
    // 1️⃣ Count all sales
    const totalSales = await selectCountSales({
      connection,
      keyFields: {
        storeId: storeId,
      },
    });

    // 3️⃣ Generate invoice number with padded count
    const salesNo = `SALES-${(totalSales + 1).toString().padStart(6, "0")}`;

    return salesNo;
  } catch (e) {
    throw e;
  }
}
