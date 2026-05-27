"use client";

import qz, { type PrintData } from "qz-tray";

export async function connectQZ() {
  if (!qz.websocket.isActive()) {
    await qz.websocket.connect();
  }
}

export async function getPrinters(): Promise<string[]> {
  await connectQZ();

  const printers = await qz.printers.find();

  return Array.isArray(printers) ? printers : [printers];
}

export async function printToPrinter(
  printerName: string,
  data: string[] | PrintData[],
) {
  await connectQZ();

  const config = qz.configs.create(printerName);

  await qz.print(config, data);
}
