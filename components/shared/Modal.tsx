import React, { ReactNode, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { LucideIcon, X } from "lucide-react";

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
  const [isMobile, setIsMobile] = useState(false);

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

    // Check if mobile/tablet
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024); // Tablet and mobile
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      if (portalRoot && portalRoot.childElementCount === 0) {
        portalRoot.remove();
      }
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.classList.add("overflow-hidden");

      // Prevent viewport resize on mobile
      if (isMobile) {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute(
            "content",
            "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
          );
        }
      }
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.classList.remove("overflow-hidden");

      // Restore viewport
      if (isMobile) {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute(
            "content",
            "width=device-width, initial-scale=1.0"
          );
        }
      }
    };
  }, [isOpen, onClose, isMobile]);

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

  // Mobile-specific styles
  const mobileOverlayClass = isMobile
    ? "fixed inset-0 z-50 flex p-4 bg-black/20 items-center justify-center"
    : `fixed inset-0 z-50 flex p-4 bg-black/20 ${positionClasses[position]}`;

  const mobileModalClass = isMobile
    ? `bg-background-white rounded-lg shadow-2xl overflow-hidden w-full max-h-[90dvh] flex flex-col ${sizeClasses[size]} ${className}`
    : `bg-background-white rounded-lg shadow-2xl overflow-hidden w-full flex flex-col ${sizeClasses[size]} ${className}`;

  if (!isOpen || !portalRoot) return null;

  return ReactDOM.createPortal(
    <div
      className={`${mobileOverlayClass} ${overlayClassName}`}
      style={
        isMobile
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
            }
          : undefined
      }
    >
      <div
        ref={modalRef}
        className={mobileModalClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        style={
          isMobile
            ? {
                maxHeight: "90dvh", // Use dynamic viewport height
                overflow: "hidden",
              }
            : undefined
        }
      >
        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="flex flex-col justify-between p-2 xl:p-4 border-b bg-white border-gray-200 shrink-0">
            <div className="flex justify-between">
              {title && (
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    {Icon && <Icon size={30} />}
                    <h2
                      id="modal-title"
                      className="text-sm xl:text-xl font-bold text-black"
                    >
                      {title}
                    </h2>
                  </div>
                </div>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-gray-700 transition-color"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4 xl:w-6 xl:h-6 text-black hover:text-white" />
                </button>
              )}
            </div>
            {subtitle && (
              <span className="text-gray-400 text-[9px] xl:text-sm">
                {subtitle}
              </span>
            )}
            {modalDetails && <div className="flex">{modalDetails}</div>}
          </div>
        )}

        {/* Content Area (scrollable) - Fixed height for mobile */}
        <div
          className={`flex-1 overflow-y-auto ${hasPadding ? "p-4" : ""}`}
          style={
            isMobile
              ? {
                  WebkitOverflowScrolling: "touch",
                  overflowY: "auto",
                }
              : undefined
          }
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-gray-200 p-4 bg-white shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    portalRoot
  );
};

export default Modal;
