import React, { ReactNode, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { LucideIcon, X } from "lucide-react";
import { Icon } from "next/dist/lib/metadata/types/metadata-types";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  position?: "center" | "left" | "right" | "top" | "bottom";
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
  modalDetails?: ReactNode;
  leadingIcon?: LucideIcon;
  hasPadding?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  header,
  footer,
  children,
  subtitle,
  size = "md",
  position = "center",
  showCloseButton = true,
  className = "",
  overlayClassName = "",
  modalDetails,
  leadingIcon: Icon,
  hasPadding = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      let root = document.getElementById("modal-root");
      if (!root) {
        root = document.createElement("div");
        root.id = "modal-root";
        document.body.appendChild(root);
      }
      setPortalRoot(root);
    }

    return () => {
      if (portalRoot && portalRoot.childElementCount === 0) {
        portalRoot.remove();
      }
    };
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.classList.add("overflow-hidden");
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-7xl",
    full: "w-full h-full",
  };

  const positionClasses = {
    center: "items-center justify-center",
    left: "items-center justify-start",
    right: "items-center justify-end",
    top: "items-start justify-center",
    bottom: "items-end justify-center",
  };

  if (!isOpen || !portalRoot) return null;

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 z-50 flex p-4 bg-black/20 ${positionClasses[position]} ${overlayClassName}`}
    >
      <div
        ref={modalRef}
        className={`bg-background-white rounded-lg shadow-2xl overflow-hidden w-full ${sizeClasses[size]} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {(title || showCloseButton) && (
          <div>
            <div className="flex flex-col  justify-between p-4 border-b bg-white border-gray-200">
              <div className="flex justify-between">
                {title && (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      {Icon && <Icon size={30} />}
                      <h2
                        id="modal-title"
                        className="text-xl font-bold text-black"
                      >
                        {title}
                      </h2>
                    </div>
                    <span className="text-gray-400 text-sm">{subtitle}</span>
                  </div>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-gray-700 transition-color"
                    aria-label="Close modal"
                  >
                    <X className="w-6 h-6 text-black hover:text-white" />
                  </button>
                )}
              </div>
              <div className="flex"> {modalDetails}</div>
            </div>
          </div>
        )}
        <div className=" max-h-[80vh]">
          {/* Header */}
          {header && <div className="border-b">{header}</div>}
          <div className={`overflow-y-auto ${hasPadding ? "p-4" : ""}`}>
            {children}
          </div>
          <div>{header}</div>
        </div>
        {/* Footer */}
      </div>
    </div>,
    portalRoot
  );
};

export default Modal;
