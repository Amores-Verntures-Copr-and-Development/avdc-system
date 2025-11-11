import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

interface PopupProps {
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  position?: "left" | "right" | "top" | "bottom";
  background?: string;
  children: React.ReactNode;
  subtitle?: string;
}

const Popup: React.FC<PopupProps> = ({
  title,
  isOpen,
  onClose,
  position = "right",
  background = "bg-black bg-opacity-40 backdrop-blur-sm",
  children,
  subtitle,
}) => {
  const [show, setShow] = useState(isOpen);

  // Handle mount/unmount for animation
  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      // delay unmount until animation finishes
      const timer = setTimeout(() => setShow(false), 300); // duration-300
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!show) return null;

  const positionClasses = {
    left: `left-0 top-0 h-full w-96 transform transition-transform duration-300 ease-in-out ${
      isOpen ? "translate-x-0" : "-translate-x-full"
    }`,
    right: `right-0 top-0 h-full w-96 transform transition-transform duration-300 ease-in-out ${
      isOpen ? "translate-x-0" : "translate-x-full"
    }`,
    top: `top-0 left-0 w-full h-72 transform transition-transform duration-300 ease-in-out ${
      isOpen ? "translate-y-0" : "-translate-y-full"
    }`,
    bottom: `bottom-0 left-0 w-full h-72 transform transition-transform duration-300 ease-in-out ${
      isOpen ? "translate-y-0" : "translate-y-full"
    }`,
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300",
        isOpen ? "opacity-100" : "opacity-0",
        background
      )}
    >
      <div
        className={clsx(
          "fixed bg-white shadow-lg rounded-lg flex flex-col",
          positionClasses[position]
        )}
      >
        {/* Header */}
        <div className="flex flex-col  p-4 border-b border-gray-200">
          <div className="flex  justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className=" p-1 rounded-full hover:bg-gray-700 transition-color"
            >
              <X className="w-5 h-5 hover:text-white" />
            </button>
          </div>
          <span className="text-xs text-gray-500">{subtitle}</span>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Popup;
