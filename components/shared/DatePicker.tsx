import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";

const DateRangePicker = () => {
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);

  return (
    <div className="flex items-center border border-gray-500 rounded px-3 py-1 text-sm">
      <DatePicker
        selectsRange
        startDate={startDate}
        endDate={endDate}
        onChange={(dates: [Date | null, Date | null]) => {
          const [start, end] = dates;
          setStartDate(start);
          setEndDate(end);
        }}
        dateFormat="MMM d, yyyy"
        placeholderText="Select date range"
        className="outline-none text-gray-700 w-full cursor-pointer"
      />
      <Calendar size={16} className="ml-2 text-gray-500" />
    </div>
  );
};

export default DateRangePicker;
