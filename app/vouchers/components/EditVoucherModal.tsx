"use client";

import Button from "@/components/shared/Button";
import { DropdownSearch } from "@/components/shared/DropDownSearch";
import Input from "@/components/shared/Input";
import TextArea from "@/components/shared/TextArea";
import Toggle from "@/components/shared/Toggle";
import { UpdateVoucherDto } from "@/dtos/voucher.dto";
import { Customer } from "@/types/customer";
import { DisplayVoucher } from "@/types/voucher";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface StoreOption {
  storeId: number;
  storeName: string;
}

interface EditVoucherModalProps {
  voucher: DisplayVoucher;
  stores: StoreOption[];
  onCancel: () => void;
  onUpdated: (voucher: DisplayVoucher) => void;
}

const searchCustomers = async (query: string): Promise<Customer[]> => {
  const res = await fetch(`/api/customers?search=${encodeURIComponent(query)}`);
  const json = await res.json();
  return json.data || [];
};

const EditVoucherModal = ({
  voucher,
  stores,
  onCancel,
  onUpdated,
}: EditVoucherModalProps) => {
  const [voucherName, setVoucherName] = useState(voucher.voucherName ?? "");
  const [fixedValue, setFixedValue] = useState(
    voucher.voucherFixedValue != null ? String(voucher.voucherFixedValue) : "",
  );
  const [percent, setPercent] = useState(
    voucher.voucherPercent != null ? String(voucher.voucherPercent) : "",
  );
  const [maxDiscount, setMaxDiscount] = useState(
    voucher.voucherMaxDiscount != null
      ? String(voucher.voucherMaxDiscount)
      : "",
  );
  const [maxUses, setMaxUses] = useState(String(voucher.voucherMaxUses ?? 1));
  const [expiresAt, setExpiresAt] = useState(voucher.voucherExpiresAt ?? "");
  const [isAllStores, setIsAllStores] = useState(
    Boolean(voucher.voucherIsAllStores),
  );
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>(
    voucher.storeIds ?? [],
  );
  const [issuedTo, setIssuedTo] = useState<Customer | null>(
    voucher.voucherIssuedTo
      ? ({
          customerId: voucher.voucherIssuedTo,
          customerName: voucher.voucherIssuedToName ?? "",
        } as Customer)
      : null,
  );
  const [remarks, setRemarks] = useState(voucher.voucherRemarks ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleStore = (storeId: number) => {
    setSelectedStoreIds((prev) =>
      prev.includes(storeId)
        ? prev.filter((id) => id !== storeId)
        : [...prev, storeId],
    );
  };

  const handleSubmit = async () => {
    if (voucher.voucherValueType === "fixed" && Number(fixedValue) <= 0) {
      toast.error("Enter a voucher value greater than 0!");
      return;
    }

    if (voucher.voucherValueType === "percent" && Number(percent) <= 0) {
      toast.error("Enter a discount percent greater than 0!");
      return;
    }

    if (!isAllStores && selectedStoreIds.length === 0) {
      toast.error("Select at least one store, or enable All Stores!");
      return;
    }

    const data: UpdateVoucherDto = {
      voucherName: voucherName || null,
      voucherFixedValue:
        voucher.voucherValueType === "fixed" ? Number(fixedValue) : undefined,
      voucherPercent:
        voucher.voucherValueType === "percent" ? Number(percent) : undefined,
      voucherMaxDiscount:
        voucher.voucherValueType === "percent" && maxDiscount
          ? Number(maxDiscount)
          : null,
      voucherMaxUses:
        voucher.voucherValueType === "percent" ? Number(maxUses) || 1 : 1,
      voucherExpiresAt: expiresAt || null,
      voucherIsAllStores: isAllStores,
      storeIds: isAllStores ? [] : selectedStoreIds,
      voucherIssuedTo: issuedTo?.customerId ?? null,
      voucherRemarks: remarks || null,
    };

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/vouchers/${voucher.voucherId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!json.success) {
        toast.error(json.message || "Failed to update voucher");
        return;
      }

      toast.success("Voucher updated successfully!");
      onUpdated(json.data);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update voucher");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Input label="Voucher Code" sizes="xs" value={voucher.voucherCode} readOnly />

      <Input
        label="Voucher Name (optional)"
        sizes="xs"
        placeholder="e.g. Anniversary Gift Card"
        value={voucherName}
        onChange={(e) => setVoucherName(e.target.value)}
        disabled={isSubmitting}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {voucher.voucherValueType === "fixed" ? (
          <Input
            label="Value (₱)"
            sizes="xs"
            type="number"
            value={fixedValue}
            onChange={(e) => setFixedValue(e.target.value)}
            disabled={isSubmitting}
          />
        ) : (
          <>
            <Input
              label="Discount Percent (%)"
              sizes="xs"
              type="number"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              label="Max Discount Cap (₱, optional)"
              sizes="xs"
              type="number"
              placeholder="Leave blank for no cap"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              label="Max Uses"
              sizes="xs"
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              disabled={isSubmitting}
            />
          </>
        )}

        <Input
          label="Expiry Date (optional)"
          sizes="xs"
          type="date"
          value={expiresAt ? String(expiresAt).slice(0, 10) : ""}
          onChange={(e) => setExpiresAt(e.target.value)}
          disabled={isSubmitting}
        />

        <DropdownSearch<Customer>
          label="Issued To (optional)"
          sizes="xs"
          placeholder="Leave blank for a bearer voucher"
          selectedValue={issuedTo?.customerName ?? ""}
          searchFn={searchCustomers}
          onSelect={(row) => setIssuedTo(row ?? null)}
          renderItem={(c) => <span>{c.customerName}</span>}
          displayValue={(c) => c.customerName}
          disabled={isSubmitting}
        />
      </div>

      <div className="rounded-md border border-gray-200 p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700">
            Where can this be redeemed?
          </p>
          <Toggle
            label="All Stores"
            sizes="sm"
            initial={isAllStores}
            onToggle={setIsAllStores}
          />
        </div>

        {!isAllStores && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {stores.map((store) => (
              <label
                key={store.storeId}
                className="flex items-center gap-2 text-xs text-gray-700 rounded-md border border-gray-200 px-2 py-1.5 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-gray-300"
                  checked={selectedStoreIds.includes(store.storeId)}
                  onChange={() => toggleStore(store.storeId)}
                />
                {store.storeName}
              </label>
            ))}
          </div>
        )}
      </div>

      <TextArea
        label="Remarks (optional)"
        sizes="xs"
        value={remarks ?? ""}
        onChange={(e) => setRemarks(e.target.value)}
        disabled={isSubmitting}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button
          label="Cancel"
          size="xs"
          color="secondary"
          hasBorder
          onClick={onCancel}
          disabled={isSubmitting}
        />
        <Button
          label="Save Changes"
          size="xs"
          color="primary"
          hasBorder
          onClick={handleSubmit}
          loading={isSubmitting}
        />
      </div>
    </div>
  );
};

export default EditVoucherModal;
