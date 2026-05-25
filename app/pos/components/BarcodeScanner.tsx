"use client";

import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { X } from "lucide-react";
import React, { useEffect, useRef } from "react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose?: () => void;
}

const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();

    let controls: IScannerControls | undefined;
    let stopped = false;

    async function start() {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();

        const backCamera =
          devices.find((d) => /back|rear|environment/i.test(d.label)) ??
          devices[0];

        controls = await reader.decodeFromVideoDevice(
          backCamera?.deviceId,
          videoRef.current!,
          (result) => {
            if (result) {
              const code = result.getText();

              onScan(code);
            }
          },
        );
      } catch (error) {
        console.error("Barcode scanner error:", error);
      }
    }

    start();

    return () => {
      stopped = true;
      controls?.stop();
    };
  }, [onScan]);

  return (
    <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
          autoPlay
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-[220px] w-[70%] overflow-hidden rounded-2xl border-4 border-white">
            <div className="absolute left-0 top-1/2 h-1 w-full bg-green-400 animate-pulse" />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-black/20" />
      </div>

      <div className="flex items-center justify-between p-4 text-sm text-zinc-400">
        <div>Supports EAN, UPC, Code128, QR</div>

        <button
          type="button"
          className="rounded-xl bg-pink-600 px-4 py-2 text-white hover:bg-pink-500"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;
