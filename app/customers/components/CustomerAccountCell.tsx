import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DisplayCustomerDto } from "@/dtos/customer.dto";
import { formatDateToWords } from "@/utils/formatDateToWords";

interface CustomerAccountCellProps {
  row: DisplayCustomerDto;
}

const CustomerAccountCell = ({ row }: CustomerAccountCellProps) => {
  const hasAccount = Boolean(row.cusAccId);
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
      width: Math.max(rect.width, 180),
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
      className="relative inline-block"
      onMouseEnter={show}
      onMouseLeave={scheduleClose}
      onClick={show}
    >
      <span
        className={`cursor-pointer inline-flex items-center px-1.5 py-0.5 2xl:px-3 2xl:py-1 rounded-full text-[9px] xl:text-[10px] 2xl:text-xs font-semibold ${
          hasAccount
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {hasAccount ? "Online Access" : "No Access"}
      </span>

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
            {hasAccount ? (
              <div className="px-2 py-1.5 space-y-1">
                <div>
                  <span className="text-gray-500">Email:</span>{" "}
                  {row.accountEmail}
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>{" "}
                  {row.cusAccStatus}
                </div>
                <div>
                  <span className="text-gray-500">Email Verified:</span>{" "}
                  {row.emailVerified ? "Yes" : "No"}
                </div>
                <div>
                  <span className="text-gray-500">Since:</span>{" "}
                  {formatDateToWords(row.accountCreatedAt ?? "")}
                </div>
              </div>
            ) : (
              <div className="px-2 py-1.5 text-gray-500">
                No online account for this customer
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
};

export default CustomerAccountCell;
