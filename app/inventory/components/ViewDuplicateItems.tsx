import Button from "@/components/shared/Button";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/shared/CustomCard";
import LoaderComponent from "@/components/shared/LoaderComponent";
import SearchBar from "@/components/shared/SearchBar";
import { DuplicateInventoryItemGroup } from "@/dtos/inventory.dto";
import { InventoryReferenceType } from "@/types/inventory";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import { CheckCircle2, Copy, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

interface ViewDuplicateItemsProps {
  inventoryId: number;
}

type ResolveTarget =
  | { scope: "all" }
  | {
      scope: "group";
      inventoryItemReferenceType: InventoryReferenceType;
      inventoryItemReferenceId: number;
      itemName: string;
    };

const LIMIT = 50;

const ViewDuplicateItems = ({ inventoryId }: ViewDuplicateItemsProps) => {
  const [resolveTarget, setResolveTarget] = useState<ResolveTarget | null>(
    null,
  );
  const [isResolving, setIsResolving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const {
    data: response,
    isLoading,
    mutate,
  } = useSWR<ApiResponse<DuplicateInventoryItemGroup[]>>(
    inventoryId
      ? `/api/inventory/${inventoryId}/duplicates?search=${encodeURIComponent(search)}&page=${page}&limit=${LIMIT}`
      : null,
    fetcher,
  );

  const groups = response?.data ?? [];
  const totalCount = response?.count ?? 0;

  const handleResolve = async () => {
    if (!resolveTarget) return;

    setIsResolving(true);
    try {
      const body =
        resolveTarget.scope === "group"
          ? {
              inventoryItemReferenceType:
                resolveTarget.inventoryItemReferenceType,
              inventoryItemReferenceId:
                resolveTarget.inventoryItemReferenceId,
            }
          : {};

      const res = await fetch(
        `/api/inventory/${inventoryId}/duplicates/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success(result.message);
      mutate();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to remove duplicate items!",
      );
    } finally {
      setIsResolving(false);
      setResolveTarget(null);
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col">
      <Card className="h-full flex flex-col overflow-hidden">
        <CardTitle className="flex flex-col gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Duplicate items
              </p>
              <p className="text-xs text-gray-500">
                Items that were added to this inventory more than once
              </p>
            </div>

            <div className="flex items-center gap-2">
              {totalCount > 0 && (
                <>
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                    {totalCount} {totalCount === 1 ? "item" : "items"}
                  </span>
                  <Button
                    label="Remove All Duplicates"
                    icon={Trash2}
                    size="sm"
                    color="danger"
                    onClick={() => setResolveTarget({ scope: "all" })}
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <SearchBar
                useUrl={false}
                placeholder="Search duplicate items"
                onSearch={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
              />
            </div>

            {totalCount > LIMIT && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  label="Prev"
                  color="outline"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                />

                <span className="text-[11px] 2xl:text-xs text-gray-500 whitespace-nowrap">
                  {page}
                </span>

                <Button
                  size="sm"
                  label="Next"
                  color="outline"
                  disabled={page * LIMIT >= totalCount}
                  onClick={() => setPage((prev) => prev + 1)}
                />
              </div>
            )}
          </div>
        </CardTitle>

        <CardContent className="flex-1 min-h-0 p-2">
          {isLoading ? (
            <LoaderComponent />
          ) : groups.length > 0 ? (
            <div className="h-full overflow-y-auto pr-1 space-y-3">
              {groups.map((group) => (
                <div
                  key={`${group.inventoryItemReferenceType}-${group.inventoryItemReferenceId}`}
                  className="rounded-xl border border-gray-200 p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50">
                        <Copy className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-gray-800">
                          {group.itemName || "Unnamed item"}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {group.itemUnit || "No unit"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-[11px] font-medium text-yellow-700">
                        {group.duplicateCount} rows
                      </span>
                      <button
                        type="button"
                        title="Merge quantities and remove the extra rows"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        onClick={() =>
                          setResolveTarget({
                            scope: "group",
                            inventoryItemReferenceType:
                              group.inventoryItemReferenceType,
                            inventoryItemReferenceId:
                              group.inventoryItemReferenceId,
                            itemName: group.itemName || "this item",
                          })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <div
                        key={item.inventoryItemId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-[11px] text-gray-600"
                      >
                        <span>Item ID: {item.inventoryItemId}</span>
                        <span>Qty: {item.inventoryItemQuantity}</span>
                        <span>Min: {item.inventoryItemMin}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                {search ? "No matching duplicate items" : "No duplicate items found"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {search
                  ? "Try a different search term."
                  : "Every item in this inventory appears only once."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationModal
        isShow={resolveTarget !== null}
        isLoading={isResolving}
        title="Remove Duplicate Items"
        confirmLabel="Remove"
        confirmationInfo={
          resolveTarget?.scope === "all"
            ? `Are you sure you want to merge quantities and remove the extra rows for all ${totalCount} duplicated ${totalCount === 1 ? "item" : "items"}? This keeps one row per item with the combined quantity and cannot be undone.`
            : `Are you sure you want to merge quantities and remove the extra rows for "${resolveTarget?.scope === "group" ? resolveTarget.itemName : ""}"? This keeps one row with the combined quantity and cannot be undone.`
        }
        onClose={() => setResolveTarget(null)}
        onConfirm={handleResolve}
      />
    </div>
  );
};

export default ViewDuplicateItems;
