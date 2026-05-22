import { Loader2 } from "lucide-react";
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

interface IconButtonProps {
  icon?: React.ReactNode;
  onClick: () => void;
  label: string;
  bg: string;
  isRounded?: boolean;
  showLabel?: boolean;
  disable?: boolean;
  loading?: boolean;
}

const colorMap: Record<string, string> = {
  gray: "text-gray-600 hover:bg-gray-200",
  green: "text-green-600 hover:bg-green-200",
  red: "text-red-600 hover:bg-red-200",
  blue: "text-blue-600 hover:bg-blue-200",
  yellow: "text-yellow-600 hover:bg-yellow-200",
  primary: "text-primary-1 hover:primary-1-hover",
  nobg: "text-black hover:bg-gray-300",
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      onClick,
      label,
      bg,
      isRounded = true,
      showLabel = true,
      disable = false,
      loading = false,
    },
    ref,
  ) => {
    const btnRef = useRef<HTMLButtonElement>(null);

    useImperativeHandle(ref, () => btnRef.current as HTMLButtonElement);

    const [showTooltip, setShowTooltip] = useState(false);

    const [pos, setPos] = useState({
      top: 0,
      left: 0,
    });

    const handleEnter = () => {
      if (disable) return;

      const rect = btnRef.current?.getBoundingClientRect();

      if (rect) {
        setPos({
          top: rect.top - 30,
          left: rect.left + rect.width / 2,
        });
      }

      setShowTooltip(true);
    };

    const handleLeave = () => setShowTooltip(false);

    return (
      <>
        <div className="inline-block">
          <button
            ref={btnRef}
            onClick={(e) => {
              e.stopPropagation();

              if (!disable) onClick();
            }}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            className={`
              px-1 py-0.5 xl:px-2 xl:py-1
              border border-gray-200
              flex items-center gap-2
              ${isRounded ? "rounded-lg" : ""}
              ${
                disable
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : colorMap[bg] || ""
              }
            `}
            disabled={disable || loading}
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin text-current" />
            ) : (
              icon
            )}
          </button>
        </div>

        {showTooltip &&
          showLabel &&
          !disable &&
          createPortal(
            <span
              className="
                fixed z-[9999]
                hidden xl:inline
                rounded bg-gray-800
                px-2 py-1
                text-xs text-white
                pointer-events-none
                transition-opacity duration-200
              "
              style={{
                top: `${pos.top}px`,
                left: `${pos.left}px`,
                transform: "translateX(-50%)",
              }}
            >
              {label}
            </span>,
            document.body,
          )}
      </>
    );
  },
);

IconButton.displayName = "IconButton";

export default IconButton;
