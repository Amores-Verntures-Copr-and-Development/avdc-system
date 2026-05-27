import Button from "@/components/shared/Button";
import { RefreshCw, ShoppingBasket } from "lucide-react";
import React from "react";
import toast from "react-hot-toast";

const UnlistedItems = () => {
  return (
    <div className="flex flex-1 flex-col overflow-hidden p-2 2xl:p-0 gap-2">
      {/* Header */}
      <div className="flex items-center border-l-2 border-yellow-600 p-2 gap-2 bg-yellow-600/10 rounded shrink-0">
        <div>
          <ShoppingBasket className="text-yellow-600 h-8 w-8" />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[10px] 2xl:text-xs text-yellow-800 font-semibold">
            Showing items that are not yet assigned to any product.
          </p>

          <p className="text-[9px] 2xl:text-[11px] text-gray-500">
            Add these items to a product to include them in inventory.
          </p>
        </div>
      </div>

      {/* Top actions */}
      <div className="flex justify-between items-center shrink-0">
        <span className="font-semibold text-xs 2xl:text-sm">
          Items not in products (5)
        </span>

        <button className="p-2 hover:bg-gray-200 rounded">
          <RefreshCw className="h-4 w-4 text-blue-600" />
        </button>
      </div>

      {/* ONLY THIS SCROLLS */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center border-border rounded-lg border shadow p-2">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-sm bg-border"></div>
              <div className="flex flex-col justify-between">
                <h1 className="font-semibold text-sm">Mineral Water</h1>
                <span className="font-medium text-xs text-gray-700">
                  Stock:45
                </span>
              </div>
            </div>
            <div>
              <Button
                size="sm"
                label="Add"
                onClick={() => {
                  toast.success("Item added to product successfully!");
                }}
              />
            </div>
          </div>
          <div className="flex justify-between items-center border-border rounded-lg border shadow p-2">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-sm bg-border"></div>
              <div className="flex flex-col justify-between">
                <h1 className="font-semibold text-sm">Mineral Water</h1>
                <span className="font-medium text-xs text-gray-700">
                  Stock:45
                </span>
              </div>
            </div>
            <div>
              <Button
                size="sm"
                label="Add"
                onClick={() => {
                  toast.success("Item added to product successfully!");
                }}
              />
            </div>
          </div>
          <div className="flex justify-between items-center border-border rounded-lg border shadow p-2">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-sm bg-border"></div>
              <div className="flex flex-col justify-between">
                <h1 className="font-semibold text-sm">Mineral Water</h1>
                <span className="font-medium text-xs text-gray-700">
                  Stock:45
                </span>
              </div>
            </div>
            <div>
              <Button
                size="sm"
                label="Add"
                onClick={() => {
                  toast.success("Item added to product successfully!");
                }}
              />
            </div>
          </div>
          <div className="flex justify-between items-center border-border rounded-lg border shadow p-2">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-sm bg-border"></div>
              <div className="flex flex-col justify-between">
                <h1 className="font-semibold text-sm">Mineral Water</h1>
                <span className="font-medium text-xs text-gray-700">
                  Stock:45
                </span>
              </div>
            </div>
            <div>
              <Button
                size="sm"
                label="Add"
                onClick={() => {
                  toast.success("Item added to product successfully!");
                }}
              />
            </div>
          </div>
          <div className="flex justify-between items-center border-border rounded-lg border shadow p-2">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-sm bg-border"></div>
              <div className="flex flex-col justify-between">
                <h1 className="font-semibold text-sm">Mineral Water</h1>
                <span className="font-medium text-xs text-gray-700">
                  Stock:45
                </span>
              </div>
            </div>
            <div>
              <Button
                size="sm"
                label="Add"
                onClick={() => {
                  toast.success("Item added to product successfully!");
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnlistedItems;
