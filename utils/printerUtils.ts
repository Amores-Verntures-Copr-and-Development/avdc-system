const OPTIONAL_SERVICES = [
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "000018f0-0000-1000-8000-00805f9b34fb",
];

let cachedPrinterDevice: BluetoothDevice | null = null;

export async function getPrinter() {
  if (!("bluetooth" in navigator)) {
    throw new Error("Web Bluetooth is not supported on this browser.");
  }

  if (cachedPrinterDevice) {
    return cachedPrinterDevice;
  }

  const savedPrinterId = localStorage.getItem("printerDeviceId");

  if ("getDevices" in navigator.bluetooth && savedPrinterId) {
    const devices = await navigator.bluetooth.getDevices();

    const savedDevice = devices.find((device) => device.id === savedPrinterId);

    if (savedDevice) {
      cachedPrinterDevice = savedDevice;
      return savedDevice;
    }
  }

  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: OPTIONAL_SERVICES,
  });

  localStorage.setItem("printerDeviceId", device.id);
  cachedPrinterDevice = device;

  return device;
}
