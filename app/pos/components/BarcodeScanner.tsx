"use client";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { X } from "lucide-react";
import React, { useEffect, useRef } from "react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose?: () => void;
}

const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const hints = new Map();

    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
    ]);

    const reader = new BrowserMultiFormatReader(hints);

    let controls: IScannerControls | undefined;
    let stopped = false;

    let lastCode = "";
    let lastScanTime = 0;

    async function start() {
      try {
        // check camera support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error("Camera API not supported");
          return;
        }

        controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current!,
          (result) => {
            if (stopped || !result) return;

            const code = result.getText().trim();
            const now = Date.now();

            // ignore urls / qr text
            if (!/^\d{8,14}$/.test(code)) {
              return;
            }

            // prevent duplicate scans
            if (code === lastCode && now - lastScanTime < 1500) {
              return;
            }

            lastCode = code;
            lastScanTime = now;

            onScan(code);
          },
        );
      } catch (error) {
        console.error("Barcode scanner error:", error);
      }
    }

    const timer = setTimeout(start, 300);

    return () => {
      stopped = true;

      clearTimeout(timer);

      if (controls) {
        controls.stop();
      }
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
