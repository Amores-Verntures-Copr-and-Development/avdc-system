import DynamicDropdown from "@/components/shared/DynamicDropdown";
import Table, { Column } from "@/components/shared/Table";
import { DisplaProductVariantsDtos } from "@/dtos/products.dto";
import { UserAuth } from "@/hooks/useSession";
import { ApiResponse } from "@/types/api";
import { StoreInterface } from "@/types/stores";
import { fetcher } from "@/utils/fetcher";
import { formatPeso } from "@/utils/formatPeso";
import { getNextCloudImageUrl } from "@/utils/getNextCloudImageUrl";
import { ImageIcon, Store } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import useSWR from "swr";

interface StoreVariantsViewProps {
  // Store users are locked to their own store; admins pick one via the URL's
  // `store` (store name) param, which we resolve back to an id here.
  hasStore: boolean;
  storeId: number | null;
  stores: StoreInterface[];
  user?: UserAuth | null;
}

// Quantities come back as "24.00" - drop the noise and add thousands grouping.
const fmtQty = (n?: number | null) => Number(n ?? 0).toLocaleString();

// Table cell: a small dot + label reads cleaner than a filled pill.
const YesNo = ({ on }: { on: boolean }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        on ? "bg-green-500" : "bg-gray-300"
      }`}
    />
    <span className={on ? "text-gray-700" : "text-gray-400"}>
      {on ? "Yes" : "No"}
    </span>
  </span>
);

// Mobile card: labeled availability chip.
const StatusChip = ({ label, on }: { label: string; on: boolean }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
      on ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"
    }`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        on ? "bg-green-500" : "bg-gray-300"
      }`}
    />
    {label}
  </span>
);

const Thumb = ({
  src,
  alt,
  size = "h-10 w-10",
  icon = "h-4 w-4",
}: {
  src?: string | null;
  alt: string;
  size?: string;
  icon?: string;
}) => (
  <div
    className={`flex ${size} flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-white`}
  >
    {src ? (
      <img
        src={getNextCloudImageUrl(src)}
        alt={alt}
        className="h-full w-full object-cover"
      />
    ) : (
      <ImageIcon className={`${icon} text-gray-300`} />
    )}
  </div>
);

const columns: Column<DisplaProductVariantsDtos>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  {
    key: "prodVarImage",
    name: "Image",
    selector: (row) => <Thumb src={row.prodVarImage} alt={row.prodVarName} />,
  },
  {
    key: "prodVarName",
    name: "Variant",
    selector: (row) => (
      <div className="flex max-w-[240px] flex-col">
        <span className="truncate text-sm font-semibold text-gray-900">
          {row.prodVarName}
        </span>
        <span className="truncate text-xs text-gray-400">{row.prodName}</span>
      </div>
    ),
  },
  {
    key: "prodVarUnit",
    name: "Unit",
    selector: (row) => (
      <span className="text-xs text-gray-500">{row.prodVarUnit || "-"}</span>
    ),
  },
  {
    key: "prodVarPrice",
    name: "Price",
    selector: (row) => (
      <span className="font-semibold text-gray-900">
        {formatPeso(row.prodVarPrice)}
      </span>
    ),
  },
  {
    key: "isAvailableOnline",
    name: "Online",
    selector: (row) => <YesNo on={Boolean(row.isAvailableOnline)} />,
  },
  {
    key: "isAvailableKiosk",
    name: "Kiosk",
    selector: (row) => <YesNo on={Boolean(row.isAvailableKiosk)} />,
  },
  {
    key: "inventoryItemQuantity",
    name: "Stock",
    selector: (row) => {
      const stock = Number(row.inventoryItemQuantity ?? 0);
      return (
        <span
          className={`font-semibold ${
            stock > 0 ? "text-green-600" : "text-gray-400"
          }`}
        >
          {fmtQty(stock)}
        </span>
      );
    },
  },
  {
    key: "sold",
    name: "Sold",
    selector: (row) => {
      const sold = Number(row.sold ?? 0);
      return (
        <span
          className={sold > 0 ? "font-semibold text-gray-800" : "text-gray-400"}
        >
          {fmtQty(sold)}
        </span>
      );
    },
  },
  {
    key: "totalSales",
    name: "Total Sales",
    selector: (row) => {
      const sales = Number(row.totalSales ?? 0);
      return (
        <span
          className={sales > 0 ? "font-semibold text-gray-900" : "text-gray-400"}
        >
          {formatPeso(sales)}
        </span>
      );
    },
  },
];

const StoreVariantsView = ({
  hasStore,
  storeId,
  stores,
  user,
}: StoreVariantsViewProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedStoreName = searchParams.get("store");
  const effectiveStoreId = hasStore
    ? storeId
    : (stores.find((s) => s.storeName === selectedStoreName)?.storeId ?? null);

  const storeOptions = stores.map((s) => ({
    label: s.storeName,
    value: s.storeName,
  }));

  // Same search/page/limit params the products table uses, so the shared
  // toolbar keeps working when toggling between views.
  const apiUrl = useMemo(() => {
    if (!effectiveStoreId) return null;
    const search = searchParams.get("search") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "1";
    const online = searchParams.get("isAvailableOnline");
    const kiosk = searchParams.get("isAvailableKiosk");
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (limit) params.append("limit", limit);
    if (online === "1" || online === "0")
      params.append("isAvailableOnline", online);
    if (kiosk === "1" || kiosk === "0")
      params.append("isAvailableKiosk", kiosk);
    params.append("page", page);
    return `/api/products/${effectiveStoreId}/product-variants?${params.toString()}`;
  }, [effectiveStoreId, searchParams]);

  const { data: response, isLoading } = useSWR<
    ApiResponse<DisplaProductVariantsDtos[]>
  >(user && apiUrl ? apiUrl : null, fetcher);

  const goToVariant = (row: DisplaProductVariantsDtos) =>
    router.push(
      `/products/${row.prodId}/${row.prodVarId}?storeId=${effectiveStoreId}`,
    );

  // All filters live in the URL (and reset pagination) so they persist across
  // refresh and the Products/Variants toggle.
  const setParam = (key: string, value: string | number | "") => {
    const url = new URL(window.location.href);
    if (value === "" || value === null || value === undefined) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, String(value));
    }
    url.searchParams.delete("page");
    router.push(url.toString());
  };

  const storeDropdown = !hasStore && (
    <DynamicDropdown
      options={storeOptions}
      value={selectedStoreName ?? ""}
      onChange={(value) => setParam("store", value)}
      placeholder={`Store (${storeOptions.length})`}
      icon={<Store className="w-4 h-4" />}
      size="sm"
    />
  );

  // Availability + kiosk live in the Table's Filter panel. Each is single-value
  // (matching the endpoint); handleFilterSave mirrors the Products view.
  const filterConfig = useMemo(
    () => [
      {
        id: "isAvailableOnline",
        label: "Availability",
        options: [
          { label: "Online", value: "1" },
          { label: "Offline", value: "0" },
        ],
      },
      {
        id: "isAvailableKiosk",
        label: "Kiosk",
        options: [
          { label: "In kiosk", value: "1" },
          { label: "Hidden from kiosk", value: "0" },
        ],
      },
    ],
    [],
  );
  const handleFilterSave = (newFilters: Record<string, string[]>) => {
    const params = new URLSearchParams(window.location.search);
    filterConfig.forEach((f) => params.delete(f.id));
    Object.entries(newFilters).forEach(([key, values]) => {
      values.forEach((value) => params.append(key, value));
    });
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  // Admin hasn't picked a store yet - there's nothing store-wide to list, so
  // surface the picker instead of an empty grid.
  if (!effectiveStoreId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50/40 p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-50 text-primary-1">
          <Store className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">
            Choose a store
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            Select a store to view its product variants.
          </p>
        </div>
        <div className="w-60">{storeDropdown}</div>
      </div>
    );
  }

  return (
    <Table
      uniqueIdKey="prodVarId"
      columns={columns}
      data={response?.data ?? []}
      showPagination
      totalCount={response?.count}
      maxHeight="h-full"
      searchUrl="products"
      loading={isLoading}
      onRowSelection={goToVariant}
      showFilter
      filterConfig={filterConfig}
      onSave={handleFilterSave}
      addContentLeftTitle={
        storeDropdown && (
          <div className="order-first mr-auto w-full sm:w-64">
            {storeDropdown}
          </div>
        )
      }
      renderMobileCard={(row) => {
        const stock = Number(row.inventoryItemQuantity ?? 0);
        const sold = Number(row.sold ?? 0);
        return (
          <div
            onClick={() => goToVariant(row)}
            className="flex cursor-pointer gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:border-pink-200 hover:shadow-md active:scale-[0.99]"
          >
            <Thumb
              src={row.prodVarImage}
              alt={row.prodVarName}
              size="h-16 w-16"
              icon="h-5 w-5"
            />

            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {row.prodVarName}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {row.prodName}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-gray-900">
                  {formatPeso(row.prodVarPrice)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-semibold text-primary-1">
                  {row.prodVarUnit || "pc"}
                </span>
                <StatusChip label="Online" on={Boolean(row.isAvailableOnline)} />
                <StatusChip label="Kiosk" on={Boolean(row.isAvailableKiosk)} />
              </div>

              <div className="flex items-center gap-4 border-t border-gray-100 pt-1.5 text-[11px] text-gray-400">
                <span>
                  Stock{" "}
                  <b
                    className={
                      stock > 0 ? "text-green-600" : "text-gray-400"
                    }
                  >
                    {fmtQty(stock)}
                  </b>
                </span>
                <span>
                  Sold{" "}
                  <b className={sold > 0 ? "text-gray-700" : "text-gray-400"}>
                    {fmtQty(sold)}
                  </b>
                </span>
                <span className="ml-auto font-medium text-gray-500">
                  {formatPeso(row.totalSales ?? 0)}
                </span>
              </div>
            </div>
          </div>
        );
      }}
    />
  );
};

export default StoreVariantsView;
