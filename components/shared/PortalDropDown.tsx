import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type PortalDropdownProps = {
  trigger: React.ReactNode;
  children: React.ReactNode;
};

export function PortalDropdown({ trigger, children }: PortalDropdownProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();

    setPos({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, [open]);

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {trigger}

      {open &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              zIndex: 9999,
            }}
            className="bg-white border border-gray-300 rounded shadow-lg max-h-40 overflow-y-auto"
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  );
}
