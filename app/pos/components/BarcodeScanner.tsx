"use client";

import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Camera, RefreshCcw, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose?: () => void;
}

type CameraMode = "environment" | "user";

const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [cameraMode, setCameraMode] = useState<CameraMode>("environment");
  const [status, setStatus] = useState("Starting camera...");
  const [lastScanned, setLastScanned] = useState<string>("");

  useEffect(() => {
    if (!videoRef.current) return;

    let stopped = false;
    let lastCode = "";
    let lastScanTime = 0;

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.QR_CODE,
    ]);

    const reader = new BrowserMultiFormatReader(hints);

    async function startScanner() {
      try {
        setStatus("Requesting camera permission...");

        if (!navigator.mediaDevices?.getUserMedia) {
          setStatus("Camera is not supported on this device.");
          return;
        }

        controlsRef.current?.stop();

        controlsRef.current = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: cameraMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current!,
          (result) => {
            if (stopped || !result) return;

            const code = result.getText().trim();
            const now = Date.now();

            if (!/^\d{8,14}$/.test(code)) return;

            if (code === lastCode && now - lastScanTime < 1500) return;

            lastCode = code;
            lastScanTime = now;

            setLastScanned(code);
            setStatus("Barcode scanned");
            onScan(code);
          },
        );

        setStatus(
          cameraMode === "environment"
            ? "Back camera active"
            : "Front camera active",
        );
      } catch (error) {
        console.error("Barcode scanner error:", error);
        setStatus("Unable to access camera.");
      }
    }

    const timer = setTimeout(startScanner, 300);

    return () => {
      stopped = true;
      clearTimeout(timer);
      controlsRef.current?.stop();
    };
  }, [cameraMode, onScan]);

  const switchCamera = () => {
    setCameraMode((prev) => (prev === "environment" ? "user" : "environment"));
    setStatus("Switching camera...");
  };

  return (
    <div className="w-full max-w-lg overflow-hidden ">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div>
          <p className="text-xs text-zinc-500">{status}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={switchCamera}
            className="rounded-xl border bg-zinc-50 p-2 text-zinc-700 hover:bg-zinc-100"
            title="Switch camera"
          >
            <RefreshCcw size={18} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border bg-zinc-50 p-2 text-zinc-700 hover:bg-zinc-100"
            title="Close scanner"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="relative aspect-[4/5] bg-black sm:aspect-video">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
          autoPlay
        />

        <div className="absolute inset-0 bg-black/30" />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <div className="relative h-40 w-full max-w-sm rounded-2xl border-2 border-white/90">
            <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-green-400 shadow-[0_0_18px_rgba(74,222,128,0.9)]" />

            <div className="absolute -left-1 -top-1 h-8 w-8 border-l-4 border-t-4 border-green-400" />
            <div className="absolute -right-1 -top-1 h-8 w-8 border-r-4 border-t-4 border-green-400" />
            <div className="absolute -bottom-1 -left-1 h-8 w-8 border-b-4 border-l-4 border-green-400" />
            <div className="absolute -bottom-1 -right-1 h-8 w-8 border-b-4 border-r-4 border-green-400" />
          </div>
        </div>
      </div>

      <div className="space-y-3 bg-zinc-950 px-5 py-4 text-white">
        <div className="flex items-center gap-2 text-sm">
          <Camera size={16} className="text-green-400" />
          <span>
            Using{" "}
            {cameraMode === "environment" ? "Back Camera" : "Front Camera"}
          </span>
        </div>

        {lastScanned && (
          <div className="rounded-xl bg-zinc-900 px-3 py-2 text-sm">
            Last scanned: <span className="font-semibold">{lastScanned}</span>
          </div>
        )}

        <p className="text-xs text-zinc-400">
          Supports EAN, UPC, Code128, and QR codes.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-pink-600 py-3 font-semibold text-white hover:bg-pink-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;
