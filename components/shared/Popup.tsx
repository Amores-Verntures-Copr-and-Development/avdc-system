import React, { useEffect, useState, useRef } from "react";
import clsx from "clsx";

import { LucideIcon, X } from "lucide-react";

interface PopupProps {
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  position?: "left" | "right" | "top" | "bottom";
  background?: string;
  children: React.ReactNode;
  subtitle?: string;
  icon?: LucideIcon;
  closeOnClickOutside?: boolean; // New prop to control this behavior
}

const Popup: React.FC<PopupProps> = ({
  title,
  icon: Icon,
  isOpen,
  onClose,
  position = "right",
  background = "bg-black bg-opacity-40 backdrop-blur-sm",
  children,
  subtitle,
  closeOnClickOutside = true, // Default to true
}) => {
  const [show, setShow] = useState(isOpen);
  const popupRef = useRef<HTMLDivElement>(null);

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      setShow(true);
    } else {
      // Delay unmount until animation finishes
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen || !closeOnClickOutside) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // Add event listener with a slight delay to avoid immediate triggering
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, closeOnClickOutside]);

  if (!show) return null;

  const positionClasses = {
    left: `left-0 top-0 h-full w-full max-w-[22rem] sm:max-w-sm lg:max-w-md transform transition-transform duration-300 ease-in-out ${
      isOpen ? "translate-x-0" : "-translate-x-full"
    }`,
    right: `right-0 top-0 h-full w-full max-w-[22rem] sm:max-w-sm lg:max-w-md xl:max-w-lg transform transition-transform duration-300 ease-in-out ${
      isOpen ? "translate-x-0" : "translate-x-full"
    }`,
    top: `top-0 left-0 w-full h-[70dvh] sm:h-72 transform transition-transform duration-300 ease-in-out ${
      isOpen ? "translate-y-0" : "-translate-y-full"
    }`,
    bottom: `bottom-0 left-0 w-full h-[70dvh] sm:h-72 transform transition-transform duration-300 ease-in-out ${
      isOpen ? "translate-y-0" : "translate-y-full"
    }`,
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300",
        isOpen ? "opacity-100" : "opacity-0",
        background,
      )}
    >
      {/* Clickable overlay - alternative approach */}
      {closeOnClickOutside && (
        <div
          className="absolute inset-0"
          onClick={(e) => {
            e.stopPropagation(); // Prevent click from bubbling
          }}
          aria-hidden="true"
        />
      )}

      <div
        ref={popupRef}
        className={clsx(
          "fixed bg-white shadow-lg rounded-lg flex flex-col z-10",
          positionClasses[position],
        )}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 3xl:p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 bg-blue-50 rounded-lg">
                <Icon className="w-3 h-3 xl:w-5 xl:h-5 text-blue-600" />
              </div>
            )}
            <div>
              <h2 className="text-xs xl:text-lg font-semibold text-gray-900">
                {title}
              </h2>
              <p className="text-xs xl:text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close popup"
          >
            <X className="w-5 h-5 xl:w-5 xl:h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 xl:p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Popup;
