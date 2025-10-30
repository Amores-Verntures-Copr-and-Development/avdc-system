import { ArrowRight, Calendar } from "lucide-react";
import React from "react";

const DashboardCard = () => {
  return (
    <div className="flex flex-col justify-between p-4 border rounded-2xl shadow-sm border-gray-200 bg-white ">
      {/* Top Section */}
      <div className="flex items-center gap-3">
        <div className="bg-emerald-600 p-2 rounded-lg flex items-center justify-center">
          <Calendar className="text-white w-5 h-5" />
        </div>
        <div className="flex flex-col align-middle items-start">
          <span className="block text-lg font-semibold text-gray-900">560</span>
          <span className="text-sm text-gray-500">Attendance</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-3"></div>

      {/* Footer */}
      <div className="flex items-center justify-between text-gray-600 hover:text-gray-900 cursor-pointer">
        <span className="text-sm font-medium">View details</span>
        <ArrowRight size={15} />
      </div>
    </div>
  );
};

export default DashboardCard;
