import { Package, MapPin, ChevronRight } from "lucide-react";
import { DisplayAllInventory } from "../InventoryPage";

interface InventoryDetailsCardProps {
  data: DisplayAllInventory;
  onClick: (row: DisplayAllInventory) => void;
}

const InventoryDetailsCard = ({ data, onClick }: InventoryDetailsCardProps) => {
  const isStoreInventory = data.inventoryReference === "store";

  const inventoryName = data.stockRoomName ?? data.storeName;
  const inventoryLocation = data.stockRoomLocation ?? data.storeLocation;
  const inventoryType = isStoreInventory ? "Store" : "Stock Room";

  return (
    <div
      onClick={() => onClick(data)}
      className="group flex items-center p-3 bg-white rounded-lg w-full shadow-sm border border-gray-100 gap-3 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer 
    /* Mobile First */
    h-auto min-h-[80px] 
    /* Tablet */
    md:h-20 md:min-h-0
    /* Desktop */
    xl:h-24
    /* Landscape */
    landscape:h-16 landscape:md:h-20"
    >
      {/* Icon/Thumbnail */}
      <div
        className={`flex-shrink-0 rounded-lg flex items-center justify-center
      /* Mobile */
      w-8 h-8
      /* Small tablets */
      md:w-10 md:h-10
      /* Desktop */
      xl:w-12 xl:h-12
      /* Landscape */
      landscape:w-8 landscape:h-8 landscape:md:w-10
      ${
        isStoreInventory
          ? "bg-gradient-to-br from-blue-500 to-blue-600"
          : "bg-gradient-to-br from-green-500 to-green-600"
      }`}
      >
        <Package
          className="
      /* Mobile */
      w-4 h-4
      /* Small tablets */
      md:w-5 md:h-5
      /* Desktop */
      xl:w-6 xl:h-6
      /* Landscape */
      landscape:w-4 landscape:h-4 landscape:md:w-5
      text-white"
        />
      </div>

      {/* Content */}
      <div
        className="flex-1 min-w-0 space-y-1
    /* Landscape adjustments */
    landscape:space-y-0.5"
      >
        <div
          className="flex items-center gap-2
      /* Mobile - stack if needed */
      flex-wrap
      /* Prevent wrapping on larger screens */
      md:flex-nowrap"
        >
          <h1
            className="
        /* Mobile */
        text-sm font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-1
        /* Tablet */
        md:text-sm
        /* Desktop */
        xl:text-base
        /* Landscape - smaller text */
        landscape:text-xs landscape:md:text-sm"
          >
            {inventoryName}
          </h1>
          <span
            className={`px-1.5 py-0.5 font-medium text-center rounded-full whitespace-nowrap
          /* Mobile */
          text-[10px]
          /* Tablet */
          md:text-xs
          /* Landscape */
          landscape:text-[10px]
          ${
            isStoreInventory
              ? "bg-blue-100 text-blue-800"
              : "bg-green-100 text-green-800"
          }`}
          >
            {inventoryType}
          </span>
        </div>

        <div
          className="flex items-center gap-2
      /* Mobile - vertical stack */
      flex-col items-start
      /* Tablet+ - horizontal */
      md:flex-row md:items-center
      /* Text sizes */
      text-xs md:text-sm text-gray-600
      /* Landscape - compact */
      landscape:flex-row landscape:items-center landscape:gap-3"
        >
          {inventoryLocation && (
            <div className="flex items-center gap-1 w-full md:w-auto">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate flex-1">{inventoryLocation}</span>
            </div>
          )}
          <div className="flex items-center gap-1 w-full md:w-auto">
            <Package className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{data.inventoryId}</span>
          </div>
        </div>

        {/* Description */}
        {(data.stockRoomDescription || data.storeDescription) && (
          <p
            className="text-xs text-gray-500 line-clamp-1
        /* Hide description in landscape to save space */
        landscape:hidden"
          >
            {data.stockRoomDescription ?? data.storeDescription}
          </p>
        )}
      </div>

      {/* Quick Action */}
      <button
        className="
      /* Mobile - always visible for better UX */
      opacity-100
      /* Desktop - show on hover only */
      md:opacity-0 md:group-hover:opacity-100
      transition-opacity duration-200 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md
      /* Landscape - smaller */
      landscape:p-1"
        onClick={(e) => {
          e.stopPropagation();
          onClick(data);
        }}
      >
        <ChevronRight
          className="
      w-4 h-4
      /* Landscape */
      landscape:w-3 landscape:h-3"
        />
      </button>
    </div>
  );
};

export default InventoryDetailsCard;
