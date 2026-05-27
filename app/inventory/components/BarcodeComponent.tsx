"use client";

import Button from "@/components/shared/Button";
import { CreateBarcodeDto } from "@/dtos/barcode.dto";
import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { useSession } from "@/hooks/useSession";
import { ApiResponse } from "@/types/api";
import { Barcodes } from "@/types/barcode";
import { fetcher } from "@/utils/fetcher";

import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";

import { BarcodeFormat, DecodeHintType } from "@zxing/library";

import { Camera, CameraOff, RefreshCcw, ScanLine } from "lucide-react";

import React, { useEffect, useRef, useState } from "react";

import toast from "react-hot-toast";
import useSWR from "swr";

interface BarcodeComponentProps {
  data: DisplayInventoryItems | null;
  onCancel: () => void;
  mutate: () => void;
}

type CameraMode = "environment" | "user";

const BarcodeComponent = ({
  data,
  onCancel,
  mutate,
}: BarcodeComponentProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const { user } = useSession();

  const [showView, setShowView] = useState<"view" | "add">("view");

  const [addUse, setAddUse] = useState<"scan" | "input">("scan");

  const [barcode, setBarcode] = useState("");

  const [cameraMode, setCameraMode] = useState<CameraMode>("environment");

  const [cameraStatus, setCameraStatus] = useState("Initializing camera...");

  const [isLoading, setIsLoading] = useState(false);

  const { data: barcodeResponse, mutate: mutateBarcode } = useSWR<
    ApiResponse<Barcodes[]>
  >(data ? `/api/barcode/item/${data.inventoryItemId}` : null, fetcher);

  const handleSaveBarcode = async () => {
    if (!user) {
      toast.error("No user found");
      return;
    }

    setIsLoading(true);

    try {
      const barcodeData: CreateBarcodeDto = {
        inventoryItemId: data?.inventoryItemId ?? 0,
        barcode,
        prodVarId: null,
        createdBy: user.userId,
      };

      const res = await fetch(
        `/api/barcode/item/${barcodeData.inventoryItemId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(barcodeData),
        },
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed saving barcode");
      }

      toast.success("Barcode saved!");

      setBarcode("");

      setShowView("view");

      mutateBarcode();
      mutate();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showView !== "add") return;
    if (addUse !== "scan") return;

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

    let stopped = false;

    let lastCode = "";
    let lastScanTime = 0;

    const startScanner = async () => {
      try {
        setCameraStatus("Requesting camera...");

        controlsRef.current?.stop();

        controlsRef.current = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: {
                ideal: cameraMode,
              },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current!,
          (result) => {
            if (stopped || !result) return;

            const code = result.getText().trim();

            const now = Date.now();

            if (!/^[A-Za-z0-9\-]{4,20}$/.test(code)) return;

            if (code === lastCode && now - lastScanTime < 1500) {
              return;
            }

            lastCode = code;
            lastScanTime = now;

            setBarcode(code);

            toast.success("Barcode detected");
          },
        );

        setCameraStatus(
          cameraMode === "environment"
            ? "Back camera active"
            : "Front camera active",
        );
      } catch (error) {
        console.error(error);

        setCameraStatus("Unable to access camera");
      }
    };

    startScanner();

    return () => {
      stopped = true;

      controlsRef.current?.stop();
    };
  }, [showView, addUse, cameraMode]);

  const switchCamera = () => {
    setCameraMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        {showView === "view" ? (
          <Button
            label="Add Barcode"
            size="sm"
            onClick={() => setShowView("add")}
          />
        ) : (
          <Button
            label="Back"
            size="sm"
            color="secondary"
            onClick={() => setShowView("view")}
          />
        )}
      </div>

      {/* VIEW */}
      {showView === "view" ? (
        <div className="flex flex-col gap-3">
          {barcodeResponse?.data?.length ? (
            barcodeResponse.data.map((item) => (
              <div
                key={item.barcodeId}
                className="
                flex items-center justify-between
                rounded-3xl
                border border-zinc-200
                bg-white
                px-5 py-4
                shadow-sm
              "
              >
                <div>
                  <div className="text-xs text-zinc-500">Barcode</div>

                  <div className="font-mono text-xl tracking-widest text-zinc-900">
                    {item.barcode}
                  </div>
                </div>

                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600">
                  Active
                </div>
              </div>
            ))
          ) : (
            <div
              className="
              flex min-h-[250px]
              flex-col items-center justify-center
              rounded-3xl
              border border-dashed border-zinc-200
              bg-zinc-50
            "
            >
              <ScanLine className="text-zinc-400" size={40} />

              <div className="mt-4 text-lg font-semibold">No Barcode Yet</div>

              <p className="mt-1 text-sm text-zinc-500">
                Scan or create a barcode
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Toggle */}
          <div className="flex rounded-2xl bg-zinc-100 p-1">
            <button
              onClick={() => setAddUse("scan")}
              className={`flex-1 rounded-xl py-3 text-sm font-medium transition-all ${
                addUse === "scan"
                  ? "bg-white shadow text-primary-1"
                  : "text-zinc-500"
              }`}
            >
              Scan Barcode
            </button>

            <button
              onClick={() => setAddUse("input")}
              className={`flex-1 rounded-xl py-3 text-sm font-medium transition-all ${
                addUse === "input"
                  ? "bg-white shadow text-primary-1"
                  : "text-zinc-500"
              }`}
            >
              Manual Input
            </button>
          </div>

          {/* Scanner */}
          {addUse === "scan" ? (
            <div
              className="
              overflow-hidden
              rounded-[28px]
              border border-zinc-800
              bg-zinc-950
              shadow-2xl
            "
            >
              {/* Top */}
              <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                <div>
                  <div className="text-lg font-semibold text-white">
                    Scan Barcode
                  </div>

                  <div className="text-xs text-zinc-400">{cameraStatus}</div>
                </div>

                <button
                  onClick={switchCamera}
                  className="
                  rounded-xl
                  bg-zinc-900
                  p-2
                  text-white
                  hover:bg-zinc-800
                "
                >
                  <RefreshCcw size={18} />
                </button>
              </div>

              {/* Video */}
              <div className="relative aspect-[4/5] bg-black sm:aspect-video">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  autoPlay
                />

                <div className="absolute inset-0 bg-black/30" />

                {/* Scanner Frame */}
                <div className="absolute inset-0 flex items-center justify-center p-5">
                  <div
                    className="
                    relative
                    h-[180px]
                    w-full
                    max-w-[320px]
                    rounded-3xl
                    border-2 border-white/80
                  "
                  >
                    {/* Scan line */}
                    <div
                      className="
                      absolute top-1/2 left-0
                      h-1 w-full
                      -translate-y-1/2
                      bg-green-400
                      shadow-[0_0_20px_rgba(74,222,128,0.9)]
                    "
                    />

                    {/* Corners */}
                    <div className="absolute -left-1 -top-1 h-10 w-10 border-l-4 border-t-4 border-green-400" />
                    <div className="absolute -right-1 -top-1 h-10 w-10 border-r-4 border-t-4 border-green-400" />
                    <div className="absolute -bottom-1 -left-1 h-10 w-10 border-b-4 border-l-4 border-green-400" />
                    <div className="absolute -bottom-1 -right-1 h-10 w-10 border-b-4 border-r-4 border-green-400" />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="space-y-4 bg-zinc-950 px-5 py-4">
                <div className="flex items-center gap-2 text-sm text-white">
                  {cameraStatus.includes("Unable") ? (
                    <CameraOff size={16} className="text-red-400" />
                  ) : (
                    <Camera size={16} className="text-green-400" />
                  )}

                  <span>
                    {cameraMode === "environment"
                      ? "Back Camera"
                      : "Front Camera"}
                  </span>
                </div>

                {barcode && (
                  <div
                    className="
                    rounded-2xl
                    bg-zinc-900
                    px-4 py-3
                  "
                  >
                    <div className="text-xs text-zinc-400">
                      Detected Barcode
                    </div>

                    <div className="mt-1 font-mono text-xl tracking-widest text-white">
                      {barcode}
                    </div>
                  </div>
                )}

                <div className="text-xs text-zinc-500">
                  Supports EAN, UPC, Code128, QR
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-zinc-200 bg-white p-6">
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Barcode
              </label>

              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Enter barcode"
                className="
                w-full rounded-2xl
                border border-zinc-200
                px-4 py-4
                text-lg
                outline-none
                transition-all
                focus:border-primary-1
                focus:ring-4
                focus:ring-primary-1/10
              "
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              label="Cancel"
              color="secondary"
              disabled={isLoading}
              onClick={onCancel}
            />

            <Button
              label="Save Barcode"
              loading={isLoading}
              disabled={!barcode}
              onClick={handleSaveBarcode}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default BarcodeComponent;
