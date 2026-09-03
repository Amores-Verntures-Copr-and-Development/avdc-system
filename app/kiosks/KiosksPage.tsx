"use client";

import Image from "next/image";
import PageLayout from "@/components/shared/PageLayout";
import LoaderComponent from "@/components/shared/LoaderComponent";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useSession } from "@/hooks/useSession";
import { ApiResponse } from "@/types/api";
import { DisplayKioskProductVariantDto } from "@/dtos/products.dto";
import { StoreInterface } from "@/types/stores";
import { fetcher } from "@/utils/fetcher";
import { formatPeso } from "@/utils/formatPeso";
import { getNextCloudImageUrl } from "@/utils/getNextCloudImageUrl";
import { fileToDataUrl } from "@/utils/fileToDataUrl";
import {
  Camera,
  ImageIcon,
  Maximize2,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import React, { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

// Cycled by category index so each section gets a distinct, consistent
// accent without needing per-category color configuration.
const CATEGORY_PALETTES = [
  { icon: "bg-pink-100 text-pink-600", panel: "from-pink-50 to-rose-50" },
  { icon: "bg-emerald-100 text-emerald-600", panel: "from-emerald-50 to-green-50" },
  { icon: "bg-amber-100 text-amber-600", panel: "from-amber-50 to-orange-50" },
  { icon: "bg-violet-100 text-violet-600", panel: "from-violet-50 to-purple-50" },
  { icon: "bg-sky-100 text-sky-600", panel: "from-sky-50 to-blue-50" },
];

const KiosksPage = () => {
  const { isFullscreen, isSupported, toggle } = useFullscreen();
  const { user, hasStore, loading: sessionLoading } = useSession();
  const storeId = hasStore || user?.storeId ? (user?.storeId ?? null) : null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const { data: response, isLoading } = useSWR<
    ApiResponse<DisplayKioskProductVariantDto[]>
  >(storeId ? `/api/products/${storeId}/kiosk-menu` : null, fetcher);

  const {
    data: storeResponse,
    isLoading: isStoreLoading,
    mutate: mutateStore,
  } = useSWR<ApiResponse<StoreInterface[]>>(
    storeId ? `/api/stores/${storeId}` : null,
    fetcher,
  );

  const store = storeResponse?.data?.[0];
  // No banner is the default - a plain, unbranded gradient until a store
  // deliberately uploads one, rather than showing a placeholder photo.
  const bannerUrl = getNextCloudImageUrl(store?.storeKioskBannerImage);

  const items = response?.data ?? [];

  const categories = useMemo(() => {
    const groups = new Map<string, DisplayKioskProductVariantDto[]>();
    items.forEach((item) => {
      const key = item.prodCatName || "Other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });
    return Array.from(groups.entries());
  }, [items]);

  const loading = sessionLoading || isLoading || isStoreLoading;

  const handleBannerFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !storeId) return;

    setIsUploadingBanner(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch(`/api/stores/${storeId}/kiosk-banner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataUrl,
          fileName: file.name,
          fileType: file.type,
        }),
        credentials: "include",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Banner updated");
      mutateStore();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload banner");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleRemoveBanner = async () => {
    if (!storeId) return;
    try {
      const res = await fetch(`/api/stores/${storeId}/kiosk-banner`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Banner removed");
      mutateStore();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove banner");
    }
  };

  return (
    <PageLayout className="p-2 gap-4 overflow-y-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleBannerFileChange}
      />

      {/* Text always sits on the plain gradient, never directly on the
          banner photo - a photo can be any brightness, so text overlaid on
          it can end up unreadable. The banner is a decorative corner accent
          instead (it clips its own image, so no overflow-hidden needed here -
          that previously capped this row's height to the text column alone
          and hid the title whenever the button stack needed more room). */}
      {/* Explicit min-height (not auto, sized off content) so the banner
          reads as a proper hero band rather than a thin bar - the menu
          card below overlaps up into its bottom edge for a layered look. */}
      <div className="relative min-h-[220px] rounded-2xl bg-gradient-to-br from-pink-50 via-white to-orange-50">
        <div className="relative flex items-center gap-4 p-6">
          <div className="flex flex-1 flex-col gap-1">
            <h1 className="text-3xl font-bold text-gray-900">Our Menu</h1>
            <p className="text-sm text-gray-500">
              Tap Full Screen for the best kiosk display.
            </p>
          </div>

          {bannerUrl && (
            <div className="relative hidden h-40 w-40 shrink-0 overflow-hidden rounded-2xl shadow-md sm:block">
              <Image
                src={bannerUrl}
                alt="Kiosk banner"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          )}

          {/* Once in full screen, these controls disappear entirely rather
              than turning into exit/edit controls - customers at the kiosk
              shouldn't have an easy on-screen way to back out of kiosk mode
              or change the store's banner. */}
          {!isFullscreen && (
            <div className="flex shrink-0 flex-col gap-2">
              {isSupported && (
                <button
                  type="button"
                  onClick={toggle}
                  title="Full screen"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingBanner}
                title={bannerUrl ? "Change banner" : "Add banner image"}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
              </button>
              {bannerUrl && (
                <button
                  type="button"
                  onClick={handleRemoveBanner}
                  title="Remove banner"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <LoaderComponent />
      ) : items.length === 0 ? (
        <div className="relative z-10 -mt-8 flex flex-1 flex-col items-center justify-center gap-2 rounded-t-3xl rounded-b-2xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
          <UtensilsCrossed className="h-10 w-10 text-gray-300" />
          <span className="text-sm font-semibold text-gray-600">
            No items are set up for the kiosk yet
          </span>
          <span className="max-w-sm text-xs text-gray-400">
            Turn on &quot;Show in Kiosk&quot; on a product variant to have it
            appear here.
          </span>
        </div>
      ) : (
        // Negative margin pulls this card up over the hero's bottom edge -
        // the rounded top plus shadow gives the "menu card resting on the
        // banner" layered look instead of two stacked blocks with a gap.
        <div className="relative z-10 -mt-8 flex flex-col gap-6 rounded-t-3xl rounded-b-2xl bg-white p-4 shadow-sm">
          {categories.map(([categoryName, categoryItems], categoryIndex) => {
            const palette =
              CATEGORY_PALETTES[categoryIndex % CATEGORY_PALETTES.length];

            return (
              <div key={categoryName} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${palette.icon}`}
                  >
                    <UtensilsCrossed className="h-4 w-4" />
                  </span>
                  <h2 className="whitespace-nowrap text-base font-bold uppercase tracking-wide text-gray-800">
                    {categoryName}
                  </h2>
                  <div className="h-px flex-1 border-t border-dashed border-gray-200" />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryItems.map((item) => {
                    const imageUrl = getNextCloudImageUrl(item.prodVarImage);
                    const displayName =
                      item.prodVarName?.trim() &&
                      !item.prodName
                        ?.toLowerCase()
                        .includes(item.prodVarName.trim().toLowerCase())
                        ? `${item.prodName} ${item.prodVarName}`
                        : item.prodName;

                    return (
                      <div
                        key={item.prodVarId}
                        className="flex overflow-hidden rounded-2xl border border-gray-100 shadow-sm"
                      >
                        <div
                          className={`relative h-28 w-28 shrink-0 bg-gradient-to-br ${palette.panel}`}
                        >
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={displayName}
                              fill
                              unoptimized
                              className="object-contain p-3"
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center text-gray-300">
                              <ImageIcon className="h-7 w-7" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col justify-center gap-1 bg-white p-3">
                          <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
                            {displayName}
                          </h3>
                          <p className="text-sm font-bold text-primary-1">
                            {formatPeso(item.prodVarPrice)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
};

export default KiosksPage;
