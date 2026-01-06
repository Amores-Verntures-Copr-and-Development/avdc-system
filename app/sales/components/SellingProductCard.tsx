import React from "react";

const SellingProductCard = () => {
  return (
    <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      {/* Rank */}
      <div className="flex-shrink-0 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
        1
      </div>

      {/* Product Name & Category */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm">Coke</div>
        <div className="text-xs text-gray-500">Beverages</div>
      </div>

      {/* Units Sold */}
      <div className="text-right">
        <div className="text-sm font-semibold text-gray-900">100</div>
        <div className="text-xs text-gray-500">sold</div>
      </div>

      {/* Revenue */}
      <div className="text-right">
        <div className="text-sm font-semibold text-gray-900">$1,000</div>
        <div className="text-xs text-green-600">↑ 15%</div>
      </div>
    </div>
  );
};

export default SellingProductCard;
