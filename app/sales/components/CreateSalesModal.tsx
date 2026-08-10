"use client";

import Button from "@/components/shared/Button";
import { DropdownSearch } from "@/components/shared/DropDownSearch";
import DropdownSelect from "@/components/shared/DropdownSelect";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Table, { Column } from "@/components/shared/Table";
import Textarea from "@/components/shared/TextArea";
import {
  CreateSaleDto,
  CreateSaleItemDto,
  CreateSalePaymentDto,
} from "@/dtos/sales.dto";
import { DisplayProductsDtos } from "@/dtos/products.dto";
import { UserAuth } from "@/hooks/useSession";
import { Customer } from "@/types/customer";
import { Discounts } from "@/types/discount";
import { PaymentMethods } from "@/types/payment-methods";
import { ApiResponse } from "@/types/api";
import { SalesPaymentStatus, SalesStatus } from "@/types/sales";
import { formatDateForMySQL } from "@/utils/formatDateToWords";
import { fetcher } from "@/utils/fetcher";
import { formatPeso } from "@/utils/formatPeso";
import { Check, Layers, Minus, Plus, Trash2, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

interface VariantOption {
  label: string;
  value: number;
  prodVarName: string;
  prodVarPrice: number;
  inventoryItemId: number | null;
  variantComponents?: { inventoryItemId: number; quantityRequired: number }[];
}

interface DraftSaleItem {
  prodVarId: number;
  prodVarName: string;
  quantity: number;
  unitPrice: number;
  inventoryItemId: number | null;
  variantComponents?: { inventoryItemId: number; quantityRequired: number }[];
  // Per-item discount - mutually exclusive with the sale-level discount,
  // same rule as POS: discount either the whole sale or specific items, never both.
  discountId: number | null;
}

interface DraftSale {
  id: string;
  customer: Customer | null;
  salesDate: string;
  discountId: number | null;
  payMetId: number | null;
  notes: string;
  items: DraftSaleItem[];
}

interface CreateSalesModalProps {
  storeId: number;
  user: UserAuth | null;
  onCreated: () => void;
  onClose: () => void;
}

const todayDate = () => new Date().toISOString().slice(0, 10);

// crypto.randomUUID() only exists in secure contexts (HTTPS/localhost) - on
// a plain-HTTP prod deployment (e.g. LAN-hosted over http://<ip>:port) it's
// undefined, so calling it throws and silently aborts the "Add Sale" click
// before any state update happens. Fall back to a UUID-shaped string built
// from Math.random() so draft ids stay unique either way.
const generateDraftId = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const createEmptyDraft = (): DraftSale => ({
  id: generateDraftId(),
  customer: null,
  salesDate: todayDate(),
  discountId: null,
  payMetId: null,
  notes: "",
  items: [],
});

const CreateSalesModal = ({
  storeId,
  user,
  onCreated,
  onClose,
}: CreateSalesModalProps) => {
  const storageKey = `sales_drafts_store_${storeId}`;

  // Read synchronously on mount (storeId is fixed for this component's
  // lifetime - the parent only mounts it once a store is chosen) instead of
  // loading via useEffect. Loading in an effect raced against the save
  // effect below: the save effect ran right after with the stale initial
  // `drafts` ([]) still in its closure, since a setState from the load
  // effect doesn't apply until the next render - wiping out any previously
  // saved draft (items, notes, everything) before it could ever be shown.
  const loadDrafts = (): DraftSale[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const [drafts, setDrafts] = useState<DraftSale[]>(loadDrafts);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(
    () => loadDrafts()[0]?.id ?? null,
  );
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(
    null,
  );
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");

  const [showBulkSummary, setShowBulkSummary] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(drafts));
  }, [drafts, storageKey]);

  const { data: discountResponse = { data: [] } } = useSWR<{
    data: Discounts[];
  }>(storeId ? `/api/sales-discount/store/${storeId}/` : null, fetcher);

  const { data: paymentMethodResponse = { data: [] } } = useSWR<{
    data: PaymentMethods[];
  }>(storeId ? `/api/payment-method/store/${storeId}/` : null, fetcher);

  const buildVariantOptions = (
    products: DisplayProductsDtos[],
  ): VariantOption[] =>
    products.flatMap(
      (product) =>
        product.productVariants?.map((variant) => {
          // Skip the redundant "Rice - Rice" style repetition when the
          // variant is just a placeholder copy of the product name.
          const displayName =
            variant.prodVarName === product.prodName
              ? product.prodName
              : `${product.prodName} - ${variant.prodVarName}`;

          return {
            label: `${displayName} (${formatPeso(variant.prodVarPrice)})`,
            value: variant.prodVarId,
            prodVarName: displayName,
            prodVarPrice: variant.prodVarPrice,
            inventoryItemId: variant.inventoryItemId,
            variantComponents: variant.variantComponents,
          };
        }) ?? [],
    );

  // Search the server on every query (same endpoint/pattern POS uses)
  // instead of filtering a single pre-fetched page - a fixed-size snapshot
  // meant products past the first page (e.g. "Winston") could never match,
  // even though the product exists and POS could find it fine.
  const searchProducts = async (query: string): Promise<VariantOption[]> => {
    const res = await fetch(
      `/api/products/${storeId}/pos?search=${encodeURIComponent(
        query.trim(),
      )}&category=&page=1&limit=50`,
    );
    const json: ApiResponse<DisplayProductsDtos[]> = await res.json();
    return buildVariantOptions(json.data ?? []);
  };

  const searchCustomers = async (query: string): Promise<Customer[]> => {
    const res = await fetch(
      `/api/customers/store/${storeId}?search=${encodeURIComponent(query)}`,
    );
    const json = await res.json();
    return json.data || [];
  };

  const activeDraft = drafts.find((d) => d.id === activeDraftId) ?? null;

  const updateDraft = (
    id: string,
    updater: (draft: DraftSale) => DraftSale,
  ) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? updater(d) : d)));
  };

  const addDraft = () => {
    const cashPayMet = paymentMethodResponse.data.find(
      (pm) => pm.payMetName.trim().toLowerCase() === "cash",
    );
    const newDraft: DraftSale = {
      ...createEmptyDraft(),
      payMetId: cashPayMet?.payMetId ?? null,
    };
    setDrafts((prev) => [...prev, newDraft]);
    setActiveDraftId(newDraft.id);
  };

  const removeDraft = (id: string) => {
    setDrafts((prev) => {
      const next = prev.filter((d) => d.id !== id);
      if (activeDraftId === id) {
        setActiveDraftId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const handleAddItem = () => {
    if (!activeDraft) return;

    if (!selectedVariant) {
      toast.error("Select a product first!");
      return;
    }

    const qty = Number(quantity) || 0;
    const price = Number(unitPrice) || 0;

    if (qty <= 0) {
      toast.error("Quantity must be greater than 0!");
      return;
    }

    updateDraft(activeDraft.id, (draft) => ({
      ...draft,
      items: [
        ...draft.items,
        {
          prodVarId: selectedVariant.value,
          prodVarName: selectedVariant.prodVarName,
          quantity: qty,
          unitPrice: price,
          inventoryItemId: selectedVariant.inventoryItemId,
          variantComponents: selectedVariant.variantComponents,
          discountId: null,
        },
      ],
    }));

    setSelectedVariant(null);
    setQuantity("1");
    setUnitPrice("");
  };

  const handleRemoveItem = (index: number) => {
    if (!activeDraft) return;

    updateDraft(activeDraft.id, (draft) => ({
      ...draft,
      items: draft.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemDiscountChange = (
    index: number,
    discountId: number | null,
  ) => {
    if (!activeDraft) return;

    updateDraft(activeDraft.id, (draft) => ({
      ...draft,
      items: draft.items.map((item, i) =>
        i === index ? { ...item, discountId } : item,
      ),
    }));
  };

  const handleItemQuantityChange = (index: number, delta: number) => {
    if (!activeDraft) return;

    updateDraft(activeDraft.id, (draft) => ({
      ...draft,
      items: draft.items.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    }));
  };

  const getSubtotal = (draft: DraftSale) =>
    draft.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const getDiscount = (draft: DraftSale) =>
    discountResponse.data.find((d) => d.discountId === draft.discountId) ??
    null;

  const hasItemLevelDiscounts = (draft: DraftSale) =>
    draft.items.some((i) => i.discountId);

  const getItemDiscount = (item: DraftSaleItem) =>
    discountResponse.data.find((d) => d.discountId === item.discountId) ?? null;

  const getItemDiscountAmount = (item: DraftSaleItem) => {
    const discount = getItemDiscount(item);
    if (!discount) return 0;

    const lineSubtotal = item.quantity * item.unitPrice;
    const amount =
      discount.discountType === "percent"
        ? lineSubtotal * (Number(discount.discountValue) / 100)
        : Number(discount.discountValue) * item.quantity;

    return Math.min(amount, lineSubtotal);
  };

  // Discount is either applied to the whole sale OR to specific items,
  // never both - matches the POS rule (cantDiscountAll).
  const getDiscountAmount = (draft: DraftSale) => {
    if (hasItemLevelDiscounts(draft)) {
      return draft.items.reduce(
        (sum, item) => sum + getItemDiscountAmount(item),
        0,
      );
    }

    const discount = getDiscount(draft);
    if (!discount) return 0;

    const subtotal = getSubtotal(draft);
    return discount.discountType === "percent"
      ? subtotal * (Number(discount.discountValue) / 100)
      : Number(discount.discountValue);
  };

  const getTotal = (draft: DraftSale) =>
    Math.max(getSubtotal(draft) - getDiscountAmount(draft), 0);

  const grandTotal = drafts.reduce((sum, draft) => sum + getTotal(draft), 0);

  const isValidDraft = (draft: DraftSale) =>
    draft.items.length > 0 && Boolean(draft.payMetId);

  const buildSaleData = (draft: DraftSale): CreateSaleDto => {
    const subtotal = getSubtotal(draft);
    const totalAmount = getTotal(draft);
    const now = new Date();
    const itemDiscountMode = hasItemLevelDiscounts(draft);
    const discount = itemDiscountMode ? null : getDiscount(draft);
    const discountAmount = getDiscountAmount(draft);

    // Prorate the whole-sale discount across items by their share of the
    // subtotal, so each item's total (and receipt) reflects the discount -
    // not just the sale's bottom line. The last item absorbs any rounding
    // remainder so the per-item discounts always sum to discountAmount exactly.
    // Item-level discounts (mutually exclusive with the whole-sale one) skip
    // proration entirely - each item already carries its own discount.
    let discountAssigned = 0;

    const salesItems: CreateSaleItemDto[] = draft.items.map((item, index) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const isLastItem = index === draft.items.length - 1;

      let itemDiscountAmount = 0;
      let itemDiscountId: number | null = null;
      let itemDiscountType = discount?.discountType;

      if (itemDiscountMode) {
        const itemDiscount = getItemDiscount(item);
        if (itemDiscount) {
          itemDiscountAmount = getItemDiscountAmount(item);
          itemDiscountId = itemDiscount.discountId;
          itemDiscountType = itemDiscount.discountType;
        }
      } else if (discount && discountAmount > 0 && subtotal > 0) {
        itemDiscountAmount = isLastItem
          ? discountAmount - discountAssigned
          : Math.round((lineSubtotal / subtotal) * discountAmount * 100) /
            100;
        discountAssigned += itemDiscountAmount;
        itemDiscountId = discount.discountId;
      }

      return {
        salesItemQuantity: item.quantity,
        salesId: 0,
        salesItemPrice: item.unitPrice,
        salesItemSubtotal: lineSubtotal,
        salesItemTotal: Math.max(lineSubtotal - itemDiscountAmount, 0),
        prodVarId: item.prodVarId,
        inventoryItemId: item.inventoryItemId,
        components:
          item.variantComponents?.map((vc) => ({
            inventoryItemId: vc.inventoryItemId,
            quantityRequired: vc.quantityRequired,
          })) ?? [],
        salesItemDiscounts:
          itemDiscountId && itemDiscountAmount > 0
            ? [
                {
                  discountId: itemDiscountId,
                  discountAmount: itemDiscountAmount,
                  salesItemId: 0,
                  salesItemDiscCreatedBy: user?.userId ?? 0,
                  discountType: itemDiscountType,
                },
              ]
            : [],
      };
    });

    return {
      customerId: draft.customer?.customerId ?? 0,
      salesCreatedBy: user?.userId ?? 0,
      salesSubTotal: subtotal,
      salesTotalPaid: totalAmount,
      salesInvoice: "",
      salesNo: "",
      salesTotalAmount: totalAmount,
      storeId,
      salesStatus: SalesStatus.COMPLETED,
      salesRemarks: draft.notes,
      salesSource: "pos",
      // Same conversion EditSalesPage uses for its date field: build a local
      // wall-clock Date (date picked + current time), then convert to UTC
      // before sending, since salesCreatedAt is stored as UTC and re-converted
      // via CONVERT_TZ(+00:00, +08:00) everywhere else it's read - sending the
      // raw local string here shifted the displayed date/time by 8 hours.
      salesCreatedAt: formatDateForMySQL(
        new Date(
          `${draft.salesDate}T${now.toTimeString().slice(0, 8)}`,
        ).toISOString(),
      ),
      salesItems,
      saleDiscounts: discount
        ? [
            {
              discountId: discount.discountId,
              discountAmount,
              saleId: 0,
            },
          ]
        : [],
      salesPayments: [
        {
          salesId: 0,
          payMetId: draft.payMetId as number,
          salesPaymentAmount: totalAmount,
          paymentReference: "",
          salesPaymentStatus: SalesPaymentStatus.COMPLETED,
        },
      ],
    };
  };

  const submitSale = async (draft: DraftSale) => {
    const saleData = buildSaleData(draft);
    const result = await fetch(`/api/sales/pos/${storeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleData),
    });

    const res = await result.json();
    if (!res.success) {
      throw new Error(res.message || "Failed to create sale");
    }
  };

  const handleCreateSale = async (draft: DraftSale) => {
    if (draft.items.length === 0) {
      toast.error("Add at least one item!");
      return;
    }

    if (!draft.payMetId) {
      toast.error("Select a payment type!");
      return;
    }

    setSubmittingId(draft.id);
    try {
      await submitSale(draft);
      toast.success("Sale created successfully!");
      removeDraft(draft.id);
      onCreated();
    } catch (e: any) {
      toast.error(e?.message || "Failed to create sale");
    } finally {
      setSubmittingId(null);
    }
  };

  const validBulkDrafts = drafts.filter(isValidDraft);
  const skippedBulkDraftsCount = drafts.length - validBulkDrafts.length;

  const bulkSummaryByPaymentType = validBulkDrafts.reduce<
    Record<string, { label: string; count: number; total: number }>
  >((acc, draft) => {
    const method = paymentMethodResponse.data.find(
      (pm) => pm.payMetId === draft.payMetId,
    );
    const key = String(draft.payMetId);
    const label = method?.payMetName ?? "Unknown";

    if (!acc[key]) acc[key] = { label, count: 0, total: 0 };
    acc[key].count += 1;
    acc[key].total += getTotal(draft);

    return acc;
  }, {});

  const bulkGrandTotal = validBulkDrafts.reduce(
    (sum, draft) => sum + getTotal(draft),
    0,
  );

  const handleBulkCreate = async () => {
    if (validBulkDrafts.length === 0) {
      toast.error("No valid draft sales to create!");
      return;
    }

    setIsBulkSubmitting(true);
    let successCount = 0;
    let failCount = 0;
    // Track removals locally and apply them in one batch after the loop -
    // calling removeDraft() per-iteration reads activeDraftId from the
    // closure captured at click time, which goes stale the moment an
    // `await` lets React re-render mid-loop, so later comparisons in the
    // same run can miss that the active tab was already removed.
    const createdIds = new Set<string>();

    for (const draft of validBulkDrafts) {
      try {
        await submitSale(draft);
        successCount++;
        createdIds.add(draft.id);
      } catch {
        failCount++;
      }
    }

    if (createdIds.size > 0) {
      const remaining = drafts.filter((d) => !createdIds.has(d.id));
      setDrafts(remaining);
      setActiveDraftId((prev) =>
        prev && createdIds.has(prev) ? (remaining[0]?.id ?? null) : prev,
      );
    }

    setIsBulkSubmitting(false);
    setShowBulkSummary(false);

    if (successCount > 0) onCreated();

    if (failCount === 0) {
      toast.success(
        `Created ${successCount} sale${successCount === 1 ? "" : "s"} successfully!`,
      );
    } else {
      toast.error(
        `Created ${successCount} sale${successCount === 1 ? "" : "s"}, ${failCount} failed. Failed drafts were kept.`,
      );
    }
  };

  const discountOptions = [
    { label: "No Discount", value: "" },
    ...discountResponse.data.map((d) => ({
      label: `${d.discountName} (${
        d.discountType === "percent"
          ? `${d.discountValue}%`
          : formatPeso(d.discountValue)
      })`,
      value: d.discountId,
    })),
  ];

  const paymentMethodOptions = [
    { label: "Select payment type", value: "" },
    ...paymentMethodResponse.data.map((pm) => ({
      label: pm.payMetName,
      value: pm.payMetId,
    })),
  ];

  const wholeSaleDiscountActive = Boolean(activeDraft?.discountId);

  const itemColumns = useMemo<Column<DraftSaleItem>[]>(
    () => [
      { key: "#", name: "#", selector: (_row, index) => index + 1 },
      { key: "prodVarName", name: "Item" },
      {
        key: "quantity",
        name: "Qty",
        selector: (row, index) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => handleItemQuantityChange(index, -1)}
              disabled={row.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-5 text-center">{row.quantity}</span>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
              onClick={() => handleItemQuantityChange(index, 1)}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        ),
      },
      {
        key: "unitPrice",
        name: "Unit Price",
        selector: (row) => formatPeso(row.unitPrice),
      },
      {
        key: "discountId",
        name: "Discount",
        selector: (row, index) => (
          <DropdownSelect
            name={`item-discount-${index}`}
            sizes="xs"
            value={String(row.discountId ?? "")}
            options={discountOptions}
            disabled={wholeSaleDiscountActive}
            onChange={(e) =>
              handleItemDiscountChange(
                index,
                e.target.value ? Number(e.target.value) : null,
              )
            }
          />
        ),
      },
      {
        key: "lineTotal",
        name: "Line Total",
        selector: (row) =>
          formatPeso(row.quantity * row.unitPrice - getItemDiscountAmount(row)),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [discountOptions, wholeSaleDiscountActive],
  );

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Draft tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          {drafts.map((draft, index) => (
            <button
              key={draft.id}
              type="button"
              onClick={() => setActiveDraftId(draft.id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                activeDraftId === draft.id
                  ? "border-primary-1 bg-pink-50 text-primary-1"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              Sale {index + 1} ({formatPeso(getTotal(draft))})
              <X
                className="h-3 w-3 text-gray-400 hover:text-rose-500"
                onClick={(e) => {
                  e.stopPropagation();
                  removeDraft(draft.id);
                }}
              />
            </button>
          ))}
          <Button
            label="Add Sale"
            size="xs"
            color="secondary"
            icon={Plus}
            className="w-auto px-3"
            onClick={addDraft}
          />
        </div>

        {drafts.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold text-gray-700">
              Total ({drafts.length} sale{drafts.length === 1 ? "" : "s"}):{" "}
              <span className="text-primary-1">{formatPeso(grandTotal)}</span>
            </div>
            <Button
              label="Create All"
              size="xs"
              icon={Layers}
              className="w-auto px-3"
              onClick={() => setShowBulkSummary(true)}
              disabled={validBulkDrafts.length === 0}
            />
          </div>
        )}
      </div>

      {!activeDraft ? (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
          No draft sales yet. Click &quot;Add Sale&quot; to start.
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <DropdownSearch<Customer>
              label="Customer (optional)"
              sizes="xs"
              placeholder="Search customer"
              selectedValue={activeDraft.customer?.customerName ?? ""}
              searchFn={searchCustomers}
              onSelect={(row) =>
                updateDraft(activeDraft.id, (draft) => ({
                  ...draft,
                  customer: row ?? null,
                }))
              }
              renderItem={(c) => <span>{c.customerName}</span>}
              displayValue={(c) => c.customerName}
            />

            <Input
              label="Sale Date"
              sizes="xs"
              type="date"
              value={activeDraft.salesDate}
              onChange={(e) =>
                updateDraft(activeDraft.id, (draft) => ({
                  ...draft,
                  salesDate: e.target.value,
                }))
              }
            />

            <div className="flex flex-col gap-1">
              <DropdownSelect
                name="discountId"
                label="Discount for whole sale (optional)"
                sizes="xs"
                value={String(activeDraft.discountId ?? "")}
                options={discountOptions}
                disabled={hasItemLevelDiscounts(activeDraft)}
                onChange={(e) =>
                  updateDraft(activeDraft.id, (draft) => ({
                    ...draft,
                    discountId: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
              {hasItemLevelDiscounts(activeDraft) && (
                <span className="text-[10px] text-gray-400">
                  Remove item discounts to discount the whole sale instead.
                </span>
              )}
            </div>

            <DropdownSelect
              name="payMetId"
              label="Payment Type"
              sizes="xs"
              value={String(activeDraft.payMetId ?? "")}
              options={paymentMethodOptions}
              onChange={(e) =>
                updateDraft(activeDraft.id, (draft) => ({
                  ...draft,
                  payMetId: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
          </div>

          <Textarea
            name="notes"
            label="Notes (optional)"
            sizes="xs"
            rows={2}
            value={activeDraft.notes}
            onChange={(e) =>
              updateDraft(activeDraft.id, (draft) => ({
                ...draft,
                notes: e.target.value,
              }))
            }
          />

          <div className="flex flex-col gap-3 rounded-md border border-gray-200 p-3">
            <p className="text-xs font-semibold text-gray-700">Add Item</p>
            <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-4">
              <div className="md:col-span-2">
                <DropdownSearch<VariantOption>
                  label="Product"
                  sizes="xs"
                  placeholder="Search product"
                  selectedValue={selectedVariant?.prodVarName ?? ""}
                  searchFn={searchProducts}
                  onSelect={(v) => {
                    setSelectedVariant(v ?? null);
                    if (v) setUnitPrice(String(v.prodVarPrice));
                  }}
                  renderItem={(v) => (
                    <span>
                      {v.prodVarName} {formatPeso(v.prodVarPrice)}
                    </span>
                  )}
                  displayValue={(v) => v.prodVarName}
                />
              </div>
              <Input
                label="Quantity"
                sizes="xs"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <Input
                label="Unit Price"
                sizes="xs"
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button
                label="Add Item"
                size="xs"
                color="secondary"
                hasBorder
                icon={Plus}
                className="w-auto px-4"
                onClick={handleAddItem}
              />
            </div>
          </div>

          {wholeSaleDiscountActive && (
            <span className="text-[10px] text-gray-400">
              A whole-sale discount is applied - remove it to discount specific
              items instead.
            </span>
          )}

          <Table
            isRounded={false}
            rowSize="h-9"
            textSize="xs"
            columns={itemColumns}
            data={activeDraft.items}
            showActions
            renderActions={(_row, index) => (
              <button
                type="button"
                className="text-rose-500 hover:text-rose-700"
                onClick={() => handleRemoveItem(index)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          />

          <div className="flex flex-col items-end gap-1 border-t border-gray-100 pt-3 text-xs text-gray-600">
            <div>Subtotal: {formatPeso(getSubtotal(activeDraft))}</div>
            {getDiscountAmount(activeDraft) > 0 && (
              <div className="text-rose-500">
                Discount: -{formatPeso(getDiscountAmount(activeDraft))}
              </div>
            )}
            <div className="text-sm font-bold text-gray-900">
              Total: {formatPeso(getTotal(activeDraft))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-[10px] text-gray-400">
          {drafts.length} draft sale{drafts.length === 1 ? "" : "s"} saved
          locally
        </span>
        <div className="flex gap-2">
          <Button
            label="Close"
            size="sm"
            color="secondary"
            className="w-auto px-4"
            onClick={onClose}
          />
          {activeDraft && (
            <Button
              label="Create Sale"
              size="sm"
              icon={Check}
              className="w-auto px-4"
              onClick={() => handleCreateSale(activeDraft)}
              loading={submittingId === activeDraft.id}
              disabled={activeDraft.items.length === 0 || !activeDraft.payMetId}
            />
          )}
        </div>
      </div>

      <Modal
        isOpen={showBulkSummary}
        onClose={() => setShowBulkSummary(false)}
        title="Confirm Bulk Create"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-md border border-gray-200 p-3">
            <div className="grid grid-cols-3 text-[10px] font-semibold uppercase text-gray-400">
              <span>Payment Type</span>
              <span className="text-center">Sales</span>
              <span className="text-right">Total</span>
            </div>
            {Object.values(bulkSummaryByPaymentType).map((summary) => (
              <div
                key={summary.label}
                className="grid grid-cols-3 text-xs text-gray-700"
              >
                <span>{summary.label}</span>
                <span className="text-center">{summary.count}</span>
                <span className="text-right">{formatPeso(summary.total)}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm font-bold text-gray-900">
            <span>
              {validBulkDrafts.length} sale
              {validBulkDrafts.length === 1 ? "" : "s"} total
            </span>
            <span className="text-primary-1">{formatPeso(bulkGrandTotal)}</span>
          </div>

          {skippedBulkDraftsCount > 0 && (
            <p className="text-[10px] text-amber-500">
              {skippedBulkDraftsCount} draft
              {skippedBulkDraftsCount === 1 ? "" : "s"} skipped (missing
              items or payment type) and will not be created.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              size="sm"
              color="secondary"
              className="w-auto px-4"
              onClick={() => setShowBulkSummary(false)}
              disabled={isBulkSubmitting}
            />
            <Button
              label={`Create ${validBulkDrafts.length} Sale${validBulkDrafts.length === 1 ? "" : "s"}`}
              size="sm"
              icon={Check}
              className="w-auto px-4"
              onClick={handleBulkCreate}
              loading={isBulkSubmitting}
              disabled={validBulkDrafts.length === 0}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CreateSalesModal;
