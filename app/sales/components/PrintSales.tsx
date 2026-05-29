"use client";

import { DisplaySalesDto, DisplaySalesItems } from "@/dtos/sales.dto";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import React from "react";
import useSWR from "swr";

const PRINTER_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
const PRINTER_CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";

export function generateReceiptData(
  salesData: DisplaySalesDto | null,
  salesItems: DisplaySalesItems[],
): string[] {
  if (!salesData) return [];

  const lines: string[] = [];
  const divider = "--------------------------------\n";
  const peso = (value: number) => `PHP ${value.toFixed(2)}`;

  lines.push("\x1B\x40");
  lines.push("\x1B\x61\x01");
  lines.push(`${salesData.storeName ?? "STORE"}\n`);
  lines.push("NOT OFFICIAL RECEIPT\n\n");
  lines.push("\x1B\x61\x00");

  lines.push(`Order #: ${salesData.salesNo}\n`);
  lines.push(
    `Date: ${new Date(salesData.salesCreatedAt ?? "").toLocaleString()}\n`,
  );
  lines.push(`Customer: ${salesData.customerName || "Walk-in Customer"}\n`);

  lines.push(divider);
  lines.push("ITEMS\n");
  lines.push(divider);

  salesItems.forEach((item) => {
    const name = item.prodVarName || item.prodName || "Item";

    lines.push(`${name}\n`);
    lines.push(
      `${Number(item.salesItemQuantity)} x ${peso(Number(item.salesItemPrice))}\n`,
    );

    item.salesItemsDiscount?.forEach((disc) => {
      lines.push(`  DISC: -${peso(Number(disc.discountAmount))}\n`);
    });

    lines.push(`  TOTAL: ${peso(Number(item.salesItemTotal))}\n\n`);
  });

  lines.push(divider);
  lines.push(`SUBTOTAL: ${peso(Number(salesData.salesSubTotal ?? 0))}\n`);

  salesData.salesDiscounts?.forEach((disc) => {
    lines.push(`${disc.discountName}: -${peso(Number(disc.discountAmount))}\n`);
  });

  lines.push(`TOTAL: ${peso(Number(salesData.salesTotalAmount ?? 0))}\n`);
  lines.push(divider);

  lines.push("PAYMENTS\n");

  salesData.paymentMethods?.forEach((pay) => {
    lines.push(`${pay.payMetName}: ${peso(Number(pay.salesPaymentAmount))}\n`);

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
}

async function printViaBluetooth(receiptLines: string[]) {
  if (!("bluetooth" in navigator)) {
    alert("Web Bluetooth is not supported on this browser.");
    return;
  }

  const bluetooth = navigator.bluetooth as Bluetooth;

  const device = await bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [PRINTER_SERVICE_UUID],
  });

  const server = await device.gatt?.connect();

  if (!server) {
    throw new Error("Failed to connect to printer.");
  }

  const service = await server.getPrimaryService(PRINTER_SERVICE_UUID);

  const characteristic = await service.getCharacteristic(
    PRINTER_CHARACTERISTIC_UUID,
  );

  const encoder = new TextEncoder();
  const data = encoder.encode(receiptLines.join(""));

  const chunkSize = 180;

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    await characteristic.writeValue(chunk);
  }

  device.gatt?.disconnect();
}

interface PrintSalesProps {
  salesData: DisplaySalesDto | null;
  onBack: () => void;
}

const PrintSales = ({ salesData, onBack }: PrintSalesProps) => {
  const { data: response, isLoading } = useSWR<
    ApiResponse<DisplaySalesItems[]>
  >(
    salesData?.salesId
      ? `/api/sales/${salesData.storeId}/${salesData.salesId}/sales-items`
      : null,
    fetcher,
  );

  async function inspectBluetoothDevice() {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        "battery_service",
        "device_information",
        "0000ffe0-0000-1000-8000-00805f9b34fb",
      ],
    });

    const server = await device.gatt?.connect();

    if (!server) {
      console.log("No GATT server");
      return;
    }

    const services = await server.getPrimaryServices();

    for (const service of services) {
      console.log("SERVICE UUID:", service.uuid);

      const characteristics = await service.getCharacteristics();

      for (const characteristic of characteristics) {
        console.log("  CHARACTERISTIC UUID:", characteristic.uuid);

        console.log("  PROPERTIES:", characteristic.properties);
      }
    }
  }
  async function printViaBluetooth(receiptLines: string[]) {
    await inspectBluetoothDevice();
    if (!("bluetooth" in navigator)) {
      throw new Error("Web Bluetooth is not supported on this browser.");
    }

    const bluetooth = navigator.bluetooth as Bluetooth;

    const device = await bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        PRINTER_SERVICE_UUID,
        "0000ff00-0000-1000-8000-00805f9b34fb",
        "000018f0-0000-1000-8000-00805f9b34fb",
      ],
    });

    const server = await device.gatt?.connect();

    if (!server) {
      throw new Error("Failed to connect to printer.");
    }

    try {
      const service = await server.getPrimaryService(PRINTER_SERVICE_UUID);

      const characteristic = await service.getCharacteristic(
        PRINTER_CHARACTERISTIC_UUID,
      );

      const encoder = new TextEncoder();
      const data = encoder.encode(receiptLines.join(""));

      const chunkSize = 180;

      for (let i = 0; i < data.length; i += chunkSize) {
        await characteristic.writeValue(data.slice(i, i + chunkSize));
      }
    } finally {
      server.disconnect();
    }
  }
  const receiptLines = generateReceiptData(salesData, response?.data ?? []);

  const previewLines = receiptLines
    .filter((line) => !line.startsWith("\x1B"))
    .join("");

  const handlePrint = async () => {
    try {
      if (!receiptLines.length) {
        alert("No receipt data to print.");
        return;
      }

      await printViaBluetooth(receiptLines);
      alert("Print command sent.");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to print receipt.",
      );
    }
  };

  return (
    <div className="mx-auto max-w-sm rounded-lg border bg-white p-4">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back
      </button>

      <h2 className="mb-3 text-center text-sm font-semibold">
        Receipt Preview
      </h2>

      {isLoading ? (
        <div className="rounded bg-gray-50 p-3 text-center text-xs text-gray-500">
          Loading receipt...
        </div>
      ) : (
        <pre className="whitespace-pre-wrap rounded bg-gray-50 p-3 font-mono text-xs leading-5 text-gray-800">
          {previewLines}
        </pre>
      )}

      <button
        className="mt-4 w-full rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        onClick={handlePrint}
        disabled={isLoading || !receiptLines.length}
      >
        Print
      </button>
    </div>
  );
};

export default PrintSales;
