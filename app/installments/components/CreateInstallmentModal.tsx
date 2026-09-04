"use client";

import Button from "@/components/shared/Button";
import { DropdownSearch } from "@/components/shared/DropDownSearch";
import Input from "@/components/shared/Input";
import Table, { Column } from "@/components/shared/Table";
import TextArea from "@/components/shared/TextArea";
import { CreateInstallmentCheckDto } from "@/dtos/installment.dto";
import { Customer } from "@/types/customer";
import { formatPeso } from "@/utils/formatPeso";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface CreateInstallmentModalProps {
  storeId: number;
  onCancel: () => void;
  onCreated: () => void;
}

type DraftCheck = CreateInstallmentCheckDto;

const searchCustomers = (storeId: number) => async (query: string): Promise<Customer[]> => {
  const res = await fetch(
    `/api/customers/store/${storeId}?search=${encodeURIComponent(query)}`,
  );
  const json = await res.json();
  return json.data || [];
};

// Adds `months` to a "YYYY-MM-DD" date, clamping the day to the target
// month's length instead of letting it roll into the month after (e.g. Jan
// 31 + 1 month -> Feb 28, not Mar 3).
function addMonthsClamped(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1 + months, 1);
  const daysInTargetMonth = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  const day = Math.min(d, daysInTargetMonth);
  target.setDate(day);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Increments a check number's trailing digit run by 1, preserving
// leading zeros and any surrounding prefix/suffix (e.g. "0000113729" ->
// "0000113730", "CHK-0001" -> "CHK-0002").
function incrementCheckNo(value: string): string {
  const match = value.match(/^(\D*)(\d+)(\D*)$/);
  if (!match) return value;

  const [, prefix, digits, suffix] = match;
  const incremented = (BigInt(digits) + BigInt(1))
    .toString()
    .padStart(digits.length, "0");
  return `${prefix}${incremented}${suffix}`;
}

// Splits `amount` across `count` slots as evenly as possible. Works in
// integer cents rather than dividing the peso amount directly - a plain
// `amount / count` (e.g. 682719.84 / 36, which is exactly 18964.44) can
// land a hair below the true value in floating point (18964.439999999996),
// which Math.floor then truncates to 18964.43 for every slot and dumps the
// accumulated shortfall onto the last one. Any genuine leftover cent(s) are
// spread one each across the trailing slots instead of lumped onto the
// last slot, so slots differ by at most one centavo.
function splitAmountEvenly(amount: number, count: number): number[] {
  const totalCents = Math.round(amount * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainderCents = totalCents - baseCents * count;

  return Array.from({ length: count }, (_, i) => {
    const cents = i >= count - remainderCents ? baseCents + 1 : baseCents;
    return cents / 100;
  });
}

function computeEwtAndNet(gross: number, ewtRatePercent: number) {
  const ewt = ewtRatePercent
    ? Number(((gross * ewtRatePercent) / 100).toFixed(2))
    : 0;
  return { ewt, net: Number((gross - ewt).toFixed(2)) };
}

function buildDraftChecks({
  startDate,
  totalAmount,
  totalMonthsPlan,
  ewtRate,
}: {
  startDate: string;
  totalAmount: number;
  totalMonthsPlan: number;
  ewtRate: number;
}): DraftCheck[] {
  const grossAmounts = splitAmountEvenly(totalAmount, totalMonthsPlan);

  return grossAmounts.map((gross, i) => {
    const { ewt, net } = computeEwtAndNet(gross, ewtRate);

    return {
      installmentCheckSequenceNo: i + 1,
      installmentCheckNo: "",
      installmentCheckDate: addMonthsClamped(startDate, i),
      installmentCheckGrossAmount: gross,
      installmentCheckEwtWithheld: ewt,
      installmentCheckNetAmount: net,
      installmentCheckNotes: "",
    };
  });
}

const CreateInstallmentModal = ({
  storeId,
  onCancel,
  onCreated,
}: CreateInstallmentModalProps) => {
  const [step, setStep] = useState<"form" | "draft">("form");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [clientCode, setClientCode] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [totalMonthsPlan, setTotalMonthsPlan] = useState("");
  const [ewtRate, setEwtRate] = useState("");
  const [notes, setNotes] = useState("");
  const [draftChecks, setDraftChecks] = useState<DraftCheck[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoPopulate, setAutoPopulate] = useState(true);

  const handleGenerateSchedule = () => {
    if (!customer) {
      toast.error("Search and select a client!");
      return;
    }
    if (!clientCode.trim()) {
      toast.error("Enter a client code!");
      return;
    }
    if (!description.trim()) {
      toast.error("Enter a description for this installment!");
      return;
    }
    if (!startDate) {
      toast.error("Select a start date!");
      return;
    }
    const amount = Number(totalAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a total amount greater than 0!");
      return;
    }
    const months = Number(totalMonthsPlan);
    if (!months || months < 1 || !Number.isInteger(months)) {
      toast.error("Enter a valid number of months!");
      return;
    }
    const rate = Number(ewtRate) || 0;
    if (rate < 0 || rate > 100) {
      toast.error("EWT rate must be between 0 and 100!");
      return;
    }

    setDraftChecks(
      buildDraftChecks({
        startDate,
        totalAmount: amount,
        totalMonthsPlan: months,
        ewtRate: rate,
      }),
    );
    setStep("draft");
  };

  const handleSubmit = async () => {
    if (!customer) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/installments/${storeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installmentClientCode: clientCode,
          installmentDescription: description,
          installmentTotalMonthsPlan: Number(totalMonthsPlan),
          installmentTotalAmount: Number(totalAmount),
          installmentStartDate: startDate,
          installmentEwtRate: ewtRate ? Number(ewtRate) : null,
          installmentNotes: notes || null,
          customerId: customer.customerId,
          checks: draftChecks.map((c) => ({
            ...c,
            installmentCheckGrossAmount: Number(c.installmentCheckGrossAmount),
            installmentCheckEwtWithheld: Number(
              c.installmentCheckEwtWithheld || 0,
            ),
            installmentCheckNetAmount: Number(c.installmentCheckNetAmount),
            installmentCheckNo: c.installmentCheckNo || null,
          })),
        }),
      });

      const json = await res.json();

      if (!json.success) {
        toast.error(json.message || "Failed to create installment plan");
        return;
      }

      toast.success("Installment plan created successfully!");
      onCreated();
    } catch (e: any) {
      toast.error(e?.message || "Failed to create installment plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Whichever row's Check No. was just edited, cascade an incrementing
  // sequence into every later row - post-dated checks come from one
  // checkbook, so their numbers are sequential.
  const cascadeCheckNo = (newData: DraftCheck[], changedIndex: number) => {
    const updated = [...newData];
    let previous = updated[changedIndex].installmentCheckNo as string;

    for (let i = changedIndex + 1; i < updated.length; i++) {
      previous = incrementCheckNo(previous);
      updated[i] = { ...updated[i], installmentCheckNo: previous };
    }

    return updated;
  };

  // Whichever row's Gross Amount was just edited, treat every row up to
  // and including it as fixed and re-split whatever's left of the total
  // evenly across the remaining rows (e.g. rows 1-2 hand-set to a bigger
  // first payment, rows 3+ auto-fill from what's left over the rest of
  // the plan).
  const cascadeGrossAmount = (newData: DraftCheck[], changedIndex: number) => {
    const updated = [...newData];
    const remainingCount = updated.length - (changedIndex + 1);
    if (remainingCount <= 0) return updated;

    const fixedSum = updated
      .slice(0, changedIndex + 1)
      .reduce((sum, r) => sum + Number(r.installmentCheckGrossAmount || 0), 0);
    const remainingAmount = Math.max(0, Number(totalAmount) - fixedSum);
    const rate = Number(ewtRate) || 0;

    splitAmountEvenly(remainingAmount, remainingCount).forEach((gross, i) => {
      const { ewt, net } = computeEwtAndNet(gross, rate);
      const rowIndex = changedIndex + 1 + i;
      updated[rowIndex] = {
        ...updated[rowIndex],
        installmentCheckGrossAmount: gross,
        installmentCheckEwtWithheld: ewt,
        installmentCheckNetAmount: net,
      };
    });

    return updated;
  };

  const handleDraftChecksUpdate = (newData: DraftCheck[]) => {
    if (!autoPopulate) {
      setDraftChecks(newData);
      return;
    }

    const checkNoChangedIndex = newData.findIndex(
      (row, idx) =>
        row.installmentCheckNo !== draftChecks[idx]?.installmentCheckNo,
    );
    if (checkNoChangedIndex !== -1 && newData[checkNoChangedIndex].installmentCheckNo) {
      setDraftChecks(cascadeCheckNo(newData, checkNoChangedIndex));
      return;
    }

    const grossChangedIndex = newData.findIndex(
      (row, idx) =>
        Number(row.installmentCheckGrossAmount) !==
        Number(draftChecks[idx]?.installmentCheckGrossAmount),
    );
    if (grossChangedIndex !== -1) {
      setDraftChecks(cascadeGrossAmount(newData, grossChangedIndex));
      return;
    }

    setDraftChecks(newData);
  };

  const draftColumns: Column<DraftCheck>[] = [
    {
      key: "installmentCheckSequenceNo",
      name: "#",
      selector: (row) => `${row.installmentCheckSequenceNo}/${draftChecks.length}`,
    },
    {
      key: "installmentCheckDate",
      name: "Check Date",
      editable: true,
      inputType: "date",
    },
    {
      key: "installmentCheckNo",
      name: "Check No.",
      editable: true,
      inputType: "text",
    },
    {
      key: "installmentCheckGrossAmount",
      name: "Gross Amount",
      editable: true,
      inputType: "number",
    },
    {
      key: "installmentCheckEwtWithheld",
      name: "EWT Withheld",
      editable: true,
      inputType: "number",
    },
    {
      key: "installmentCheckNetAmount",
      name: "Net Amount",
      editable: true,
      inputType: "number",
      compute: (row) =>
        Number(
          (
            Number(row.installmentCheckGrossAmount || 0) -
            Number(row.installmentCheckEwtWithheld || 0)
          ).toFixed(2),
        ),
      dependsOn: ["installmentCheckGrossAmount", "installmentCheckEwtWithheld"],
    },
  ];

  const draftTotal = draftChecks.reduce(
    (sum, c) => sum + Number(c.installmentCheckGrossAmount || 0),
    0,
  );

  if (step === "draft") {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
          <p className="font-semibold text-gray-800">
            {customer?.customerName} &middot; {clientCode}
          </p>
          <p className="mt-0.5">
            {description} &middot; {totalMonthsPlan} month(s) &middot;{" "}
            {formatPeso(totalAmount)}
          </p>
          <p className="mt-1 text-gray-400">
            Review the schedule below - every field is editable before you
            save.
          </p>
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-gray-300"
            checked={autoPopulate}
            onChange={(e) => setAutoPopulate(e.target.checked)}
          />
          Auto-fill Check No. and Gross Amount for the remaining rows
        </label>

        <Table
          columns={draftColumns}
          data={draftChecks}
          updateData={handleDraftChecksUpdate}
          uniqueIdKey="installmentCheckSequenceNo"
          maxHeight="20rem"
          showPagination={false}
        />

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Scheduled total</span>
          <span
            className={`font-semibold ${
              Math.abs(draftTotal - Number(totalAmount)) > 0.01
                ? "text-rose-500"
                : "text-gray-800"
            }`}
          >
            {formatPeso(draftTotal)}
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            label="Back"
            size="sm"
            color="secondary"
            onClick={() => setStep("form")}
            disabled={isSubmitting}
          />
          <Button
            label="Save Installment Plan"
            size="sm"
            onClick={handleSubmit}
            loading={isSubmitting}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DropdownSearch<Customer>
        label="Client"
        required
        sizes="sm"
        placeholder="Search client name"
        searchFn={searchCustomers(storeId)}
        onSelect={(row) => setCustomer(row ?? null)}
        renderItem={(c) => <span>{c.customerName}</span>}
        displayValue={(c) => c.customerName}
      />

      <Input
        label="Client Code"
        sizes="sm"
        placeholder="e.g. JD-001"
        value={clientCode}
        onChange={(e) => setClientCode(e.target.value)}
      />

      <Input
        label="Description"
        sizes="sm"
        placeholder="e.g. Solar panel system"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Start Date"
          sizes="sm"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="Total Months"
          sizes="sm"
          type="number"
          placeholder="e.g. 36"
          value={totalMonthsPlan}
          onChange={(e) => setTotalMonthsPlan(e.target.value)}
        />
        <Input
          label="Total Amount (₱)"
          sizes="sm"
          type="number"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
        />
        <Input
          label="EWT Rate % (optional)"
          sizes="sm"
          type="number"
          placeholder="Leave blank if none"
          value={ewtRate}
          onChange={(e) => setEwtRate(e.target.value)}
        />
      </div>

      <TextArea
        label="Notes (optional)"
        sizes="sm"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button label="Cancel" size="sm" color="secondary" onClick={onCancel} />
        <Button
          label="Generate Schedule"
          size="sm"
          onClick={handleGenerateSchedule}
        />
      </div>
    </div>
  );
};

export default CreateInstallmentModal;
