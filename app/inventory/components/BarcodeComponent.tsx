import Button from "@/components/shared/Button";
import { CreateBarcodeDto } from "@/dtos/barcode.dto";
import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { ApiResponse } from "@/types/api";
import { Barcodes } from "@/types/barcode";
import { fetcher } from "@/utils/fetcher";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import React, { useEffect, useRef, useState } from "react";
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

  const [addUse, setAddUse] = useState<"scan" | "input">("scan");
  const { data: barcodeResponse } = useSWR<ApiResponse<Barcodes[]>>(
    data ? `/api/barcode/item/${data.itemId}` : null,
    fetcher,
  );

  const [form, setForm] = useState<CreateBarcodeDto>({
    inventoryItemId: data?.inventoryItemId ?? 0,
    barcode: "",
    prodVarId: null,
    createdBy: 0,
  });

  useEffect(() => {
    if (showView !== "add" || addUse !== "scan") {
      return;
    }

    const reader = new BrowserMultiFormatReader();

    let controls: IScannerControls | undefined;

    let lastCode = "";
    let lastScanTime = 0;

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

              const now = Date.now();

              if (code !== lastCode || now - lastScanTime > 1500) {
                lastCode = code;
                lastScanTime = now;

                setForm((prev) => ({
                  ...prev,
                  barcode: code,
                }));
              }
            }
          },
        );
      } catch (error) {
        console.error("Barcode scanner error:", error);
      }
    }

    start();

    return () => {
      controls?.stop();
    };
  }, [showView, addUse]);
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm border border-gray-100">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Barcode Manager
          </h2>

          <p className="text-sm text-gray-500">
            Manage inventory item barcodes
          </p>
        </div>

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
                  value={form.barcode}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      barcode: e.target.value,
                    }))
                  }
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
          {form.barcode && (
            <div className="rounded-2xl bg-primary-1/5 border border-primary-1/10 p-4">
              <div className="text-xs text-primary-1 font-medium">
                Detected Barcode
              </div>

              <div className="mt-1 font-mono text-xl tracking-widest text-gray-900">
                {form.barcode}
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex justify-end gap-3">
            <Button label="Cancel" color="secondary" onClick={onCancel} />

            <Button label="Save Barcode" disabled={!form.barcode} />
          </div>
        </>
      )}
    </div>
  );
};

export default BarcodeComponent;
