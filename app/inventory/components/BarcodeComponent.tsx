import Button from "@/components/shared/Button";
import { CreateBarcodeDto } from "@/dtos/barcode.dto";
import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { useSession } from "@/hooks/useSession";
import { ApiResponse } from "@/types/api";
import { Barcodes } from "@/types/barcode";
import { fetcher } from "@/utils/fetcher";
import { IScannerControls,BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat,  DecodeHintType } from "@zxing/library";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

interface BarcodeComponentProps {
  data: DisplayInventoryItems | null;
  onCancel: () => void;
  mutate: () => void;
}

const BarcodeComponent = ({
  data,
  onCancel,
  mutate,
}: BarcodeComponentProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showView, setShowView] = useState<"view" | "add" | "preview">("view");
  const { user } = useSession();
  const [addUse, setAddUse] = useState<"scan" | "input">("scan");
  const { data: barcodeResponse, mutate: mutateBarcode } = useSWR<
    ApiResponse<Barcodes[]>
  >(data ? `/api/barcode/item/${data.inventoryItemId}` : null, fetcher);

  const [barcode, setBarcode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveBarcode = async () => {
    setIsLoading(true);

    if (!user) {
      toast.error("No user found!");
      return;
    }
    try {
      const barcodeData: CreateBarcodeDto = {
        inventoryItemId: data?.inventoryItemId ?? 0,
        barcode,
        prodVarId: null,
        createdBy: user.userId,
      };
      console.log({ barcodeData });

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
        throw new Error(result.message || "Failed to save barcode!");
      }

      toast.success("Barcode saved successfully!");
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
    if (showView !== "add" || addUse !== "scan") return;

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

    const start = async () => {
      try {
        const video = videoRef.current;

        if (!video) {
          console.error("Video element not ready");
          return;
        }

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
          video,
          (result) => {
            if (stopped || !result) return;

            const code = result.getText().trim();
            const now = Date.now();

            // ignore QR links/text
            if (!/^\d{8,14}$/.test(code)) return;

            // prevent duplicate scans
            if (code === lastCode && now - lastScanTime < 1500) return;

            lastCode = code;
            lastScanTime = now;

            setBarcode(code);
          },
        );
      } catch (error) {
        console.error("Barcode scanner error:", error);
      }
    };

    const timer = setTimeout(start, 300);

    return () => {
      stopped = true;
      clearTimeout(timer);
      controls?.stop();
    };
  }, [showView, addUse]);
  return (
    <div className="flex flex-col gap-4">
      {/* HEADER */}
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
            barcodeResponse.data.map((barcode) => (
              <div
                key={barcode.barcodeId}
                className="
                flex items-center justify-between
                rounded-2xl border border-gray-100
                bg-gray-50
                px-4 py-3
              "
              >
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Barcode</span>

                  <span className="font-mono text-lg tracking-wider text-gray-900">
                    {barcode.barcode}
                  </span>
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
              rounded-3xl border border-dashed border-gray-200
              bg-gray-50
              text-center
            "
            >
              <div className="text-lg font-semibold text-gray-700">
                No Barcodes
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Create or scan a barcode
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* SCAN / INPUT TOGGLE */}
          <div className="flex rounded-2xl bg-gray-100 p-1">
            <button
              onClick={() => setAddUse("scan")}
              className={`
              flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-all
              ${
                addUse === "scan"
                  ? "bg-white shadow text-primary-1"
                  : "text-gray-500"
              }
            `}
            >
              Scan Barcode
            </button>

            <button
              onClick={() => setAddUse("input")}
              className={`
              flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-all
              ${
                addUse === "input"
                  ? "bg-white shadow text-primary-1"
                  : "text-gray-500"
              }
            `}
            >
              Manual Input
            </button>
          </div>

          {/* CONTENT */}
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-black">
            {addUse === "scan" ? (
              <div className="relative aspect-video">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  autoPlay
                />

                {/* OVERLAY */}
                <div className="pointer-events-none absolute inset-0 bg-black/20" />

                {/* FRAME */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-[220px] w-[70%] overflow-hidden rounded-3xl border-4 border-white/90">
                    {/* CORNERS */}
                    <div className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-primary-1" />
                    <div className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-primary-1" />
                    <div className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-primary-1" />
                    <div className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-primary-1" />

                    {/* SCAN LINE */}
                    <div className="absolute left-0 top-1/2 h-1 w-full bg-green-400 animate-pulse" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Barcode
                </label>

                <input
                  type="text"
                  placeholder="Enter barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="
                  w-full rounded-2xl border border-gray-200
                  px-4 py-3
                  text-lg
                  outline-none
                  transition-all
                  focus:border-primary-1
                  focus:ring-4 focus:ring-primary-1/10
                "
                />
              </div>
            )}
          </div>

          {/* PREVIEW */}
          {barcode !== "" && (
            <div className="rounded-2xl bg-primary-1/5 border border-primary-1/10 p-4">
              <div className="text-xs text-primary-1 font-medium">
                Detected Barcode
              </div>

              <div className="mt-1 font-mono text-xl tracking-widest text-gray-900">
                {barcode}
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex justify-end gap-3">
            <Button
              label="Cancel"
              color="secondary"
              onClick={onCancel}
              disabled={isLoading}
            />

            <Button
              label="Save Barcode"
              disabled={barcode === ""}
              loading={isLoading}
              onClick={handleSaveBarcode}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default BarcodeComponent;
