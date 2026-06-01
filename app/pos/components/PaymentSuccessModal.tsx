import Button from "@/components/shared/Button";
import { Sales, SalesV2 } from "@/types/sales";
import { formatPeso } from "@/utils/formatPeso";
import { getPrinter } from "@/utils/printerUtils";
import { CheckCircle2, Printer, Receipt } from "lucide-react";
import React, { useRef } from "react";

interface PaymentSuccessModalProps {
  totalPaid: number;
  change: number;
  salesData: Sales | null;
  onNewSale: () => void;
  onPrintReceipt?: () => void;
}

const OPTIONAL_SERVICES = [
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "000018f0-0000-1000-8000-00805f9b34fb",
];

const PaymentSuccessModal = ({
  totalPaid,
  change,
  onNewSale,
  salesData,
}: PaymentSuccessModalProps) => {
  const generateReceiptData = (salesData: SalesV2 | null): string[] => {
    if (!salesData) return [];

    const lines: string[] = [];
    const divider = "--------------------------------\n";
    const peso = (value: number | string | null | undefined) =>
      `PHP ${Number(value ?? 0).toFixed(2)}`;

    lines.push("\x1B\x40");
    lines.push("\x1B\x61\x01");
    lines.push(`${salesData.storeName ?? "STORE"}\n`);
    lines.push("NOT OFFICIAL RECEIPT\n\n");

    lines.push("\x1B\x61\x00");
    lines.push(`Order #: ${salesData.salesNo}\n`);
    lines.push(`Invoice: ${salesData.salesInvoice ?? "-"}\n`);
    lines.push(
      `Date: ${new Date(salesData.salesCreatedAt).toLocaleString()}\n`,
    );
    lines.push(`Customer: ${salesData.customerName || "Walk-in Customer"}\n`);

    lines.push(divider);
    lines.push("ITEMS\n");
    lines.push(divider);

    salesData.saleItems?.forEach((item) => {
      const name = item.prodVarName || item.saleItemName || "Item";

      lines.push(`${name}\n`);
      lines.push(
        `${Number(item.salesItemQuantity)} x ${peso(item.salesItemPrice)}\n`,
      );

      item.salesItemDiscounts?.forEach((disc) => {
        lines.push(`  DISC: -${peso(disc.discountAmount)}\n`);
      });

      lines.push(`  TOTAL: ${peso(item.salesItemTotal)}\n\n`);
    });

    lines.push(divider);
    lines.push(`SUBTOTAL: ${peso(salesData.salesSubTotal)}\n`);

    salesData.salesDiscounts?.forEach((disc) => {
      lines.push(`${disc.discountName}: -${peso(disc.discountAmount)}\n`);
    });

    lines.push(`TOTAL: ${peso(salesData.salesTotalAmount)}\n`);
    lines.push(`PAID: ${peso(salesData.salesTotalPaid)}\n`);
    lines.push(divider);

    lines.push("PAYMENTS\n");

    salesData.paymentMethods?.forEach((pay) => {
      lines.push(`${pay.payMetName}: ${peso(pay.salesPaymentAmount)}\n`);

      if (pay.paymentReference) {
        lines.push(`REF: ${pay.paymentReference}\n`);
      }
    });

    lines.push(divider);
    lines.push(`Cashier: ${salesData.salesCreatedByName ?? "-"}\n\n`);

    lines.push("\x1B\x61\x01");
    lines.push("Thank you!\n");
    lines.push("Please come again.\n\n\n");

    return lines;
  };

  const printViaBluetooth = async (receiptLines: string[]) => {
    let device;
    let server;

    try {
      device = await getPrinter();
      server = await device.gatt?.connect();

      if (!server) {
        throw new Error("Failed to connect to printer.");
      }

      const services = await server.getPrimaryServices();

      let writable: BluetoothRemoteGATTCharacteristic | null = null;

      for (const service of services) {
        const characteristics = await service.getCharacteristics();

        for (const ch of characteristics) {
          if (ch.properties.write || ch.properties.writeWithoutResponse) {
            writable = ch;
            break;
          }
        }

        if (writable) break;
      }

      if (!writable) {
        throw new Error(
          "No writable BLE characteristic found. This printer may not support Web Bluetooth.",
        );
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(receiptLines.join(""));
      const chunkSize = 180;

      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);

        if (writable.properties.writeWithoutResponse) {
          await writable.writeValueWithoutResponse?.(chunk);
        } else if (writable.properties.write) {
          await writable.writeValueWithResponse?.(chunk);
        } else {
          await writable.writeValue(chunk);
        }

        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error("Print error:", error);
      throw error;
    } finally {
      // Don't disconnect immediately - keep connection for future prints
      // server?.disconnect();
    }
  };

  const handlePrintReceipt = async () => {
    try {
      if (!salesData) {
        alert("No sales data found.");
        return;
      }

      const receiptLines = generateReceiptData(salesData as unknown as SalesV2);

      if (!receiptLines.length) {
        return;
      }

      await printViaBluetooth(receiptLines);
      onNewSale();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to print receipt.",
      );
    }
  };

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="w-10 h-10 2xl:w-20 2xl:h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-1 2xl:mb-6">
        <CheckCircle2 className="w-6 h-6 2xl:w-12 2xl:h-12 text-emerald-500" />
      </div>

      <h2 className="text-sm 2xl:text-2xl font-bold text-slate-800 mb-2">
        Payment Successful!
      </h2>

      <p className="text-xs 2xl:text-xl text-slate-500 mb-6">
        Transaction completed successfully
      </p>

      <div className="bg-slate-50 rounded-2xl p-3 2xl:p-6 w-full mb-1 2xl:mb-6">
        <div className="flex justify-between items-center 2xl:mb-4">
          <span className="text-sm 2xl:text-base text-slate-500">
            Total Paid
          </span>
          <span className="text-lg 2xl:text-2xl font-bold text-slate-800">
            {formatPeso(totalPaid)}
          </span>
        </div>

        <div className="flex justify-between items-center 2xl:mb-4">
          <span className="text-sm 2xl:text-base text-slate-500">
            Total Amount
          </span>
          <span className="text-lg 2xl:text-2xl font-bold text-slate-800">
            {formatPeso(salesData?.salesTotalAmount)}
          </span>
        </div>

        {change > 0 && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-200">
            <span className="text-slate-500">Change Due</span>
            <span className="text-xl font-bold text-amber-600">
              {formatPeso(change)}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-3 w-full">
        <Button
          size="md"
          color="secondary"
          onClick={onNewSale}
          label="New Sale"
          icon={Receipt}
        />

        <Button
          onClick={handlePrintReceipt}
          label="Print Receipt"
          icon={Printer}
          size="md"
        />
      </div>
    </div>
  );
};

export default PaymentSuccessModal;
