import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { formatPeso } from "@/utils/formatPeso";

interface SupplierCellProps {
  row: DisplayInventoryItems;
  onAddSupplier: (row: DisplayInventoryItems) => void;
}

const SupplierCell = ({ row, onAddSupplier }: SupplierCellProps) => {
  const suppliers = (row.itemSuppliers || []).filter((s) => s !== null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  const show = () => {
    clearCloseTimer();
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 200),
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => () => clearCloseTimer(), []);

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={scheduleClose}
      onClick={show}
    >
      <select
        className="border border-gray-300 rounded px-1 py-0.5 xl:px-2 xl:py-1 w-full text-[10px] xl:text-xs bg-gray-50 appearance-none cursor-pointer"
        disabled
      >
        <option value="">
          {suppliers.length > 0
            ? `Suppliers (${suppliers.length})`
            : "No Supplier"}
        </option>
      </select>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              zIndex: 9999,
            }}
            className="bg-white border border-gray-300 rounded shadow-lg text-[10px] xl:text-xs"
            onMouseEnter={clearCloseTimer}
            onMouseLeave={scheduleClose}
          >
            {suppliers.length > 0 ? (
              <div className="max-h-32 overflow-y-auto">
                {suppliers.map((supplier, index) => (
                  <div
                    key={index}
                    className="px-2 py-1 hover:bg-gray-100 cursor-default border-b border-gray-100 last:border-b-0"
                  >
                    {`${supplier.suppName} (${formatPeso(supplier.suppItemPrice)})`}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-2 py-1.5 text-gray-500">
                No supplier assigned
              </div>
            )}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-blue-600 hover:bg-blue-50 border-t border-gray-200 font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onAddSupplier(row);
              }}
            >
              <Plus size={12} />
              Add to Supplier
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default SupplierCell;
