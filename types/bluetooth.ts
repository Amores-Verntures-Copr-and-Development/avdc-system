// src/types/bluetooth.d.ts
export {};

declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }

  interface Bluetooth {
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
    getDevices(): Promise<BluetoothDevice[]>;
  }

  interface RequestDeviceOptions {
    acceptAllDevices?: boolean;
    optionalServices?: BluetoothServiceUUID[];
    filters?: BluetoothLEScanFilter[];
  }

  interface BluetoothLEScanFilter {
    name?: string;
    namePrefix?: string;
    services?: BluetoothServiceUUID[];
  }

  type BluetoothServiceUUID = string | number;
  type BluetoothCharacteristicUUID = string | number;

  interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
  }

  interface BluetoothRemoteGATTServer {
    device: BluetoothDevice;
    connected: boolean;

    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;

    getPrimaryService(
      service: BluetoothServiceUUID,
    ): Promise<BluetoothRemoteGATTService>;

    getPrimaryServices(
      service?: BluetoothServiceUUID,
    ): Promise<BluetoothRemoteGATTService[]>;
  }

  interface BluetoothRemoteGATTService {
    device: BluetoothDevice;
    uuid: string;
    isPrimary: boolean;

    getCharacteristic(
      characteristic: BluetoothCharacteristicUUID,
    ): Promise<BluetoothRemoteGATTCharacteristic>;

    getCharacteristics(
      characteristic?: BluetoothCharacteristicUUID,
    ): Promise<BluetoothRemoteGATTCharacteristic[]>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    service: BluetoothRemoteGATTService;
    uuid: string;
    properties: BluetoothCharacteristicProperties;

    writeValue(value: BufferSource): Promise<void>;

    writeValueWithResponse?(value: BufferSource): Promise<void>;

    writeValueWithoutResponse?(value: BufferSource): Promise<void>;

    readValue(): Promise<DataView>;

    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;

    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  }

  interface BluetoothCharacteristicProperties {
    broadcast: boolean;
    read: boolean;
    writeWithoutResponse: boolean;
    write: boolean;
    notify: boolean;
    indicate: boolean;
    authenticatedSignedWrites: boolean;
    reliableWrite: boolean;
    writableAuxiliaries: boolean;
  }
}
