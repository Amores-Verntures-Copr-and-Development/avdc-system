import React, { ReactNode, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { LucideIcon, X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  leftTitleContent?: React.ReactNode;
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
  showCloseButton = true,
  className = "",
  overlayClassName = "",
  modalDetails,
  leadingIcon: Icon,
  hasPadding = true,
  leftTitleContent,
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
            "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
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
            "width=device-width, initial-scale=1.0",
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

  // const positionClasses = {
  //   center: "items-center justify-center",
  //   left: "items-center justify-start",
  //   right: "items-center justify-end",
  //   top: "items-start justify-center",
  //   bottom: "items-end justify-center",
  // };

  // Mobile-specific styles
  const mobileOverlayClass = `
  fixed inset-0 z-50 flex
  items-center
  justify-center
  bg-black/20
  px-4
`;

  const mobileModalClass = `
  bg-background-white
  rounded-lg
  shadow-2xl
  w-full
  max-h-[85dvh]
  overflow-hidden
  flex
  flex-col
  ${sizeClasses[size]}
  ${className}
`;

  if (!isOpen || !portalRoot) return null;

  return ReactDOM.createPortal(
    <div
      onClick={(e) => {
        e.stopPropagation();
      }}
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
        onClick={(e) => e.stopPropagation()}
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
          <div
            className={`flex flex-col  p-2 2xl:p-4 border-b bg-white border-gray-200 shrink-0`}
          >
            <div
              className={`flex justify-between items-center  ${
                title && showCloseButton ? "justify-between" : "justify-end"
              }`}
            >
              {title && (
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 xl:gap-2">
                    {Icon && <Icon className="w-5 h-5 xl:w-7 xl:h-7" />}
                    <h2
                      id="modal-title"
                      className="text-xs 2xl:text-xl font-bold text-black"
                    >
                      {title}
                    </h2>
                  </div>
                </div>
              )}
              {!showCloseButton && leftTitleContent}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-gray-700 transition-color"
                  aria-label="Close modal"
                >
                  <X className="w-3 h-3 xl:w-6 xl:h-6 text-black hover:text-white" />
                </button>
              )}
            </div>
            {subtitle && (
              <span className="text-gray-400 text-[8px] 2xl:text-sm">
                {subtitle}
              </span>
            )}
            {modalDetails && <div className="flex">{modalDetails}</div>}
          </div>
        )}

        {/* Content Area (scrollable) - Fixed height for mobile */}
        <div
          className={`flex-1 overflow-y-auto overscroll-contain ${
            hasPadding ? "p-4" : ""
          }`}
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
    portalRoot,
  );
};

export default Modal;
