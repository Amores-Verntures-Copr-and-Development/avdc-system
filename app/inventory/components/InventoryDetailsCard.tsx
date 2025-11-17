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
      className="group flex items-center p-3 bg-white rounded-lg w-full shadow-sm border border-gray-100 gap-4 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer h-24" // Fixed height
    >
      {/* Icon/Thumbnail */}
      <div
        className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
          isStoreInventory
            ? "bg-gradient-to-br from-blue-500 to-blue-600"
            : "bg-gradient-to-br from-green-500 to-green-600"
        }`}
      >
        <Package className="w-6 h-6 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600">
            {inventoryName}
          </h1>
          <span
            className={`px-1.5 py-0.5 text-xs font-medium text-center rounded-full ${
              isStoreInventory
                ? "bg-blue-100 text-blue-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {inventoryType}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          {inventoryLocation && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{inventoryLocation}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            <span>{data.inventoryId}</span>
          </div>
        </div>

        {/* Description (optional - shows on hover or as tooltip) */}
        {(data.stockRoomDescription || data.storeDescription) && (
          <p className="text-xs text-gray-500 mt-1 truncate">
            {data.stockRoomDescription ?? data.storeDescription}
          </p>
        )}
      </div>

      {/* Quick Action */}
      <button
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
        onClick={(e) => {
          e.stopPropagation(); // Prevent triggering the card's onClick
          onClick(data);
        }}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default InventoryDetailsCard;
