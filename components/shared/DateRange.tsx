import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronUp, ChevronDown } from "lucide-react";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { createPortal } from "react-dom";

interface DateRangeProps {
  onDateRangeChange?: (range: { from: string; to: string }) => void;
  isRounded?: boolean;
}

const DateRange: React.FC<DateRangeProps> = ({
  onDateRangeChange,
  isRounded = true,
}) => {
  const [isShow, setIsShow] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();

    const dropdownWidth = 320;
    const dropdownHeight = 340;
    const margin = 12;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const shouldOpenUp =
      spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;

    const left = Math.min(
      Math.max(margin, rect.left),
      window.innerWidth - dropdownWidth - margin,
    );

    setPosition({
      top: shouldOpenUp ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
      left,
    });
  };

  const toggleDropdown = () => {
    updatePosition();
    setIsShow((prev) => !prev);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    const to = params.get("to");

    if (from) setFromDate(from);
    if (to) setToDate(to);
  }, []);

  useEffect(() => {
    if (fromDate && toDate) {
      onDateRangeChange?.({ from: fromDate, to: toDate });
    }
  }, [fromDate, toDate, onDateRangeChange]);

  useEffect(() => {
    if (!isShow) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }

      setIsShow(false);
    };

    const handleUpdatePosition = () => updatePosition();

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleUpdatePosition);
    window.addEventListener("scroll", handleUpdatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleUpdatePosition);
      window.removeEventListener("scroll", handleUpdatePosition, true);
    };
  }, [isShow]);

  const setToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setFromDate(today);
    setToDate(today);
    setIsShow(false);
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = yesterday.toISOString().split("T")[0];

    setFromDate(dateStr);
    setToDate(dateStr);
    setIsShow(false);
  };

  const setPastMonth = () => {
    const today = new Date();
    const pastMonth = new Date();

    pastMonth.setMonth(today.getMonth() - 1);

    setFromDate(pastMonth.toISOString().split("T")[0]);
    setToDate(today.toISOString().split("T")[0]);
    setIsShow(false);
  };

  const setPastThreeMonths = () => {
    const today = new Date();
    const pastThreeMonths = new Date();

    pastThreeMonths.setMonth(today.getMonth() - 3);

    setFromDate(pastThreeMonths.toISOString().split("T")[0]);
    setToDate(today.toISOString().split("T")[0]);
    setIsShow(false);
  };

  const clearDates = () => {
    setFromDate("");
    setToDate("");
    onDateRangeChange?.({ from: "", to: "" });
    setIsShow(false);
  };

  const getDisplayText = () => {
    if (!fromDate && !toDate) return "Any Date";
    if (fromDate === toDate) return formatDateToWords(fromDate);
    return `${formatDateToWords(fromDate)} to ${formatDateToWords(toDate)}`;
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleDropdown}
        className={`
    flex min-w-[80px] items-center gap-2
    ${isRounded ? `rounded-xl` : `rounded-sm`} border px-2 py-1
    text-[8px] 2xl:text-xs font-medium  transition
    2xl:px-3 2xl:py-1.5
    ${
      isShow
        ? "border-primary-1 bg-primary-1 text-white"
        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
    }
  `}
      >
        <Calendar className="h-3 w-3 shrink-0 2xl:h-4 2xl:w-4" />

        <span className="flex-1 truncate text-left">{getDisplayText()}</span>

        {isShow ? (
          <ChevronUp className="h-3 w-3 shrink-0 2xl:h-4 2xl:w-4" />
        ) : (
          <ChevronDown className="h-3 w-3 shrink-0 2xl:h-4 2xl:w-4" />
        )}
      </button>

      {isShow &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              zIndex: 9999,
            }}
            className="
  w-80
  max-h-[90vh]
  overflow-y-auto
  rounded-2xl
  border border-gray-100
  bg-white
  p-4
  shadow-2xl
"
          >
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                label="From"
                sizes="xs"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <Input
                type="date"
                label="To"
                sizes="xs"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <Button
                size="xs"
                label="Today"
                color="secondary"
                onClick={setToday}
                className="justify-center"
              />
              <Button
                size="xs"
                label="Yesterday"
                color="secondary"
                onClick={setYesterday}
                className="justify-center"
              />
              <Button
                size="xs"
                label="Past Month"
                color="secondary"
                onClick={setPastMonth}
                className="justify-center"
              />
              <Button
                size="xs"
                label="Past 3 Months"
                color="secondary"
                onClick={setPastThreeMonths}
                className="justify-center"
              />
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                size="xs"
                label="Clear"
                color="secondary"
                onClick={clearDates}
                className="flex-1 justify-center"
              />
              <Button
                size="xs"
                label="Apply"
                onClick={() => setIsShow(false)}
                className="flex-1 justify-center"
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default DateRange;
