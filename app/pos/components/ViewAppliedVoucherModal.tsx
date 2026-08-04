import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { formatPeso } from "@/utils/formatPeso";
import { AppliedVoucher } from "@/types/voucher";
import { Plus, Ticket, Trash2 } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface ViewAppliedVoucherModalProps {
  storeId: number | null;
  appliedVouchers: AppliedVoucher[];
  addVoucher: (appliedVoucher: AppliedVoucher) => void;
  removeVoucher: (voucherId: number) => void;
  remainingAmount: number;
}

const ViewAppliedVoucherModal = ({
  storeId,
  appliedVouchers,
  addVoucher,
  removeVoucher,
  remainingAmount,
}: ViewAppliedVoucherModalProps) => {
  const [voucherCode, setVoucherCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    const code = voucherCode.trim();
    if (!code) return;

    if (!storeId) {
      toast.error("No store found!");
      return;
    }

    if (
      appliedVouchers.some(
        (av) => av.voucher.voucherCode.toLowerCase() === code.toLowerCase(),
      )
    ) {
      toast.error("This voucher is already applied.");
      return;
    }

    setIsApplying(true);
    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voucherCode: code,
          storeId,
          remainingAmount,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        toast.error(json.message || "Voucher is not valid.");
        return;
      }

      const { voucher, appliedAmount } = json.data;

      addVoucher({ voucher, appliedAmount });
      setVoucherCode("");
      toast.success(`Voucher ${voucher.voucherCode} applied!`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to apply voucher.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-5">
      {/* Applied Vouchers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-800">
            Applied Vouchers
          </label>

          {appliedVouchers.length > 0 && (
            <span className="text-xs text-gray-400">
              {appliedVouchers.length} applied
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
          {appliedVouchers.length === 0 ? (
            <div className="flex items-center justify-center py-6 text-sm text-gray-400">
              No vouchers applied yet
            </div>
          ) : (
            <div className="space-y-2">
              {appliedVouchers.map(({ voucher, appliedAmount }) => (
                <div
                  key={voucher.voucherId}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">
                      {voucher.voucherCode}
                    </span>

                    <span className="text-xs text-gray-400">
                      {voucher.voucherName ??
                        (voucher.voucherValueType === "fixed"
                          ? "Fixed value voucher"
                          : "Percent discount voucher")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-rose-500">
                      -{formatPeso(appliedAmount)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeVoucher(voucher.voucherId)}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enter Voucher Code */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">
          Enter Voucher Code
        </label>

        <Input
          label=""
          sizes="md"
          placeholder="e.g. VCH-8K2N4Q"
          value={voucherCode}
          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
          leadingIcon={<Ticket className="h-4 w-4" />}
          disabled={isApplying}
        />
      </div>

      {/* Footer */}
      <div className="mt-auto pt-2">
        <Button
          label="Apply Voucher"
          icon={Plus}
          size="sm"
          onClick={handleApply}
          disabled={!voucherCode.trim()}
          loading={isApplying}
        />
      </div>
    </div>
  );
};

export default ViewAppliedVoucherModal;
