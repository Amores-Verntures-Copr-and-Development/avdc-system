import React, { useEffect, useState } from "react";
import { OrderList } from "../PosPage";
import { formatPeso } from "@/utils/formatPeso";
import Button from "@/components/shared/Button";
import { PaymentMethods } from "@/types/payment-methods";
import IconButton from "@/components/shared/IconButton";
import {
  Banknote,
  Check,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  PhilippinePeso,
  Plus,
  ShoppingCart,
  Wallet,
  X,
} from "lucide-react";
import { CreateSalePaymentDto, CreateSalesDiscount } from "@/dtos/sales.dto";
import Input from "@/components/shared/Input";
import { handleChange } from "@/utils/handle-change";
import Textarea from "@/components/shared/TextArea";
import { SalesPaymentStatus } from "@/types/sales";
import { Customer } from "@/types/customer";
import toast from "react-hot-toast";
import { AppliedVoucher } from "@/types/voucher";

interface CheckOutModalProps {
  order: OrderList[] | null;
  discounts: CreateSalesDiscount[] | null;
  paymentMethods: PaymentMethods[] | null;
  selectedPaymentMethod: CreateSalePaymentDto[] | null;
  addPayment: (payment: CreateSalePaymentDto) => void;
  setSelectedPaymentMethod: React.Dispatch<
    React.SetStateAction<CreateSalePaymentDto[] | null>
  >;
  handleCompleteSale: (remarks?: string) => void;
  totalPaid: number;
  subtotal: number;
  remaining: number;
  change: number;
  canComplete: boolean;
  isConfirming: boolean;
  customer?: Customer | null;
  appliedVouchers: AppliedVoucher[];
  onClose: () => void;
}

const CheckOutModal = ({
  discounts,
  paymentMethods,
  selectedPaymentMethod,
  addPayment,
  setSelectedPaymentMethod,
  handleCompleteSale,
  totalPaid,
  subtotal,
  remaining,
  change,
  canComplete,
  isConfirming,
  customer,
  appliedVouchers,
  onClose,
}: CheckOutModalProps) => {
  const [remarks, setRemarks] = useState<string>("");
  const [mobilePaymentView, setMobilePaymentView] = useState<
    "current" | "add"
  >("add");
  const [showRemarksMobile, setShowRemarksMobile] = useState(false);
  const [selectedMethod, setSelectedMethod] =
    useState<CreateSalePaymentDto | null>({
      paymentReference: "",
      payMetId: 0,
      salesPaymentAmount: 0,
      salesId: 0,
      salesPaymentStatus: SalesPaymentStatus.COMPLETED,
    });

  useEffect(() => {
    const defaultMethod = paymentMethods?.find(
      (pm) => pm.payMetName === "Cash",
    );
    if (defaultMethod) {
      // Check if already added
      const exists = selectedPaymentMethod?.some(
        (p) => p.payMetId === defaultMethod.payMetId,
      );
      if (!exists) {
        setSelectedMethod((prev) => {
          if (!prev) {
            return {
              salesId: 0,
              payMetId: defaultMethod.payMetId,
              salesPaymentAmount: 0,
              paymentReference: "",
              salesPaymentStatus: SalesPaymentStatus.COMPLETED,
            };
          }

          return {
            ...prev,
            payMetId: defaultMethod.payMetId,
          };
        });
      }
    }
  }, []);

  const quickAmounts = [50, 100, 200, 500, 1000];

  const removePayment = (index: number) => {
    setSelectedPaymentMethod((prev) =>
      prev ? prev.filter((_, i) => i !== index) : null,
    );
  };

  const getPaymentIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "cash":
        return { color: "bg-green-500", icon: Banknote };
      case "bank":
      case "debit card":
      case "credit card":
        return { color: "bg-blue-500", icon: CreditCard };
      case "gcash":
      case "paymaya":
      case "e-wallet":
        return { color: "bg-purple-500", icon: Wallet };
      default:
        return { color: "bg-gray-500", icon: Wallet };
    }
  };
  const findPaymentMethod = paymentMethods?.find(
    (pm) => pm.payMetId === selectedMethod?.payMetId,
  );
  const handleChangeSelectedPayment = handleChange(
    selectedMethod,
    setSelectedMethod,
  );
  const handleAddPayment = () => {
    if (!selectedMethod) return;

    const paymentToAdd: CreateSalePaymentDto = {
      ...selectedMethod,
      salesPaymentAmount: Number(selectedMethod.salesPaymentAmount) || 0,
      salesId: 0,
    };
    addPayment(paymentToAdd);

    setSelectedMethod({
      paymentReference: "",
      payMetId: 0,
      salesId: 0,
      salesPaymentAmount: 0,
      salesPaymentStatus: SalesPaymentStatus.COMPLETED,
    });
  };
  const handleQuickAmount = (qa: number) => {
    setSelectedMethod((prev) => {
      if (!prev) return prev; // or return null

      return {
        ...prev,
        salesPaymentAmount: qa,
      };
    });
  };
  const getTotalAmount = (): number => {
    const totalDiscount =
      discounts?.reduce((acc, disc) => acc + disc.discountAmount, 0) ?? 0;

    const totalVoucherAmount = appliedVouchers.reduce(
      (acc, av) => acc + av.appliedAmount,
      0,
    );

    return Math.max(subtotal - totalDiscount - totalVoucherAmount, 0); // prevent negative
  };

  const SectionHeader = ({
    icon: Icon,
    iconBg,
    iconColor,
    label,
  }: {
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    label: string;
  }) => (
    <div className="flex items-center gap-2 mb-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
      >
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <span className="text-sm font-semibold text-gray-900">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2 lg:pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-pink-50 lg:h-11 lg:w-11">
            <ShoppingCart className="h-4 w-4 text-primary-1 lg:h-5 lg:w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 lg:text-base">
              Confirm Order
            </h2>
            <p className="mt-0.5 hidden text-xs text-gray-500 sm:block">
              Review your payment details and complete your order.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 transition hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto py-2 lg:gap-4 lg:py-4">
        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-2 lg:gap-3">
          <div className="flex items-center justify-between rounded-2xl bg-indigo-50 p-2 lg:p-3 2xl:p-4">
            <div>
              <p className="text-[10px] font-medium text-indigo-500 2xl:text-xs">
                Total
              </p>
              <p className="mt-1 text-xs font-bold text-gray-900 2xl:text-lg">
                {formatPeso(getTotalAmount())}
              </p>
            </div>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 lg:h-8 lg:w-8 2xl:h-9 2xl:w-9">
              <Wallet className="h-4 w-4 text-indigo-500" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-2 lg:p-3 2xl:p-4">
            <div>
              <p className="text-[10px] font-medium text-emerald-600 2xl:text-xs">
                Paid
              </p>
              <p className="mt-1 text-xs font-bold text-emerald-700 2xl:text-lg">
                {formatPeso(totalPaid || 0)}
              </p>
            </div>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 lg:h-8 lg:w-8 2xl:h-9 2xl:w-9">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </div>

          <div
            className={`flex items-center justify-between rounded-2xl p-2 lg:p-3 2xl:p-4 ${
              remaining > 0 ? "bg-amber-50" : "bg-emerald-50"
            }`}
          >
            <div>
              <p
                className="text-[10px] font-medium 2xl:text-xs"
                style={{ color: remaining > 0 ? "#d97706" : "#059669" }}
              >
                {remaining > 0 ? "Remaining" : "Change"}
              </p>
              <p
                className="mt-1 text-xs font-bold 2xl:text-lg"
                style={{ color: remaining > 0 ? "#d97706" : "#059669" }}
              >
                {remaining > 0 ? formatPeso(remaining) : formatPeso(change)}
              </p>
            </div>
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full lg:h-8 lg:w-8 2xl:h-9 2xl:w-9 ${
                remaining > 0 ? "bg-amber-100" : "bg-emerald-100"
              }`}
            >
              <CreditCard
                className={`h-4 w-4 ${
                  remaining > 0 ? "text-amber-600" : "text-emerald-600"
                }`}
              />
            </div>
          </div>
        </div>

        {!canComplete ? (
          <div className="flex flex-col gap-2 lg:flex-1 lg:gap-4">
            {/* Mobile/tablet tab switcher - both panels show side by side on lg+ */}
            <div className="flex gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => setMobilePaymentView("current")}
                className={`flex-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  mobilePaymentView === "current"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                    : "border-gray-200 text-gray-500"
                }`}
              >
                Current Payments
                {selectedPaymentMethod && selectedPaymentMethod.length > 0
                  ? ` (${selectedPaymentMethod.length})`
                  : ""}
              </button>
              <button
                type="button"
                onClick={() => setMobilePaymentView("add")}
                className={`flex-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  mobilePaymentView === "add"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                    : "border-gray-200 text-gray-500"
                }`}
              >
                Add Payment
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 lg:flex-1 lg:grid-cols-2 lg:gap-4">
              <div
                className={`flex flex-col rounded-2xl border border-gray-100 p-3 lg:p-4 ${
                  mobilePaymentView === "current" ? "flex" : "hidden lg:flex"
                }`}
              >
                <SectionHeader
                  icon={ClipboardList}
                  iconBg="bg-indigo-50"
                  iconColor="text-indigo-500"
                  label="Current Payments"
                />

                {selectedPaymentMethod && selectedPaymentMethod.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {selectedPaymentMethod.map((payment, index) => {
                      const method = paymentMethods?.find(
                        (m) => m.payMetId === payment.payMetId,
                      );
                      const details = getPaymentIcon(method?.payMetName || "");
                      const Icon = details.icon || Banknote;
                      return (
                        <div
                          className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                          key={index}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-lg p-2 ${details.color} text-white`}
                            >
                              <Icon className="h-2 w-2 2xl:h-4 2xl:w-4" />
                            </div>
                            <div>
                              <span className="text-[9px] font-medium text-slate-800 2xl:text-sm">
                                {method?.payMetName}
                              </span>
                              {payment.paymentReference && (
                                <p className="text-[9px] text-slate-500 2xl:text-xs">
                                  {payment.paymentReference}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-semibold text-slate-800 2xl:text-sm">
                              {formatPeso(payment.salesPaymentAmount)}
                            </span>
                            <IconButton
                              bg="red"
                              icon={<X className="h-4 w-4" />}
                              label="Remove"
                              onClick={() => {
                                removePayment(index);
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-1 py-4 text-center lg:py-10">
                    <div className="mb-2 hidden h-14 w-14 items-center justify-center rounded-full bg-gray-50 lg:flex">
                      <FileText className="h-6 w-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      No payments added yet
                    </p>
                    <p className="text-xs text-gray-400">
                      Add a payment to get started.
                    </p>
                  </div>
                )}
              </div>

              <div
                className={`rounded-2xl border border-gray-100 p-3 lg:p-4 ${
                  mobilePaymentView === "add" ? "block" : "hidden lg:block"
                }`}
              >
                <SectionHeader
                  icon={Wallet}
                  iconBg="bg-indigo-50"
                  iconColor="text-indigo-500"
                label="Add Payment"
              />

              <div className="flex flex-col gap-2 lg:h-full lg:gap-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {paymentMethods?.map((payment) => {
                    const { icon, color } = getPaymentIcon(
                      payment.payMetName,
                    );
                    const Icon = icon || Banknote;
                    return (
                      <button
                        key={payment.payMetId}
                        onClick={() => {
                          if (payment.payMetIsCustomer && !customer) {
                            toast.error(
                              `${payment.payMetName} requires a customer to be selected!`,
                            );
                            return;
                          }

                          setSelectedMethod((prev) => {
                            if (!prev) {
                              return {
                                salesId: 0,
                                payMetId: payment.payMetId,
                                salesPaymentAmount: 0,
                                paymentReference: "",
                                salesPaymentStatus: SalesPaymentStatus.PENDING,
                              };
                            }

                            return {
                              ...prev,
                              payMetId: payment.payMetId,
                            };
                          });
                        }}
                        className={`flex items-center gap-2 rounded-xl border-2 px-2 py-1.5 transition-all lg:flex-col lg:justify-center lg:gap-0 lg:rounded-2xl lg:p-2 lg:text-center 2xl:p-4 ${
                          selectedMethod?.payMetId === payment.payMetId
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg lg:mb-2 lg:h-auto lg:w-auto lg:p-2 ${color} text-white`}
                        >
                          <Icon className="h-3 w-3 2xl:h-5 2xl:w-5" />
                        </div>
                        <span className="truncate text-[10px] font-medium text-slate-700 2xl:text-sm">
                          {payment.payMetName}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((qa) => (
                    <Button
                      key={qa}
                      color="secondary"
                      size="sm"
                      onClick={() => handleQuickAmount(qa)}
                      className="flex-1"
                      label={formatPeso(qa)}
                    ></Button>
                  ))}
                  <Button
                    color="warning"
                    size="sm"
                    onClick={() => handleQuickAmount(remaining)}
                    className="flex-1 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    label={`${formatPeso(remaining)}`}
                  ></Button>
                </div>

                <div className="flex flex-col gap-2">
                  <Input
                    leadingIcon={<PhilippinePeso className="w-4 h-4" />}
                    label={""}
                    sizes={"md"}
                    type="number"
                    name="salesPaymentAmount"
                    value={Number(selectedMethod?.salesPaymentAmount) || ""}
                    onChange={handleChangeSelectedPayment}
                  />
                  {findPaymentMethod?.payMetHasRef === 1 && (
                    <Input
                      label={""}
                      placeholder="Reference (optional)"
                      value={selectedMethod?.paymentReference}
                      name="paymentReference"
                      onChange={handleChangeSelectedPayment}
                    />
                  )}
                </div>

                <div className="mt-auto">
                  <Button
                    label="Add Payment"
                    size={"sm"}
                    className="w-full"
                    onClick={handleAddPayment}
                    icon={Plus}
                    disabled={
                      selectedMethod?.payMetId === null ||
                      selectedMethod?.payMetId === 0 ||
                      Number(selectedMethod?.salesPaymentAmount) === 0
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 p-3 lg:p-4">
            <SectionHeader
              icon={ClipboardList}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-500"
              label="Applied Payments"
            />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {selectedPaymentMethod &&
                selectedPaymentMethod.length > 0 &&
                selectedPaymentMethod.map((payment, index) => {
                  const method = paymentMethods?.find(
                    (m) => m.payMetId === payment.payMetId,
                  );
                  const details = getPaymentIcon(method?.payMetName || "");
                  const Icon = details.icon || Banknote;
                  return (
                    <div
                      className="flex items-center justify-between rounded-lg bg-slate-50 p-3 shadow"
                      key={index}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-lg p-2 ${details.color} text-white`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-medium text-slate-800 2xl:text-sm">
                            {method?.payMetName}
                          </span>
                          {payment.paymentReference && (
                            <p className="text-xs text-slate-500">
                              {payment.paymentReference}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-semibold text-slate-800 2xl:text-sm">
                          {formatPeso(payment.salesPaymentAmount)}
                        </span>
                        <IconButton
                          bg="red"
                          icon={<X className="h-4 w-4" />}
                          label="Remove"
                          onClick={() => {
                            removePayment(index);
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setShowRemarksMobile((prev) => !prev)}
            className="text-left text-xs font-semibold text-gray-600 lg:hidden"
          >
            {showRemarksMobile ? "− Hide remarks" : "+ Add remarks (optional)"}
          </button>

          <label className="hidden text-xs font-semibold text-gray-600 lg:block xl:text-sm">
            Order Remarks (optional)
          </label>

          <div className={showRemarksMobile ? "block" : "hidden lg:block"}>
            <Textarea
              label={""}
              sizes="sm"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              name="remarks"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 border-t border-gray-100 pt-2 lg:gap-3 lg:pt-4">
        <Button
          label="Cancel"
          size="md"
          color="secondary"
          className="flex-1 sm:w-auto sm:flex-none sm:px-6"
          onClick={onClose}
          disabled={isConfirming}
        />
        <Button
          label={
            change && canComplete
              ? `Confirm Order (Change: ${formatPeso(change)})`
              : "Confirm Order"
          }
          size="md"
          className="w-auto px-6"
          onClick={() => handleCompleteSale(remarks)}
          icon={Check}
          disabled={!canComplete}
          loading={isConfirming}
        />
      </div>
    </div>
  );
};

export default CheckOutModal;
