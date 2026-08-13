"use client";

import PageLayout from "@/components/shared/PageLayout";
import { useFullscreen } from "@/hooks/useFullscreen";
import { Maximize2 } from "lucide-react";
import React from "react";

// Placeholder menu content just to give the fullscreen toggle something to
// show off - swap this section out for the real customer-facing menu.
const placeholderCategories = [
  { name: "Breakfast", itemCount: 8 },
  { name: "Rice Meals", itemCount: 12 },
  { name: "Drinks", itemCount: 15 },
  { name: "Desserts", itemCount: 6 },
];

const KiosksPage = () => {
  const { isFullscreen, isSupported, toggle } = useFullscreen();

  return (
    <PageLayout className="p-2 gap-4">
      <div className="flex items-center gap-4 pt-2">
        <div className="flex flex-1 flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Our Menu</h1>
          <p className="text-sm text-gray-500">
            Tap Full Screen for the best kiosk display.
          </p>
        </div>

        {/* Once in full screen, the button disappears entirely rather than
            turning into an exit control - customers at the kiosk shouldn't
            have an easy on-screen way to back out of kiosk mode. */}
        {isSupported && !isFullscreen && (
          <button
            type="button"
            onClick={toggle}
            title="Full screen"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50"
          >
            <Maximize2 className="h-4 w-4 text-gray-700" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {placeholderCategories.map((category) => (
          <div
            key={category.name}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
          >
            <span className="text-lg font-semibold text-gray-800">
              {category.name}
            </span>
            <span className="text-xs text-gray-400">
              {category.itemCount} items
            </span>
          </div>
        ))}
      </div>
    </PageLayout>
  );
};

export default KiosksPage;
