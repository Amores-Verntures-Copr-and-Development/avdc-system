"use client";

import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";
import Input from "@/components/shared/Input";
import TextArea from "@/components/shared/TextArea";
import Toggle from "@/components/shared/Toggle";
import { MockStore, Voucher, VoucherValueType } from "@/types/voucher";
import { RefreshCw } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface CreateVoucherModalProps {
  stores: MockStore[];
  nextVoucherId: number;
  onCancel: () => void;
  onCreate: (voucher: Voucher) => void;
}

const generateVoucherCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `VCH-${code}`;
};

const CreateVoucherModal = ({
  stores,
  nextVoucherId,
  onCancel,
  onCreate,
}: CreateVoucherModalProps) => {
  const [voucherCode, setVoucherCode] = useState(generateVoucherCode());
  const [voucherName, setVoucherName] = useState("");
  const [valueType, setValueType] = useState<VoucherValueType>("fixed");
  const [fixedValue, setFixedValue] = useState("");
  const [percent, setPercent] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [issuingStoreId, setIssuingStoreId] = useState(
    String(stores[0]?.storeId ?? ""),
  );
  const [isAllStores, setIsAllStores] = useState(true);
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);
  const [issuedTo, setIssuedTo] = useState("");
  const [remarks, setRemarks] = useState("");

  const toggleStore = (storeId: number) => {
    setSelectedStoreIds((prev) =>
      prev.includes(storeId)
        ? prev.filter((id) => id !== storeId)
        : [...prev, storeId],
    );
  };

  const handleSubmit = () => {
    if (valueType === "fixed" && Number(fixedValue) <= 0) {
      toast.error("Enter a voucher value greater than 0!");
      return;
    }

    if (valueType === "percent" && Number(percent) <= 0) {
      toast.error("Enter a discount percent greater than 0!");
      return;
    }

    if (!isAllStores && selectedStoreIds.length === 0) {
      toast.error("Select at least one store, or enable All Stores!");
      return;
    }

    const voucher: Voucher = {
      voucherId: nextVoucherId,
      voucherCode,
      voucherName: voucherName || null,
      voucherValueType: valueType,
      voucherFixedValue: valueType === "fixed" ? Number(fixedValue) : null,
      voucherPercent: valueType === "percent" ? Number(percent) : null,
      voucherMaxDiscount:
        valueType === "percent" && maxDiscount ? Number(maxDiscount) : null,
      voucherBalance: valueType === "fixed" ? Number(fixedValue) : null,
      voucherMaxUses: valueType === "percent" ? Number(maxUses) || 1 : 1,
      voucherUsedCount: 0,
      voucherStatus: "active",
      voucherExpiresAt: expiresAt || null,
      voucherIsAllStores: isAllStores,
      voucherStoreIds: isAllStores ? [] : selectedStoreIds,
      voucherIssuedTo: issuedTo || null,
      storeId: Number(issuingStoreId),
      voucherIssuedBy: "You",
      voucherRemarks: remarks || null,
      voucherCreatedAt: new Date().toISOString(),
    };

    onCreate(voucher);
    toast.success("Voucher created (mock - not saved to database)");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="Voucher Code"
            sizes="xs"
            value={voucherCode}
            readOnly
          />
        </div>
        <Button
          icon={RefreshCw}
          label=""
          size="sm"
          color="secondary"
          className="w-auto shrink-0"
          onClick={() => setVoucherCode(generateVoucherCode())}
        />
      </div>

      <Input
        label="Voucher Name (optional)"
        sizes="xs"
        placeholder="e.g. Anniversary Gift Card"
        value={voucherName}
        onChange={(e) => setVoucherName(e.target.value)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DropdownSelect
          name="valueType"
          label="Voucher Type"
          sizes="xs"
          value={valueType}
          options={[
            { label: "Fixed value (gift card / store credit)", value: "fixed" },
            { label: "Percent discount", value: "percent" },
          ]}
          onChange={(e) => setValueType(e.target.value as VoucherValueType)}
        />

        <DropdownSelect
          name="issuingStoreId"
          label="Issuing Store"
          sizes="xs"
          value={issuingStoreId}
          options={stores.map((s) => ({
            label: s.storeName,
            value: s.storeId,
          }))}
          onChange={(e) => setIssuingStoreId(e.target.value)}
        />

        {valueType === "fixed" ? (
          <Input
            label="Value (₱)"
            sizes="xs"
            type="number"
            value={fixedValue}
            onChange={(e) => setFixedValue(e.target.value)}
          />
        ) : (
          <>
            <Input
              label="Discount Percent (%)"
              sizes="xs"
              type="number"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
            />
            <Input
              label="Max Discount Cap (₱, optional)"
              sizes="xs"
              type="number"
              placeholder="Leave blank for no cap"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
            />
            <Input
              label="Max Uses"
              sizes="xs"
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
            />
          </>
        )}

        <Input
          label="Expiry Date (optional)"
          sizes="xs"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />

        <Input
          label="Issued To (optional)"
          sizes="xs"
          placeholder="Leave blank for a bearer voucher"
          value={issuedTo}
          onChange={(e) => setIssuedTo(e.target.value)}
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
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
      />

      <div className="flex justify-end gap-3 border-t pt-4">
        <Button
          label="Cancel"
          size="xs"
          color="secondary"
          hasBorder
          onClick={onCancel}
        />
        <Button
          label="Create Voucher"
          size="xs"
          color="primary"
          hasBorder
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
};

export default CreateVoucherModal;
