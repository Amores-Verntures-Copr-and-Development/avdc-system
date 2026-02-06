import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronUp, ChevronDown } from "lucide-react";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { formatDateToWords } from "@/utils/formatDateToWords";

interface DateRangeProps {
  onDateRangeChange?: (range: { from: string; to: string }) => void;
}

const DateRange: React.FC<DateRangeProps> = ({ onDateRangeChange }) => {
  const [isShow, setIsShow] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsShow(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    const to = params.get("to");

    if (from) setFromDate(from);
    if (to) setToDate(to);
  }, []);
  // Handle date range changes
  useEffect(() => {
    if (fromDate && toDate && onDateRangeChange) {
      onDateRangeChange({ from: fromDate, to: toDate });
    }
  }, [fromDate, toDate, onDateRangeChange]);

  // Quick date range functions
  const setToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setFromDate(today);
    setToDate(today);
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];
    setFromDate(dateStr);
    setToDate(dateStr);
  };

  const setPastMonth = () => {
    const today = new Date();
    const pastMonth = new Date();
    pastMonth.setMonth(today.getMonth() - 1);

    setFromDate(pastMonth.toISOString().split("T")[0]);
    setToDate(today.toISOString().split("T")[0]);
  };

  const setPastThreeMonths = () => {
    const today = new Date();
    const pastThreeMonths = new Date();
    pastThreeMonths.setMonth(today.getMonth() - 3);

    setFromDate(pastThreeMonths.toISOString().split("T")[0]);
    setToDate(today.toISOString().split("T")[0]);
  };

  const clearDates = () => {
    setFromDate("");
    setToDate("");
    if (onDateRangeChange) {
      onDateRangeChange({ from: "", to: "" });
    }
  };

  // Get display text for the button
  const getDisplayText = () => {
    if (!fromDate && !toDate) return "Any Date";
    if (fromDate === toDate) return formatDateToWords(fromDate);
    return `${formatDateToWords(fromDate)} to ${formatDateToWords(toDate)}`;
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsShow((prev) => !prev)}
        className={`flex items-center gap-2 px-1.5 py-1 2xl:px-3 2xl:py-1.5 rounded-md border border-gray-300 ${
          isShow ? "!bg-primary-1" : "bg-white"
        } shadow-sm hover:bg-gray-50 transition-colors duration-200 min-w-[140px]`}
      >
        <Calendar
          className={`w-2 h-2 2xl:w-4 2xl:h-4 text-gray-600         ${
            isShow ? "!text-white" : "text-gray-600"
          } `}
        />
        <span
          className={`text-[8px] 2xl:text-xs 3xl:text-sm ${
            isShow ? "!text-white" : "text-gray-700"
          } font-medium flex-1 text-left`}
        >
          {getDisplayText()}
        </span>

        {isShow ? (
          <ChevronUp
            className={`w-2 h-2 2xl:w-4 2xl:h-4 text-gray-600         ${
              isShow ? "!text-white" : "text-gray-600"
            } `}
          />
        ) : (
          <ChevronDown
            className={`w-2 h-2 2xl:w-4 2xl:h-4 text-gray-600         ${
              isShow ? "!text-white" : "text-gray-600"
            } `}
          />
        )}
      </button>

      {isShow && (
        <div className="absolute z-50 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 space-y-4">
          {/* Date Inputs */}
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

          {/* Quick Selection Buttons */}
          <div className="grid grid-cols-1 gap-2">
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

          {/* Action Buttons */}
          <div className="flex justify-between  gap-2 ">
            <Button
              size="xs"
              label="Clear"
              color="secondary"
              onClick={clearDates}
            />
            <Button size="xs" label="Apply" onClick={() => setIsShow(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRange;
